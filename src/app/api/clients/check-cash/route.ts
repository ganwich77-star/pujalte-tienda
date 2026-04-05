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
    const exactDni = dni.trim().toUpperCase()

    if (!numericDni) {
      return NextResponse.json({ error: 'DNI inválido' }, { status: 400 })
    }

    const { collection, getDocs, query, where } = await import('firebase/firestore')
    const clientsRef = collection(db, COLLECTIONS.CLIENTS)
    
    let targetClient: any = null
    let clientIdMatch: string | null = null

    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim()

    const nameParam = searchParams.get('name')
    const normalizedParam = nameParam ? normalize(nameParam) : ''

    // Traemos todos para una búsqueda flexible total
    const q = query(clientsRef)
    const querySnapshot = await getDocs(q)
    
    // Almacenamos posibles matches por DNI numérico
    const candidates: any[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const docId = doc.id.toUpperCase().trim()
      const docIdNumeric = docId.replace(/[^0-9]/g, '')
      
      // Soporte para IDs con sufijo (ej: "48427310_7juw8")
      const docIdPrefix = docId.split('_')[0]
      const docIdPrefixNumeric = docIdPrefix.replace(/[^0-9]/g, '')
      
      // Campo dni explícito (si existe)
      const dbDniField = (data.dni || '').toUpperCase().trim()
      const dbDniFieldNumeric = dbDniField.replace(/[^0-9]/g, '')

      const isMatch = 
        docId === exactDni || 
        docIdPrefix === exactDni ||
        docIdNumeric === numericDni ||
        docIdPrefixNumeric === numericDni ||
        dbDniField === exactDni ||
        dbDniFieldNumeric === numericDni

      if (isMatch) {
        candidates.push({ id: doc.id, ...data })
      }
    })

    if (candidates.length === 0) {
      return NextResponse.json({ exists: false, errorType: 'NOT_FOUND' })
    }

    // Buscamos el mejor candidato comparando el nombre de forma ULTRA FLEXIBLE
    if (normalizedParam) {
      targetClient = candidates.find(c => {
        const dbNameNormalized = normalize(c.name || '')
        // 1. Coincidencia exacta o parcial
        if (dbNameNormalized === normalizedParam) return true
        if (dbNameNormalized.includes(normalizedParam) || normalizedParam.includes(dbNameNormalized)) return true
        
        // 2. Coincidencia por primera palabra (ej: "PEPE" coincide con "PEPE PRUEBA")
        const dbFirstPart = dbNameNormalized.split(' ')[0]
        const paramFirstPart = normalizedParam.split(' ')[0]
        if (dbFirstPart === paramFirstPart && dbFirstPart.length > 2) return true
        
        return false
      })

      if (!targetClient) {
        // Log para depuración interna si vuelve a fallar
        console.warn(`Mismatch detectado: DB[${candidates.map(c => c.name).join(', ')}] vs INPUT[${nameParam}]`)
        return NextResponse.json({ exists: true, errorType: 'NAME_MISMATCH' })
      }
      clientIdMatch = targetClient.id
    } else {
      // Si no hay nombre para validar, cogemos el primero (caso raro)
      targetClient = candidates[0]
      clientIdMatch = targetClient.id
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
