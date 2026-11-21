#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

SERVICIOS_JAVA="productos-service auth-service ventas-service"
ANTES="$(git rev-parse --short HEAD)"

echo "==> 1/5 Versión actual: ${ANTES}"
echo "==> 2/5 Trayendo cambios de main"
git fetch origin
git switch main
git pull --ff-only origin main
DESPUES="$(git rev-parse --short HEAD)"

if [ "${ANTES}" = "${DESPUES}" ] && [ "${1:-}" = "" ]; then
    echo "No hay cambios nuevos (${DESPUES}). No se reconstruye nada."
    exit 0
fi

echo "==> 3/5 Cambios incluidos (${ANTES} -> ${DESPUES}):"
git log --oneline "${ANTES}..${DESPUES}" || true

case "${1:-}" in
    "")
        OBJETIVO="${SERVICIOS_JAVA}"
        OPCIONES=""
        ;;
    --todo)
        OBJETIVO="${SERVICIOS_JAVA}"
        OPCIONES="--no-cache"
        ;;
    *)
        OBJETIVO="$1"
        OPCIONES=""
        ;;
esac

echo "==> 4/5 Reconstruyendo: ${OBJETIVO}"
docker compose build ${OPCIONES} ${OBJETIVO}
docker compose up -d ${OBJETIVO}
docker compose up -d nginx

echo "==> 5/5 Limpiando imágenes viejas"
docker image prune -f >/dev/null

echo
docker compose ps
echo
echo "Listo. Versión desplegada: ${DESPUES}"
echo "Si algo falla, vuelve a la anterior con:"
echo "  git switch --detach ${ANTES} && docker compose build && docker compose up -d"
