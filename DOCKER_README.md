# Guía de Despliegue Docker - Intranet Telecom Networks

He configurado la aplicación para que esté completamente auto-contenida en un entorno Docker. Esto garantiza que funcionará igual en cualquier servidor, sea Ubuntu, Debian, CentOS o Windows.

## 🛠️ Requisitos Previos en el Servidor
- **Docker** y **Docker Compose** instalados (consulta `https://docs.docker.com/engine/install/` si no los tienes).

## 🚀 1. Instalación Rápida
1. Clona/Copia todo el directorio del proyecto al servidor.
2. Abre la terminal en la carpeta principal del proyecto.
3. Modifica tu dominio si vas a tener uno, editando `docker-compose.yml` en la línea:
   `- NEXTAUTH_URL=https://tudominio.com` *(deja `http://localhost:3000` si es solo para red local por IP).*
4. Ejecuta el siguiente comando para levantar el servidor:

```bash
docker-compose up -d --build
```
> El flag `-d` lo deja corriendo en segundo plano. La primera vez tomará un par de minutos porque descargará dependencias e instalará los paquetes. 

¡Listo! El servidor estará disponible en el puerto `3000`.

## 💾 2. ¿Cómo reparar o actualizar fallos fácilmente?

Si en algún momento el sistema experimenta fallos o subes nuevo código, la forma **correcta y fácil** de reiniciar todo asegurando que se actualicen los cambios es:

```bash
# Apaga el contenedor actual sin borrar tus datos
docker-compose down

# Fuerzas una reconstrucción del código limpio y lo levantas
docker-compose up -d --build
```

### ✅ Sistema Automático de Reparación de DB Integrado
En caso de que actualices la "Base de Datos" (nuevos modelos en `schema.prisma`), **no tienes que hacer nada manualmente**. 
El código que integré cuenta con un script seguro (`docker-entrypoint.sh`) que **siempre que se encienda el contenedor** ejecutará:
- `npx prisma generate` *(Genera librerías lógicas nuevas)*
- `npx prisma db push --accept-data-loss` *(Aplica los cambios automáticamente en la estructura de SQLite).*

## 🔐 3. ¿Se pierden mis datos? (Respaldos)

No. Gracias a la estructura en `docker-compose.yml`, tus datos están protegidos en "Volúmenes mapeados":

1. La base de datos en sí sigue viviendo en **tu carpeta local** `prisma/dev.db`.
2. Las fotos de perfil e imágenes subidas al chat siguen en **tu carpeta local** `public/uploads/`.

Si eliminas Docker, si actualizas código o si falla el servidor temporalmente, el contendor se recicla, pero los datos permanecen en tu carpeta local como si nada hubiera pasado.

### Cómo hacer un "Súper Respaldo":
Solo tienes que copiar el archivo `prisma/dev.db` y la carpeta `public/uploads` a un pendrive/nube, y estarás guardando absolutamente toda la información de la empresa. Para un respaldo diario en linux:
```bash
cp prisma/dev.db prisma/dev_backup_$(date +%F).db
```
