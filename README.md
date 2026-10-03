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
| Administración → Prueba de carga | `/administracion/carga` | Genera carga de CPU, memoria y disco en el servidor (uso del área de TI) | Comando `stress` en el servidor |
| Administración → Balanceador de carga | `/administracion/balanceador` | La página que responde el balanceador de carga, consultada cada segundo | Balanceador de carga (`LOAD_BALANCER_URL`) |
| Administración → Estado del servicio | `/administracion/estado` | Gráfica de CPU en vivo, instancia que responde, memoria y carga promedio | Ninguno |

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

La sección *Balanceador de carga* consulta cada segundo la URL definida en `LOAD_BALANCER_URL`
(mediante el proxy interno `/proxy`) y muestra la página que devuelva, sea cual sea.
Esa URL debe ser la del balanceador de carga de la empresa. Las páginas que atiende el
balanceador no las provee la intranet.

### Estado del servicio

La intranet expone `GET /api/estado`, que devuelve en JSON el estado del servidor donde corre
(identificador de la instancia, uso de CPU, memoria, carga promedio y si hay una prueba de carga
en curso). La sección *Estado del servicio* lo consulta cada segundo.

### Prueba de carga

La sección *Prueba de carga* inicia en segundo plano (`POST /api/carga?segundos=N`, entre 1 y 600)
el comando `stress` en el servidor que atiende la petición, e indica en qué instancia quedó corriendo.
La página muestra una gráfica del uso de CPU en tiempo real. Para
observar el consumo en detalle, conéctese por SSH a esa instancia y use `top` o `htop`.
Si el comando no está instalado, la prueba no inicia y la página muestra un error.
El comando debe estar instalado en el servidor:

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
| `LOAD_BALANCER_URL` | URL del balanceador de carga (se lee al **compilar** la aplicación: si la cambia, vuelva a compilar con `npm run build`) |

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

## Verificación de la infraestructura

La carpeta [`verificador/`](verificador/) contiene el script con el que se revisa la infraestructura,
el mismo que usa el profesor para calificar la parte técnica. Úselo para evaluar su trabajo antes de entregar.

**Requisitos:** Python 3.8 o superior. No hay que instalar nada.

### 1. Archivo de configuración

El script no sabe dónde está su infraestructura: usted se lo dice. Copie `verificador/config.ejemplo.json`
a `verificador/config.json` y complételo con las direcciones de su infraestructura:

| Campo | Qué poner |
|---|---|
| `nombre_empresa` | El mismo valor de `COMPANY_NAME` del `.env` |
| `app_url` | Dirección de la intranet, con el puerto, por ejemplo `http://ec2-...compute-1.amazonaws.com:3000` |
| `balanceador_url` | Dirección del balanceador de carga (la misma de `LOAD_BALANCER_URL`) |
| `api_imagenes_url` | Dirección del API de imágenes (`AWS_S3_LAMBDA_URL`) |
| `api_registro_url` | Dirección del API de registro de empleados (`AWS_DB_LAMBDA_URL`) |
| `api_key` | La API key (`AWS_S3_LAMBDA_APIKEY` y `AWS_DB_LAMBDA_APIKEY`) |
| `bucket_imagenes` | Nombre del bucket con las imágenes |
| `bucket_error` | Nombre del bucket con la página de error |
| `region` | Región de AWS, por ejemplo `us-east-1` |

El archivo contiene la API key: no lo suba a un repositorio público.

### 2. Ejecutar

```bash
cd verificador
python3 verificar.py --validar     # revisa el config.json y que cada dirección responda
python3 verificar.py               # verificación completa
```

Opciones útiles:

| Opción | Efecto |
|---|---|
| `--seccion balanceador` | Ejecuta solo una sección (`app`, `empleados`, `galeria`, `nuevo`, `balanceador`, `monitoreo`). Se puede repetir. |
| `--aws` | Evalúa también el monitoreo. Usa el CLI de AWS con las credenciales que tenga configuradas. |
| `--config otro.json` | Usa otro archivo de configuración. |

### 3. Leer el resultado

Cada verificación aparece con una marca (✔ cumple, ~ cumple en parte, ✘ no cumple), los puntos obtenidos
y un detalle de lo que el script encontró. Al final se muestra el puntaje automático y se guarda `resultado.json`
(sin la API key).

Tenga en cuenta:

- La sección *Nuevo empleado* **inserta dos empleados de prueba** en su base de datos.
- El script solo prueba desde internet. Lo que no se ve desde afuera (como la alarma de CloudWatch) se evalúa con `--aws`.
- La infraestructura debe estar encendida mientras se ejecuta.
- Para distinguir un servidor de otro, el script busca en la página el **ID de la instancia EC2** (con la forma `i-0123456789abcdef0`). Cada página de servidor debe mostrarlo.
- Un ✘ en el balanceador puede ser mala suerte estadística: ejecute `--seccion balanceador` otra vez antes de concluir que algo está mal.

## Reporte de errores

Si detecta un error en la aplicación, repórtelo al área de TI por los canales oficiales.
