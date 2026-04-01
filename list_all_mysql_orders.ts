import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- LISTANDO TODOS LOS PEDIDOS EN MYSQL ---')
  const count = await prisma.order.count()
  console.log('TOTAL:', count)
  
  const allOrders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('PEDIDOS:', JSON.stringify(allOrders, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
