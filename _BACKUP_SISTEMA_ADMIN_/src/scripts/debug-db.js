const { PrismaClient } = require('@prisma/client');

async function debug() {
  const prisma = new PrismaClient();
  console.log('--- INSPECCIÓN DE PRODUCTOS CON FORMAS ---');

  try {
    const products = await prisma.product.findMany({
      where: {
        name: { contains: 'MADERA' }
      },
      select: {
          id: true,
          name: true,
          customOptions: true
      }
    });

    for (const p of products) {
      console.log(`Producto: ${p.name}`);
      console.log(`ID: ${p.id}`);
      console.log(`Formas en DB: ${p.customOptions || 'VACÍO'}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
