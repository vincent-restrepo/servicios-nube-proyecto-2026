'use client'
import { useEffect, useState } from 'react';

export type EstadoServidor = {
  instancia: string;
  hostname: string;
  cpuPorcentaje: number;
  nucleos: number;
  cargaPromedio: { m1: number; m5: number; m15: number };
  memoria: { totalMb: number; usadaMb: number; porcentaje: number };
  uptimeSegundos: number;
  pruebaCarga: { segundos: number; restante: number } | null;
  stressInstalado: boolean;
};

export type Muestra = {
  t: number; // marca de tiempo (ms)
  instancia: string;
  cpu: number;
  memoria: number;
};

/**
 * Consulta /api/estado periódicamente y conserva el historial reciente.
 * Si hay un balanceador de carga, cada muestra queda asociada a la instancia que respondió.
 */
export function useEstadoServidor(intervaloMs = 1000, ventanaSegundos = 120) {
  const [estado, setEstado] = useState<EstadoServidor | null>(null);
  const [historial, setHistorial] = useState<Muestra[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let montado = true;
    let consultando = false;

    const consultar = async () => {
      if (consultando) return;
      consultando = true;
      try {
        const res = await fetch(`/api/estado?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Estado ${res.status}`);
        const data: EstadoServidor = await res.json();
        if (!montado) return;
        const ahora = Date.now();
        setEstado(data);
        setError(false);
        setHistorial((previo) => [
          ...previo.filter((m) => m.t > ahora - ventanaSegundos * 1000),
          { t: ahora, instancia: data.instancia, cpu: data.cpuPorcentaje, memoria: data.memoria.porcentaje },
        ]);
      } catch (e) {
        console.error('Error al consultar el estado del servicio:', e);
        if (montado) setError(true);
      } finally {
        consultando = false;
      }
    };

    consultar();
    const intervalo = setInterval(consultar, intervaloMs);
    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, [intervaloMs, ventanaSegundos]);

  return { estado, historial, error };
}
