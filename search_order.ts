import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- BUSCANDO PEDIDO ESPECÍFICO ---')
  
  // Buscar por ID exacto de la captura
  const orderById = await prisma.order.findUnique({
    where: { id: '1A42E98L' },
    include: { items: true }
  })
  
  if (orderById) {
    console.log('ENCONTRADO POR ID:', JSON.stringify(orderById, null, 2))
  } else {
    console.log('No se encontró por ID 1A42E98L')
  }

  // Buscar por aproximación en paymentId o similar
  const ordersByPaymentId = await prisma.order.findMany({
    where: {
      OR: [
        { paymentId: { contains: '1A42E98L' } },
        { id: { contains: '1A42E98L' } },
        { customerName: { contains: 'CRISTINA' } }
      ]
    },
    include: { items: true }
  })
  
  console.log('RESULTADOS ADICIONALES:', JSON.stringify(ordersByPaymentId, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
