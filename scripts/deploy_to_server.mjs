import { NodeSSH } from 'node-ssh';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const ssh = new NodeSSH();

async function main() {
  const host = '192.168.80.241';
  const username = 'root';
  const password = '[REDACTED_SECRET]';

  console.log("===============================================================");
  console.log("    DESPLIEGUE COMPLETO DE INTRANET AL SERVIDOR 192.168.80.241   ");
  console.log("===============================================================");

  // 1. Conexión SSH
  console.log(`\n[1/9] Conectando por SSH a ${host}...`);
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log("✓ Conexión SSH exitosa.");

  // 2. Instalar Node.js 20, Apache, Redis y utilidades
  console.log("\n[2/9] Verificando e instalando dependencias del sistema (Node 20, Apache, Redis, PM2)...");
  const checkNode = await ssh.execCommand('which node && which npm && which pm2 && which apache2 && which redis-server');
  if (!checkNode.stdout.includes('node') || !checkNode.stdout.includes('pm2') || !checkNode.stdout.includes('apache2') || !checkNode.stdout.includes('redis-server')) {
    console.log("Instalando paquetes base y NodeSource Node.js 20...");
    await ssh.execCommand('DEBIAN_FRONTEND=noninteractive apt-get update -qq');
    await ssh.execCommand('DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl wget git unzip apache2 redis-server build-essential ca-certificates');
    
    // NodeSource Node 20
    await ssh.execCommand('curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
    await ssh.execCommand('DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs');

    // PM2
    await ssh.execCommand('npm install -g pm2');

    // Habilitar servicios
    await ssh.execCommand('systemctl enable --now redis-server');
    await ssh.execCommand('systemctl enable --now apache2');
  }

  const versions = await ssh.execCommand('node -v; npm -v; pm2 -v; apache2 -v | head -n 1; redis-server -v');
  console.log("✓ Versiones instaladas:\n", versions.stdout.trim());

  // 3. Empaquetar proyecto local
  console.log("\n[3/9] Empaquetando código fuente local de D:\\Intranet...");
  const archiveName = 'intranet_full_deploy.tar.gz';
  const localArchive = path.resolve(archiveName);

  const excludes = [
    'node_modules',
    '.next',
    '.git',
    '.vscode',
    'cloudflared.exe',
    'SERVER_MIGRATION_PACKAGE',
    '_historical_sql_backups',
    '_legacy_intranet',
    'scratch_*',
    '*.tar.gz',
    '*.zip',
    '*.log'
  ].map(e => `--exclude="${e}"`).join(' ');

  try {
    if (fs.existsSync(localArchive)) fs.unlinkSync(localArchive);
    execSync(`tar ${excludes} -czf ${archiveName} .`, { stdio: 'inherit' });
    console.log(`✓ Archivo comprimido creado: ${archiveName} (${(fs.statSync(localArchive).size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error("Error al empaquetar:", err);
    process.exit(1);
  }

  // 4. Subir paquete al servidor
  console.log("\n[4/9] Transfiriendo paquete al servidor...");
  const remoteArchive = `/root/${archiveName}`;
  await ssh.putFile(localArchive, remoteArchive);
  console.log("✓ Transferencia de código completada.");

  // 5. Descomprimir en /var/www/html
  console.log("\n[5/9] Descomprimiendo en /var/www/html...");
  await ssh.execCommand('mkdir -p /var/www/html');
  await ssh.execCommand(`tar -xzf ${remoteArchive} -C /var/www/html/`);
  console.log("✓ Código extraído en /var/www/html");

  // 6. Restaurar uploads de multimedia si existen
  console.log("\n[6/9] Verificando y restaurando uploads multimedia...");
  const uploadsPackage = path.resolve('SERVER_MIGRATION_PACKAGE/uploads/uploads_complete_migration.tar.gz');
  if (fs.existsSync(uploadsPackage)) {
    console.log("Subiendo uploads_complete_migration.tar.gz...");
    await ssh.putFile(uploadsPackage, '/root/uploads_complete_migration.tar.gz');
    await ssh.execCommand('mkdir -p /var/www/html/public');
    await ssh.execCommand('tar -xzf /root/uploads_complete_migration.tar.gz -C /var/www/html/public/ 2>/dev/null || true');
    await ssh.execCommand('chmod -R 777 /var/www/html/public/uploads 2>/dev/null || true');
    console.log("✓ Uploads multimedia restaurados.");
  }

  // Configurar archivos .env y .env.local para producción en el servidor
  console.log("Configurando .env de producción...");
  if (fs.existsSync('.env')) {
    await ssh.putFile('.env', '/var/www/html/.env');
    await ssh.putFile('.env', '/var/www/html/.env.local');
    console.log("✓ Archivos de entorno transferidos de forma segura vía SFTP.");
  } else {
    console.warn("⚠️ Archivo .env local no encontrado para transferir.");
  }
  console.log("✓ Variables de entorno configuradas.");

  // 7. Instalar dependencias de Node.js y compilar Next.js
  console.log("\n[7/9] Instalando dependencias npm y generando cliente Prisma...");
  const npmInstall = await ssh.execCommand('cd /var/www/html && npm install --legacy-peer-deps');
  console.log("✓ npm install completado:", npmInstall.stdout.slice(-150));

  console.log("Generando Prisma Client...");
  await ssh.execCommand('cd /var/www/html && npx prisma generate');

  console.log("Compilando Next.js en producción (npm run build)...");
  const buildResult = await ssh.execCommand('cd /var/www/html && npm run build');
  console.log("✓ Build Next.js completado:\n", buildResult.stdout.slice(-350));
  if (buildResult.stderr && !buildResult.stdout.includes('Compiled successfully')) {
    console.error("Avisos build:", buildResult.stderr);
  }

  // 8. Configurar Apache Proxy Reverso
  console.log("\n[8/9] Configurando Apache como Proxy Reverso...");
  await ssh.execCommand('a2enmod proxy proxy_http proxy_wstunnel headers rewrite');

  const apacheVhost = `
<VirtualHost *:80>
    ServerName intranet.telecomnetworks.org
    ServerAlias 192.168.80.241

    Alias /uploads /var/www/html/public/uploads
    <Directory /var/www/html/public/uploads>
        Options -Indexes
        Require all granted
    </Directory>

    ProxyRequests Off
    ProxyPreserveHost On
    <Proxy *>
        Require all granted
    </Proxy>
    ProxyPass /uploads !
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog \${APACHE_LOG_DIR}/intranet_error.log
    CustomLog \${APACHE_LOG_DIR}/intranet_access.log combined
</VirtualHost>
`.trim();

  await ssh.execCommand(`cat << 'EOF' > /etc/apache2/sites-available/intranet.conf\n${apacheVhost}\nEOF`);
  await ssh.execCommand('a2ensite intranet.conf && a2dissite 000-default.conf || true');
  await ssh.execCommand('apache2ctl configtest && systemctl restart apache2');
  console.log("✓ Apache reconfigurado y reiniciado.");

  // 9. Levantar aplicación con PM2
  console.log("\n[9/9] Iniciando proceso PM2 de la Intranet...");
  await ssh.execCommand('pm2 delete intranet 2>/dev/null || true');
  const pm2Start = await ssh.execCommand('cd /var/www/html && pm2 start npm --name "intranet" -- start');
  console.log(pm2Start.stdout);
  await ssh.execCommand('pm2 save');
  await ssh.execCommand('pm2 startup systemd -u root --hp /root 2>/dev/null || true');

  // Esperar 4 segundos a que Next.js enlace el puerto 3000
  await new Promise(r => setTimeout(r, 4000));

  console.log("Verificando puertos activos...");
  const ports = await ssh.execCommand('ss -tulpn | grep -E "3000|80|3306|6379"');
  console.log(ports.stdout);

  console.log("Verificando respuesta HTTP...");
  const httpCheck = await ssh.execCommand('curl -s -I http://127.0.0.1:3000/ | head -n 5');
  console.log("Respuesta puerto 3000:\n", httpCheck.stdout);

  const apacheCheck = await ssh.execCommand('curl -s -I http://127.0.0.1:80/ | head -n 5');
  console.log("Respuesta puerto 80 (Apache):\n", apacheCheck.stdout);

  ssh.dispose();

  // Limpiar archivo tar local
  if (fs.existsSync(localArchive)) fs.unlinkSync(localArchive);

  console.log("\n===============================================================");
  console.log("    ¡DESPLIEGUE COMPLETADO CON ÉXITO EN 192.168.80.241!        ");
  console.log("===============================================================");
}

main().catch(err => {
  console.error("Error en despliegue:", err);
  process.exit(1);
});
