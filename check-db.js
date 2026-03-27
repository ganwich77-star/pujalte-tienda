const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const allCount = await prisma.product.count()
  const activeCount = await prisma.product.count({ where: { active: true } })
  console.log('Total products:', allCount)
  console.log('Active products:', activeCount)
  
  const products = await prisma.product.findMany({
    select: { name: true, active: true }
  })
  products.forEach((p, i) => console.log(`${i+1}. ${p.name} (Active: ${p.active})`))
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
