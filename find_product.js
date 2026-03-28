
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findProduct() {
  try {
    const product = await prisma.product.findFirst({
      where: {
        name: {
          contains: 'iman formas',
          mode: 'insensitive'
        }
      }
    });
    console.log('Result:', JSON.stringify(product, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

findProduct();
