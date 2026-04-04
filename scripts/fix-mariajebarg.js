const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = 'cmnj1k6ty0000qwlrrphlu8et';
  
  // 1. Actualizar el Item de los 3 Bloques
  await prisma.orderItem.update({
    where: { id: 'cmnj24sbn0004qwlrv266wn84' },
    data: { 
      fileName: '_PS10405',
      note: 'Ref: _PS10405.JPG'
    }
  });
  console.log("✅ Actualizado Item Bloque (x3): _PS10405");

  // 2. Actualizar el Item del Lienzo
  await prisma.orderItem.update({
    where: { id: 'cmnj24sbn0005qwlrvjxx4y67' },
    data: { 
      fileName: '_PS10433',
      note: 'Ref: _PS10433.JPG'
    }
  });
  console.log("✅ Actualizado Item Lienzo: _PS10433");

  // 3. Opcional: Si quieres que también arregle los precios que están a 0
  // Basado en la captura: Bloque x3 = 29€ cada uno? O total?
  // Si el total es 346€, y el lienzo es 185€...
  // 346 - 185 = 161€
  // Si los 3 bloques son 29€ cada uno = 87€.
  // 161 - 87 = 74€.
  // Parece que el bloque suelto (x1) cuesta 74€ (quizás sea un tamaño más grande).
}

main().catch(console.error).finally(() => prisma.$disconnect());
