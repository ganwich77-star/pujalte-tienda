
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  const categories = [
    { id: 'M1JvdwqlM0qjp6PqBLDM', name: 'Recordatorios', slug: 'recordatorios' },
    { id: 'V3h94yFC7Ggv0pM24QKG', name: 'Gran Formato', slug: 'gran-formato' },
    { id: 'Vp6CSDsdZC7y7ulckS3v', name: 'COPIAS', slug: 'copias', description: 'Impresión en papel fotográfico profesional y aficionado.' },
    { id: 'hNjN46stJWBP5raEbl6X', name: 'Fotodetalles', slug: 'madera-sobremesa' },
    { id: 'mg0bi44M36op4zF4zVZo', name: 'Álbumes', slug: 'albumes' }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        description: cat.description || '',
      },
      create: {
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
      }
    });
    console.log(`Category Migrated: ${cat.name}`);
  }

  const productsRaw = fs.readFileSync('/Users/pujaltefotografia/.gemini/antigravity/brain/175a6ad7-92b7-4c11-a7ad-0fda02ad422a/.system_generated/steps/2161/output.txt', 'utf8');
  const prodData = JSON.parse(productsRaw);
  const firestoreProducts = prodData.documents || [];

  for (const doc of firestoreProducts) {
    const fields = doc.fields;
    const firestoreId = doc.name.split('/').pop();

    const prodRecord = {
      firebaseId: firestoreId,
      name: fields.name?.stringValue || 'Untitled',
      description: fields.descriptionLocal?.stringValue || fields.description?.stringValue || '',
      price: parseFloat(fields.price?.doubleValue || fields.price?.integerValue || 0),
      image: fields.imageUrl?.stringValue || '',
      stock: parseInt(fields.stock?.integerValue || 0),
      categoryId: fields.categoryId?.stringValue || null,
      active: fields.active?.booleanValue !== false,
      sortOrder: parseInt(fields.sortOrder?.integerValue || 0),
      showPrice: fields.showPrice?.booleanValue !== false,
      isPack: fields.isPack?.booleanValue || false,
      packItems: JSON.stringify(fields.packItems?.arrayValue?.values || []),
      hasVariants: fields.hasVariants?.booleanValue || false,
    };

    await prisma.product.upsert({
      where: { id: firestoreId },
      update: prodRecord,
      create: {
        id: firestoreId,
        ...prodRecord,
      }
    });

    if (fields.variants?.arrayValue?.values) {
      await prisma.productVariant.deleteMany({ where: { productId: firestoreId } });
      for (const v of fields.variants.arrayValue.values) {
        const mapValue = v.mapValue?.fields;
        if (mapValue) {
          await prisma.productVariant.create({
            data: {
              name: mapValue.name?.stringValue || 'Default',
              price: parseFloat(mapValue.price?.doubleValue || mapValue.price?.integerValue || 0),
              sku: mapValue.sku?.stringValue || '',
              stock: parseInt(mapValue.stock?.integerValue || 0),
              sortOrder: parseInt(mapValue.sortOrder?.integerValue || 0),
              productId: firestoreId,
            }
          });
        }
      }
    }

    console.log(`Product Migrated: ${prodRecord.name}`);
  }

  console.log('Migration completed!');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
