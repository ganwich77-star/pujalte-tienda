const { PrismaClient } = require('@prisma/client');

async function check() {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.count();
    const categories = await prisma.category.count();
    const orders = await prisma.order.count();
    console.log(`--- MySQL Production Summary ---`);
    console.log(`Products: ${products}`);
    console.log(`Categories: ${categories}`);
    console.log(`Orders: ${orders}`);
  } catch (e) {
    console.error("Error checking MySQL:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
