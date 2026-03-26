import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import * as firestore from "firebase/firestore";
import { sendWelcomeEmails } from '@/lib/mail'

export async function GET() {
  try {
    const q = firestore.query(
      firestore.collection(db, COLLECTIONS.ORDERS),
      firestore.orderBy('createdAt', 'desc')
    );
    const querySnapshot = await firestore.getDocs(q);
    const orders = querySnapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { items, total, customer, status = 'pending', paymentMethod = 'cash' } = data;

    // 1. Persistencia/Activación del cliente en la colección unificada
    const clientRef = firestore.doc(db, COLLECTIONS.CLIENTS, customer.dni);
    const clientSnap = await firestore.getDoc(clientRef);
    
    let isNewClient = !clientSnap.exists();

    const clientData = {
      ...customer,
      updatedAt: firestore.serverTimestamp(),
      lastOrderDate: firestore.serverTimestamp(),
    };

    if (isNewClient) {
      // Si es nuevo, inicializamos campos base
      await firestore.setDoc(clientRef, {
        ...clientData,
        createdAt: firestore.serverTimestamp(),
        cashEnabled: false, // Por defecto deshabilitado para nuevos
        status: 'active'
      });
      
      // ENVIAR EMAILS DE BIENVENIDA (incluye enlace de activación para admin)
      try {
        await sendWelcomeEmails(customer);
      } catch (mailError) {
        console.error('Error enviando emails de bienvenida:', mailError);
      }
    } else {
      // Si ya existe, actualizamos sus datos
      await firestore.updateDoc(clientRef, clientData);
    }

    // 2. Crear el pedido
    const orderData = {
      items,
      total,
      customer: {
        dni: customer.dni,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      status,
      paymentMethod,
      createdAt: firestore.serverTimestamp(),
      updatedAt: firestore.serverTimestamp()
    };

    const docRef = await firestore.addDoc(firestore.collection(db, COLLECTIONS.ORDERS), orderData);
    
    return NextResponse.json({ 
      id: docRef.id,
      isNewClient 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await firestore.deleteDoc(firestore.doc(db, COLLECTIONS.ORDERS, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Error al eliminar el pedido' }, { status: 500 });
  }
}
