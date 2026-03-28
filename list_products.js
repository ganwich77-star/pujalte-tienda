const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listProducts() {
  try {
    const products = await prisma.product.findMany({
        take: 10,
        select: { id: true, name: true }
    })
    console.log("Current PRODUCTS in DB:", JSON.stringify(products, null, 2))
  } catch (error) {
    console.error("List failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}
listProducts()
