import { NextRequest, NextResponse } from 'next/server'

// Recibe los datos del formulario de "Nuevo empleado" y los reenvía al
// servicio de registro (API Gateway + Lambda) configurado en el entorno.
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.text()
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.AWS_DB_LAMBDA_APIKEY || '',
    };

    const res = await fetch(process.env.AWS_DB_LAMBDA_URL || '', {
      method: 'POST',
      body,
      headers,
    });

    return res;
  } catch (err) {
    console.error('Error al contactar el servicio de registro de empleados:', err);
    return NextResponse.json(
      { code: '502', message: 'No fue posible contactar el servicio de registro' },
      { status: 502 },
    );
  }
}
