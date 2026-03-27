
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany()
  console.log(`MySQL contains ${products.length} products.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
