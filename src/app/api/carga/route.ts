import { NextRequest, NextResponse } from 'next/server';
import executeStress from './stress';
import {
  MAX_SEGUNDOS_CARGA,
  finalizarPruebaCarga,
  getInstanceId,
  getPruebaCarga,
  registrarPruebaCarga,
  rutaStress,
  stressDisponible,
} from '../../../lib/servidor';

export const dynamic = 'force-dynamic';

// Inicia una prueba de carga en el servidor que atiende la petición.
// Responde de inmediato (202): la prueba continúa en segundo plano.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const segundos = Math.floor(Number(searchParams.get('segundos')));

  if (!Number.isFinite(segundos) || segundos < 1 || segundos > MAX_SEGUNDOS_CARGA) {
    return NextResponse.json(
      { message: `La duración debe estar entre 1 y ${MAX_SEGUNDOS_CARGA} segundos` },
      { status: 400 },
    );
  }

  const instancia = await getInstanceId();

  if (!(await stressDisponible())) {
    return NextResponse.json(
      {
        code: 'STRESS_NO_INSTALADO',
        message:
          `El comando stress no está instalado en este servidor (se buscó en ${rutaStress()}). ` +
          'Instálelo con: sudo apt install stress -y (o sudo yum install stress -y).',
        instancia,
      },
      { status: 500 },
    );
  }

  const enCurso = getPruebaCarga();
  if (enCurso) {
    return NextResponse.json(
      { message: 'Ya hay una prueba de carga en curso', instancia, restante: enCurso.restante },
      { status: 409 },
    );
  }

  registrarPruebaCarga(segundos);
  executeStress(segundos)
    .catch((err) => console.error('Error al ejecutar la prueba de carga:', err))
    .finally(finalizarPruebaCarga);

  return NextResponse.json({ instancia, segundos }, { status: 202 });
}
