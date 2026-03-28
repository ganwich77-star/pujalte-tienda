import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Listar productos desde Prisma (Postgres/Neon)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};
    
    if (categoryId && categoryId !== 'all') {
      where.OR = [
        { categoryId: categoryId },
        { category: { name: { contains: categoryId, mode: 'insensitive' } } }
      ];
    }

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        variants: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    // Normalización mínima para el frontend si fuera necesaria
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Prisma GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear producto en Prisma
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const product = await db.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        image: data.image,
        stock: parseInt(data.stock) || 0,
        categoryId: data.categoryId,
        active: data.active ?? true,
        showPrice: data.showPrice ?? true,
        isPack: data.isPack ?? false,
        hasVariants: data.hasVariants ?? false,
        variantType: data.variantType,
        variantBehavior: data.variantBehavior,
        isNew: data.isNew ?? false,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        minQuantity: parseInt(data.minQuantity) || 1,
        stepQuantity: parseInt(data.stepQuantity) || 1,
        tierPricing: typeof data.tierPricing === 'object' ? JSON.stringify(data.tierPricing) : data.tierPricing,
        variants: {
          create: (data.variants || []).map((v: any) => ({
            name: v.name,
            price: parseFloat(v.price),
            stock: parseInt(v.stock) || 0,
            sortOrder: v.sortOrder || 0
          }))
        }
      }
    });
    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Prisma POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar en Prisma
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, variants, category, ...fields } = data;

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const product = await db.product.update({
      where: { id },
      data: {
        ...fields,
        price: fields.price !== undefined ? parseFloat(fields.price) : undefined,
        stock: fields.stock !== undefined ? parseInt(fields.stock) : undefined,
        salePrice: fields.salePrice !== undefined ? parseFloat(fields.salePrice) : undefined,
        tierPricing: typeof fields.tierPricing === 'object' ? JSON.stringify(fields.tierPricing) : fields.tierPricing,
      }
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Prisma PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar en Prisma
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (ids) {
      const idList = ids.split(',');
      await db.product.deleteMany({ where: { id: { in: idList } } });
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db.product.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  } catch (error: any) {
    console.error("Prisma DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
