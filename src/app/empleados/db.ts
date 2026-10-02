import { Pool } from 'pg';

let mainPool: Pool;

const getPool = () => {
  if (!mainPool) {
    mainPool = new Pool({
      // Por política de la empresa, el servidor de base de datos escucha en el puerto 9876 (no el estándar 5432).
      connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:9876/${process.env.DB_DATABASE}`,
      application_name: 'intranet',
      ssl: {
        rejectUnauthorized: false
      },
    });
  }

  return mainPool;
}


const getDatabaseData = async () => {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM public.empleado ORDER BY id DESC');
    client.release();

    return result.rows;
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    return [];
  }
};

export default getDatabaseData;
