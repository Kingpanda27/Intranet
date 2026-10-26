import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno locales si existen
if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const ssh = new NodeSSH();

async function main() {
  const host = process.env.REMOTE_HOST || '192.168.80.241';
  const username = process.env.REMOTE_USER || 'root';
  const password = process.env.REMOTE_PASSWORD;

  if (!password) {
    console.error("❌ ERROR DE SEGURIDAD: Debes definir la variable de entorno REMOTE_PASSWORD para conectar por SSH.");
    process.exit(1);
  }

  console.log("===============================================================");
  console.log(`    DESPLIEGUE A PRODUCCIÓN - INTRANET v1.2.8 (${host}) `);
  console.log("===============================================================");

  // 1. Conectar SSH
  console.log(`\n[1/5] Conectando por SSH a ${host}...`);
  await ssh.connect({ host, username, password, readyTimeout: 25000 });
  console.log("✓ Conectado exitosamente.");

  // 2. Archivos a transferir
  console.log("\n[2/5] Transfiriendo archivos de la versión 1.2.8...");
  const filesToTransfer = [
    { local: 'package.json', remote: '/var/www/html/package.json' },
    { local: 'CHANGELOG.md', remote: '/var/www/html/CHANGELOG.md' },
    { local: 'lib/auditPermissions.ts', remote: '/var/www/html/lib/auditPermissions.ts' },
    { local: 'lib/permissions.ts', remote: '/var/www/html/lib/permissions.ts' },
    { local: 'lib/auth.ts', remote: '/var/www/html/lib/auth.ts' },
    { local: 'lib/validations/index.ts', remote: '/var/www/html/lib/validations/index.ts' },
    { local: 'middleware.ts', remote: '/var/www/html/middleware.ts' },
    { local: 'app/actions/apiConfigurationActions.ts', remote: '/var/www/html/app/actions/apiConfigurationActions.ts' },
    { local: 'app/actions/auditActions.ts', remote: '/var/www/html/app/actions/auditActions.ts' },
    { local: 'app/actions/groupActions.ts', remote: '/var/www/html/app/actions/groupActions.ts' },
    { local: 'app/actions/ollamaActions.ts', remote: '/var/www/html/app/actions/ollamaActions.ts' },
    { local: 'app/actions/timeOffActions.ts', remote: '/var/www/html/app/actions/timeOffActions.ts' },
    { local: 'app/actions/userActions.ts', remote: '/var/www/html/app/actions/userActions.ts' },
    { local: 'app/admin/audit-logs/page.tsx', remote: '/var/www/html/app/admin/audit-logs/page.tsx' },
    { local: 'app/api/admin/groups/members/route.ts', remote: '/var/www/html/app/api/admin/groups/members/route.ts' },
    { local: 'app/api/chat/route.ts', remote: '/var/www/html/app/api/chat/route.ts' },
    { local: 'app/components/Admin/AdminDashboard.tsx', remote: '/var/www/html/app/components/Admin/AdminDashboard.tsx' },
    { local: 'app/components/Admin/AuditLogViewer.tsx', remote: '/var/www/html/app/components/Admin/AuditLogViewer.tsx' },
    { local: 'app/components/Admin/GroupManager.tsx', remote: '/var/www/html/app/components/Admin/GroupManager.tsx' },
    { local: 'app/components/Admin/UserManager.tsx', remote: '/var/www/html/app/components/Admin/UserManager.tsx' },
    { local: 'app/components/Layout/Sidebar.tsx', remote: '/var/www/html/app/components/Layout/Sidebar.tsx' },
    { local: 'app/components/Vacations/VacationForm.tsx', remote: '/var/www/html/app/components/Vacations/VacationForm.tsx' },
    { local: 'app/vacations/page.tsx', remote: '/var/www/html/app/vacations/page.tsx' },
    { local: 'lib/authorizationRoles.ts', remote: '/var/www/html/lib/authorizationRoles.ts' },
    { local: 'lib/requestAuthorization.ts', remote: '/var/www/html/lib/requestAuthorization.ts' },
    { local: 'app/api/requests/route.ts', remote: '/var/www/html/app/api/requests/route.ts' },
    { local: 'app/api/requests/[id]/route.ts', remote: '/var/www/html/app/api/requests/[id]/route.ts' },
    { local: 'app/api/requests/[id]/approve/route.ts', remote: '/var/www/html/app/api/requests/[id]/approve/route.ts' },
    { local: 'app/api/requests/[id]/reject/route.ts', remote: '/var/www/html/app/api/requests/[id]/reject/route.ts' },
    { local: 'app/configuracion-ti/page.tsx', remote: '/var/www/html/app/configuracion-ti/page.tsx' },
    { local: 'app/acceso-denegado/page.tsx', remote: '/var/www/html/app/acceso-denegado/page.tsx' },
    { local: 'app/dashboard/page.tsx', remote: '/var/www/html/app/dashboard/page.tsx' },
    { local: 'app/admin/config/page.tsx', remote: '/var/www/html/app/admin/config/page.tsx' }
  ];

  for (const item of filesToTransfer) {
    const localPath = path.resolve(item.local);
    if (fs.existsSync(localPath)) {
      const remoteDir = path.dirname(item.remote).replace(/\\/g, '/');
      await ssh.execCommand(`mkdir -p ${remoteDir}`);
      await ssh.putFile(localPath, item.remote);
      console.log(`  ✓ Subido: ${item.local} -> ${item.remote}`);
    } else {
      console.warn(`  ⚠️ Archivo no encontrado: ${item.local}`);
    }
  }

  // 3. Compilar en el servidor
  console.log("\n[3/5] Compilando Next.js en el servidor (npm run build)...");
  const buildResult = await ssh.execCommand('cd /var/www/html && npm run build');
  console.log(buildResult.stdout.slice(-400));
  if (buildResult.code !== 0) {
    console.error("❌ Error en compilación:", buildResult.stderr);
    ssh.dispose();
    process.exit(1);
  }
  console.log("✓ Compilación de Next.js completada con éxito.");

  // 4. Recargar proceso PM2
  console.log("\n[4/5] Recargando proceso PM2 intranet...");
  await ssh.execCommand('pm2 reload intranet --update-env');
  await ssh.execCommand('pm2 save');
  console.log("✓ Proceso PM2 recargado.");

  // Esperar 3 segundos para que el servidor levante
  await new Promise(r => setTimeout(r, 3000));

  // 5. Test de salud HTTP
  console.log("\n[5/5] Verificando respuesta HTTP del servidor...");
  const healthCheck = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/');
  console.log(`✓ Código HTTP devuelto por Next.js: ${healthCheck.stdout.trim()}`);

  ssh.dispose();
  console.log("\n===============================================================");
  console.log("   ¡DESPLIEGUE A PRODUCCIÓN v1.2.0 COMPLETADO CON ÉXITO!      ");
  console.log("===============================================================");
}

main().catch(err => {
  console.error("Error fatal durante el despliegue:", err);
  process.exit(1);
});
