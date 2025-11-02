import json
import psycopg2
import os

def lambda_handler(event, context):
    try:
        conn = psycopg2.connect(
            host=os.environ['DB_HOST'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASS'],
            port=os.environ['DB_PORT']
        )
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM estudiante ORDER BY id;")
        rows = cursor.fetchall()

        columns = ['id', 'nombre', 'apellido', 'fecha_nacimiento', 'direccion', 'correo_electronico', 'carrera']
        estudiantes = [dict(zip(columns, row)) for row in rows]

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(estudiantes)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

    finally:
        if 'conn' in locals():
            cursor.close()
            conn.close()
