import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import landingData from '@/data/landing-config.json'
import { StoreConfig } from '@/types'

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
    const config = await db.systemConfig.findUnique({
      where: { id: 'default' }
    })
    
    if (config) {
      return NextResponse.json({ ...defaultConfig, ...(config.data as any) })
    }
    
    return NextResponse.json(defaultConfig)
  } catch (error: any) {
    console.error('Error fetching config from Neon:', error)
    return NextResponse.json(defaultConfig)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    await db.systemConfig.upsert({
      where: { id: 'default' },
      update: { data: body as any },
      create: { 
        id: 'default',
        data: body as any 
      }
    })
    
    return NextResponse.json({ success: true, ...body })
  } catch (error: any) {
    console.error('Error saving config in Neon:', error)
    return NextResponse.json({ error: 'Error al guardar configuración en Neon' }, { status: 500 })
  }
}
