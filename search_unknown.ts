import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- BUSCANDO PEDIDO POR DNI EN NOTAS O CLIENTE DESCONOCIDO ---')
  
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerName: { contains: 'Desconocido' } },
        { customerName: { contains: 'Cliente' } },
        { notes: { contains: '48751444T' } },
        { paymentId: { contains: '1A42E98L' } },
        { id: { contains: '1A42E98L' } }
      ]
    },
    include: { items: true }
  })
  
  console.log('RESULTADOS:', JSON.stringify(orders, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
