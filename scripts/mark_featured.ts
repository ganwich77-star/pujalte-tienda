import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Ponemos el Metacrilato como Novedad
  await prisma.product.update({
    where: { id: '0bk7AQ6Pd8QpGBBdNeE0' },
    data: { isNew: true }
  })

  // Ponemos los Recordatorios en Oferta
  await prisma.product.update({
    where: { id: '1ejCMSA59FGgfZFKgVYj' },
    data: { salePrice: 7.95 }
  })

  console.log('¡Productos destacados actualizados con éxito!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
