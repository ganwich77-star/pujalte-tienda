const { PrismaClient } = require('@prisma/client');

async function check() {
  const prisma = new PrismaClient();
  try {
    const suppliers = await prisma.supplier.count();
    console.log(`Suppliers: ${suppliers}`);
  } catch (e) {
    console.error("Error checking Suppliers:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
