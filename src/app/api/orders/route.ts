import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOrderEmails } from '@/lib/mail'

export async function GET() {
  try {
    const orders = await db.order.findMany({
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders from MySQL:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { items, total, customer, customerName, customerEmail, customerPhone, status = 'pending', paymentMethod = 'cash' } = data;

    // Calculamos el total seguro
    const safeTotal = total ?? data.total ?? 0;
    
    // 1. Crear el pedido en MySQL
    const trackingNumber = `PUJ-26-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await db.order.create({
      data: {
        customerName: customer?.name || customerName || 'Desconocido',
        customerEmail: customer?.email || customerEmail || null,
        customerPhone: customer?.phone || customerPhone || '',
        total: parseFloat(String(safeTotal)) || 0,
        status: status,
        paymentMethod: paymentMethod,
        paymentId: trackingNumber, // Usamos trackingNumber como referencia inicial
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id,
            productName: item.productName || item.name || 'Producto sin nombre',
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            quantity: parseInt(String(item.quantity)) || 1,
            price: parseFloat(String(item.price || item.basePrice)) || 0,
            note: item.note || "",
            fileUrl: item.fileUrl || null,
            fileName: item.fileName || null
          }))
        }
      },
      include: {
        items: true
      }
    });

    // 2. Enviar correos de notificación
    try {
      // Determinamos si es pago manual/efectivo
      const isCash = String(paymentMethod).toUpperCase() === 'CASH';
      await sendOrderEmails({ ...order, trackingNumber }, isCash);
    } catch (mailError) {
      console.error('Error al enviar emails de pedido:', mailError);
    }
    
    return NextResponse.json({ 
        id: order.id,
        success: true,
        trackingNumber: trackingNumber
    });
  } catch (error) {
    console.error('Error creating order in MySQL:', error);
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

    // El esquema tiene onDelete: Cascade para OrderItem
    await db.order.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order from MySQL:', error);
    return NextResponse.json({ error: 'Error al eliminar el pedido' }, { status: 500 });
  }
}
