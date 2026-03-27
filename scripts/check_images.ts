import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Copy the fixPath implementation from src/lib/utils.ts to test it
function fixPath(path: string | undefined | null): string {
  if (!path) return ''
  if (path.startsWith('data:')) return path
  
  // Limpiar slashes dobles y asegurar que empiece con /
  let fixed = path.replace(/\/+/g, '/')
  if (!fixed.startsWith('/')) fixed = '/' + fixed
  
  // Codificar partes del path manteniendo los slashes
  return fixed.split('/').map(part => encodeURIComponent(part)).join('/')
}

async function main() {
  const products = await prisma.product.findMany()
  console.log(`\n=== PRODUCT IMAGES CHECK ===`)
  console.log(`Total Products: ${products.length}\n`)
  
  products.forEach(p => {
    console.log(`Product: ${p.name} (ID: ${p.id})`)
    if (!p.image) {
      console.log(`❌ NO IMAGE DATA`)
    } else if (p.image.startsWith('data:')) {
      console.log(`✅ Base64 Image (Starts with: ${p.image.substring(0, 30)}...)`)
    } else {
      console.log(`📁 Path Image: ${p.image}`)
      console.log(`🔗 Fixed Path: ${fixPath(p.image)}`)
    }
    console.log(`-------------------`)
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
