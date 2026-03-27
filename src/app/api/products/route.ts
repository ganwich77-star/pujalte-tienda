import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    const categoryId = searchParams.get('categoryId')
    
    const where: any = {}
    if (!all) {
      where.active = true
    }
    
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId
    }
    
    const products = await db.product.findMany({
      where,
      orderBy: {
        sortOrder: 'asc'
      },
      include: {
        variants: {
          where: all ? undefined : { active: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
    
    return NextResponse.json(products)
  } catch (error: any) {
    console.error('ERROR EN API PRODUCTS GET:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ 
      error: 'Error al obtener productos', 
      details: error.message,
      code: error.code 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, description, price, categoryId, image,
      hasVariants, variantType, variants, sortOrder,
      variantBehavior, isPack, packItems, showPrice,
      isNew, salePrice, minQuantity, stepQuantity, tierPricing
    } = body
    
    const product = await db.product.create({
      data: {
        name: name || "",
        description: description || "",
        price: parseFloat(String(price)) || 0,
        salePrice: salePrice ? parseFloat(String(salePrice)) : null,
        isNew: isNew || false,
        categoryId: categoryId === 'none' ? null : categoryId,
        image: image || null,
        active: true,
        showPrice: showPrice !== undefined ? showPrice : true,
        isPack: isPack || false,
        packItems: isPack ? (typeof packItems === 'string' ? packItems : JSON.stringify(packItems || [])) : null,
        hasVariants: hasVariants || false,
        variantType: variantType || null,
        variantBehavior: variantBehavior || 'add',
        sortOrder: sortOrder || 0,
        minQuantity: parseInt(String(minQuantity)) || 1,
        stepQuantity: parseInt(String(stepQuantity)) || 1,
        tierPricing: typeof tierPricing === 'string' ? tierPricing : JSON.stringify(tierPricing || []),
        variants: {
          create: Array.isArray(variants) ? variants.map((v: any, i: number) => ({
            name: v.name || "",
            sku: v.sku || "",
            price: parseFloat(String(v.price)) || 0,
            stock: parseInt(String(v.stock)) || 0,
            sortOrder: v.sortOrder !== undefined ? v.sortOrder : i,
            active: true
          })) : []
        }
      },
      include: {
        variants: true
      }
    });
    
    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error creating product in MySQL:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, variants, ...data } = body

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };

    if (data.categoryId === 'none') updateData.categoryId = null;
    if (data.price !== undefined) updateData.price = parseFloat(String(data.price));
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice ? parseFloat(String(data.salePrice)) : null;
    if (data.isNew !== undefined) updateData.isNew = !!data.isNew;
    if (data.minQuantity !== undefined) updateData.minQuantity = parseInt(String(data.minQuantity)) || 1;
    if (data.stepQuantity !== undefined) updateData.stepQuantity = parseInt(String(data.stepQuantity)) || 1;
    if (data.tierPricing !== undefined) updateData.tierPricing = typeof data.tierPricing === 'string' ? data.tierPricing : JSON.stringify(data.tierPricing);
    
    if (data.packItems) {
        updateData.packItems = typeof data.packItems === 'string' ? data.packItems : JSON.stringify(data.packItems);
    }

    const operations: any = [
      db.product.update({
        where: { id },
        data: updateData
      })
    ];

    if (variants) {
      operations.push(db.productVariant.deleteMany({ where: { productId: id } }));
      operations.push(db.product.update({
        where: { id },
        data: {
          variants: {
            create: variants.map((v: any, i: number) => ({
              name: v.name || "",
              sku: v.sku || "",
              price: parseFloat(String(v.price)) || 0,
              stock: parseInt(String(v.stock)) || 0,
              sortOrder: v.sortOrder !== undefined ? v.sortOrder : i,
              active: v.active !== undefined ? v.active : true
            }))
          }
        }
      }));
    }

    const results = await db.$transaction(operations);
    const updatedProduct = await db.product.findUnique({
      where: { id },
      include: { variants: true }
    });

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error('Error updating product in MySQL:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    await db.product.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product from MySQL:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}

