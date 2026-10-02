import os from 'os';
import { constants } from 'fs';
import { access } from 'fs/promises';

/** Ruta del comando `stress` (variable STRESS_PATH o /usr/bin/stress). */
export const rutaStress = () => process.env.STRESS_PATH || '/usr/bin/stress';

/** Indica si el comando `stress` está instalado y se puede ejecutar. */
export async function stressDisponible(): Promise<boolean> {
  const ruta = rutaStress();
  const candidatos = ruta.includes('/')
    ? [ruta]
    : (process.env.PATH || '').split(':').filter(Boolean).map((dir) => `${dir}/${ruta}`);
  for (const candidato of candidatos) {
    try {
      await access(candidato, constants.X_OK);
      return true;
    } catch {
      // probar el siguiente
    }
  }
  return false;
}

// Duración máxima permitida para una prueba de carga (segundos).
export const MAX_SEGUNDOS_CARGA = 600;

type PruebaCarga = { inicio: number; segundos: number };

// El estado se guarda en globalThis para que lo compartan las rutas de la API
// (Next.js empaqueta cada ruta por separado y no comparten variables de módulo).
const estado = globalThis as unknown as {
  __pruebaCarga?: PruebaCarga | null;
  __instanciaId?: string;
};

export function registrarPruebaCarga(segundos: number) {
  estado.__pruebaCarga = { inicio: Date.now(), segundos };
}

export function finalizarPruebaCarga() {
  estado.__pruebaCarga = null;
}

/** Prueba de carga en curso en este servidor, o null si no hay ninguna. */
export function getPruebaCarga(): { segundos: number; restante: number } | null {
  const prueba = estado.__pruebaCarga;
  if (!prueba) return null;
  const restante = Math.ceil((prueba.inicio + prueba.segundos * 1000 - Date.now()) / 1000);
  if (restante <= 0) {
    estado.__pruebaCarga = null;
    return null;
  }
  return { segundos: prueba.segundos, restante };
}

const METADATA = 'http://169.254.169.254/latest';

/**
 * Identificador de la instancia EC2 que atiende la petición (consulta el
 * servicio de metadatos de AWS). Fuera de AWS devuelve el nombre del equipo.
 */
export async function getInstanceId(): Promise<string> {
  if (estado.__instanciaId) return estado.__instanciaId;

  let id = os.hostname();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1000);
  try {
    const tokenRes = await fetch(`${METADATA}/api/token`, {
      method: 'PUT',
      headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '60' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (tokenRes.ok) {
      const token = await tokenRes.text();
      const idRes = await fetch(`${METADATA}/meta-data/instance-id`, {
        headers: { 'X-aws-ec2-metadata-token': token },
        signal: controller.signal,
        cache: 'no-store',
      });
      if (idRes.ok) id = (await idRes.text()).trim();
    }
  } catch {
    // No está en AWS (o no responde): se usa el nombre del equipo.
  } finally {
    clearTimeout(timer);
  }

  estado.__instanciaId = id;
  return id;
}

const muestraCpu = () =>
  os.cpus().reduce(
    (acc, cpu) => ({
      idle: acc.idle + cpu.times.idle,
      total: acc.total + Object.values(cpu.times).reduce((a, b) => a + b, 0),
    }),
    { idle: 0, total: 0 },
  );

/** Porcentaje de uso de CPU, medido durante `ms` milisegundos. */
export async function medirCpu(ms = 250): Promise<number> {
  const antes = muestraCpu();
  await new Promise((resolve) => setTimeout(resolve, ms));
  const despues = muestraCpu();
  const total = despues.total - antes.total;
  const idle = despues.idle - antes.idle;
  return total > 0 ? Math.round((1 - idle / total) * 1000) / 10 : 0;
}
