import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function migrate() {
  console.log("=== INICIANDO MIGRACIÓN DE DATOS DE AILLAMA A BASE DE DATOS INTRANET ===");

  const aillamaDir = path.resolve('D:/AILlama');
  const ticketsPath = path.join(aillamaDir, 'support_tickets.json');
  const exclusionsPath = path.join(aillamaDir, 'whatsapp_exclusions.json');

  // 1. Migración de Exclusiones de WhatsApp
  if (fs.existsSync(exclusionsPath)) {
    console.log("\n--- Migrando exclusiones de WhatsApp ---");
    const rawExclusions = JSON.parse(fs.readFileSync(exclusionsPath, 'utf8'));

    // Configuración global
    await prisma.whatsappSetting.upsert({
      where: { id: 'default' },
      update: { ignoreAllGroups: Boolean(rawExclusions.ignoreAllGroups) },
      create: { id: 'default', ignoreAllGroups: Boolean(rawExclusions.ignoreAllGroups) }
    });
    console.log(`✓ WhatsappSetting configurado: ignoreAllGroups = ${rawExclusions.ignoreAllGroups}`);

    // Números excluidos
    if (Array.isArray(rawExclusions.numbers)) {
      for (const num of rawExclusions.numbers) {
        if (!num) continue;
        await prisma.whatsappExclusion.upsert({
          where: { value: num },
          update: { type: 'NUMBER' },
          create: { value: num, type: 'NUMBER', note: 'Migrado de AILlama' }
        });
        console.log(`  + Número excluido migrado: ${num}`);
      }
    }

    // Grupos excluidos
    if (Array.isArray(rawExclusions.groups)) {
      for (const grp of rawExclusions.groups) {
        if (!grp) continue;
        await prisma.whatsappExclusion.upsert({
          where: { value: grp },
          update: { type: 'GROUP' },
          create: { value: grp, type: 'GROUP', note: 'Migrado de AILlama' }
        });
        console.log(`  + Grupo excluido migrado: ${grp}`);
      }
    }
  } else {
    console.warn(`! Archivo no encontrado: ${exclusionsPath}`);
  }

  // 2. Migración de Tickets de Soporte
  if (fs.existsSync(ticketsPath)) {
    console.log("\n--- Migrando tickets de soporte ---");
    const rawTickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
    console.log(`Total de tickets a procesar: ${rawTickets.length}`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const ticket of rawTickets) {
      const ticketTimestamp = ticket.timestamp ? new Date(ticket.timestamp) : new Date();
      
      // Intentar vincular usuario del Intranet por correo
      let matchedUserId = null;
      if (ticket.email) {
        const foundUser = await prisma.user.findUnique({
          where: { email: ticket.email.trim().toLowerCase() }
        });
        if (foundUser) {
          matchedUserId = foundUser.id;
        }
      }

      // Serializar historial
      let historyText = "";
      if (Array.isArray(ticket.history)) {
        historyText = JSON.stringify(ticket.history);
      } else if (typeof ticket.history === 'string') {
        historyText = ticket.history;
      } else if (ticket.summary) {
        historyText = ticket.summary;
      }

      // Evitar duplicados si ya fue migrado
      const existing = await prisma.supportTicket.findFirst({
        where: {
          from: ticket.from || 'Desconocido',
          issue: ticket.issue || 'Sin descripción',
          createdAt: ticketTimestamp
        }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.supportTicket.create({
        data: {
          from: ticket.from || 'Desconocido',
          email: ticket.email || null,
          box: ticket.box || null,
          category: ticket.category || 'General',
          severity: ticket.severity || 'Normal',
          issue: ticket.issue || 'Sin descripción',
          summary: ticket.summary || null,
          history: historyText,
          source: ticket.source || (ticket.from?.includes('@') ? 'WhatsApp' : 'Chat Web'),
          status: 'OPEN',
          createdAt: ticketTimestamp,
          userId: matchedUserId
        }
      });
      createdCount++;
      console.log(`  + Ticket migrado: [${ticket.source || 'Auto'}] ${ticket.from} - ${ticket.issue?.substring(0, 40)}... (Usuario vinculado: ${matchedUserId ? 'Sí' : 'No'})`);
    }

    console.log(`\n✓ Migración de tickets finalizada: ${createdCount} creados, ${skippedCount} ya existentes omitidos.`);
  } else {
    console.warn(`! Archivo no encontrado: ${ticketsPath}`);
  }

  const totalDbTickets = await prisma.supportTicket.count();
  const totalExclusions = await prisma.whatsappExclusion.count();
  console.log(`\n=== ESTADO EN BASE DE DATOS ===`);
  console.log(`Total Tickets en BD Intranet: ${totalDbTickets}`);
  console.log(`Total Exclusiones WhatsApp en BD Intranet: ${totalExclusions}`);
}

migrate()
  .catch(err => {
    console.error("Error durante la migración:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
