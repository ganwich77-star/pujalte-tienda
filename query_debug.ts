import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- BUSCANDO CRISTINA FERNANDEZ ---')
  const orders = await prisma.order.findMany({
    where: {
      customerName: { contains: 'Cristina' }
    }
  })
  console.log('PEDIDOS MATCH:', JSON.stringify(orders, null, 2))

  const clients = await prisma.client.findMany({
    where: {
      name: { contains: 'Cristina' }
    }
  })
  console.log('CLIENTES MATCH:', JSON.stringify(clients, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
