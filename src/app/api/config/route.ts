import { NextRequest, NextResponse } from 'next/server'
import landingData from '@/data/landing-config.json'
import { StoreConfig } from '@/types'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp
} from "firebase/firestore";

const defaultConfig: StoreConfig = {
  ...landingData,
  whatsappNumber: landingData.whatsapp || '34650494728',
  storeName: landingData.nombre || 'Pujalte Fotografía',
  showImages: true,
  currency: 'EUR',
  phone: landingData.telefono || '650494728',
  email: landingData.email || 'hola@pujaltefotografia.es',
  slogan: landingData.slogan || 'POWERED BY PUJALTE CREATIVE STUDIO',
  subtitulo: landingData.subtitulo || 'Más que fotografía, tus mejores recuerdos',
  enableCash: true,
  enableBizum: true,
  enableCard: true,
  formFields: [
    { id: 'name', label: 'Nombre Completo', placeholder: 'Tu nombre...', type: 'text', required: true, active: true },
    { id: 'phone', label: 'Teléfono WhatsApp', placeholder: 'Para contactarte...', type: 'tel', required: true, active: true },
    { id: 'email', label: 'Correo Electrónico', placeholder: 'Tu email...', type: 'email', required: false, active: true },
    { id: 'address', label: 'Dirección de Entrega', placeholder: 'Calle, número, CP...', type: 'textarea', required: false, active: true },
    { id: 'notes', label: 'Notas Adicionales', placeholder: 'Algún detalle extra...', type: 'textarea', required: false, active: true }
  ]
}

export async function GET() {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'default');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return NextResponse.json({ ...defaultConfig, ...docSnap.data() })
    }
    
    return NextResponse.json(defaultConfig)
  } catch (error: any) {
    console.error('Error fetching config from Firebase:', error)
    return NextResponse.json(defaultConfig) // Fallback al default en caso de error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📡 [API/CONFIG] Guardando configuración:', Object.keys(body))
    if (body.promos) console.log('🖼️  [API/CONFIG] Banners detectados:', body.promos.length)
    
    const docRef = doc(db, COLLECTIONS.CONFIG, 'default');
    
    await setDoc(docRef, {
      ...body,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return NextResponse.json({ success: true, ...body })

  } catch (error: any) {
    console.error('Error saving config in Firebase:', error)
    return NextResponse.json({ error: 'Error al guardar configuración en Firebase' }, { status: 500 })
  }
}
