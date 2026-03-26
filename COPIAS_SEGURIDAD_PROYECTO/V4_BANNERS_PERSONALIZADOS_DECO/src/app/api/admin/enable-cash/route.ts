import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore"
import { db as prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dni = searchParams.get('dni')?.toUpperCase()
  const email = searchParams.get('email') || ''

  if (!dni) return new NextResponse('Falta el DNI', { status: 400 })

  try {
    const clientRef = doc(db, 'clients', dni)
    await setDoc(clientRef, {
      dni,
      email,
      cashEnabled: true,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    return new NextResponse(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #4A7C59;">✅ ¡Hecho!</h1>
        <p>El pago en efectivo ha sido habilitado para el DNI: <strong>${dni}</strong></p>
        <a href="javascript:window.close()" style="color: #666;">Cerrar esta ventana</a>
      </div>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Error enabling cash:', error)
    return new NextResponse('Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const dni = (searchParams.get('dni') || '').toUpperCase().trim()
    const name = searchParams.get('name') || ''
    const email = searchParams.get('email') || ''
    const phone = searchParams.get('phone') || ''
    const enable = searchParams.get('enable') === 'true'
    
    // Identificadores para sincronizar pedidos antiguos
    const originalDni = (searchParams.get('originalDni') || '').toUpperCase().trim()
    const originalEmail = (searchParams.get('originalEmail') || '').trim()
    const originalPhone = (searchParams.get('originalPhone') || '').trim()

    console.log('[UPDATE_CUSTOMER] Sync Request:', { dni, originalDni, originalEmail, originalPhone })

    if (!dni && !email && !phone) {
      return NextResponse.json({ error: 'Se necesita al menos un identificador (DNI, email o teléfono)' }, { status: 400 })
    }

    // Clave de Firebase: DNI si existe, si no email o teléfono
    const firebaseKey = dni || email || phone

    // Si el DNI ha cambiado o se está asignando por primera vez, eliminar el doc con la clave antigua
    const oldKey = originalDni || originalEmail || originalPhone || ''
    if (oldKey && oldKey !== firebaseKey) {
        try {
            await deleteDoc(doc(db, 'clients', oldKey))
        } catch (e) { console.error('Error eliminando doc antiguo:', e) }
    }

    const clientRef = doc(db, 'clients', firebaseKey)
    await setDoc(clientRef, {
      dni,
      name,
      email,
      phone,
      cashEnabled: enable,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    // 2. MySQL Sync (OPCIONAL - si falla NO bloquea el guardado en Firebase)
    // Buscamos pedidos que coincidan con la identidad previa del cliente
    // Solo buscamos si tenemos algun dato previo para evitar un barrido total accidental
    if (originalDni || originalEmail || originalPhone) {
      try {
        const conds: any[] = []
        if (originalDni) conds.push({ customFields: { contains: `"dni":"${originalDni}"` } })
        if (originalEmail) conds.push({ customerEmail: originalEmail })
        if (originalPhone) conds.push({ customerPhone: originalPhone })

        const ordersToUpdate = await prisma.order.findMany({
            where: { OR: conds }
        })

        console.log(`[SYNC_MYSQL] Found ${ordersToUpdate.length} orders to update.`)

        for (const order of ordersToUpdate) {
            let customFields: any = {}
            try {
                if (order.customFields) customFields = JSON.parse(order.customFields)
            } catch (e) { 
                console.error('[SYNC_MYSQL] Error parseando customFields en pedido:', order.id)
                customFields = {}
            }
            
            // Forzar el nuevo DNI
            customFields.dni = dni

            await prisma.order.update({
                where: { id: order.id },
                data: {
                    customerName: name || order.customerName,
                    customerEmail: email || order.customerEmail,
                    customerPhone: phone || order.customerPhone,
                    customFields: JSON.stringify(customFields)
                }
            })
        }
      } catch (mysqlError: any) {
        // MySQL falló (credenciales, conexión) pero Firebase ya está guardado correctamente
        console.error('[SYNC_MYSQL_ERROR] Non-critical MySQL sync failed:', mysqlError.message)
      }
    }

    // Firebase guardado → éxito garantizado
    return NextResponse.json({ success: true, dni })

  } catch (error: any) {
    console.error('[UPDATE_CUSTOMER_FATAL]', error)
    // Retornamos el error detallado para ayudar al usuario/despacho
    return NextResponse.json({ 
        error: 'No se pudo guardar el cliente.', 
        details: error.message 
    }, { status: 500 })
  }
}
