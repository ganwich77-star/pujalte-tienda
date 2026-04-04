
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      active: true
    }
  })
  
  console.log(`Total productos: ${products.length}`)
  products.forEach(p => {
    console.log(`Producto: ${p.name}, Active: ${p.active}, Imagen length: ${p.image?.length || 0}, Start: ${p.image?.substring(0, 50)}...`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
