const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = '626405569';
  const orders = await prisma.order.findMany({
    where: { customerPhone: phone },
    include: { items: true }
  });

  for (const order of orders) {
    console.log(`\nID: ${order.id} | Status: ${order.status} | Note: ${order.notes}`);
    for (const item of order.items) {
       console.log(`  - Item: ${item.productName} | Note: ${item.note}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
