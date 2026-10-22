import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';

const ssh = new NodeSSH();

async function main() {
  const host = '192.168.80.241';
  const username = 'root';
  const password = '[REDACTED_SECRET]';

  console.log("===============================================================");
  console.log("  DESPLIEGUE DE GESTIÓN DE GRUPOS Y ROLES A 192.168.80.241     ");
  console.log("===============================================================");

  console.log(`\n[1/4] Conectando por SSH a ${host}...`);
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log("✓ Conectado exitosamente.");

  console.log("\n[2/4] Subiendo archivos modificados al servidor...");
  const filesToTransfer = [
    { local: 'lib/permissions.ts', remote: '/var/www/html/lib/permissions.ts' },
    { local: 'app/actions/groupActions.ts', remote: '/var/www/html/app/actions/groupActions.ts' },
    { local: 'app/actions/timeOffActions.ts', remote: '/var/www/html/app/actions/timeOffActions.ts' },
    { local: 'app/actions/userActions.ts', remote: '/var/www/html/app/actions/userActions.ts' },
    { local: 'app/actions/teamActions.ts', remote: '/var/www/html/app/actions/teamActions.ts' },
    { local: 'app/admin/groups/page.tsx', remote: '/var/www/html/app/admin/groups/page.tsx' },
    { local: 'app/components/Admin/GroupManager.tsx', remote: '/var/www/html/app/components/Admin/GroupManager.tsx' },
    { local: 'app/components/Admin/UserManager.tsx', remote: '/var/www/html/app/components/Admin/UserManager.tsx' },
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
