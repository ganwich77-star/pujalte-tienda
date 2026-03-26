import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyBsiG9CByzLlvGgjctJshIrc2k-Ck1DWM",
  authDomain: "asistente-digital-comuniones.firebaseapp.com",
  projectId: "asistente-digital-comuniones",
  storageBucket: "asistente-digital-comuniones.firebasestorage.app",
  messagingSenderId: "318953930173",
  appId: "1:318953930173:web:25bbcbca953e978ffa6d4"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = {
  PRODUCTS: "comuniones2026_products",
  CATEGORIES: "comuniones2026_categories"
};

const imageFiles = [
  "COM26-001_Madera_BindinNAT.png", "COM26-002_Madera_TS_Bindin.png",
  "COM26-003_Madero_Sobremesa.png", "COM26-004_Taco_Gandia.png",
  "COM26-005_Bloque_Nube.png", "COM26-006_Bloque_Rectangulo.png",
  "COM26-007_Bloque_Hexagono.png", "COM26-008_Bloque_Estrella.png",
  "COM26-009_Bloque_Cuadrado.png", "COM26-010_Madera_Colgar_Circulo.png",
  "COM26-011_Madera_Colgar_Globo.png", "COM26-012_Madera_Colgar_Corazon.png",
  "COM26-013_Madera_Colgar_Nube.png", "COM26-014_Madera_Colgar_Cometa.png",
  "COM26-015_Madera_Colgar_Ovalo.png", "COM26-016_Metacrilato_PVC.png",
  "COM26-017_Portafotos_Acolchado.png", "COM26-018_Metacrilato_Box.png",
  "COM26-019_Metacrilato_Peana.png", "COM26-020_Mini_Revistas.png",
  "COM26-021_Dipticos.png", "COM26-022_Chapas_Magneticas.png",
  "COM26-023_Metacrilatos_7x7.png"
];

async function run() {
  const csvPath = '/Users/pujaltefotografia/Desktop/TARIFA_COMUNIONES_2026.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
  const dataLines = lines.slice(1);

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
      price: parseFloat(precioStr.replace('€', '').trim())
    });
  });

  // 1. Limpiar colecciones
  console.log('--- LIMPPIANDO CATÁLOGO ACTUAL ---');
  const prodSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
  for (const prodDoc of prodSnap.docs) await deleteDoc(prodDoc.ref);
  const catSnap = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
  for (const catDoc of catSnap.docs) await deleteDoc(catDoc.ref);

  // 2. Crear categorías
  const categories = [...new Set(Object.values(productsMap).map(p => p.categoryName))];
  const categoryIds = {};
  for (const catName of categories) {
    const catDoc = doc(collection(db, COLLECTIONS.CATEGORIES));
    await setDoc(catDoc, {
      name: catName,
      slug: catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'),
      active: true,
      order: 0
    });
    categoryIds[catName] = catDoc.id;
  }

  // 3. Inyectar productos con imágenes inteligentes
  let pIndex = 0;
  for (const productName in productsMap) {
    const p = productsMap[productName];
    
    // Buscar imagen que coincida con el nombre
    const matchedImage = imageFiles.find(img => 
      productName.toLowerCase().split(' ').some(word => img.toLowerCase().includes(word))
    ) || imageFiles[pIndex % imageFiles.length];

    const hasVariants = p.options.length > 1 || (p.options[0] && p.options[0].name !== 'Única' && p.options[0].name !== 'Completa');

    const productData = {
      name: p.name,
      description: p.description || `Precioso producto de la colección Comuniones 2026: ${p.name}`,
      price: p.options[0].price,
      categoryId: categoryIds[p.categoryName],
      image: `/pujaltefotografia/products/comuniones_2026/${matchedImage}`,
      imagePosition: 'center',
      active: true,
      stock: 99,
      sortOrder: pIndex + 1,
      hasVariants: hasVariants,
      variantType: hasVariants ? 'Medida / Opción' : '',
      variants: hasVariants ? p.options.map((opt, idx) => ({
        id: `v${idx}`,
        name: opt.name,
        price: opt.price,
        stock: 99,
        sortOrder: idx
      })) : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(collection(db, COLLECTIONS.PRODUCTS), productData);
    console.log(`✅ ${p.name} INYECTADO con imagen ${matchedImage}`);
    pIndex++;
  }

  console.log('--- TARIFA INYECTADA CON ÉXITO ---');
  process.exit(0);
}

run().catch(console.error);
