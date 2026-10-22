import mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getPrefix(email) {
  if (!email) return "";
  return email.split("@")[0].toLowerCase().trim();
}

function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ");
}

function cleanGroupName(name) {
  if (!name) return "";
  return name.replace(/&amp;/g, "&").trim();
}

const DEPT_TO_GROUP = {
  "hapusa": "HAPUSA CS",
  "hapusa cs": "HAPUSA CS",
  "hapusa ar": "HAPUSA AR",
  "hapusa cp": "HAPUSA CP",
  "online divorce cs": "OnlineDivorce Customer Service",
  "onlinedivorce customer service": "OnlineDivorce Customer Service",
  "onlinedivorce sales": "OnlineDivorce Sales",
  "online divorce sales": "OnlineDivorce Sales",
  "pop menu": "PopMenu",
  "popmenu": "PopMenu",
  "bayada referrals": "Call of Duty",
  "bayada pocs": "TUPOCS",
  "bayada pocs cpc": "TUPOCS",
  "bayada f2f": "Avengers",
  "bayada hhc": "Batman & Robins",
  "bayada episode detail": "Batman & Robins",
  "bayada pc": "Cherry",
  "payoneer": "PAYONEER",
  "client acquisition": "Client Acquisition",
  "site management": "Management",
  "administration": "Admin",
  "admin": "Admin",
  "qa": "QA",
  "qa team": "QA Team",
  "human resources": "HR",
  "hr": "HR",
  "it": "IT",
  "aci": "ACI",
  "nuorder": "NuOrder",
  "wfm": "WFM",
  "marketing": "Marketing",
  "pd hvac": "PD HVAC",
  "special ops": "Special Ops",
  "district 12": "District 12",
  "consenters": "Consenters",
  "hunger games": "Hunger Games",
  "coffee": "Coffee",
  "fbm": "FBM",
  "study fetch": "Study Fetch",
  "century": "Century",
  "batcave": "Batcave"
};

const GROUP_METADATA = {
  "ACI": { color: "#3b82f6", icon: "🏢", desc: "Equipo de operaciones ACI" },
  "HAPUSA CS": { color: "#06b6d4", icon: "🎧", desc: "Atención al cliente HAPUSA" },
  "HAPUSA CP": { color: "#0284c7", icon: "📞", desc: "Equipo HAPUSA CP" },
  "HAPUSA AR": { color: "#0ea5e9", icon: "📋", desc: "HAPUSA Cuentas por Cobrar" },
  "Call of Duty": { color: "#10b981", icon: "🎮", desc: "Equipo Call of Duty / Bayada Referrals" },
  "NuOrder": { color: "#8b5cf6", icon: "📦", desc: "Equipo de soporte NuOrder" },
  "TUPOCS": { color: "#ec4899", icon: "⚡", desc: "Operaciones TUPOCS" },
  "IT": { color: "#f59e0b", icon: "💻", desc: "Tecnología e Infraestructura" },
  "Avengers": { color: "#ef4444", icon: "🛡️", desc: "Escuadrón Avengers / Bayada F2F" },
  "Coffee": { color: "#d97706", icon: "☕", desc: "Equipo Coffee" },
  "Consenters": { color: "#14b8a6", icon: "🤝", desc: "Equipo Consenters" },
  "District 12": { color: "#6366f1", icon: "🏹", desc: "Operaciones District 12" },
  "Special Ops": { color: "#475569", icon: "🎯", desc: "Operaciones Especiales" },
  "Batman & Robins": { color: "#1e293b", icon: "🦇", desc: "Equipo Batman & Robins" },
  "OnlineDivorce Customer Service": { color: "#f43f5e", icon: "💬", desc: "Atención al cliente OnlineDivorce" },
  "OnlineDivorce Sales": { color: "#e11d48", icon: "📈", desc: "Ventas OnlineDivorce" },
  "Cherry": { color: "#be123c", icon: "🍒", desc: "Equipo Cherry / Bayada PC" },
  "Hunger Games": { color: "#ea580c", icon: "🔥", desc: "Equipo Hunger Games" },
  "Batcave": { color: "#334155", icon: "🌑", desc: "Operaciones Batcave" },
  "PAYONEER": { color: "#f97316", icon: "💳", desc: "Operaciones Payoneer" },
  "FBM": { color: "#84cc16", icon: "🚚", desc: "Equipo FBM" },
  "PopMenu": { color: "#eab308", icon: "🍽️", desc: "Soporte PopMenu" },
  "QA": { color: "#a855f7", icon: "🔍", desc: "Control de Calidad (QA)" },
  "QA Team": { color: "#9333ea", icon: "🔎", desc: "Equipo de Calidad" },
  "Study Fetch": { color: "#2563eb", icon: "📚", desc: "Equipo Study Fetch" },
  "Century": { color: "#64748b", icon: "🏛️", desc: "Operaciones Century" },
  "PD HVAC": { color: "#0891b2", icon: "❄️", desc: "Equipo PD HVAC" },
  "HR": { color: "#10b981", icon: "👥", desc: "Gestión Humana y Talento" },
  "Client Acquisition": { color: "#22c55e", icon: "🎯", desc: "Adquisición de Clientes" },
  "WFM": { color: "#3b82f6", icon: "📊", desc: "Workforce Management" },
  "MOVESPEED": { color: "#f43f5e", icon: "⚡", desc: "Equipo MOVESPEED" },
  "Goodworks-Managers": { color: "#7c3aed", icon: "👔", desc: "Liderazgo Goodworks" },
  "Tecma Aries": { color: "#059669", icon: "🏭", desc: "Operaciones Tecma Aries" },
  "Management": { color: "#4f46e5", icon: "👑", desc: "Dirección y Gerencia General" },
  "MICROSOFT": { color: "#00a4ef", icon: "🪟", desc: "Cuentas Microsoft" },
  "Admin": { color: "#6b7280", icon: "⚙️", desc: "Administración General" },
  "SDR": { color: "#16a34a", icon: "🎯", desc: "Sales Development Reps" },
  "ALTICE USA": { color: "#d946ef", icon: "📡", desc: "Operaciones Altice USA" },
  "TMOBILE SALES": { color: "#e11d48", icon: "📱", desc: "Ventas T-Mobile" },
  "Marketing": { color: "#f43f5e", icon: "📣", desc: "Mercadeo y Comunicación" }
};

async function main() {
  console.log("=================================================");
  console.log("INICIANDO SINCRONIZACIÓN AUTOMÁTICA DE GRUPOS");
  console.log("=================================================");

  // 1. Connect to read-only external database
  const extDb = await mysql.createConnection({
    host: "192.168.60.230",
    user: "mbertozzo",
    password: "[REDACTED_SECRET]",
    database: "wfm_platform"
  });
  console.log("✓ Conexión exitosa a base de datos externa (wfm_platform) en modo SOLO LECTURA.");

  // 2. Fetch all unique groups from desktime_employee_data
  const [extGroups] = await extDb.query(`
    SELECT DISTINCT group_name
    FROM desktime_employee_data
    WHERE group_name IS NOT NULL AND group_name != '' AND group_name != '-' AND group_name != 'Without team'
  `);
  const allDesktimeGroupNames = extGroups.map(g => cleanGroupName(g.group_name));
  console.log(`✓ Leídos ${allDesktimeGroupNames.length} grupos distintos de desktime_employee_data.`);

  // 3. Fetch latest desktime record per employee
  const [desktimeRows] = await extDb.query(`
    SELECT d.employee_id, d.name, d.email, d.group_name, d.log_date
    FROM desktime_employee_data d
    INNER JOIN (
      SELECT employee_id, MAX(log_date) as max_date
      FROM desktime_employee_data
      WHERE group_name IS NOT NULL AND group_name != '' AND group_name != '-' AND group_name != 'Without team'
      GROUP BY employee_id
    ) latest ON d.employee_id = latest.employee_id AND d.log_date = latest.max_date
  `);
  console.log(`✓ Leídos ${desktimeRows.length} registros más recientes de empleados en Desktime.`);

  // 4. Fetch job titles and department from odoo_employee_data
  const [odooRows] = await extDb.query(`
    SELECT employee_id, desktime_id, work_email, employee_name, job_title, department_name
    FROM odoo_employee_data
  `);
  console.log(`✓ Leídos ${odooRows.length} registros de cargos y títulos en Odoo.`);

  // 5. Fetch team managers from org_team_managers
  const [teamManagers] = await extDb.query(`
    SELECT m.manager_name, t.name as team_name
    FROM org_team_managers m
    LEFT JOIN org_teams t ON m.target_id = t.id
  `);
  console.log(`✓ Leídos ${teamManagers.length} gerentes asignados en org_team_managers.`);

  await extDb.end();
  console.log("✓ Conexión con base externa cerrada. No se alteró ningún dato externo.");

  // Build lookup maps for fast matching
  const dtByExactEmail = new Map();
  const dtByPrefix = new Map();
  const dtByName = new Map();
  const dtByEmpId = new Map();

  for (const d of desktimeRows) {
    if (d.employee_id) dtByEmpId.set(String(d.employee_id), d);
    if (d.email) {
      const em = d.email.toLowerCase().trim();
      dtByExactEmail.set(em, d);
      const pref = getPrefix(em);
      if (pref && !dtByPrefix.has(pref)) dtByPrefix.set(pref, d);
    }
    if (d.name) {
      const nm = normalize(d.name);
      if (nm && !dtByName.has(nm)) dtByName.set(nm, d);
    }
  }

  const odooByExactEmail = new Map();
  const odooByPrefix = new Map();
  const odooByName = new Map();

  for (const o of odooRows) {
    if (o.work_email) {
      const em = o.work_email.toLowerCase().trim();
      odooByExactEmail.set(em, o);
      const pref = getPrefix(em);
      if (pref && !odooByPrefix.has(pref)) odooByPrefix.set(pref, o);
    }
    if (o.employee_name) {
      const nm = normalize(o.employee_name);
      if (nm && !odooByName.has(nm)) odooByName.set(nm, o);
    }
  }

  const managersByTeam = new Map();
  for (const tm of teamManagers) {
    if (tm.team_name && tm.manager_name) {
      const tName = cleanGroupName(tm.team_name);
      if (!managersByTeam.has(tName)) managersByTeam.set(tName, []);
      managersByTeam.get(tName).push(normalize(tm.manager_name));
    }
  }

  // 6. Ensure Roles exist in Intranet DB
  console.log("\n--- Asegurando Roles en Intranet ---");
  const rolesInDb = await prisma.role.findMany();
  const roleMap = new Map();
  for (const r of rolesInDb) {
    roleMap.set(r.name, r);
  }

  // Ensure TEAM_LEAD role exists in DB
  if (!roleMap.has("TEAM_LEAD")) {
    const supervisorRole = roleMap.get("SUPERVISOR");
    const newTeamLeadRole = await prisma.role.create({
      data: {
        name: "TEAM_LEAD",
        description: "Team Leader / Supervisor de Operaciones",
        level: 20,
        isSystem: true
      }
    });
    // Copy permissions from SUPERVISOR if available
    if (supervisorRole) {
      const supPerms = await prisma.rolePermission.findMany({ where: { roleId: supervisorRole.id } });
      for (const sp of supPerms) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: newTeamLeadRole.id, permissionId: sp.permissionId } },
          create: { roleId: newTeamLeadRole.id, permissionId: sp.permissionId },
          update: {}
        });
      }
    }
    roleMap.set("TEAM_LEAD", newTeamLeadRole);
    console.log("✓ Rol TEAM_LEAD creado y configurado en Intranet.");
  } else {
    console.log("✓ Rol TEAM_LEAD ya existe en Intranet.");
  }

  // 7. Ensure All Desktime Groups (Projects) Exist in Intranet
  console.log("\n--- Sincronizando Grupos / Proyectos en Intranet ---");
  const existingProjects = await prisma.project.findMany();
  const projectMap = new Map(); // key: normalized name -> project
  for (const p of existingProjects) {
    projectMap.set(normalize(p.name), p);
  }

  // Alias existing IT Telecom -> IT, RRHH -> HR if applicable
  if (projectMap.has(normalize("IT Telecom")) && !projectMap.has(normalize("IT"))) {
    const itProj = projectMap.get(normalize("IT Telecom"));
    await prisma.project.update({ where: { id: itProj.id }, data: { name: "IT" } });
    itProj.name = "IT";
    projectMap.set(normalize("IT"), itProj);
    console.log("✓ Proyecto 'IT Telecom' actualizado a 'IT'.");
  }

  if (projectMap.has(normalize("RRHH")) && !projectMap.has(normalize("HR"))) {
    const hrProj = projectMap.get(normalize("RRHH"));
    await prisma.project.update({ where: { id: hrProj.id }, data: { name: "HR" } });
    hrProj.name = "HR";
    projectMap.set(normalize("HR"), hrProj);
    console.log("✓ Proyecto 'RRHH' actualizado a 'HR'.");
  }

  // Create any missing groups from desktime
  let createdGroupsCount = 0;
  for (const gName of allDesktimeGroupNames) {
    const norm = normalize(gName);
    if (!projectMap.has(norm)) {
      const meta = GROUP_METADATA[gName] || { color: "#3b82f6", icon: "👥", desc: `Grupo ${gName}` };
      const newProj = await prisma.project.create({
        data: {
          name: gName,
          description: meta.desc || `Grupo ${gName} de Telecom Networks`,
          color: meta.color || "#3b82f6",
          icon: meta.icon || "👥"
        }
      });
      projectMap.set(norm, newProj);
      createdGroupsCount++;
      console.log(`+ Grupo creado: ${gName}`);
    }
  }
  console.log(`✓ Total de grupos disponibles en Intranet: ${projectMap.size} (${createdGroupsCount} nuevos creados).`);

  // 8. Match Intranet Users and Determine Assignments
  console.log("\n--- Evaluando Empleados y Asignaciones ---");
  const intranetUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, roleId: true, position: true, projectId: true }
  });

  const groupSupervisors = new Map(); // projectId -> Set of userIds
  const groupSubLeaders = new Map();  // projectId -> Set of userIds
  const groupMembers = new Map();     // projectId -> Set of userIds

  for (const p of projectMap.values()) {
    groupSupervisors.set(p.id, new Set());
    groupSubLeaders.set(p.id, new Set());
    groupMembers.set(p.id, new Set());
  }

  let usersUpdated = 0;
  let rolesPromoted = 0;
  let unassignedUsers = 0;

  for (const u of intranetUsers) {
    const em = u.email?.toLowerCase().trim();
    const pref = getPrefix(em);
    const nm = normalize(u.name);

    // Matching order:
    // 1. Direct desktime exact email
    let dt = dtByExactEmail.get(em);
    // 2. Direct desktime email prefix
    if (!dt && pref) dt = dtByPrefix.get(pref);
    // 3. Direct desktime exact normalized name
    if (!dt && nm) dt = dtByName.get(nm);
    // 4. Odoo desktime_id bridge
    let o = odooByExactEmail.get(em) || (pref ? odooByPrefix.get(pref) : null) || (nm ? odooByName.get(nm) : null);
    if (!dt && o && o.desktime_id) {
      dt = dtByEmpId.get(String(o.desktime_id));
    }
    // 5. Desktime token match
    if (!dt && nm) {
      const uTokens = nm.split(" ").filter(t => t.length > 2);
      for (const d of desktimeRows) {
        const dTokens = normalize(d.name).split(" ").filter(t => t.length > 2);
        const intersection = uTokens.filter(t => dTokens.includes(t));
        if (intersection.length >= 2 && uTokens[0] === dTokens[0]) {
          dt = d;
          break;
        }
      }
    }

    // Determine target group
    let targetGroupName = null;
    if (dt) {
      targetGroupName = cleanGroupName(dt.group_name);
    } else if (o && o.department_name) {
      const normDept = normalize(o.department_name);
      targetGroupName = DEPT_TO_GROUP[normDept] || cleanGroupName(o.department_name);
    }

    // Find the project in Intranet
    let targetProject = null;
    if (targetGroupName) {
      targetProject = projectMap.get(normalize(targetGroupName));
      if (!targetProject) {
        // Fallback: check if partial or create
        const meta = GROUP_METADATA[targetGroupName] || { color: "#3b82f6", icon: "👥", desc: `Grupo ${targetGroupName}` };
        targetProject = await prisma.project.create({
          data: {
            name: targetGroupName,
            description: meta.desc || `Grupo ${targetGroupName}`,
            color: meta.color || "#3b82f6",
            icon: meta.icon || "👥"
          }
        });
        projectMap.set(normalize(targetGroupName), targetProject);
        groupSupervisors.set(targetProject.id, new Set());
        groupSubLeaders.set(targetProject.id, new Set());
        groupMembers.set(targetProject.id, new Set());
      }
    }

    // Determine role & position
    const jobTitle = o?.job_title?.trim() || null;
    const titleLower = (jobTitle || "").toLowerCase();

    const isTeamLeadOrSupervisor =
      titleLower.includes("lead") ||
      titleLower.includes("supervisor") ||
      titleLower.includes("supervisora");

    const isManager =
      titleLower.includes("manager") ||
      titleLower.includes("country manager") ||
      titleLower.includes("director") ||
      titleLower.includes("ceo");

    const isHR =
      titleLower.includes("human resources") ||
      titleLower.includes("recruitment") ||
      titleLower.includes("recruiter");

    const isTech =
      titleLower.includes("it helpdesk") ||
      titleLower.includes("developer") ||
      titleLower.includes("it consultant") ||
      titleLower.includes("it coordinator") ||
      titleLower.includes("systems specialist");

    const isSubLeader = titleLower.includes("backup");

    // Check if user is a designated manager in org_team_managers
    let isManagerOfTeam = false;
    if (targetGroupName) {
      const mgrList = managersByTeam.get(targetGroupName) || [];
      isManagerOfTeam = mgrList.some(mgrNorm => nm.includes(mgrNorm) || mgrNorm.includes(nm));
    }

    // Resolve system role and roleId
    let newRole = u.role;
    let newRoleId = u.roleId;

    // Do NOT downgrade high-privilege IT accounts (TECHNOLOGY, IT_MANAGER, TECHNOLOGY_ADMIN)
    const isAlreadyHighTech = ["TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER"].includes(u.role);

    if (!isAlreadyHighTech) {
      if (isTeamLeadOrSupervisor) {
        newRole = "SUPERVISOR";
        newRoleId = roleMap.get("SUPERVISOR")?.id || u.roleId;
      } else if (isManager) {
        newRole = "MANAGER";
        newRoleId = roleMap.get("MANAGER")?.id || u.roleId;
      } else if (isHR) {
        newRole = "HR";
        newRoleId = roleMap.get("HR")?.id || u.roleId;
      } else if (isTech) {
        newRole = "TECHNOLOGY";
        newRoleId = roleMap.get("TECHNOLOGY")?.id || u.roleId;
      } else if (u.role === "USER" || u.role === "NO_ROLE") {
        newRole = "AGENT";
        newRoleId = roleMap.get("AGENT")?.id || u.roleId;
      }
    }

    if (newRole !== u.role) {
      rolesPromoted++;
    }

    const newPosition = jobTitle || u.position || (newRole === "AGENT" ? "Agent" : null);

    // Update user record in Intranet
    const updateData = {};
    if (targetProject && u.projectId !== targetProject.id) {
      updateData.projectId = targetProject.id;
    }
    if (newRole !== u.role) {
      updateData.role = newRole;
      if (newRoleId) updateData.roleId = newRoleId;
    }
    if (newPosition && newPosition !== u.position) {
      updateData.position = newPosition;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: u.id },
        data: updateData
      });
      usersUpdated++;
    }

    // Group memberships
    if (targetProject) {
      if (isSubLeader) {
        groupSubLeaders.get(targetProject.id).add(u.id);
      } else if (isTeamLeadOrSupervisor || isManagerOfTeam) {
        groupSupervisors.get(targetProject.id).add(u.id);
      } else {
        groupMembers.get(targetProject.id).add(u.id);
      }
    } else {
      unassignedUsers++;
    }
  }

  // 9. Link Supervisors and SubLeaders to each Project
  console.log("\n--- Vinculando Líderes y Supervisores a cada Grupo ---");
  for (const [projId, supSet] of groupSupervisors.entries()) {
    const subSet = groupSubLeaders.get(projId) || new Set();

    const connectSupervisors = Array.from(supSet).map(id => ({ id }));
    const connectSubLeaders = Array.from(subSet).map(id => ({ id }));

    await prisma.project.update({
      where: { id: projId },
      data: {
        supervisors: { set: connectSupervisors },
        subLeaders: { set: connectSubLeaders }
      }
    });
  }

  console.log("=================================================");
  console.log("RESUMEN FINAL DE LA SINCRONIZACIÓN");
  console.log("=================================================");
  console.log(`✓ Total de usuarios en Intranet: ${intranetUsers.length}`);
  console.log(`✓ Usuarios actualizados (grupo/rol/posición): ${usersUpdated}`);
  console.log(`✓ Roles adaptados / promovidos: ${rolesPromoted}`);
  console.log(`✓ Usuarios sin grupo asignado (cuentas de servicio/bots): ${unassignedUsers}`);
  console.log(`✓ Grupos activos en Intranet: ${projectMap.size}`);

  // Print detailed group overview
  const finalProjects = await prisma.project.findMany({
    include: {
      supervisors: { select: { name: true, role: true, position: true } },
      subLeaders: { select: { name: true, role: true, position: true } },
      members: { select: { id: true } }
    },
    orderBy: { name: "asc" }
  });

  console.log("\n--- DETALLE DE GRUPOS CONFIGURADOS ---");
  for (const p of finalProjects) {
    if (p.members.length > 0 || p.supervisors.length > 0) {
      const sups = p.supervisors.map(s => `${s.name} (${s.position || s.role})`).join(", ") || "Ninguno";
      const subs = p.subLeaders.map(s => `${s.name} (${s.position || s.role})`).join(", ") || "";
      console.log(`📂 [${p.name}] - ${p.members.length} miembros`);
      console.log(`   👑 Supervisores/Líderes: ${sups}`);
      if (subs) console.log(`   🥈 Sub-Líderes: ${subs}`);
    }
  }

  console.log("\n¡Sincronización completada con éxito!");
}

main()
  .catch(err => {
    console.error("Error durante la sincronización:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
