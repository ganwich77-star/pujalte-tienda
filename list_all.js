
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAll() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true }
    });
    console.log('All Products:', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

listAll();
