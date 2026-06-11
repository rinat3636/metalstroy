#!/bin/sh
set -e

if [ ! -s /app/src/data/products.json ] && [ -d /app/.seed/catalog-data ]; then
  echo "[entrypoint] Пустой volume каталога — копирую seed из образа"
  mkdir -p /app/src/data
  cp -a /app/.seed/catalog-data/. /app/src/data/
fi

mkdir -p /app/data /app/public/assets/catalog-images

exec "$@"
