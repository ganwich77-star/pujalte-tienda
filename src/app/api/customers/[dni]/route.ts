import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { dni: string } }
) {
  try {
    const { dni } = params

    if (!dni) {
      return NextResponse.json({ error: 'DNI requerido' }, { status: 400 })
    }

    // Buscamos en la tabla Client (MySQL)
    const client = await db.client.findFirst({
      where: {
        OR: [
          { dni: dni.toUpperCase() },
          { id: dni } // A veces el ID es el slug de la galería
        ]
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Mapeamos los campos para que coincidan con lo que espera el frontend (shippingData)
    // Intentamos separar nombre y apellidos si vienen juntos en 'name'
    const nameParts = client.name.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return NextResponse.json({
      id: client.id,
      firstName: firstName,
      lastName: lastName,
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: '', // No solemos guardarla en Client, pero la devolvemos vacía
      dni: client.dni || dni.toUpperCase()
    })

  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
