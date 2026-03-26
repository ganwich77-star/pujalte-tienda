const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  const variants = await prisma.productVariant.findMany();
  const orders = await prisma.order.findMany();
  const items = await prisma.orderItem.findMany();

  const data = {
    categories,
    products,
    variants,
    orders,
    items,
    exportedAt: new Date().toISOString()
  };

  fs.writeFileSync('db_full_backup.json', JSON.stringify(data, null, 2));
  console.log('✅ Creado db_full_backup.json con todo el contenido de la base de datos');
  
  await prisma.$disconnect();
}

main();
