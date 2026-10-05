const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROLES_DATA = [
  { name: 'AGENT', level: 10, description: 'Empleado estándar de la organización con acceso general' },
  { name: 'USER', level: 10, description: 'Rol legacy equivalente a AGENT' },
  { name: 'SUPERVISOR', level: 20, description: 'Supervisor de equipo con capacidad de solicitar cambios de rol' },
  { name: 'MANAGER', level: 30, description: 'Gerente de área con supervisión de múltiples grupos' },
  { name: 'HR', level: 35, description: 'Recursos Humanos para gestión de personal y ausencias' },
  { name: 'TECHNOLOGY', level: 40, description: 'Equipo de TI con administración de usuarios y aprobación de roles' },
  { name: 'TECHNOLOGY_ADMIN', level: 50, description: 'Administrador superior de infraestructura y seguridad TI' },
  { name: 'IT_MANAGER', level: 50, description: 'Gerente de TI con privilegios de administración completa' },
  { name: 'NO_ROLE', level: 0, description: 'Cuenta inactiva o sin rol asignado' }
];

const PERMISSIONS_DATA = [
  // Usuarios y Roles
  { code: 'users.view', name: 'Ver usuarios', category: 'USERS', description: 'Consultar directorio de empleados' },
  { code: 'users.create', name: 'Crear usuarios', category: 'USERS', description: 'Dar de alta nuevos usuarios' },
  { code: 'users.edit', name: 'Editar usuarios', category: 'USERS', description: 'Modificar perfiles de usuarios' },
  { code: 'users.disable', name: 'Desactivar usuarios', category: 'USERS', description: 'Suspender acceso a usuarios' },
  { code: 'users.role.view', name: 'Ver roles de usuarios', category: 'USERS', description: 'Consultar roles asignados' },
  { code: 'users.role.change', name: 'Cambiar roles directamente', category: 'ROLES', description: 'Modificar rol de usuario sin solicitud' },
  { code: 'users.role.request', name: 'Solicitar cambio de rol', category: 'ROLES', description: 'Crear solicitud de cambio de rol para un usuario' },
  { code: 'users.role.approve', name: 'Aprobar solicitudes de rol', category: 'ROLES', description: 'Aprobar cambios de rol pendientes' },
  { code: 'users.role.reject', name: 'Rechazar solicitudes de rol', category: 'ROLES', description: 'Rechazar solicitudes de rol con motivo' },

  // Equipo y Reportes
  { code: 'team.view', name: 'Ver equipo', category: 'TEAM', description: 'Ver miembros y métricas de su equipo' },
  { code: 'team.manage', name: 'Administrar equipo', category: 'TEAM', description: 'Gestionar asignaciones de equipo' },
  { code: 'reports.view', name: 'Ver reportes', category: 'REPORTS', description: 'Acceso a estadísticas y reportes' },
  { code: 'reports.manage', name: 'Administrar reportes', category: 'REPORTS', description: 'Configurar reportes' },

  // Documentos
  { code: 'documents.view', name: 'Ver documentos', category: 'DOCUMENTS', description: 'Acceso a la base de conocimiento' },
  { code: 'documents.manage', name: 'Administrar documentos', category: 'DOCUMENTS', description: 'Subir y eliminar documentos' },

  // Vacaciones y Permisos
  { code: 'vacation.request', name: 'Solicitar vacaciones', category: 'VACATIONS', description: 'Crear solicitudes de tiempo libre' },
  { code: 'vacation.manage', name: 'Aprobar vacaciones', category: 'VACATIONS', description: 'Aprobar o rechazar permisos' },

  // Sistema y Auditoría
  { code: 'system.settings', name: 'Configuración del sistema', category: 'SYSTEM', description: 'Configuración general de TI' },
  { code: 'audit.view', name: 'Ver logs de auditoría', category: 'AUDIT', description: 'Consultar el registro de auditoría' }
];

const ROLE_PERMISSIONS_MATRIX = {
  TECHNOLOGY_ADMIN: [
    'users.view', 'users.create', 'users.edit', 'users.disable', 'users.role.view',
    'users.role.change', 'users.role.request', 'users.role.approve', 'users.role.reject',
    'team.view', 'team.manage', 'reports.view', 'reports.manage',
    'documents.view', 'documents.manage', 'vacation.request', 'vacation.manage',
    'system.settings', 'audit.view'
  ],
  IT_MANAGER: [
    'users.view', 'users.create', 'users.edit', 'users.disable', 'users.role.view',
    'users.role.change', 'users.role.request', 'users.role.approve', 'users.role.reject',
    'team.view', 'team.manage', 'reports.view', 'reports.manage',
    'documents.view', 'documents.manage', 'vacation.request', 'vacation.manage',
    'system.settings', 'audit.view'
  ],
  TECHNOLOGY: [
    'users.view', 'users.create', 'users.edit', 'users.disable', 'users.role.view',
    'users.role.change', 'users.role.request', 'users.role.approve', 'users.role.reject',
    'team.view', 'documents.view', 'documents.manage', 'vacation.request', 'vacation.manage',
    'system.settings', 'audit.view'
  ],
  HR: [
    'users.view', 'users.create', 'users.edit', 'users.role.view', 'users.role.request',
    'team.view', 'reports.view', 'documents.view', 'documents.manage',
    'vacation.request', 'vacation.manage'
  ],
  MANAGER: [
    'users.view', 'users.role.view', 'users.role.request',
    'team.view', 'team.manage', 'reports.view',
    'documents.view', 'documents.manage', 'vacation.request', 'vacation.manage'
  ],
  SUPERVISOR: [
    'users.role.request',
    'team.view', 'documents.view', 'vacation.request', 'vacation.manage'
  ],
  AGENT: [
    'documents.view', 'vacation.request'
  ],
  USER: [
    'documents.view', 'vacation.request'
  ],
  NO_ROLE: []
};

async function seedRBAC() {
  console.log('Iniciando población de Roles y Permisos RBAC...');

  // 1. Crear o actualizar Roles
  const rolesMap = {};
  for (const r of ROLES_DATA) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { level: r.level, description: r.description },
      create: { name: r.name, level: r.level, description: r.description, isSystem: true }
    });
    rolesMap[r.name] = role;
  }
  console.log(`✓ ${Object.keys(rolesMap).length} Roles sincronizados.`);

  // 2. Crear o actualizar Permisos
  const permsMap = {};
  for (const p of PERMISSIONS_DATA) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, category: p.category, description: p.description },
      create: { code: p.code, name: p.name, category: p.category, description: p.description }
    });
    permsMap[p.code] = perm;
  }
  console.log(`✓ ${Object.keys(permsMap).length} Permisos sincronizados.`);

  // 3. Crear relaciones RolePermission
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS_MATRIX)) {
    const role = rolesMap[roleName];
    if (!role) continue;

    for (const code of permCodes) {
      const perm = permsMap[code];
      if (!perm) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id
        }
      });
    }
  }
  console.log('✓ Matriz de Permisos asignada a Roles.');

  // 4. Migrar usuarios existentes: vincular su roleId según su role actual
  const users = await prisma.user.findMany({ select: { id: true, role: true, roleId: true } });
  let migratedUsers = 0;
  for (const u of users) {
    const currentRoleName = (u.role || 'AGENT').trim().toUpperCase();
    const matchingRole = rolesMap[currentRoleName] || rolesMap['AGENT'];
    if (matchingRole && u.roleId !== matchingRole.id) {
      await prisma.user.update({
        where: { id: u.id },
        data: { roleId: matchingRole.id }
      });
      migratedUsers++;
    }
  }
  console.log(`✓ ${migratedUsers} usuarios vinculados a sus respectivos Role IDs en base de datos.`);
  console.log('Población de RBAC completada con éxito.');
}

seedRBAC()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
