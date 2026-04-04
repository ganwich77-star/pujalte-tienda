const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'mariajebarg@hotmail.com';
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerEmail: email },
        { customerName: { contains: 'MARIA JESÚS' } }
      ]
    },
    include: {
      items: true
    }
  });

  for (const order of orders) {
    console.log(`\n--- PEDIDO ${order.id} ---`);
    console.log(`Order Notes (Global): ${order.notes || 'VACÍAS'}`);
    
    for (const item of order.items) {
      console.log(`  Item: ${item.productName}`);
      console.log(`  Item ID: ${item.id}`);
      console.log(`  Item Note: ${item.note || 'VACÍA'}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
