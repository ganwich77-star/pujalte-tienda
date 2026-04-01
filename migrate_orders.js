const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function migrate() {
  const prisma = new PrismaClient();
  const rawData = fs.readFileSync('/Users/pujaltefotografia/.gemini/antigravity/brain/175a6ad7-92b7-4c11-a7ad-0fda02ad422a/.system_generated/steps/4975/output.txt', 'utf8');
  const { documents } = JSON.parse(rawData);

  console.log(`Starting migration of ${documents.length} orders...`);

  for (const doc of documents) {
    const fields = doc.fields;
    
    // Devolvemos el ID de Firebase para evitar duplicados si lo usamos de ID o en un campo
    const firebaseId = doc.name.split('/').pop();
    
    // Normalizamos campos
    const customerName = fields.customerName?.stringValue || "Desconocido";
    const customerEmail = fields.customerEmail?.stringValue || "";
    const customerPhone = fields.customerPhone?.stringValue || "";
    const address = fields.address?.stringValue || "";
    const notes = fields.notes?.stringValue || "";
    const status = fields.status?.stringValue || "pending";
    const paymentMethod = fields.paymentMethod?.stringValue || "card";
    const paymentStatus = fields.paymentStatus?.stringValue || "pending";
    const paymentId = fields.paymentId?.stringValue || firebaseId;
    const total = parseFloat(fields.total?.doubleValue || fields.total?.integerValue || 0);

    // Items
    const items = fields.items?.arrayValue?.values || [];
    const prismaItems = items.map(val => {
      const f = val.mapValue.fields;
      return {
        productId: f.productId?.stringValue || null,
        productName: f.productName?.stringValue || "Producto",
        variantId: f.variantId?.stringValue || null,
        variantName: f.variantName?.stringValue || null,
        quantity: parseInt(f.quantity?.integerValue || 1),
        price: parseFloat(f.price?.doubleValue || f.price?.integerValue || 0),
        note: f.note?.stringValue || "",
        fileUrl: f.fileUrl?.stringValue || null,
        fileName: f.fileName?.stringValue || null
      };
    });

    try {
      // Usamos el ID de Firebase como el ID de la tabla si es posible para mantener consistencia
      // Pero si ya existe, fallará (upsert)
      await prisma.order.upsert({
        where: { id: firebaseId },
        update: {
          customerName, customerEmail, customerPhone, address, notes,
          total, status, paymentMethod, paymentStatus, paymentId,
          updatedAt: new Date(),
        },
        create: {
          id: firebaseId,
          customerName, customerEmail, customerPhone, address, notes,
          total, status, paymentMethod, paymentStatus, paymentId,
          createdAt: new Date(doc.createTime),
          updatedAt: new Date(doc.updateTime),
          items: {
            create: prismaItems
          }
        }
      });
      console.log(`Migrated order: ${firebaseId} (${customerName})`);
    } catch (e) {
      console.error(`Failed to migrate order ${firebaseId}:`, e.message);
    }
  }

  console.log("Migration complete!");
  const finalCount = await prisma.order.count();
  console.log(`Total orders in MySQL: ${finalCount}`);
  await prisma.$disconnect();
}

migrate();
