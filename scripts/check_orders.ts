import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://u239382299_admin_tienda:Jpm17pass71-@srv2197.hstgr.io:3306/u239382299_tienda_pujalte"
    }
  }
});

async function main() {
  console.log("--- BUSCANDO TODOS LOS PEDIDOS ---");
  const orders = await prisma.order.findMany();
  console.log("Total pedidos encontrados:", orders.length);
  console.log("Estados:", orders.map(o => o.status));
  process.exit(0);
}

main();
