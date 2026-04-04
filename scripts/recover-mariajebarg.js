const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'mariajebarg@hotmail.com';
  console.log(`Buscando pedidos para: ${email}`);

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerEmail: email },
        { customerName: { contains: 'MARIA JESÚS' } }
      ]
    },
    include: {
      items: true
    }
  });

  console.log(`Pedidos encontrados: ${orders.length}`);

  for (const order of orders) {
    console.log(`\nPedido ID: ${order.id} | Cliente: ${order.customerName}`);
    for (const item of order.items) {
      console.log(`  - Artículo: ${item.productName}`);
      console.log(`    Nota: ${item.note || 'SIN NOTA'}`);
      
      if (item.note) {
        let recoveredName = "";
        const patterns = [
          /ref[:.]?\s*([^|]+)/i, 
          /archivo[:.]?\s*([^|]+)/i, 
          /foto[:.]?\s*([^|]+)/i,
          /referencia[:.]?\s*([^|]+)/i,
          /([a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|heic))/i,
          /(_[A-Z0-9]{4,}\b)/i
        ];
        
        for (const pattern of patterns) {
          const match = item.note.match(pattern);
          if (match && match[1]) {
            recoveredName = match[1].trim();
            break;
          }
        }

        if (recoveredName) {
           const cleanName = recoveredName.replace(/\.(jpg|jpeg|png|webp|gif|mp4|mov|heic|heif)$/i, '');
           console.log(`    >>> RECUPERADO: ${cleanName}`);
           
           await prisma.orderItem.update({
             where: { id: item.id },
             data: { fileName: cleanName }
           });
           console.log(`    ✅ Actualizado`);
        } else {
           console.log(`    ❌ No se pudo recuperar de la nota`);
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
