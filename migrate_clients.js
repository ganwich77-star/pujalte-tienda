const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function migrate() {
  const prisma = new PrismaClient();
  const rawData = fs.readFileSync('/Users/pujaltefotografia/.gemini/antigravity/brain/175a6ad7-92b7-4c11-a7ad-0fda02ad422a/.system_generated/steps/5014/output.txt', 'utf8');
  const { documents } = JSON.parse(rawData);

  console.log(`Starting migration of ${documents.length} clients...`);

  for (const doc of documents) {
    const fields = doc.fields;
    const firebaseId = doc.name.split('/').pop();
    
    // Si no tiene campos, es un documento fantasma
    if (!fields) continue;

    const name = fields.name?.stringValue || "Cliente sin nombre";
    const dni = fields.dni?.stringValue || firebaseId;
    const email = fields.email?.stringValue || "";
    const phone = fields.phone?.stringValue || "";
    const status = fields.status?.stringValue || "active";
    const cashEnabled = fields.cashEnabled?.booleanValue !== false;
    
    // Gallery settings: guardamos el objeto completo como JSON stringify en LongText
    // ya que el esquema de Prisma para Client tiene gallerySettings String? @db.LongText
    const gallerySettings = fields.gallerySettings ? JSON.stringify(fields.gallerySettings) : null;

    try {
      await prisma.client.upsert({
        where: { id: firebaseId },
        update: {
          name, dni, email, phone, status, cashEnabled, gallerySettings,
          updatedAt: new Date(),
        },
        create: {
          id: firebaseId,
          name, dni, email, phone, status, cashEnabled, gallerySettings,
          createdAt: fields.createdAt?.timestampValue ? new Date(fields.createdAt.timestampValue) : new Date(doc.createTime),
          updatedAt: fields.updatedAt?.timestampValue ? new Date(fields.updatedAt.timestampValue) : new Date(doc.updateTime),
        }
      });
      console.log(`Migrated client: ${firebaseId} (${name})`);
    } catch (e) {
      console.error(`Failed to migrate client ${firebaseId}:`, e.message);
    }
  }

  console.log("Migration complete!");
  const finalCount = await prisma.client.count();
  console.log(`Total clients in MySQL: ${finalCount}`);
  await prisma.$disconnect();
}

migrate();
