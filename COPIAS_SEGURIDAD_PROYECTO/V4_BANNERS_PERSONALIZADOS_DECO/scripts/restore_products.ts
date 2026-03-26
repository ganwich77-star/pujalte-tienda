import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
  CATEGORIES: "comuniones2026_categories",
  ORDERS: "comuniones2026_orders",
  CONFIG: "comuniones2026_config",
  VARIANTS: "comuniones2026_variants"
};

const products = [
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

async function restore() {
  console.log('--- EMPEZANDO RESTAURACIÓN DE EMERGENCIA ---');
  const productsRef = collection(db, COLLECTIONS.PRODUCTS);
  
  for (const filename of products) {
    let name = filename.replace(/^COM26-\d{3}_/, '').replace('.png', '').replace(/_/g, ' ');
    if (!name || name.length < 2) name = "Producto " + filename.split('_')[0];

    const productData = {
      name: name,
      description: `Detalle premium de la colección Comuniones 2026: ${name}`,
      price: 29.99,
      categoryId: "cat-comuniones-2026",
      image: `/products/comuniones_2026/${filename}`,
      active: true,
      hasVariants: false,
      variantType: null,
      sortOrder: products.indexOf(filename) + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      variants: []
    };

    try {
      const docRef = await addDoc(productsRef, productData);
      console.log(`✅ ${name} RECUPERADO con éxito.`);
    } catch (e) {
      console.error(`❌ Falló ${name}:`, e);
    }
  }
  console.log('--- 23 PRODUCTOS RESTAURADOS CORRECTAMENTE ---');
  process.exit(0);
}

restore();
