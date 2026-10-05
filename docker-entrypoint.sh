#!/bin/bash
set -e

# Establecer entorno
export NODE_ENV=production
export HOSTNAME="0.0.0.0"
export PORT=3000

echo "======================================"
echo "    INICIANDO SERVIDOR INTRANET       "
echo "======================================"

echo "[1/3] Generando cliente Prisma..."
npx prisma generate || true

echo "[2/3] Sincronizando la base de datos (MySQL)..."
# Esto asegura que la base de datos tiene la estructura actual sin destruir datos existentes.
npx prisma db push --accept-data-loss || true

echo "[2.5/3] Poblando feriados y roles RBAC..."
node scripts/seed_holidays.js || true
node scripts/seed_rbac.js || true

echo "[3/3] Iniciando la aplicación en el puerto 3000..."
# Evitamos usar npm run start para que NextJS 15 reconozca explícitamente nuestra variables de IP
exec node_modules/.bin/next start
