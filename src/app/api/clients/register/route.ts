import { NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { sendWelcomeEmails } from '@/lib/mail'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { dni, name, email, phone, address, marketing } = body

    if (!dni || !name || !email) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const clientDni = dni.toUpperCase().trim()
    const clientRef = doc(db, COLLECTIONS.CLIENTS, clientDni)
    const clientSnap = await getDoc(clientRef)

    // Si ya existe, podrÃ­amos actualizar o simplemente decir que ya estÃ¡
    // Para simplificar, siempre guardamos/actualizamos los datos actuales
    const clientData = {
      dni: clientDni,
      name,
      email,
      phone: phone || '',
      address: address || '',
      marketing: marketing === 'true',
      updatedAt: serverTimestamp()
    }

    let isNewRegistration = !clientSnap.exists()

    if (isNewRegistration) {
      // @ts-ignore
      clientData.createdAt = serverTimestamp()
      // @ts-ignore
      clientData.cashEnabled = false // Por defecto deshabilitado hasta que admin apruebe
    }

    await setDoc(clientRef, clientData, { merge: true })

    // Solo enviamos email de bienvenida si es un registro NUEVO
    if (isNewRegistration) {
      console.log('Nuevo cliente registrado, enviando correos de bienvenida...')
      await sendWelcomeEmails({
        dni: clientDni,
        name,
        email,
        phone: phone || ''
      })
    }

    return NextResponse.json({ 
      success: true, 
      isNewRegistration,
      message: isNewRegistration ? 'Registro completado' : 'Datos actualizados'
    })

  } catch (error: any) {
    console.error('Error in client registration:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
