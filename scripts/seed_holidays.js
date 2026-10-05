const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HOLIDAYS_RD_AND_US_2026 = [
  // 🇩🇴 REPUBLICA DOMINICANA (Ley 139-97 traslados aplicados)
  { name: "🇩🇴 Año Nuevo", date: "2026-01-01", country: "RD", type: "HOLIDAY", description: "Feriado No Laborable en República Dominicana (Inamovible)" },
  { name: "🇩🇴 Día de los Santos Reyes (Día trasladado)", date: "2026-01-05", country: "RD", type: "HOLIDAY", description: "Feriado No Laborable por traslado del 6 de enero (Ley 139-97)" },
  { name: "🇩🇴 Día de Nuestra Señora de la Altagracia", date: "2026-01-21", country: "RD", type: "HOLIDAY", description: "Feriado Religioso No Laborable (Patrona del Pueblo Dominicano)" },
  { name: "🇩🇴 Día del Patricio Juan Pablo Duarte", date: "2026-01-26", country: "RD", type: "HOLIDAY", description: "Feriado No Laborable en Honor al Padre de la Patria Juan Pablo Duarte" },
  { name: "🇩🇴 Día de la Independencia Nacional", date: "2026-02-27", country: "RD", type: "HOLIDAY", description: "Fiesta Patria No Laborable - Independencia Nacional de Rep. Dom." },
  { name: "🇩🇴 Viernes Santo", date: "2026-04-03", country: "RD", type: "HOLIDAY", description: "Feriado Religioso No Laborable (Semana Santa)" },
  { name: "🇩🇴 Día del Trabajo (Día trasladado)", date: "2026-05-04", country: "RD", type: "HOLIDAY", description: "Feriado No Laborable por traslado del 1º de Mayo (Ley 139-97)" },
  { name: "🇩🇴 Corpus Christi", date: "2026-06-04", country: "RD", type: "HOLIDAY", description: "Feriado Religioso No Laborable en República Dominicana" },
  { name: "🇩🇴 Día de la Restauración de la República", date: "2026-08-16", country: "RD", type: "HOLIDAY", description: "Fiesta Patria No Laborable - Restauración de la República" },
  { name: "🇩🇴 Día de Nuestra Señora de las Mercedes", date: "2026-09-24", country: "RD", type: "HOLIDAY", description: "Feriado Religioso No Laborable (Patrona de la Rep. Dominicana)" },
  { name: "🇩🇴 Día de la Constitución (Día trasladado)", date: "2026-11-09", country: "RD", type: "HOLIDAY", description: "Feriado No Laborable por traslado del 6 de Noviembre (Ley 139-97)" },
  { name: "🇩🇴 Día de Navidad", date: "2026-12-25", country: "RD", type: "HOLIDAY", description: "Feriado No Laborable de Navidad" },

  // 🇺🇸 EE.UU. FEDERAL HOLIDAYS
  { name: "🇺🇸 US New Year's Day (Año Nuevo US)", date: "2026-01-01", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU." },
  { name: "🇺🇸 US Martin Luther King Jr. Day", date: "2026-01-19", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU. (Tercer lunes de enero)" },
  { name: "🇺🇸 US Presidents' Day (Washington's Birthday)", date: "2026-02-16", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU." },
  { name: "🇺🇸 US Memorial Day (Día de los Caídos)", date: "2026-05-25", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU. (Último lunes de mayo)" },
  { name: "🇺🇸 US Juneteenth National Independence Day", date: "2026-06-19", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU. (Día de la Emancipación)" },
  { name: "🇺🇸 US Independence Day (Día de la Independencia)", date: "2026-07-03", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU. (Observado el 3 de Julio)" },
  { name: "🇺🇸 US Labor Day (Día del Trabajo US)", date: "2026-09-07", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU. (Primer lunes de septiembre)" },
  { name: "🇺🇸 US Columbus Day / Indigenous Peoples' Day", date: "2026-10-12", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU." },
  { name: "🇺🇸 US Veterans Day (Día de los Veteranos)", date: "2026-11-11", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU." },
  { name: "🇺🇸 US Thanksgiving Day (Acción de Gracias)", date: "2026-11-26", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU. (Cuarto jueves de noviembre)" },
  { name: "🇺🇸 US Christmas Day (Navidad US)", date: "2026-12-25", country: "US", type: "HOLIDAY", description: "Feriado Federal en EE.UU." }
];

async function main() {
  console.log("Iniciando población de feriados RD y USA...");

  // Buscar un usuario admin para asignar como creador de los eventos
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["IT_MANAGER", "HR", "ADMIN", "TECHNOLOGY", "MANAGER"] } }
  }) || await prisma.user.findFirst();

  if (!adminUser) {
    console.error("No se encontró ningún usuario para asociar como creador.");
    return;
  }

  for (const h of HOLIDAYS_RD_AND_US_2026) {
    const d = new Date(h.date + "T00:00:00.000Z");

    // 1. Guardar o actualizar en tabla Holiday (para cálculos de días laborables en vacaciones)
    await prisma.holiday.upsert({
      where: { date: d },
      update: { name: h.name },
      create: { name: h.name, date: d }
    });

    // 2. Crear evento en el Calendario si no existe uno en esa fecha con ese título
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { title: h.name, startDate: d }
    });

    if (!existingEvent) {
      await prisma.calendarEvent.create({
        data: {
          title: h.name,
          description: h.description,
          startDate: d,
          endDate: new Date(h.date + "T23:59:59.999Z"),
          type: "HOLIDAY",
          color: h.country === "RD" ? "#ef4444" : "#3b82f6",
          location: h.country === "RD" ? "República Dominicana" : "EE.UU.",
          scope: "PUBLIC",
          participantsScope: "ALL",
          createdById: adminUser.id
        }
      });
      console.log(`+ Evento creado en Calendario: ${h.name} (${h.date})`);
    } else {
      console.log(`= Evento ya existente: ${h.name} (${h.date})`);
    }
  }

  // 3. Ajustar balances de vacaciones en DB para evitar 15 días (Art. 177 - Rep. Dominicana)
  console.log("Verificando y ajustando balances de vacaciones de usuarios (Máximo 14.0 días para <5 años)...");
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    if (user.email === "rurena@tnoutsourcing.com") {
      // Rafael Ureña (+5 años de antigüedad = 18 días)
      continue;
    }
    if (user.vacationBalance >= 15.0 || user.vacationBalance === 15) {
      await prisma.user.update({
        where: { id: user.id },
        data: { vacationBalance: 14.0 }
      });
      console.log(`✓ Balance ajustado para ${user.name || user.email}: 14.0 días`);
    }
  }

  console.log("Población y ajuste de balances completados con éxito.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
