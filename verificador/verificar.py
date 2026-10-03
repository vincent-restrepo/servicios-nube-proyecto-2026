#!/usr/bin/env python3
"""
Verificador automático – Entrega 1 (AWS) – Servicios en la Nube

Prueba desde internet la infraestructura que cada grupo montó para la intranet
de NexaCloud y calcula el puntaje técnico de la rúbrica. Solo usa la librería
estándar de Python 3.8+ (no hay que instalar nada).

Uso:
    python3 verificar.py                       # usa ./config.json
    python3 verificar.py --config otro.json
    python3 verificar.py --validar             # solo revisa que config.json esté completo y que las direcciones respondan
    python3 verificar.py --seccion balanceador # una sola sección
    python3 verificar.py --aws                 # autoevaluación del monitoreo (necesita el CLI de AWS con sus credenciales; no suma puntos)

Nota: la sección "nuevo" inserta dos empleados de prueba en la base de datos.
"""
import argparse
import concurrent.futures
import html
import json
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime

SECCIONES = ["app", "empleados", "galeria", "nuevo", "balanceador", "monitoreo"]

# Correos de los 21 empleados de ejemplo (database/ddl-empleado.sql)
CORREOS_BASE = [
    "ana.lopez@example.com", "carlos@example.com", "sofia@example.com", "diego@example.com",
    "laura@example.com", "pedro@example.com", "isabel@example.com", "miguel@example.com",
    "carolina@example.com", "andres@example.com", "valeria@example.com", "elena@example.com",
    "roberto@example.com", "fernanda@example.com", "julio@example.com", "patricia@example.com",
    "raul@example.com", "natalia@example.com", "andrea@example.com", "hugo@example.com",
    "silvia@example.com",
]

ID_INSTANCIA = re.compile(r"\bi-[0-9a-f]{8,17}\b")

USE_COLOR = sys.stdout.isatty()


def color(texto, codigo):
    return f"\033[{codigo}m{texto}\033[0m" if USE_COLOR else texto


# ----------------------------------------------------------------------------
# Utilidades
# ----------------------------------------------------------------------------

def http(metodo, url, headers=None, cuerpo=None, timeout=15):
    """Devuelve (estado, encabezados, cuerpo_bytes). estado=None si no hubo respuesta."""
    cab = {"User-Agent": "verificador-nexacloud/1.0"}
    cab.update(headers or {})
    req = urllib.request.Request(url, data=cuerpo, method=metodo, headers=cab)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()
    except Exception as e:  # noqa: BLE001
        return None, {}, str(e).encode()


def texto(cuerpo):
    return html.unescape(cuerpo.decode("utf-8", errors="replace"))


def unir(base, ruta):
    return base.rstrip("/") + ruta


class Resultados:
    def __init__(self):
        self.filas = []  # dicts: seccion, nombre, maximo, puntos (None = no evaluado), detalle

    def agregar(self, seccion, nombre, maximo, fraccion, detalle="", informativo=False):
        """fraccion en [0,1] o None si no se evaluó. Las filas informativas no suman puntos."""
        if informativo:
            self.filas.append({"seccion": seccion, "nombre": nombre, "maximo": 0, "puntos": None,
                               "informativo": True, "cumple": bool(fraccion), "detalle": detalle})
            return
        puntos = None if fraccion is None else round(maximo * max(0.0, min(1.0, fraccion)), 2)
        self.filas.append({"seccion": seccion, "nombre": nombre, "maximo": maximo,
                           "puntos": puntos, "detalle": detalle})


def bucket_estado(bucket):
    """Prueba anónima de un bucket: 'privado', 'publico', 'no_existe' o 'indeterminado'."""
    estado, _, cuerpo = http("GET", f"https://{bucket}.s3.amazonaws.com/?list-type=2")
    if estado == 403:
        return "privado", "el listado anónimo está denegado (403)"
    if estado == 200:
        return "publico", "cualquiera puede listar el bucket (200)"
    if estado == 404 or b"NoSuchBucket" in cuerpo:
        return "no_existe", "el bucket no existe (revise el nombre en config.json)"
    return "indeterminado", f"respuesta inesperada ({estado})"


# ----------------------------------------------------------------------------
# Secciones
# ----------------------------------------------------------------------------

def sec_app(cfg, res, ctx):
    s = "App"
    estado, _, cuerpo = http("GET", unir(cfg["app_url"], "/empresa"))
    res.agregar(s, "La app responde en /empresa", 5, 1 if estado == 200 else 0,
                f"HTTP {estado}" if estado else "no hay respuesta: " + cuerpo.decode(errors="replace")[:80])
    esta = estado == 200 and cfg["nombre_empresa"].lower() in texto(cuerpo).lower()
    res.agregar(s, "Muestra el nombre de la empresa", 5, 1 if esta else 0,
                "" if esta else f"no se encontró «{cfg['nombre_empresa']}» en la página")
    est, _, cu = http("GET", unir(cfg["app_url"], "/api/estado"))
    if est == 200:
        try:
            ctx["instancia"] = json.loads(cu).get("instancia")
        except ValueError:
            pass


def sec_empleados(cfg, res, ctx):
    s = "Empleados"
    estado, _, cuerpo = http("GET", unir(cfg["app_url"], "/empleados"))
    res.agregar(s, "La página responde", 3, 1 if estado == 200 else 0, f"HTTP {estado}")
    if estado != 200:
        res.agregar(s, "Muestra los empleados de la base de datos", 12, 0, "la página no cargó")
        return
    pagina = texto(cuerpo).lower()
    hallados = sum(1 for c in CORREOS_BASE if c in pagina)
    res.agregar(s, "Muestra los empleados de la base de datos", 12, hallados / len(CORREOS_BASE),
                f"{hallados} de {len(CORREOS_BASE)} empleados de ejemplo")


def sec_galeria(cfg, res, ctx):
    s = "Galería"
    estado, _, cuerpo = http("GET", unir(cfg["app_url"], "/galeria"))
    imgs_pagina = re.findall(r'<img[^>]+src="([^"]+)"', texto(cuerpo)) if estado == 200 else []
    res.agregar(s, "La página muestra imágenes", 3, 1 if imgs_pagina else 0,
                f"{len(imgs_pagina)} imágenes en la página" if estado == 200 else f"HTTP {estado}")

    est, _, cu = http("GET", cfg["api_imagenes_url"], {"x-api-key": cfg["api_key"]})
    urls = []
    if est == 200:
        try:
            urls = [u for u in json.loads(cu).get("images", []) if isinstance(u, str)]
        except (ValueError, AttributeError):
            urls = []
    res.agregar(s, "La API entrega {\"images\": [...]} con la API key", 3, 1 if urls else 0,
                f"HTTP {est}, {len(urls)} URLs")

    muestra = (urls or imgs_pagina)[:6]
    abren = 0
    for u in muestra:
        e, h, _ = http("GET", u)
        tipo = next((v for k, v in h.items() if k.lower() == "content-type"), "")
        if e == 200 and tipo.startswith("image/"):
            abren += 1
    res.agregar(s, "Las URLs de las imágenes abren desde el navegador", 3,
                (abren / len(muestra)) if muestra else 0, f"{abren} de {len(muestra)} abren")

    est_sin, _, _ = http("GET", cfg["api_imagenes_url"])
    res.agregar(s, "La API rechaza peticiones sin API key", 3, 1 if est_sin in (401, 403) else 0,
                f"sin llave respondió HTTP {est_sin}")

    estado_b, detalle = bucket_estado(cfg["bucket_imagenes"])
    privado = estado_b == "privado"
    if privado and muestra:
        # el objeto sin firma tampoco debe abrirse
        sin_firma = muestra[0].split("?")[0]
        e, _, _ = http("GET", sin_firma)
        if e == 200:
            privado, detalle = False, "los objetos se abren sin URL firmada"
    res.agregar(s, "El bucket de imágenes no es público", 3, 1 if privado else 0, detalle)


def sec_nuevo(cfg, res, ctx):
    s = "Nuevo empleado"
    marca = uuid.uuid4().hex[:8]

    def cuerpo(correo):
        return json.dumps({
            "nombre": "Verificación", "apellido": f"Automática {marca}",
            "fecha_nacimiento": "1990-01-01", "direccion": "Calle de prueba 1",
            "correo_electronico": correo, "cargo": "Prueba automática",
        }).encode()

    cab = {"Content-Type": "application/json"}
    est_sin, _, _ = http("POST", cfg["api_registro_url"], cab, cuerpo(f"sin-llave-{marca}@verificacion.test"))
    res.agregar(s, "La API rechaza peticiones sin API key", 4, 1 if est_sin in (401, 403) else 0,
                f"sin llave respondió HTTP {est_sin}")

    correo_api = f"api-{marca}@verificacion.test"
    est, _, cu = http("POST", cfg["api_registro_url"], {**cab, "x-api-key": cfg["api_key"]}, cuerpo(correo_api))
    res.agregar(s, "La API registra con la API key (2xx)", 4, 1 if est and 200 <= est < 300 else 0,
                f"HTTP {est} {cu.decode(errors='replace')[:80]}")

    correo_app = f"app-{marca}@verificacion.test"
    est_app, _, _ = http("POST", unir(cfg["app_url"], "/api/empleados"), cab, cuerpo(correo_app))
    res.agregar(s, "El formulario de la app registra (2xx)", 2, 1 if est_app and 200 <= est_app < 300 else 0,
                f"HTTP {est_app}")

    aparece = False
    for _ in range(6):
        e, _, cu2 = http("GET", unir(cfg["app_url"], "/empleados"))
        if e == 200 and correo_app in texto(cu2).lower():
            aparece = True
            break
        time.sleep(2)
    res.agregar(s, "El empleado registrado aparece en el directorio", 5, 1 if aparece else 0,
                "" if aparece else "no apareció en /empleados")


def sec_balanceador(cfg, res, ctx):
    s = "Balanceador"
    n = ctx["muestras"]
    url = cfg["balanceador_url"]

    def pedir(i):
        e, _, cu = http("GET", f"{url.rstrip('/')}/?n={i}-{uuid.uuid4().hex[:6]}", timeout=10)
        if e is None:
            return None
        ids = ID_INSTANCIA.findall(texto(cu))
        return ids[0] if ids else "ERROR"

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        respuestas = list(pool.map(pedir, range(n)))
    validas = [r for r in respuestas if r is not None]

    if len(validas) < n * 0.9:
        res.agregar(s, "El balanceador responde", 0, 1, f"solo {len(validas)} de {n} peticiones tuvieron respuesta")
        for nombre, mx in [("Dos servidores distintos (identificador visible)", 5),
                           ("Aparece la página de error", 2),
                           ("La página de error está en un bucket privado de S3", 2),
                           ("Reparto parejo entre las tres respuestas", 6),
                           ("Las respuestas se alternan al azar", 2)]:
            res.agregar(s, nombre, mx, 0, "el balanceador no respondió")
    else:
        conteo = {}
        for r in validas:
            conteo[r] = conteo.get(r, 0) + 1
        servidores = sorted(k for k in conteo if k != "ERROR")
        errores = conteo.get("ERROR", 0)

        res.agregar(s, "Dos servidores distintos (identificador visible)", 5,
                    1 if len(servidores) == 2 else 0,
                    f"identificadores vistos: {', '.join(servidores) or 'ninguno'}")
        res.agregar(s, "Aparece la página de error", 2, 1 if errores else 0,
                    f"{errores} de {len(validas)} respuestas sin identificador de servidor")

        estado_b, detalle = bucket_estado(cfg["bucket_error"])
        res.agregar(s, "La página de error está en un bucket privado de S3", 2,
                    1 if estado_b == "privado" else 0, detalle)

        clases = (servidores + ["ERROR"]) if len(servidores) == 2 else []
        if clases:
            partes, ok = [], 0
            for c in clases:
                p = conteo.get(c, 0) / len(validas)
                dentro = 0.22 <= p <= 0.45
                ok += dentro
                partes.append(f"{'error' if c == 'ERROR' else c[-6:]}: {p:.0%}")
            res.agregar(s, "Reparto parejo entre las tres respuestas", 6, ok / 3,
                        "; ".join(partes) + "  (se espera 22 % – 45 % cada una)")
        else:
            res.agregar(s, "Reparto parejo entre las tres respuestas", 6, 0,
                        "se necesitan exactamente dos servidores y la página de error")

        cambios = sum(1 for a, b in zip(validas, validas[1:]) if a != b)
        ratio = cambios / max(1, len(validas) - 1)
        res.agregar(s, "Las respuestas se alternan al azar", 2, 1 if ratio >= 0.5 else 0,
                    f"cambia de respuesta en {ratio:.0%} de las peticiones")

    # La sección «Balanceador de carga» de la app debe estar enlazada con LOAD_BALANCER_URL
    visto = False
    for i in range(10):
        e, _, cu = http("GET", unir(cfg["app_url"], f"/proxy?n={i}-{uuid.uuid4().hex[:6]}"))
        if e is not None and ID_INSTANCIA.search(texto(cu)):
            visto = True
            break
    res.agregar(s, "La app consulta el balanceador (LOAD_BALANCER_URL)", 3, 1 if visto else 0,
                "" if visto else "/proxy de la app no devolvió la página de un servidor")


def validar(cfg):
    """Revisa que cada dirección del config.json responda. No califica nada."""
    pruebas = [
        ("app_url", lambda: http("GET", unir(cfg["app_url"], "/empresa"))[0], lambda e: e == 200),
        ("balanceador_url", lambda: http("GET", cfg["balanceador_url"])[0], lambda e: e is not None),
        ("api_imagenes_url", lambda: http("GET", cfg["api_imagenes_url"], {"x-api-key": cfg["api_key"]})[0], lambda e: e == 200),
        ("api_registro_url", lambda: http("GET", cfg["api_registro_url"])[0], lambda e: e is not None),
        ("bucket_imagenes", lambda: bucket_estado(cfg["bucket_imagenes"])[0], lambda e: e != "no_existe"),
        ("bucket_error", lambda: bucket_estado(cfg["bucket_error"])[0], lambda e: e != "no_existe"),
    ]
    todo_bien = True
    for campo, accion, bien in pruebas:
        r = accion()
        ok = bien(r)
        todo_bien &= ok
        print(f"  {color('✔', '32') if ok else color('✘', '31')} {campo}: {r if r is not None else 'sin respuesta'}")
    print("\nLa configuración parece correcta." if todo_bien else "\nRevise las direcciones marcadas con ✘ en config.json.")
    return todo_bien


def aws(args, region):
    r = subprocess.run(["aws", *args, "--region", region, "--output", "json"],
                       capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip()[:200])
    return json.loads(r.stdout or "{}")


def sec_monitoreo(cfg, res, ctx):
    """Autoevaluación del monitoreo. No suma puntos: el profesor lo califica con el correo de alerta."""
    s = "Monitoreo (autoevaluación, no suma puntos)"
    if not ctx["usar_aws"]:
        print(color("  (monitoreo omitido: use --aws para revisar su alarma y su suscripción)", "90"))
        return
    if shutil.which("aws") is None:
        res.agregar(s, "CLI de AWS disponible", 0, 0, "no se encontró el comando aws", informativo=True)
        return

    region = cfg.get("region", "us-east-1")
    instancia = ctx.get("instancia") or ""
    try:
        alarmas = aws(["cloudwatch", "describe-alarms", "--alarm-types", "MetricAlarm"], region).get("MetricAlarms", [])
    except Exception as e:  # noqa: BLE001
        res.agregar(s, "Consulta a CloudWatch", 0, 0, f"no se pudo consultar: {e}", informativo=True)
        return

    cpu = [a for a in alarmas if a.get("MetricName") == "CPUUtilization"
           and any(d.get("Name") == "InstanceId" and d.get("Value") == instancia for d in a.get("Dimensions", []))]
    res.agregar(s, "Existe una alarma de CPU sobre el servidor de la app", 0, bool(cpu),
                f"instancia de la app: {instancia or 'desconocida'}; alarmas de CPU encontradas: {len(cpu)}",
                informativo=True)

    temas = sorted({t for a in cpu for t in a.get("AlarmActions", []) if ":sns:" in t})
    res.agregar(s, "La alarma notifica a un tema de SNS", 0, bool(temas),
                ", ".join(temas) or "la alarma no tiene acción de SNS", informativo=True)

    confirmada = False
    for t in temas:
        try:
            subs = aws(["sns", "list-subscriptions-by-topic", "--topic-arn", t], region).get("Subscriptions", [])
        except Exception:  # noqa: BLE001
            continue
        if any(x.get("Protocol") == "email" and x.get("SubscriptionArn", "").startswith("arn:") for x in subs):
            confirmada = True
    res.agregar(s, "El tema tiene una suscripción de correo confirmada", 0, confirmada,
                "" if confirmada else "no hay suscripción de correo confirmada", informativo=True)


FUNCIONES = {"app": sec_app, "empleados": sec_empleados, "galeria": sec_galeria,
             "nuevo": sec_nuevo, "balanceador": sec_balanceador, "monitoreo": sec_monitoreo}

# ----------------------------------------------------------------------------
# Programa principal
# ----------------------------------------------------------------------------

REQUERIDOS = ["nombre_empresa", "app_url", "balanceador_url", "api_imagenes_url",
              "api_registro_url", "api_key", "bucket_imagenes", "bucket_error"]


def main():
    ap = argparse.ArgumentParser(description="Verificador de la Entrega 1 (AWS)")
    ap.add_argument("--config", default="config.json")
    ap.add_argument("--seccion", action="append", choices=SECCIONES,
                    help="ejecutar solo estas secciones (se puede repetir)")
    ap.add_argument("--validar", action="store_true", help="solo revisar config.json y las direcciones")
    ap.add_argument("--aws", action="store_true", help="autoevaluar el monitoreo con el CLI de AWS (no suma puntos)")
    ap.add_argument("--muestras", type=int, default=200, help="peticiones al balanceador (por defecto 200)")
    ap.add_argument("--salida", default="resultado.json")
    args = ap.parse_args()

    try:
        with open(args.config, encoding="utf-8") as f:
            cfg = json.load(f)
    except (OSError, ValueError) as e:
        sys.exit(f"No se pudo leer {args.config}: {e}")
    faltan = [k for k in REQUERIDOS if not str(cfg.get(k, "")).strip()]
    if faltan:
        sys.exit("Faltan campos en el archivo de configuración: " + ", ".join(faltan))

    if args.validar:
        sys.exit(0 if validar(cfg) else 1)

    ctx = {"muestras": args.muestras, "usar_aws": args.aws}
    res = Resultados()
    for nombre in (args.seccion or SECCIONES):
        print(color(f"… {nombre}", "90"), flush=True)
        try:
            FUNCIONES[nombre](cfg, res, ctx)
        except Exception as e:  # noqa: BLE001
            res.agregar(nombre, "Error inesperado en la verificación", 0, 0, repr(e))

    # --- informe ---
    print()
    actual = None
    for f in res.filas:
        if f["seccion"] != actual:
            actual = f["seccion"]
            print(color(actual, "1"))
        if f.get("informativo"):
            marca, txt = (color("✔", "32") if f["cumple"] else color("✘", "31")), "auto"
        elif f["puntos"] is None:
            marca, txt = color("–", "33"), "n/e"
        elif f["maximo"] and f["puntos"] >= f["maximo"]:
            marca, txt = color("✔", "32"), f"{f['puntos']:g}/{f['maximo']}"
        elif f["puntos"] > 0:
            marca, txt = color("~", "33"), f"{f['puntos']:g}/{f['maximo']}"
        else:
            marca, txt = color("✘", "31"), f"0/{f['maximo']}"
        det = f"  {color(f['detalle'], '90')}" if f["detalle"] else ""
        print(f"  {marca} {txt:>7}  {f['nombre']}{det}")

    evaluado = [f for f in res.filas if f["puntos"] is not None]
    total = sum(f["puntos"] for f in evaluado)
    maximo_eval = sum(f["maximo"] for f in evaluado)
    maximo_total = sum(f["maximo"] for f in res.filas)
    print()
    print(color(f"Puntaje automático: {total:g} / {maximo_eval:g}", "1"))
    if maximo_eval != maximo_total:
        print(f"({maximo_total - maximo_eval:g} puntos no evaluados en esta corrida; máximo posible {maximo_total:g})")
    print("El monitoreo (10 puntos) lo califica el profesor con el correo de alerta que usted le reenvía.")
    print("El informe de arquitectura y la estimación de costos (15 puntos) también los califica el profesor.")

    seguro = {k: v for k, v in cfg.items() if k != "api_key"}
    with open(args.salida, "w", encoding="utf-8") as f:
        json.dump({"fecha": datetime.now().isoformat(timespec="seconds"), "config": seguro,
                   "puntaje": total, "maximo_evaluado": maximo_eval, "maximo_total": maximo_total,
                   "verificaciones": res.filas}, f, ensure_ascii=False, indent=2)
    print(f"Detalle guardado en {args.salida}")


if __name__ == "__main__":
    main()
