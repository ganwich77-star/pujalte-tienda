import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('Error fetching categories from MySQL:', error)
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, image, sortOrder } = body
    
    // El modelo Category usa id cuid() por defecto
    const category = await db.category.create({
      data: {
        name: name || "",
        description: description || null,
        image: image || null,
        sortOrder: parseInt(String(sortOrder)) || 0
      }
    });
    
    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error creating category in MySQL:', error)
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, image, sortOrder } = body

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const category = await db.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        image: image !== undefined ? image : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(String(sortOrder)) : undefined
      }
    });

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error updating category in MySQL:', error)
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    // Nota: Si hay productos en la categoría, Prisma dará error si no se maneja
    // pero el esquema permite borrar si categoryId es nulo en el producto.
    await db.category.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting category from MySQL:', error)
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 })
  }
}
