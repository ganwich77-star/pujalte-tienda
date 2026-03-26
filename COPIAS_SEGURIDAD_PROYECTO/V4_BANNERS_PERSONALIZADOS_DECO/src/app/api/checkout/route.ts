import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { generatePaycometData } from '@/lib/payments/server'
import { sendOrderEmails } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      address, 
      notes, 
      items, 
      paymentMethod,
      customFields,
      gateway = 'paycomet'
    } = body

    // 1. Calculate total
    const total = items.reduce((sum: number, item: any) => sum + (parseFloat(String(item.price)) * item.quantity), 0)

    // 2. Create the order in Firestore as "pending"
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
      paymentMethod: paymentMethod || 'card',
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      items: items.map((item: any) => ({
        productId: item.productId || null,
        productName: item.productName || "",
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        quantity: item.quantity || 1,
        price: parseFloat(String(item.price)) || 0,
        note: item.note || ""
      }))
    };

    const docRef = await addDoc(ordersRef, newOrder);
    const orderId = docRef.id;

    // 3. Generate payment data for the selected gateway
    // We use a clean order reference for the gateway (max 12 chars for Redsys compatibility)
    const paymentOrderRef = orderId.slice(-8).toUpperCase() + Math.floor(Math.random() * 1000).toString().padStart(4, '0')
    
    // Base URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pujaltefotografia.es'
    const okUrl = `${baseUrl}/order-success`
    const koUrl = `${baseUrl}/order-failed`

    if (gateway === 'paycomet') {
      try {
        const amountInCents = Math.round(total * 100).toString();
        const paycometMethod = paymentMethod === 'bizum' ? [11] : [1];
        
        const paycometResponse = await fetch("https://rest.paycomet.com/v1/form", {
          method: "POST",
          headers: {
            "PAYCOMET-API-TOKEN": process.env.PAYCOMET_API_KEY || "",
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            operationType: 1,
            language: "es",
            payment: {
              terminal: parseInt(process.env.PAYCOMET_TERMINAL || "0"),
              order: paymentOrderRef,
              amount: amountInCents,
              currency: "EUR",
              methods: paycometMethod,
              secure: 1,
              userInteraction: 1,
              urlOk: `${baseUrl}/?payment=success&orderId=${orderId}&tracking=${trackingNumber}`,
              urlKo: `${baseUrl}/?payment=error&orderId=${orderId}&tracking=${trackingNumber}`
            }
          })
        });

        const paycometData = await paycometResponse.json();

        if (!paycometData.challengeUrl) {
          console.error("Paycomet API Error:", paycometData);
          throw new Error(paycometData.error?.message || "Error al obtener URL de Paycomet");
        }

        // Update the order with the payment reference in Firestore
        await updateDoc(docRef, {
          paymentId: paymentOrderRef,
          updatedAt: serverTimestamp()
        });

        // PERSISTIR CLIENTE EN FIREBASE si hay DNI
        const cf = (customFields || {}) as Record<string, any>
        const dni = (cf.dni || '').trim().toUpperCase()
        if (dni) {
          try {
            const clientRef = doc(db, 'clients', dni)
            await setDoc(clientRef, {
              dni,
              name: customerName || '',
              email: customerEmail || '',
              phone: customerPhone || '',
              updatedAt: new Date().toISOString()
            }, { merge: true })
          } catch (e) { console.error('[CHECKOUT] Error guardando cliente:', e) }
        }

        // 4. Send order confirmations (don't await - fast response)
        const orderForEmail = { id: orderId, ...newOrder };
        sendOrderEmails(orderForEmail).catch(err => console.error("Error enviando email en checkout:", err));

        return NextResponse.json({
          success: true,
          orderId: orderId,
          trackingNumber: trackingNumber,
          paymentUrl: paycometData.challengeUrl
        })
      } catch (err: any) {
        console.error("Paycomet Integration Error:", err);
        return NextResponse.json({ error: err.message || "Error en pasarela de pago" }, { status: 500 });
      }
    }

    // Default error if gateway not supported
    return NextResponse.json({ error: 'Pasarela no soportada' }, { status: 400 })

  } catch (error: any) {
    console.error('Checkout error in Firebase:', error)
    return NextResponse.json({ error: 'Error al procesar el checkout en Firebase' }, { status: 500 })
  }
}
