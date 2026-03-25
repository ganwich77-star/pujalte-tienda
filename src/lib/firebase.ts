import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBsiG9CByzLlvGgjctJshIrc2k-Ck1DWM",
  authDomain: "asistente-digital-comuniones.firebaseapp.com",
  projectId: "asistente-digital-comuniones",
  storageBucket: "asistente-digital-comuniones.firebasestorage.app",
  messagingSenderId: "318953930173",
  appId: "1:318953930173:web:25bbcbca953e978ffa6d4"
};

// Singleton para no inicializar varias veces
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Constantes globales de colecciones para EVITAR MEZCLAS con otros proyectos
export const COLLECTIONS = {
  PRODUCTS: "comuniones2026_products",
  CATEGORIES: "comuniones2026_categories",
  ORDERS: "comuniones2026_orders",
  CONFIG: "comuniones2026_config",
  VARIANTS: "comuniones2026_variants"
};

export { app, db, storage };
