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
  console.log('🚀 [PEDIDO] Iniciando procesamiento de pedido...');
  console.time('OrderCreation');
  try {
    const data = await request.json();
    const { items, total, customer, status = 'pending', paymentMethod = 'cash', notes = '', galleryTitle = '' } = data;

    console.log(`📝 [PEDIDO] Cliente: ${customer?.firstName}, Total: ${total}, Método: ${paymentMethod}, Galería: ${galleryTitle}`);

    // Extraemos datos del cliente de forma segura (Prioridad: Nombre Real)
    let cName = "";
    if (customer?.firstName || customer?.lastName) {
      cName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    
    // Fallbacks si no hay nombres separados
    cName = cName || customer?.name || data.customerName || "";

    const cDni = customer?.dni || data.dni || "";
    if (!cName && cDni) {
        cName = `Cliente DNI: ${cDni}`;
    }
    
    cName = cName || 'Cliente sin nombre';

    let cEmail = customer?.email || data.customerEmail || data.email || null;
    let cPhone = customer?.phone || data.customerPhone || data.phone || '';
    const cAddress = customer?.address || data.address || '';

    // PARCHE: Búsqueda exhaustiva del cliente para completar datos (Email, Teléfono y Nombre Real)
    let resolvedGalleryTitle = galleryTitle;
    
    if (cDni) {
      console.log(`🔎 [PEDIDO] Buscando cliente por ID/DNI para completar datos: ${cDni}`);
      try {
        const existingClient = await db.client.findFirst({
          where: {
            OR: [
              { dni: cDni },
              { id: cDni },
              // También intentamos por email si lo tenemos, para cruzar datos
              ...(cEmail ? [{ email: cEmail }] : [])
            ]
          }
        });
        
        if (existingClient) {
          console.log(`✅ [PEDIDO] Cliente encontrado en DB: ${existingClient.name}`);
          
          // Si el nombre actual es genérico o el de la DB es más completo, lo usamos
          if (cName === 'Cliente sin nombre' || cName.startsWith('Cliente DNI:') || cName === 'DESCONOCIDO') {
            cName = existingClient.name;
          }
          
          // Completamos Email y Teléfono si faltaban
          if (!cEmail) cEmail = existingClient.email;
          if (!cPhone) cPhone = existingClient.phone || '';
          
          // Si no tenemos título de galería, usamos el nombre del cliente/galería como referencia
          if (!resolvedGalleryTitle) resolvedGalleryTitle = existingClient.name;
        }
      } catch (e) {
        console.error('❌ [PEDIDO] Error al recuperar cliente por ID:', e);
      }
    }

    // Unificamos notas con info de galería
    const finalNotesArray: string[] = [];
    if (resolvedGalleryTitle) finalNotesArray.push(`GALERÍA: ${resolvedGalleryTitle.toUpperCase()}`);
    if (cDni) finalNotesArray.push(`DNI: ${cDni}`);
    if (notes) finalNotesArray.push(notes);
    const finalNotes = finalNotesArray.join(' | ');

    const trackingNumber = `PUJ-26-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log('💾 [PEDIDO] Guardando en Base de Datos...');
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
        clientId: data.clientId || null,
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
            fileName: item.fileName || null,
            fotosIncluidas: parseInt(String(item.fotosIncluidas)) || 1
          }))
        }
      },
      include: {
        items: true
      }
    });

    console.log('✅ [PEDIDO] Guardado con éxito. ID:', order.id);
    console.timeEnd('OrderCreation');

    // 2. Enviar correos de notificación (A Pepe y al cliente)
    const isCash = String(paymentMethod).toUpperCase() === 'CASH' || String(paymentMethod).toUpperCase() === 'EFECTIVO' || status === 'pending';
    
    console.log(`📧 [PEDIDO] Enviando correos... (isCash: ${isCash}, gallery: ${resolvedGalleryTitle})`);
    try {
      await sendOrderEmails(order, isCash, resolvedGalleryTitle);
    } catch (mailErr) {
      console.error('❌ [PEDIDO] Error enviando correos:', mailErr);
    }
    
    return NextResponse.json({ 
        id: order.id,
        success: true,
        trackingCode: trackingNumber 
    });
  } catch (error) {
    console.error('❌ [PEDIDO] Error Fatal:', error);
    console.timeEnd('OrderCreation');
    return NextResponse.json({ error: 'Error interno al procesar el pedido' }, { status: 500 });
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
            note: item.note || item.notes || "",
            fileName: item.fileName || null,
            fileUrl: item.fileUrl || null,
            fotosIncluidas: parseInt(String(item.fotosIncluidas)) || 1
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

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID y estado requeridos' }, { status: 400 });
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: { status },
      include: { items: true }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status in MySQL:', error);
    return NextResponse.json({ error: 'Error al actualizar el estado del pedido' }, { status: 500 });
  }
}
