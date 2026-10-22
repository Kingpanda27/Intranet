import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';

const ssh = new NodeSSH();

async function main() {
  const host = '192.168.80.241';
  const username = 'root';
  const password = 'nexus.rdom';

  console.log("===============================================================");
  console.log("  DESPLIEGUE DE GESTIÓN DE GRUPOS Y ROLES A 192.168.80.241     ");
  console.log("===============================================================");

  console.log(`\n[1/4] Conectando por SSH a ${host}...`);
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log("✓ Conectado exitosamente.");

  console.log("\n[2/4] Subiendo archivos modificados al servidor...");
  const filesToTransfer = [
    { local: 'lib/permissions.ts', remote: '/var/www/html/lib/permissions.ts' },
    { local: 'lib/auth.ts', remote: '/var/www/html/lib/auth.ts' },
    { local: 'middleware.ts', remote: '/var/www/html/middleware.ts' },
    { local: 'lib/validations/index.ts', remote: '/var/www/html/lib/validations/index.ts' },
    { local: 'app/dashboard/page.tsx', remote: '/var/www/html/app/dashboard/page.tsx' },
    { local: 'app/actions/groupActions.ts', remote: '/var/www/html/app/actions/groupActions.ts' },
    { local: 'app/actions/timeOffActions.ts', remote: '/var/www/html/app/actions/timeOffActions.ts' },
    { local: 'app/actions/userActions.ts', remote: '/var/www/html/app/actions/userActions.ts' },
    { local: 'app/actions/calendarActions.ts', remote: '/var/www/html/app/actions/calendarActions.ts' },
    { local: 'app/actions/roleRequestActions.ts', remote: '/var/www/html/app/actions/roleRequestActions.ts' },
    { local: 'app/actions/auditActions.ts', remote: '/var/www/html/app/actions/auditActions.ts' },
    { local: 'app/actions/apiConfigurationActions.ts', remote: '/var/www/html/app/actions/apiConfigurationActions.ts' },
    { local: 'app/actions/postActions.ts', remote: '/var/www/html/app/actions/postActions.ts' },
    { local: 'app/actions/teamActions.ts', remote: '/var/www/html/app/actions/teamActions.ts' },
    { local: 'app/admin/groups/page.tsx', remote: '/var/www/html/app/admin/groups/page.tsx' },
    { local: 'app/admin/config/page.tsx', remote: '/var/www/html/app/admin/config/page.tsx' },
    { local: 'app/admin/audit-logs/page.tsx', remote: '/var/www/html/app/admin/audit-logs/page.tsx' },
    { local: 'app/admin/role-requests/page.tsx', remote: '/var/www/html/app/admin/role-requests/page.tsx' },
    { local: 'app/components/Admin/GroupManager.tsx', remote: '/var/www/html/app/components/Admin/GroupManager.tsx' },
    { local: 'app/components/Admin/UserManager.tsx', remote: '/var/www/html/app/components/Admin/UserManager.tsx' },
    { local: 'app/components/Layout/Sidebar.tsx', remote: '/var/www/html/app/components/Layout/Sidebar.tsx' },
    { local: 'app/api/admin/groups/members/route.ts', remote: '/var/www/html/app/api/admin/groups/members/route.ts' },
  ];

  for (const item of filesToTransfer) {
    const localPath = path.resolve(item.local);
    if (fs.existsSync(localPath)) {
      const remoteDir = path.dirname(item.remote).replace(/\\/g, '/');
      await ssh.execCommand(`mkdir -p ${remoteDir}`);
      await ssh.putFile(localPath, item.remote);
      console.log(`  ✓ Transferido: ${item.local} -> ${item.remote}`);
    } else {
      console.warn(`  ⚠️ Archivo no encontrado: ${item.local}`);
    }
  }

  console.log("\n[3/4] Compilando Next.js en el servidor (npm run build)...");
  const buildResult = await ssh.execCommand('cd /var/www/html && npm run build');
  console.log(buildResult.stdout.slice(-400));
  if (buildResult.code !== 0) {
    console.error("Error en build:", buildResult.stderr);
    ssh.dispose();
    process.exit(1);
  }

  console.log("\n[4/4] Recargando PM2...");
  await ssh.execCommand('pm2 reload intranet --update-env');
  await ssh.execCommand('pm2 save');
  console.log("✓ Proceso PM2 recargado.");

  ssh.dispose();
  console.log("\n===============================================================");
  console.log("   ¡DESPLIEGUE COMPLETADO Y SERVICIO LISTO EN PRODUCCIÓN!     ");
  console.log("===============================================================");
}

main().catch(err => {
  console.error("Error en despliegue:", err);
  process.exit(1);
});
