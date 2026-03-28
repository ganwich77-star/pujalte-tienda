import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error fetching product from MySQL:', error)
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Lista de campos permitidos en el esquema Prisma para evitar errores de tipo si el front envía datos extra
    const allowedFields = [
      'name', 'description', 'price', 'categoryId', 'active', 'image', 'stock',
      'hasVariants', 'variantType', 'variantBehavior', 'sortOrder', 'showPrice',
      'isPack', 'packItems', 'isNew', 'salePrice', 'minQuantity', 'stepQuantity', 'tierPricing'
    ];

    const filteredData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'price' || field === 'salePrice') {
           // Gestión de decimales (punto o coma)
           const cleanVal = String(body[field]).replace(',', '.').replace(/[^\d.]/g, '');
           filteredData[field] = parseFloat(cleanVal) || 0;
        } else if (field === 'stock' || field === 'sortOrder' || field === 'minQuantity' || field === 'stepQuantity') {
           filteredData[field] = parseInt(String(body[field])) || 0;
        } else {
           filteredData[field] = body[field];
        }
      }
    });

    const result = await db.$transaction(async (tx) => {
      // Si el producto actualiza variantes de golpe, el manejador general /api/products es el encargado.
      // Aquí manejamos solo la actualización del registro principal.
      return await tx.product.update({
        where: { id },
        data: filteredData
      });
    });
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating product in MySQL:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.product.delete({
      where: { id }
    });
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product from MySQL:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
