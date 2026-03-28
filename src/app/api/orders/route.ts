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
    const { items, total, customer, status = 'pending', paymentMethod = 'cash' } = data;

    // Nota: El modelo cliente no existe en este prisma simplificado, 
    // pero guardamos los datos del cliente dentro del Pedido (Order)
    
    // 1. Crear el pedido en MySQL
    const order = await db.order.create({
      data: {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        total: parseFloat(String(total)) || 0,
        status: status,
        paymentMethod: paymentMethod,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id,
            productName: item.name,
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
      await sendOrderEmails(order);
    } catch (mailError) {
      console.error('Error al enviar emails de pedido:', mailError);
      // No bloqueamos la respuesta al cliente si el mail falla, pero lo logueamos
    }
    
    return NextResponse.json({ 
        id: order.id,
        success: true 
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
