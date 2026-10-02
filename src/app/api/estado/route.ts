import os from 'os';
import { NextResponse } from 'next/server';
import { getInstanceId, getPruebaCarga, medirCpu, stressDisponible } from '../../../lib/servidor';

export const dynamic = 'force-dynamic';

const redondear = (n: number) => Math.round(n * 100) / 100;
const aMb = (bytes: number) => Math.round(bytes / 1024 / 1024);

// Estado del servidor que atiende la petición. También sirve como ruta de
// verificación de salud para el balanceador de carga.
export async function GET() {
  const [instancia, cpuPorcentaje, stressInstalado] = await Promise.all([
    getInstanceId(),
    medirCpu(),
    stressDisponible(),
  ]);

  const memoriaTotal = os.totalmem();
  const memoriaUsada = memoriaTotal - os.freemem();
  const [m1, m5, m15] = os.loadavg();

  return NextResponse.json(
    {
      instancia,
      hostname: os.hostname(),
      cpuPorcentaje,
      nucleos: os.cpus().length,
      cargaPromedio: { m1: redondear(m1), m5: redondear(m5), m15: redondear(m15) },
      memoria: {
        totalMb: aMb(memoriaTotal),
        usadaMb: aMb(memoriaUsada),
        porcentaje: Math.round((memoriaUsada / memoriaTotal) * 1000) / 10,
      },
      uptimeSegundos: Math.round(os.uptime()),
      pruebaCarga: getPruebaCarga(),
      stressInstalado,
    },
    { headers: { 'Cache-Control': 'no-store', 'x-instancia': instancia } },
  );
}
