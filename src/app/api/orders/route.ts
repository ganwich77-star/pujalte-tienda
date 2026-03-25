import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { sendOrderEmails } from '@/lib/mail';

export async function GET() {
  try {
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Error fetching orders from Firebase:', error)
    return NextResponse.json({ error: 'Error al obtener pedidos de Firebase' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customerName, customerPhone, customerEmail, address, notes, 
      items, paymentMethod, paymentId, paymentStatus, customFields 
    } = body

    // Calculate total
    const total = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (parseFloat(String(item.price)) * item.quantity), 0)

    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    
    // Generar número de seguimiento único
    const trackingNumber = `PUJ-26-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      trackingNumber,
      customerName: customerName || "",
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
      address: address || "",
      notes: notes || "",
      total,
      paymentMethod: paymentMethod || "none",
      paymentId: paymentId || null,
      customFields: customFields || null,
      paymentStatus: paymentStatus || 'pending',
      status: paymentStatus === 'completed' ? 'paid' : 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Guardamos los items directamente en el pedido para eficiencia
      items: items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: parseFloat(String(item.price)),
        note: item.note || ""
      }))
    };

    const docRef = await addDoc(ordersRef, newOrder);
    
    // ENVIAR CORREOS (CLIENTE Y ADMINISTRACIÓN) - No bloqueamos el proceso si falla el email
    const orderForEmail = { id: docRef.id, ...newOrder }
    sendOrderEmails(orderForEmail).catch(err => console.error("Error asíncrono enviando correos:", err));

    return NextResponse.json(orderForEmail)
  } catch (error: any) {
    console.error('Error creating order in Firebase:', error)
    return NextResponse.json({ error: 'Error al crear pedido en Firebase' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    if (!id || !status) return NextResponse.json({ error: 'ID y estado obligatorios' }, { status: 400 })

    const orderRef = doc(db, COLLECTIONS.ORDERS, id);
    await updateDoc(orderRef, { 
      status,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el pedido' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obligatorio' }, { status: 400 })

    const orderRef = doc(db, COLLECTIONS.ORDERS, id);
    await deleteDoc(orderRef);

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'No se pudo eliminar el pedido' }, { status: 500 })
  }
}
