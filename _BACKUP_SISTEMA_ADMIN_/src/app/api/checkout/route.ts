import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
      clientId,
      gateway = 'paycomet'
    } = body
    
    // ... Calcular total ...
    const total = items.reduce((sum: number, item: any) => sum + (parseFloat(String(item.price)) * item.quantity), 0)

    // 2. Generar número de seguimiento
    const trackingNumber = `PUJ-26-${Math.floor(1000 + Math.random() * 9000)}`;

    // ... Crear el pedido ...
    const order = await db.order.create({
      data: {
        customerName: customerName || "Cliente sin nombre",
        customerPhone: customerPhone || "",
        customerEmail: customerEmail || "",
        address: address || "",
        total: total,
        status: 'pending',
        paymentMethod: paymentMethod || 'card',
        paymentStatus: 'pending',
        paymentId: trackingNumber,
        notes: notes || "",
        customFields: JSON.stringify(customFields || {}),
        clientId: clientId || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id,
            productName: item.productName || item.name || 'Producto sin nombre',
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            quantity: parseInt(String(item.quantity)) || 1,
            price: parseFloat(String(item.price)) || 0,
            note: item.note || item.notes || "",
            fileUrl: item.fileUrl || null,
            fileName: item.fileName || null
          }))
        }
      },
      include: {
        items: true
      }
    });

    const orderId = order.id;

    // 4. Preparar datos para Paycomet
    const paymentOrderRef = orderId.slice(-8).toUpperCase() + Math.floor(Math.random() * 1000).toString().padStart(4, '0')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pujaltefotografia.es'

    if (gateway === 'paycomet') {
      try {
        const amountInCents = Math.round(total * 100).toString();
        // Bizum = 11, Card = 1
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

        // Actualizar el pedido con la referencia de pago real en MySQL
        await db.order.update({
          where: { id: orderId },
          data: { paymentId: paymentOrderRef }
        });

        // 5. Enviar confirmación (opcional en este paso, pero lo mantenemos)
        sendOrderEmails({ ...order, trackingNumber }).catch(err => console.error("Error enviando email en checkout:", err));

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

    return NextResponse.json({ error: 'Pasarela no soportada' }, { status: 400 })

  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Error al procesar el checkout' }, { status: 500 })
  }
}
