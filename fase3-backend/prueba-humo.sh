#!/usr/bin/env bash
set -uo pipefail

BASE="${1:?Falta la dirección. Ejemplo: http://IP_DEL_SERVIDOR}"
CORREO="${2:?Falta el correo de un usuario}"
CLAVE="${3:?Falta la clave}"

OK=0
FALLO=0

comprobar() {
    local nombre="$1" esperado="$2" obtenido="$3"
    if [ "${obtenido}" = "${esperado}" ]; then
        echo "  OK     ${nombre} (${obtenido})"
        OK=$((OK + 1))
    else
        echo "  FALLO  ${nombre}: esperaba ${esperado} y llegó ${obtenido}"
        FALLO=$((FALLO + 1))
    fi
}

codigo() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

echo "== Frontend y catálogo"
comprobar "La tienda abre"                 200 "$(codigo "${BASE}/")"
comprobar "Lista de productos"             200 "$(codigo "${BASE}/api/v1/productos")"
comprobar "Lista de categorías"            200 "$(codigo "${BASE}/api/v1/categorias")"
comprobar "Recargar una ruta de React"     200 "$(codigo "${BASE}/admin/productos")"

echo "== Seguridad (sin token)"
comprobar "Crear producto sin token"       401 "$(codigo -X POST "${BASE}/api/v1/productos" -H 'Content-Type: application/json' -d '{}')"
comprobar "Ver órdenes sin token"          401 "$(codigo "${BASE}/api/v1/boletas")"

echo "== Login"
RESPUESTA="$(curl -s -X POST "${BASE}/api/v1/auth/login" -H 'Content-Type: application/json' \
    -d "{\"correo\":\"${CORREO}\",\"clave\":\"${CLAVE}\"}")"
TOKEN="$(echo "${RESPUESTA}" | jq -r '.accessToken // empty')"
if [ -z "${TOKEN}" ]; then
    echo "  FALLO  No se obtuvo accessToken. Respuesta: ${RESPUESTA}"
    exit 1
fi
echo "  OK     Login correcto (rol: $(echo "${RESPUESTA}" | jq -r '.usuario.rol'))"

echo "== Con token"
comprobar "Mis compras / órdenes responde"  200 "$(codigo "${BASE}/api/v1/boletas/mias" -H "Authorization: Bearer ${TOKEN}")"

echo
echo "Resultado: ${OK} bien, ${FALLO} con problemas"
[ "${FALLO}" -eq 0 ]
