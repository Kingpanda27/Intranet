import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Creando tabla _ProjectMembers para soporte de múltiples grupos ===");
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`_ProjectMembers\` (
      \`A\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`B\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
      UNIQUE KEY \`_ProjectMembers_AB_unique\` (\`A\`,\`B\`),
      KEY \`_ProjectMembers_B_index\` (\`B\`),
      CONSTRAINT \`_ProjectMembers_A_fkey\` FOREIGN KEY (\`A\`) REFERENCES \`Project\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`_ProjectMembers_B_fkey\` FOREIGN KEY (\`B\`) REFERENCES \`User\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Tabla _ProjectMembers creada o ya existe.");

  console.log("=== Migrando miembros actuales a _ProjectMembers ===");
  const inserted = await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO \`_ProjectMembers\` (\`A\`, \`B\`)
    SELECT \`u\`.\`projectId\` AS \`A\`, \`u\`.\`id\` AS \`B\`
    FROM \`User\` \`u\`
    JOIN \`Project\` \`p\` ON \`u\`.\`projectId\` = \`p\`.\`id\`
    WHERE \`u\`.\`projectId\` IS NOT NULL;
  `);
  console.log(`✓ Registros insertados en _ProjectMembers: ${inserted}`);

  const total = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM \`_ProjectMembers\``);
  console.log("✓ Total de membresías en _ProjectMembers:", total);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

