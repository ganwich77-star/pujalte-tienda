
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const inactive = await prisma.product.findMany({ where: { active: false } })
  console.log(`Inactive products in MySQL: ${inactive.length}`)
  for (const p of inactive) {
    console.log(`- ${p.name}`)
  }
}

main().finally(() => prisma.$disconnect())
