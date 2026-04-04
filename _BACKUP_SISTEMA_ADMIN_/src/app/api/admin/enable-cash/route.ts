import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { doc, setDoc, deleteDoc } from "firebase/firestore"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dni = (searchParams.get('dni') || '').toUpperCase().trim()
  const email = (searchParams.get('email') || '').trim()

  if (!dni) return new NextResponse('Falta el DNI', { status: 400 })

  try {
    const clientRef = doc(db, COLLECTIONS.CLIENTS, dni)
    await setDoc(clientRef, {
      dni,
      email,
      cashEnabled: true,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Pago Habilitado</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f9f9f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
            h1 { color: #10b981; margin-bottom: 16px; font-size: 24px; }
            p { color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
            .dni { font-weight: bold; color: #1f2937; }
            .btn { color: #6b7280; text-decoration: none; font-size: 14px; border-bottom: 1px solid transparent; transition: all 0.2s; cursor: pointer; }
            .btn:hover { border-bottom-color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ Pago Habilitado</h1>
            <p>El pago en efectivo ha sido activado correctamente para el cliente con DNI <span class="dni">${dni}</span>.</p>
            <button onclick="window.close()" class="btn" style="background:none; border:none; padding:0;">Cerrar esta ventana</button>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Error enabling cash:', error)
    return new NextResponse('Error al habilitar el pago.', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      
      const dni = (searchParams.get('dni') || '').toUpperCase().trim()
      const name = searchParams.get('name') || ''
      const email = (searchParams.get('email') || '').trim()
      const phone = (searchParams.get('phone') || '').trim()
      const enable = searchParams.get('enable') === 'true'
      
      const originalDni = (searchParams.get('originalDni') || '').toUpperCase().trim()
      const originalEmail = (searchParams.get('originalEmail') || '').trim()
      const originalPhone = (searchParams.get('originalPhone') || '').trim()
  
      if (!dni && !email && !phone) {
        return NextResponse.json({ error: 'Se necesita al menos un identificador' }, { status: 400 })
      }
  
      const firebaseKey = dni || email || phone
      const oldKey = originalDni || originalEmail || originalPhone || ''
      
      if (oldKey && oldKey !== firebaseKey) {
          try {
              await deleteDoc(doc(db, COLLECTIONS.CLIENTS, oldKey))
          } catch (e) { console.error('Error eliminando doc antiguo:', e) }
      }
  
      const clientRef = doc(db, COLLECTIONS.CLIENTS, firebaseKey)
      await setDoc(clientRef, {
        dni,
        name,
        email,
        phone,
        cashEnabled: enable,
        updatedAt: new Date().toISOString()
      }, { merge: true })
  
      return NextResponse.json({ success: true, dni })
  
    } catch (error: any) {
      console.error('[UPDATE_CUSTOMER_FATAL]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

