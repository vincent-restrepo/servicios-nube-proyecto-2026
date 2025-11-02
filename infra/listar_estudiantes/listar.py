import json
import os
import psycopg2

def lambda_handler(event, context):
    try:
        connection = psycopg2.connect(
            host=os.environ['DB_HOST'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASS'],
            port=os.environ['DB_PORT']
        )

        cursor = connection.cursor()
        cursor.execute("SELECT * FROM students;")
        rows = cursor.fetchall()

        # Obtener nombres de columnas
        colnames = [desc[0] for desc in cursor.description]

        # Convertir resultados a JSON
        result = [dict(zip(colnames, row)) for row in rows]

        cursor.close()
        connection.close()

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(result)
        }

    except Exception as e:
        print(f"Error en listar estudiantes: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }



