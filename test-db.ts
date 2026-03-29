import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  console.log("Modelos disponibles:", Object.keys(prisma).filter(k => !k.startsWith("_") && !k.startsWith("$")));
  try {
    const supplierCount = await (prisma as any).supplier.count();
    console.log("Recuento de proveedores:", supplierCount);
  } catch (error: any) {
    console.error("Error al acceder a 'supplier':", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
