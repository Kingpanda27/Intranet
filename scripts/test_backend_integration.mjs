import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBackend() {
  console.log("=== VERIFICANDO ENDPOINTS Y BASE DE DATOS DE SUPPORT AILLAMA ===");

  // 1. Verificar lectura de tickets
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  console.log(`✓ [DB Tickets] Encontrados ${tickets.length} tickets en la base de datos.`);
  if (tickets.length > 0) {
    console.log(`  Último ticket: [#${tickets[0].id.slice(-6)}] ${tickets[0].from} (${tickets[0].source}): ${tickets[0].issue}`);
  }

  // 2. Verificar exclusiones
  const exclusions = await prisma.whatsappExclusion.findMany();
  const setting = await prisma.whatsappSetting.findUnique({ where: { id: 'default' } });
  console.log(`✓ [DB Exclusiones] Encontradas ${exclusions.length} exclusiones.`);
  console.log(`  Setting ignoreAllGroups: ${setting?.ignoreAllGroups}`);

  // 3. Probar creación de un ticket de prueba y luego eliminarlo
  const testTicket = await prisma.supportTicket.create({
    data: {
      from: "Test Runner",
      email: "test@tnoutsourcing.com",
      category: "Performance",
      issue: "Prueba automática de endpoint",
      summary: "Ticket de validación de backend nativo",
      source: "Chat Web",
      status: "OPEN"
    }
  });
  console.log(`✓ [DB Insert] Ticket de prueba creado: ID ${testTicket.id}`);

  await prisma.supportTicket.delete({
    where: { id: testTicket.id }
  });
  console.log(`✓ [DB Cleanup] Ticket de prueba eliminado correctamente.`);

  console.log("\n=== VALIDACIÓN DE BACKEND EXITOSA ===");
}

testBackend()
  .catch(err => {
    console.error("Error en testBackend:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
