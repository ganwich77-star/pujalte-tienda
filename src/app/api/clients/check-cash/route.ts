import { NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dni = searchParams.get('dni')?.toUpperCase().trim()

    if (!dni) {
      return NextResponse.json({ error: 'DNI es obligatorio' }, { status: 400 })
    }

    const clientRef = doc(db, COLLECTIONS.CLIENTS, dni)
    const clientSnap = await getDoc(clientRef)

    if (clientSnap.exists()) {
      const data = clientSnap.data()
      return NextResponse.json({ cashEnabled: !!data.cashEnabled })
    } else {
      return NextResponse.json({ cashEnabled: false }) // Por defecto deshabilitado si no existe
    }

  } catch (error: any) {
    console.error('Error in check-cash:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
