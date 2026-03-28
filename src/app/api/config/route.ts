import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import landingData from '@/data/landing-config.json'
import { StoreConfig } from '@/types'

// Cliente singleton local con timeout agresivo
const prisma = new PrismaClient()

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
    // Intento 1: SQL Directo (Raw) - Supervivencia ante fallos de Prisma
    try {
      const result: any[] = await prisma.$queryRawUnsafe("SELECT data FROM systemconfig WHERE id = 'default' LIMIT 1")
      if (result && result.length > 0) {
        const rawData = result[0].data
        // Aseguramos que devolvemos un objeto, no un string
        const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
        return NextResponse.json({ ...defaultConfig, ...parsedData })
      }
    } catch (rawError: any) {
      console.error('❌ Error Raw SQL en GET:', rawError.message)
    }
    
    return NextResponse.json(defaultConfig)
  } catch (error: any) {
    return NextResponse.json(defaultConfig)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body) return NextResponse.json({ error: 'Datos vacíos' }, { status: 400 })

    const jsonString = JSON.stringify(body)

    console.log('Guardando en Neon vía Raw SQL...')

    // Intento de guardado vía SQL directísimo: "UPSERT" manual
    try {
      // Intentamos actualizar
      const count = await prisma.$executeRawUnsafe(
        `UPDATE systemconfig SET data = $1::jsonb, "updatedAt" = NOW() WHERE id = 'default'`,
        jsonString
      )

      if (count === 0) {
        // Si no existe, creamos
        await prisma.$executeRawUnsafe(
          `INSERT INTO systemconfig (id, data, "updatedAt") VALUES ('default', $1::jsonb, NOW())`,
          jsonString
        )
      }

      console.log('✅ Guardado con éxito vía Raw SQL.')
      return NextResponse.json({ success: true })
    } catch (sqlError: any) {
      console.error('Error detallado Raw SQL:', sqlError.message)
      return NextResponse.json({ 
        error: 'Fallo Crítico Neon', 
        details: `SQL Error: ${sqlError.message}` 
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error', details: error.message }, { status: 500 })
  }
}
