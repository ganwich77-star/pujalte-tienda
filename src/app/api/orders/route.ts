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
    const { items, total, customer, status = 'pending', paymentMethod = 'cash', notes = '' } = data;

    // Extraemos datos del cliente de forma segura
    let cName = customer?.name;
    if (!cName && customer?.firstName) {
        cName = `${customer.firstName} ${customer.lastName || ''}`.trim();
    }
    cName = cName || 'Cliente sin nombre';

    let cEmail = customer?.email || null;
    let cPhone = customer?.phone || '';
    const cAddress = customer?.address || '';
    const cDni = customer?.dni || '';

    // PARCHE: Si el nombre está vacío pero tenemos DNI, intentamos recuperar los datos del cliente de la base de datos
    if (cName === 'Cliente sin nombre' && cDni) {
      try {
        const existingClient = await db.client.findFirst({
          where: {
            OR: [
              { dni: cDni },
              { id: cDni }
            ]
          }
        });
        
        if (existingClient) {
          cName = existingClient.name;
          cEmail = cEmail || existingClient.email;
          cPhone = cPhone || existingClient.phone || '';
        }
      } catch (e) {
        console.error('Error al recuperar cliente por DNI:', e);
      }
    }

    // Si el esquema no tiene DNI, lo guardamos en las notas del pedido para no perderlo
    const finalNotes = cDni ? `[DNI: ${cDni}] ${notes || ''}` : (notes || '');

    // 1. Crear el pedido en MySQL (Neon/Postgres vía Prisma)
    const trackingNumber = `PUJ-26-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await db.order.create({
      data: {
        customerName: cName,
        customerEmail: cEmail,
        customerPhone: cPhone,
        address: cAddress,
        total: parseFloat(String(total)) || 0,
        status: status,
        paymentMethod: paymentMethod,
        paymentId: trackingNumber, 
        notes: finalNotes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id,
            productName: item.productName || item.name || 'Producto sin nombre',
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            quantity: parseInt(String(item.quantity)) || 1,
            price: parseFloat(String(item.price)) || 0,
            note: item.notes || item.note || "",
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
      const isCash = String(paymentMethod).toUpperCase() === 'CASH';
      await sendOrderEmails({ ...order, trackingNumber }, isCash);
    } catch (mailError) {
      console.error('Error al enviar emails de pedido:', mailError);
    }
    
    return NextResponse.json({ 
        id: order.id,
        success: true,
        trackingCode: trackingNumber // Devolvemos trackingCode para el frontend
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

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, customerName, customerEmail, customerPhone, address, total, status, paymentStatus, paymentMethod, notes, items } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    // Actualizamos el pedido y sus artículos
    // Para los artículos, lo más sencillo es borrar los anteriores y crear los nuevos 
    // si se proporciona la lista de items, o simplemente actualizar los campos del pedido.
    
    const updateData: any = {
      customerName,
      customerEmail,
      customerPhone,
      address,
      total: total !== undefined ? parseFloat(String(total)) : undefined,
      status,
      paymentStatus,
      paymentMethod,
      notes,
    };

    // Eliminamos undefined del objeto de actualización
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const result = await db.$transaction(async (tx) => {
      // 1. Si hay items, borramos los antiguos y creamos los nuevos
      if (items && Array.isArray(items)) {
        await tx.orderItem.deleteMany({
          where: { orderId: id }
        });

        await tx.orderItem.createMany({
          data: items.map((item: any) => ({
            orderId: id,
            productId: item.productId || item.id,
            productName: item.productName || item.name || 'Producto',
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            quantity: parseInt(String(item.quantity)) || 1,
            price: parseFloat(String(item.price)) || 0,
            note: item.note || item.notes || ""
          }))
        });
      }

      // 2. Actualizamos los datos principales del pedido
      return await tx.order.update({
        where: { id },
        data: updateData,
        include: { items: true }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating order in MySQL:', error);
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 });
  }
}
