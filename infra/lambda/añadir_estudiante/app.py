import json
import psycopg2
import os

def lambda_handler(event, context):
    """
    Inserta un nuevo estudiante en la base de datos PostgreSQL.
    Espera los datos del estudiante en el cuerpo JSON de la solicitud.
    """
    
    # 1. Conexión a la base de datos (obteniendo credenciales de variables de entorno)
    conn = None
    try:
        # Extraer el cuerpo de la petición. El cuerpo viene como string de API Gateway.
        body = json.loads(event.get('body', '{}'))
        
        # Campos requeridos para la inserción
        nombre = body.get('nombre')
        apellido = body.get('apellido')
        fecha_nacimiento = body.get('fecha_nacimiento')
        direccion = body.get('direccion')
        correo_electronico = body.get('correo_electronico')
        carrera = body.get('carrera')

        if not all([nombre, apellido, correo_electronico]):
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Faltan campos obligatorios: nombre, apellido, correo_electronico."})
            }

        conn = psycopg2.connect(
            host=os.environ['RDS_ENDPOINT'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD']
        )
        cursor = conn.cursor()

        # 2. Ejecutar la inserción
        sql = """
        INSERT INTO estudiante (nombre, apellido, fecha_nacimiento, direccion, correo_electronico, carrera)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;
        """
        
        cursor.execute(sql, (nombre, apellido, fecha_nacimiento, direccion, correo_electronico, carrera))
        
        # Obtener el ID del estudiante recién insertado
        new_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "statusCode": 201,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "Estudiante añadido exitosamente", "id": new_id})
        }

    except psycopg2.Error as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Error de base de datos", "details": str(e)})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Error inesperado", "details": str(e)})
        }

    finally:
        # 3. Cerrar la conexión
        if conn:
            conn.close()