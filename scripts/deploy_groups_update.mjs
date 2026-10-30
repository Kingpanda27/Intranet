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
  console.log(`  DESPLIEGUE DE GESTIÓN DE GRUPOS Y ROLES A ${host}     `);
  console.log("===============================================================");

  console.log(`\n[1/4] Conectando por SSH a ${host}...`);
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log("✓ Conectado exitosamente.");

  console.log("\n[2/4] Subiendo archivos modificados al servidor...");
  const filesToTransfer = [
    { local: 'lib/permissions.ts', remote: '/var/www/html/lib/permissions.ts' },
    { local: 'lib/authorizationRoles.ts', remote: '/var/www/html/lib/authorizationRoles.ts' },
    { local: 'lib/auditPermissions.ts', remote: '/var/www/html/lib/auditPermissions.ts' },
    { local: 'lib/dateUtils.ts', remote: '/var/www/html/lib/dateUtils.ts' },
    { local: 'lib/userUtils.ts', remote: '/var/www/html/lib/userUtils.ts' },
    { local: 'lib/auth.ts', remote: '/var/www/html/lib/auth.ts' },
    { local: 'lib/requestAuthorization.ts', remote: '/var/www/html/lib/requestAuthorization.ts' },
    { local: 'lib/privateStorage.ts', remote: '/var/www/html/lib/privateStorage.ts' },
    { local: 'middleware.ts', remote: '/var/www/html/middleware.ts' },
    { local: 'lib/validations/index.ts', remote: '/var/www/html/lib/validations/index.ts' },
    { local: 'app/dashboard/page.tsx', remote: '/var/www/html/app/dashboard/page.tsx' },
    { local: 'app/actions/groupActions.ts', remote: '/var/www/html/app/actions/groupActions.ts' },
    { local: 'app/actions/homeActions.ts', remote: '/var/www/html/app/actions/homeActions.ts' },
    { local: 'app/actions/timeOffActions.ts', remote: '/var/www/html/app/actions/timeOffActions.ts' },
    { local: 'app/actions/userActions.ts', remote: '/var/www/html/app/actions/userActions.ts' },
    { local: 'app/actions/calendarActions.ts', remote: '/var/www/html/app/actions/calendarActions.ts' },
    { local: 'app/calendar/page.tsx', remote: '/var/www/html/app/calendar/page.tsx' },
    { local: 'app/actions/roleRequestActions.ts', remote: '/var/www/html/app/actions/roleRequestActions.ts' },
    { local: 'app/actions/auditActions.ts', remote: '/var/www/html/app/actions/auditActions.ts' },
    { local: 'app/actions/apiConfigurationActions.ts', remote: '/var/www/html/app/actions/apiConfigurationActions.ts' },
    { local: 'app/actions/postActions.ts', remote: '/var/www/html/app/actions/postActions.ts' },
    { local: 'app/actions/teamActions.ts', remote: '/var/www/html/app/actions/teamActions.ts' },
    { local: 'app/admin/groups/page.tsx', remote: '/var/www/html/app/admin/groups/page.tsx' },
    { local: 'app/groups/[id]/page.tsx', remote: '/var/www/html/app/groups/[id]/page.tsx' },
    { local: 'app/groups/[id]/TeamDashboardView.tsx', remote: '/var/www/html/app/groups/[id]/TeamDashboardView.tsx' },
    { local: 'app/groups/[id]/GroupEditModal.tsx', remote: '/var/www/html/app/groups/[id]/GroupEditModal.tsx' },
    { local: 'app/admin/config/page.tsx', remote: '/var/www/html/app/admin/config/page.tsx' },
    { local: 'app/admin/audit-logs/page.tsx', remote: '/var/www/html/app/admin/audit-logs/page.tsx' },
    { local: 'app/admin/role-requests/page.tsx', remote: '/var/www/html/app/admin/role-requests/page.tsx' },
    { local: 'app/admin/users/page.tsx', remote: '/var/www/html/app/admin/users/page.tsx' },
    { local: 'app/profile/page.tsx', remote: '/var/www/html/app/profile/page.tsx' },
    { local: 'app/components/Profile/ProfileView.tsx', remote: '/var/www/html/app/components/Profile/ProfileView.tsx' },
    { local: 'app/components/Profile/ProfileForm.tsx', remote: '/var/www/html/app/components/Profile/ProfileForm.tsx' },
    { local: 'app/components/UI/UserStatusBadge.tsx', remote: '/var/www/html/app/components/UI/UserStatusBadge.tsx' },
    { local: 'app/components/Admin/GroupManager.tsx', remote: '/var/www/html/app/components/Admin/GroupManager.tsx' },
    { local: 'app/components/Admin/AdminDashboard.tsx', remote: '/var/www/html/app/components/Admin/AdminDashboard.tsx' },
    { local: 'app/components/Admin/UserManager.tsx', remote: '/var/www/html/app/components/Admin/UserManager.tsx' },
    { local: 'app/components/Vacations/VacationForm.tsx', remote: '/var/www/html/app/components/Vacations/VacationForm.tsx' },
    { local: 'app/components/Vacations/VacationList.tsx', remote: '/var/www/html/app/components/Vacations/VacationList.tsx' },
    { local: 'app/components/Layout/Sidebar.tsx', remote: '/var/www/html/app/components/Layout/Sidebar.tsx' },
    { local: 'app/components/Layout/Sidebar.module.css', remote: '/var/www/html/app/components/Layout/Sidebar.module.css' },
    { local: 'app/components/Layout/TopBar.tsx', remote: '/var/www/html/app/components/Layout/TopBar.tsx' },
    { local: 'app/api/admin/groups/members/route.ts', remote: '/var/www/html/app/api/admin/groups/members/route.ts' },
    { local: 'app/api/requests/bulk-approve/route.ts', remote: '/var/www/html/app/api/requests/bulk-approve/route.ts' },
    { local: 'app/actions/friendActions.ts', remote: '/var/www/html/app/actions/friendActions.ts' },
    { local: 'app/social/page.tsx', remote: '/var/www/html/app/social/page.tsx' },
    { local: 'app/components/Social/PeopleSearch.tsx', remote: '/var/www/html/app/components/Social/PeopleSearch.tsx' },
    { local: 'app/components/Social/SocialStatCards.tsx', remote: '/var/www/html/app/components/Social/SocialStatCards.tsx' },
    { local: 'app/components/Chat/SocialChatBar.tsx', remote: '/var/www/html/app/components/Chat/SocialChatBar.tsx' },
    { local: 'app/components/Chat/SocialChatBar.module.css', remote: '/var/www/html/app/components/Chat/SocialChatBar.module.css' },
    { local: 'app/components/Chat/ChatView.tsx', remote: '/var/www/html/app/components/Chat/ChatView.tsx' },
    { local: 'app/components/Feed/RightPanel.tsx', remote: '/var/www/html/app/components/Feed/RightPanel.tsx' },
    { local: 'app/components/Feed/PostCard.tsx', remote: '/var/www/html/app/components/Feed/PostCard.tsx' },
    { local: 'lib/holidayData.ts', remote: '/var/www/html/lib/holidayData.ts' },
    { local: 'app/components/Dashboard/MetricsInteractiveCards.tsx', remote: '/var/www/html/app/components/Dashboard/MetricsInteractiveCards.tsx' },
    { local: 'app/page.tsx', remote: '/var/www/html/app/page.tsx' },
    { local: 'app/actions/ollamaActions.ts', remote: '/var/www/html/app/actions/ollamaActions.ts' },
    { local: 'app/components/Feed/CreatePost.tsx', remote: '/var/www/html/app/components/Feed/CreatePost.tsx' },
    { local: 'app/components/Feed/AiPostModal.tsx', remote: '/var/www/html/app/components/Feed/AiPostModal.tsx' },
    { local: 'app/components/Social/GiveRecognitionModal.tsx', remote: '/var/www/html/app/components/Social/GiveRecognitionModal.tsx' },
    { local: 'app/components/Dashboard/DailySummary.tsx', remote: '/var/www/html/app/components/Dashboard/DailySummary.tsx' },
    { local: 'app/components/Vacations/UpcomingHolidaysWidget.tsx', remote: '/var/www/html/app/components/Vacations/UpcomingHolidaysWidget.tsx' },
    { local: 'app/components/Admin/AuditLogViewer.tsx', remote: '/var/www/html/app/components/Admin/AuditLogViewer.tsx' },
    { local: 'app/vacations/page.tsx', remote: '/var/www/html/app/vacations/page.tsx' },
    { local: 'app/Providers.tsx', remote: '/var/www/html/app/Providers.tsx' },
    { local: 'locales/es.json', remote: '/var/www/html/locales/es.json' },
    { local: 'locales/en.json', remote: '/var/www/html/locales/en.json' },
    { local: 'lib/i18n/types.ts', remote: '/var/www/html/lib/i18n/types.ts' },
    { local: 'lib/i18n/dictionaries.ts', remote: '/var/www/html/lib/i18n/dictionaries.ts' },
    { local: 'lib/i18n/LanguageContext.tsx', remote: '/var/www/html/lib/i18n/LanguageContext.tsx' },
    { local: 'app/components/UI/LanguageSwitcher.tsx', remote: '/var/www/html/app/components/UI/LanguageSwitcher.tsx' },
    { local: 'app/api/requests/[id]/route.ts', remote: '/var/www/html/app/api/requests/[id]/route.ts' },
    { local: 'app/api/requests/[id]/approve/route.ts', remote: '/var/www/html/app/api/requests/[id]/approve/route.ts' },
    { local: 'app/api/requests/[id]/reject/route.ts', remote: '/var/www/html/app/api/requests/[id]/reject/route.ts' },
    { local: 'app/api/attachments/[requestId]/route.ts', remote: '/var/www/html/app/api/attachments/[requestId]/route.ts' },
    { local: 'app/api/chat/route.ts', remote: '/var/www/html/app/api/chat/route.ts' },
    { local: 'app/actions/embeddingActions.ts', remote: '/var/www/html/app/actions/embeddingActions.ts' },
    { local: 'app/components/Admin/Config/OllamaManager.tsx', remote: '/var/www/html/app/components/Admin/Config/OllamaManager.tsx' },
    { local: 'app/components/KnowledgeBase/KBList.tsx', remote: '/var/www/html/app/components/KnowledgeBase/KBList.tsx' },
    { local: 'app/components/Auth/LoginForm.tsx', remote: '/var/www/html/app/components/Auth/LoginForm.tsx' },
    { local: 'lib/version.ts', remote: '/var/www/html/lib/version.ts' },
    { local: 'package.json', remote: '/var/www/html/package.json' },
    { local: 'CHANGELOG.md', remote: '/var/www/html/CHANGELOG.md' },
    { local: 'DOCUMENTACION.md', remote: '/var/www/html/DOCUMENTACION.md' },
    { local: 'prisma/schema.prisma', remote: '/var/www/html/prisma/schema.prisma' },
    { local: 'tsconfig.json', remote: '/var/www/html/tsconfig.json' },
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

  console.log("\n[3/4] Generando Prisma Client y Compilando Next.js en el servidor...");
  const prismaGenResult = await ssh.execCommand('cd /var/www/html && npx prisma generate');
  console.log("  ✓ Prisma Generate:", prismaGenResult.stdout.trim() || prismaGenResult.stderr);

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
