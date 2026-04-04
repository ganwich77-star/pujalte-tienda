const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: 'cmnj1k6ty0000qwlrrphlu8et' }
  });
  console.log("Custom Fields:", order.customFields);
}

main().catch(console.error).finally(() => prisma.$disconnect());
