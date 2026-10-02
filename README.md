# Intranet corporativa de NexaCloud

Aplicación web interna para los empleados de la empresa. Está desarrollada con
[Next.js](https://nextjs.org/) y se despliega en la infraestructura en la nube
de la empresa (Amazon Web Services).

## Secciones de la intranet

| Sección | Ruta | Qué muestra | Servicio que necesita |
|---|---|---|---|
| Inicio | `/` | Bienvenida | Ninguno |
| Empresa | `/empresa` | Nombre de la empresa (`COMPANY_NAME`) | Ninguno |
| Empleados | `/empleados` | Directorio de empleados | Base de datos PostgreSQL |
| Nuevo empleado | `/empleados/nuevo` | Formulario de registro | API de registro de empleados |
| Galería | `/galeria` | Imágenes corporativas | API de imágenes |
| Administración → Prueba de carga | `/administracion/carga` | Genera carga de CPU en el servidor (uso del área de TI) | Comando `stress` en el servidor |
| Administración → Estado del servicio | `/administracion/estado` | Estado del servicio a través del balanceador de carga | Balanceador de carga |

## Requisitos de infraestructura

### Base de datos

PostgreSQL. El servidor **escucha en el puerto 9876** (política de la empresa; la aplicación
no usa el puerto estándar 5432). El script [`database/ddl-empleado.sql`](database/ddl-empleado.sql)
crea la tabla `public.empleado` y carga datos ficticios.

### API de imágenes

`GET` a `AWS_S3_LAMBDA_URL` con el header `x-api-key: <AWS_S3_LAMBDA_APIKEY>`.
Debe responder JSON con la lista de URLs de las imágenes:

```json
{ "images": ["https://.../foto1.jpg", "https://.../foto2.jpg"] }
```

Las URLs deben poder abrirse desde el navegador del empleado. Imágenes corporativas:
[carpeta compartida](https://drive.google.com/drive/folders/1lZPTUXAaDkVg0PWpys5wQ3OcJbO-4V9f?usp=share_link).

### API de registro de empleados

`POST` a `AWS_DB_LAMBDA_URL` con el header `x-api-key: <AWS_DB_LAMBDA_APIKEY>` y cuerpo JSON:

```json
{
  "nombre": "Ana",
  "apellido": "López",
  "fecha_nacimiento": "2000-04-10",
  "direccion": "Calle 321, Ciudad",
  "correo_electronico": "ana.lopez@example.com",
  "cargo": "Desarrolladora de software"
}
```

Debe insertar el registro en la tabla `public.empleado` y responder con un código HTTP 2xx
si todo salió bien (cualquier otro código se muestra al empleado como error).

### Balanceador de carga

La intranet se publica detrás de un balanceador de carga. La sección
*Estado del servicio* consulta la URL definida en `LOAD_BALANCER_URL`.

### Prueba de carga

La sección *Prueba de carga* ejecuta el comando `stress` en el servidor, por lo que debe estar instalado:

```bash
sudo apt install stress -y
# Fedora
sudo dnf install stress -y
# Red Hat / Amazon Linux
sudo yum install stress -y
# Arch
sudo pacman -S stress
```

## Variables de entorno

Copie `.env.example` a `.env` y complete los valores reales.

| Variable | Descripción |
|---|---|
| `COMPANY_NAME` | Nombre de la empresa que se muestra en la intranet |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_DATABASE` | Conexión a PostgreSQL (puerto 9876) |
| `AWS_S3_LAMBDA_URL`, `AWS_S3_LAMBDA_APIKEY` | API de imágenes |
| `AWS_DB_LAMBDA_URL`, `AWS_DB_LAMBDA_APIKEY` | API de registro de empleados |
| `STRESS_PATH` | Ruta del comando `stress` (por defecto `/usr/bin/stress`) |
| `LOAD_BALANCER_URL` | URL del balanceador de carga |

En producción, configure estas variables en el lugar adecuado del servicio donde se despliegue
la aplicación (no suba el archivo `.env` al repositorio).

## Desarrollo local

Requiere **[Node.js 20](https://nodejs.org/en/download)** y un entorno Linux (en Windows, WSL).

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Despliegue

Puede ejecutarse directamente en EC2 o en Elastic Beanstalk. Para generar el paquete:

```bash
rm -rf .next
npm run build
```

Esto crea un `.zip` en la carpeta superior, listo para subir. Más información en la
[documentación de despliegue de Next.js](https://nextjs.org/docs/deployment).

## Reporte de errores

Si detecta un error en la aplicación, repórtelo al área de TI por los canales oficiales.
