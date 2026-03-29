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

    // 1. Limpiar DNI del request (solo números)
    const numericDni = dni.replace(/[^0-9]/g, '')

    if (!numericDni) {
      return NextResponse.json({ error: 'DNI inválido' }, { status: 400 })
    }

    // 2. Obtener todos los clientes para buscar por el número del DNI 
    // (Firebase no permite buscar por parte del ID fácilmente, consultamos la colección)
    const { collection, getDocs, query, where } = await import('firebase/firestore')
    const clientsRef = collection(db, COLLECTIONS.CLIENTS)
    const q = query(clientsRef)
    const querySnapshot = await getDocs(q)
    
    let targetClient: any = null
    let clientIdMatch: string | null = null

    // Buscamos un cliente cuyo ID (DNI) contenga los números proporcionados
    querySnapshot.forEach((doc) => {
      const docIdNumeric = doc.id.replace(/[^0-9]/g, '')
      if (docIdNumeric === numericDni) {
        targetClient = doc.data()
        clientIdMatch = doc.id
      }
    })

    if (!targetClient) {
      return NextResponse.json({ exists: false, errorType: 'NOT_FOUND' })
    }

    // 3. Validar el nombre si se proporciona (opcional en la URL, pero lo usaremos para el login)
    const nameParam = searchParams.get('name')?.toUpperCase().trim()
    if (nameParam) {
      const dbName = targetClient.name?.toUpperCase().trim() || ''
      // Comprobación de nombre (flexibilidad básica: que el nombre esté contenido o coincida)
      if (dbName !== nameParam && !dbName.includes(nameParam) && !nameParam.includes(dbName)) {
        return NextResponse.json({ exists: true, errorType: 'NAME_MISMATCH' })
      }
    }

    return NextResponse.json({ 
      exists: true, 
      cashEnabled: !!targetClient.cashEnabled,
      fullName: targetClient.name,
      dni: clientIdMatch
    })

  } catch (error: any) {
    console.error('Error in check-cash:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
