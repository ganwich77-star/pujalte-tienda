const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_irSuItQZN47T@ep-fragrant-violet-ampmv04x-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
      }
    }
  });
  try {
    console.log("Connecting to Neon...");
    const count = await prisma.order.count();
    console.log(`Connection successful! Orders found: ${count}`);
  } catch (e) {
    console.error("Connection failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
