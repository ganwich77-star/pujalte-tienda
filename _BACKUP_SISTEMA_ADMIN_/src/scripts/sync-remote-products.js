const { PrismaClient } = require('@prisma/client');

async function sync() {
  const prisma = new PrismaClient();
  const BASE_URL = 'https://pujalte-tienda.vercel.app/api';

  console.log('--- INICIANDO SINCRONIZACIÓN COMPLETA DESDE PRODUCCIÓN ---');

  try {
    // 1. Sincronizar Categorías
    console.log('Sincronizando categorías...');
    const catRes = await fetch(`${BASE_URL}/categories`);
    if (catRes.ok) {
      const categories = await catRes.json();
      for (const cat of categories) {
        await prisma.category.upsert({
          where: { id: cat.id },
          update: { name: cat.name, image: cat.image, slug: cat.slug, active: cat.active, sortOrder: cat.sortOrder },
          create: { id: cat.id, name: cat.name, image: cat.image, slug: cat.slug, active: cat.active, sortOrder: cat.sortOrder }
        });
      }
    }

    // 2. Sincronizar Proveedores (si existe la API)
    console.log('Sincronizando proveedores...');
    const supRes = await fetch(`${BASE_URL}/suppliers`);
    if (supRes.ok) {
        const suppliers = await supRes.json();
        for (const sup of suppliers) {
            await prisma.supplier.upsert({
                where: { id: sup.id },
                update: { name: sup.name, contact: sup.contact, email: sup.email, phone: sup.phone, active: sup.active },
                create: { id: sup.id, name: sup.name, contact: sup.contact, email: sup.email, phone: sup.phone, active: sup.active }
            });
        }
    }

    // 3. Sincronizar Productos
    console.log('Sincronizando productos...');
    const prodRes = await fetch(`${BASE_URL}/products`);
    if (!prodRes.ok) throw new Error('No se pudieron obtener los productos');

    const products = await prodRes.json();
    for (const p of products) {
      console.log(`- ${p.name}`);
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          stock: p.stock,
          categoryId: p.categoryId,
          active: p.active,
          showPrice: p.showPrice,
          isPack: p.isPack,
          hasVariants: p.hasVariants,
          variantType: p.variantType,
          variantBehavior: p.variantBehavior,
          salePrice: p.salePrice,
          minQuantity: p.minQuantity,
          stepQuantity: p.stepQuantity,
          tierPricing: typeof p.tierPricing === 'object' ? JSON.stringify(p.tierPricing) : p.tierPricing,
          customOptions: typeof p.customOptions === 'object' ? JSON.stringify(p.customOptions) : p.customOptions,
          supplierId: p.supplierId,
          isNew: p.isNew
        },
        create: {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          stock: p.stock,
          categoryId: p.categoryId,
          active: p.active,
          showPrice: p.showPrice,
          isPack: p.isPack,
          hasVariants: p.hasVariants,
          variantType: p.variantType,
          variantBehavior: p.variantBehavior,
          salePrice: p.salePrice,
          minQuantity: p.minQuantity,
          stepQuantity: p.stepQuantity,
          tierPricing: typeof p.tierPricing === 'object' ? JSON.stringify(p.tierPricing) : p.tierPricing,
          customOptions: typeof p.customOptions === 'object' ? JSON.stringify(p.customOptions) : p.customOptions,
          supplierId: p.supplierId,
          isNew: p.isNew
        }
      });

      if (p.variants && p.variants.length > 0) {
        await prisma.productVariant.deleteMany({ where: { productId: p.id } });
        await prisma.productVariant.createMany({
          data: p.variants.map(v => ({
            id: v.id,
            productId: p.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            sortOrder: v.sortOrder,
            active: v.active
          }))
        });
      }
    }

    console.log('--- SINCRONIZACIÓN EXITOSA ---');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

sync();
