import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import landingData from '@/data/landing-config.json'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Guardar en Prisma (Neon)
    await db.systemConfig.upsert({
      where: { id: 'default' },
      update: { data: data as any },
      create: { 
        id: 'default',
        data: data as any 
      }
    })
    
    return NextResponse.json({ success: true, message: 'Configuración guardada en Base de Datos Única' })
  } catch (error) {
    console.error('Error al guardar en Neon:', error)
    return NextResponse.json(
      { success: false, message: 'Error de servidor al guardar en DB única' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const config = await db.systemConfig.findUnique({
      where: { id: 'default' }
    })
    
    // Si no existe en DB, devolvemos el fallback del JSON local
    if (!config) {
      return NextResponse.json(landingData)
    }
    
    return NextResponse.json(config.data)
  } catch (error) {
    console.error('Error al leer de Neon:', error)
    return NextResponse.json(landingData) // Fallback seguro
  }
}
