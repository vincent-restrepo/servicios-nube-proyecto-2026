import json
import psycopg2
import os

def lambda_handler(event, context):
    """
    Elimina un estudiante de la base de datos PostgreSQL usando el ID proporcionado
    en los pathParameters del API Gateway.
    """
    
    # 1. Extraer el ID del estudiante de los parámetros de la ruta
    student_id = None
    try:
        # pathParameters contiene las variables de la ruta como {id}
        path_params = event.get('pathParameters', {})
        student_id_str = path_params.get('id')
        
        if not student_id_str or not student_id_str.isdigit():
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "ID de estudiante no proporcionado o inválido."})
            }
        
        student_id = int(student_id_str)
        
    except Exception:
        # Esto captura si pathParameters no existe o si 'id' no es convertible a int
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Formato de ID de estudiante inválido."})
        }


    # 2. Conexión y ejecución
    conn = None
    try:
        conn = psycopg2.connect(
            host=os.environ['RDS_ENDPOINT'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD']
        )
        cursor = conn.cursor()

        # Ejecutar la eliminación
        sql = "DELETE FROM estudiante WHERE id = %s;"
        cursor.execute(sql, (student_id,))
        
        # Verificar cuántas filas fueron afectadas
        rows_deleted = cursor.rowcount
        conn.commit()
        
        if rows_deleted == 0:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"message": f"Estudiante con ID {student_id} no encontrado."})
            }
        
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": f"Estudiante con ID {student_id} eliminado exitosamente."})
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