const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const csvPath = '/Users/pujaltefotografia/Desktop/TARIFA_COMUNIONES_2026.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  // Limpiar BOM y separar por líneas
  const lines = csvContent.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
  const header = lines[0].split(';');
  const dataLines = lines.slice(1);

  // Agrupar por Producto
  const productsMap = {};
  dataLines.forEach(line => {
    const [categoria, producto, medida, precioStr, notas] = line.split(';');
    if (!producto) return;

    if (!productsMap[producto]) {
      productsMap[producto] = {
        name: producto,
        categoryName: categoria,
        description: notas || '',
        basePrice: parseFloat(precioStr.replace('€', '').trim()),
        options: []
      };
    }
    
    productsMap[producto].options.push({
      name: medida,
      price: parseFloat(precioStr.replace('€', '').trim()),
      notes: notas || ''
    });
  });

  console.log(`Detectados ${Object.keys(productsMap).length} productos para inyectar.`);

  // 1. Limpiar productos y categorías actuales
  const prodSnap = await db.collection('comuniones2026_products').get();
  const catSnap = await db.collection('comuniones2026_categories').get();
  
  const batch = db.batch();
  prodSnap.forEach(doc => batch.delete(doc.ref));
  catSnap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log('Colecciones limpias.');

  // 2. Crear categorías únicas
  const categories = [...new Set(Object.values(productsMap).map(p => p.categoryName))];
  const categoryIds = {};
  
  for (const catName of categories) {
    const catRef = db.collection('comuniones2026_categories').doc();
    await catRef.set({
      name: catName,
      slug: catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'),
      active: true,
      order: 0
    });
    categoryIds[catName] = catRef.id;
  }
  console.log('Categorías creadas.');

  // 3. Inyectar productos con variantes e imágenes
  // Tenemos 23 imágenes disponibles
  const images = Array.from({ length: 23 }, (_, i) => `/pujaltefotografia/products/comuniones_2026/${i + 1}.png`);
  let imgIndex = 0;

  for (const productName in productsMap) {
    const p = productsMap[productName];
    const productRef = db.collection('comuniones2026_products').doc();
    
    const hasVariants = p.options.length > 1 || (p.options[0] && p.options[0].name !== 'Única' && p.options[0].name !== 'Completa');
    
    const productData = {
      name: p.name,
      description: p.description || `Precioso producto de la categoría ${p.categoryName}`,
      price: p.basePrice,
      categoryId: categoryIds[p.categoryName],
      image: images[imgIndex % images.length],
      imagePosition: 'center',
      active: true,
      stock: 99,
      hasVariants: hasVariants,
      variantType: hasVariants ? 'Medida' : '',
      variants: hasVariants ? p.options.map((opt, idx) => ({
        id: `v${idx}`,
        name: opt.name,
        price: opt.price,
        stock: 99,
        sortOrder: idx
      })) : [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await productRef.set(productData);
    imgIndex++;
  }

  console.log('Inyección de productos completada con éxito.');
}

run().catch(console.error);
