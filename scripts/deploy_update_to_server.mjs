import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';

const ssh = new NodeSSH();

async function main() {
  const host = '192.168.80.241';
  const username = 'root';
  const password = 'nexus.rdom';

  console.log("===============================================================");
  console.log("   DESPLIEGUE RÁPIDO DE INTEGRACIÓN NVIDIA AI A 192.168.80.241 ");
  console.log("===============================================================");

  // 1. Conectar SSH
  console.log(`\n[1/5] Conectando por SSH a ${host}...`);
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log("✓ Conectado.");

  // 2. Actualizar variables .env en el servidor
  console.log("\n[2/5] Sincronizando variables de entorno con el servidor...");
  if (fs.existsSync('.env')) {
    await ssh.putFile('.env', '/var/www/html/.env');
    await ssh.putFile('.env', '/var/www/html/.env.local');
    console.log("✓ Variables de entorno sincronizadas vía SFTP.");
  }

  // 3. Transferir archivos modificados
  console.log("\n[3/5] Subiendo archivos modificados al servidor...");
  const filesToTransfer = [
    { local: 'lib/supportAiLlamaService.ts', remote: '/var/www/html/lib/supportAiLlamaService.ts' },
    { local: 'app/api/ollama/generate/route.ts', remote: '/var/www/html/app/api/ollama/generate/route.ts' },
    { local: 'app/api/nvidia/generate/route.ts', remote: '/var/www/html/app/api/nvidia/generate/route.ts' },
    { local: 'app/components/SupportAILlama/SupportContext.tsx', remote: '/var/www/html/app/components/SupportAILlama/SupportContext.tsx' },
    { local: 'app/components/SupportAILlama/ChatAssistantView.tsx', remote: '/var/www/html/app/components/SupportAILlama/ChatAssistantView.tsx' },
    { local: 'app/components/SupportAILlama/SupportAILlamaContainer.tsx', remote: '/var/www/html/app/components/SupportAILlama/SupportAILlamaContainer.tsx' },
    { local: 'app/components/SupportAILlama/SupportAILlama.module.css', remote: '/var/www/html/app/components/SupportAILlama/SupportAILlama.module.css' },
    { local: 'app/components/Admin/Config/AiIntegrationsManager.tsx', remote: '/var/www/html/app/components/Admin/Config/AiIntegrationsManager.tsx' },
    { local: 'app/components/Chat/SocialChatBar.tsx', remote: '/var/www/html/app/components/Chat/SocialChatBar.tsx' },
    { local: 'app/components/Layout/Sidebar.tsx', remote: '/var/www/html/app/components/Layout/Sidebar.tsx' },
    { local: 'app/actions/ollamaActions.ts', remote: '/var/www/html/app/actions/ollamaActions.ts' },
    { local: 'app/actions/homeActions.ts', remote: '/var/www/html/app/actions/homeActions.ts' },
    { local: 'app/components/Dashboard/MetricsInteractiveCards.tsx', remote: '/var/www/html/app/components/Dashboard/MetricsInteractiveCards.tsx' },
    { local: 'app/components/Vacations/UpcomingHolidaysWidget.tsx', remote: '/var/www/html/app/components/Vacations/UpcomingHolidaysWidget.tsx' },
    { local: 'app/components/Vacations/HolidayManager.tsx', remote: '/var/www/html/app/components/Vacations/HolidayManager.tsx' },
    { local: 'middleware.ts', remote: '/var/www/html/middleware.ts' },
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

  // 4. Compilar Next.js en el servidor
  console.log("\n[4/5] Compilando Next.js en el servidor (npm run build)...");
  const buildResult = await ssh.execCommand('cd /var/www/html && npm run build');
  console.log(buildResult.stdout.slice(-300));
  if (buildResult.code !== 0) {
    console.error("Error en build:", buildResult.stderr);
    ssh.dispose();
    process.exit(1);
  }

  // 5. Recargar proceso PM2
  console.log("\n[5/5] Recargando proceso PM2 intranet...");
  await ssh.execCommand('pm2 reload intranet --update-env');
  await ssh.execCommand('pm2 save');
  console.log("✓ Proceso PM2 recargado.");

  // Esperar a que el proceso Next.js levante el listener HTTP
  await new Promise(r => setTimeout(r, 3000));

  // 6. Test HTTP en el servidor
  console.log("\nValidando endpoint en servidor remoto (curl)...");
  const testCurl = await ssh.execCommand(`
    curl -s -X POST http://127.0.0.1:3000/api/ollama/generate \\
      -H "Content-Type: application/json" \\
      -d '{"prompt": "Di: NVIDIA AI y ocultamiento de contactos verificado."}'
  `);
  console.log("Respuesta endpoint:\n", testCurl.stdout);
  if (testCurl.stderr) console.error(testCurl.stderr);

  ssh.dispose();

  console.log("\n===============================================================");
  console.log("    ¡DESPLIEGUE DE NVIDIA AI EXITOSO EN EL SERVIDOR REMOTO!    ");
  console.log("===============================================================");
}

main().catch(err => {
  console.error("Error en despliegue:", err);
  process.exit(1);
});
