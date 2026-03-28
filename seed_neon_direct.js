
const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

async function migrate() {
  const neonPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_irSuItQZN47T@ep-fragrant-violet-ampmv04x-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
      }
    }
  });

  const mysqlConn = await mysql.createConnection("mysql://u239382299_admin_tienda:Jpm17pass71-@srv2197.hstgr.io:3306/u239382299_tienda_pujalte");

  try {
    console.log('Fetching from Hostinger...');
    const [categories] = await mysqlConn.query('SELECT * FROM category');
    const [products] = await mysqlConn.query('SELECT * FROM product');
    const [variants] = await mysqlConn.query('SELECT * FROM productvariant');

    console.log(`Found ${categories.length} categories, ${products.length} products, ${variants.length} variants.`);

    // 1. Categories
    for (const cat of categories) {
      await neonPrisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: {
          id: cat.id,
          name: cat.name,
          description: cat.description,
          image: cat.image,
          sortOrder: cat.sortOrder || 0
        }
      });
    }
    console.log('Categories synced.');

    // 2. Products
    for (const p of products) {
      await neonPrisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          name: p.name,
          description: p.description,
          price: parseFloat(p.price),
          image: p.image,
          stock: p.stock || 0,
          categoryId: p.categoryId,
          active: p.active === 1 || p.active === true,
          showPrice: p.showPrice === 1 || p.showPrice === true,
          isPack: p.isPack === 1 || p.isPack === true,
          packItems: p.packItems,
          hasVariants: p.hasVariants === 1 || p.hasVariants === true,
          variantType: p.variantType,
          variantBehavior: p.variantBehavior,
          sortOrder: p.sortOrder || 0,
          firebaseId: p.firebaseId,
          isNew: p.isNew === 1 || p.isNew === true,
          salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
          minQuantity: p.minQuantity || 1,
          stepQuantity: p.stepQuantity || 1,
          tierPricing: p.tierPricing
        }
      });
    }
    console.log('Products synced.');

    // 3. Variants
    for (const v of variants) {
      await neonPrisma.productVariant.upsert({
        where: { id: v.id },
        update: {},
        create: {
          id: v.id,
          productId: v.productId,
          name: v.name,
          sku: v.sku,
          price: parseFloat(v.price),
          stock: v.stock || 0,
          attributes: v.attributes,
          image: v.image,
          active: v.active === 1 || v.active === true,
          sortOrder: v.sortOrder || 0
        }
      });
    }
    console.log('Variants synced.');

    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mysqlConn.end();
    await neonPrisma.$disconnect();
  }
}

migrate();
