
import { db, COLLECTIONS } from './src/lib/firebase.js';
import { collection, addDoc } from 'firebase/firestore';

async function addMariaOrder() {
  try {
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const result = await addDoc(ordersRef, {
      customerName: "MARIA JESÚS BARGUEÑO",
      customerPhone: "654877798", 
      customerEmail: "pujaltefotografia@gmail.com",
      address: "Enviado por Correo/WhatsApp",
      clientId: "MARIA-JESUS-BARGUENO",
      items: [
        {
          productName: "BLOQUE METACRILATO 15x15",
          variantName: "BLOQUE METACRILATO 13X18",
          quantity: 3,
          price: 0
        },
        {
          productName: "LIENZO",
          variantName: "70X100",
          quantity: 1,
          price: 0
        },
        {
          productName: "BLOQUE METACRILATO 15x15",
          variantName: "BLOQUE METACRILATO 13X18",
          quantity: 1,
          price: 0
        }
      ],
      total: 0,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      paymentMethod: 'Galería Confirmada',
      notes: "Pedido recuperado por Pepe del email de confirmación anterior."
    });
    console.log("¡Pedido de Maria Jesús inyectado con éxito! ID:", result.id);
  } catch (e) {
    console.error("Error inyectando pedido:", e);
  }
}

addMariaOrder();
