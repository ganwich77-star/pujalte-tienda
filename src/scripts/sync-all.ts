import { db } from '../lib/db';
import { db as firestore, COLLECTIONS } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function sync() {
  console.log('--- ✨ SINCRO FIREBASE -> MYSQL INICIADA ---');

  // 1. Categorías
  console.log('📁 Sincronizando categorías...');
  try {
    const catSnap = await getDocs(collection(firestore, COLLECTIONS.CATEGORIES));
    for (const doc of catSnap.docs) {
      const data = doc.data();
      await db.category.upsert({
        where: { id: doc.id },
        update: { 
          name: data.name || data.nombre || '',
          sortOrder: data.sortOrder || 0
        },
        create: { 
          id: doc.id,
          name: data.name || data.nombre || '',
          sortOrder: data.sortOrder || 0
        }
      });
    }
    console.log('✅ Categorías sincronizadas.');
  } catch (e) {
    console.warn('⚠️ No se pudieron sincronizar categorías:', e);
  }

  // 2. Productos
  console.log('🛍️ Sincronizando productos y fotos...');
  try {
    const productSnap = await getDocs(collection(firestore, COLLECTIONS.PRODUCTS));
    
    for (const doc of productSnap.docs) {
      const p = doc.data();
      const fbId = doc.id;

      const productData = {
        firebaseId: fbId,
        name: p.name || "",
        description: p.description || "",
        price: parseFloat(p.price) || 0,
        salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
        isNew: !!p.isNew,
        image: p.image || null,
        categoryId: p.categoryId || null,
        active: p.active !== false,
        hasVariants: !!p.hasVariants,
        variantType: p.variantType || null,
        variantBehavior: p.variantBehavior || null,
        sortOrder: p.sortOrder || 0,
      };

      // Upsert product
      const product = await db.product.upsert({
        where: { firebaseId: fbId },
        update: productData,
        create: productData
      }).catch(err => {
        console.error(`❌ Error al subir producto ${p.name}:`, err.message);
        return null;
      });

      if (!product) continue;

      // Sync variants separately with catch
      try {
        if (p.hasVariants && p.variants && Array.isArray(p.variants)) {
          // Clear old ones
          await db.productVariant.deleteMany({
            where: { productId: product.id }
          });

          for (const v of p.variants) {
            await db.productVariant.create({
              data: {
                productId: product.id,
                name: v.name || "",
                price: parseFloat(v.price) || 0,
                stock: parseInt(v.stock) || 0,
                active: true,
                sortOrder: v.sortOrder || 0
              }
            });
          }
        }
        
        const imgLen = product.image ? Math.floor(product.image.length / 1024) : 0;
        console.log(`📸 OK: ${product.name.padEnd(25)} | Foto: ${imgLen}kb | Variantes: ${p.variants?.length || 0}`);
        
      } catch (variantErr) {
        console.error(`⚠️  Aviso: Error en variantes de ${product.name}:`, (variantErr as any).message);
      }
    }

    console.log("\n✅ --- SINCRONIZACIÓN FINALIZADA ---");
  } catch (error) {
    console.error("⛔ ERROR GENERAL DE SINCRONIZACIÓN:", error);
  } finally {
    process.exit(0);
  }
}

sync().catch(console.error).finally(() => {
  console.log('Cerrando...');
  process.exit();
});
