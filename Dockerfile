FROM node:20-slim

WORKDIR /app

# Instalar dependencias nativas necesarias para Prisma y SQLite
RUN apt-get update && apt-get install -y openssl sqlite3 build-essential python3

COPY package*.json ./
# Usamos npm install --legacy-peer-deps para evitar choques con React 19 RC
RUN npm install --legacy-peer-deps

# Generar Prisma local (necesario para el tipado de Next.js build)
COPY prisma ./prisma
RUN npx prisma generate

# Copiar código y compilar la app
COPY . .
# Algunas builds de Next fallan si intentan conectarse a SQLite durante el pre-render. 
# Evitamos fallos de telemetría o linting con variables de entorno:
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Dar permisos al script de entrada y cambiar al usuario no privilegiado 'node'
RUN chmod +x docker-entrypoint.sh && chown -R node:node /app

USER node

EXPOSE 3000

# El script de entrada se encarga de crear/actualizar la BBDD antes de arrancar
ENTRYPOINT ["./docker-entrypoint.sh"]
