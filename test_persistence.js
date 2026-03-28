const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testUpdate() {
  try {
    const id = "COM26-001"
    console.log("Testing update for product:", id)
    
    let product = await prisma.product.findUnique({ 
        where: { id },
        include: { variants: true }
    })
    
    if (!product) {
      console.log("Product not found, importing again?")
      return
    }
    
    const originalName = product.name
    const newName = originalName + " (SAVED)"
    
    console.log("Updating name from", originalName, "to", newName)
    
    const updated = await prisma.product.update({
      where: { id },
      data: { name: newName },
      include: { variants: true }
    })
    
    console.log("VERIFYING DB state...")
    const check = await prisma.product.findUnique({ where: { id } })
    console.log("DB NAME:", check.name)
    
    if (check.name === newName) {
        console.log("PERSISTENCE SUCCESSFUL (Neon PG)")
        // Restoring
        await prisma.product.update({ where: { id }, data: { name: originalName }})
        console.log("Restored original name.")
    } else {
        console.log("PERSISTENCE FAILED (Unexpected)")
    }
    
  } catch (error) {
    console.error("Update test failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testUpdate()
