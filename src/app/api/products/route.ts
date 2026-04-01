import { db, mysqlDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Listar productos desde MySQL Directo (Hostinger)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || searchParams.get('category');
    const search = searchParams.get('search');

    let sql = `
      SELECT p.*, c.name as categoryName, c.id as categoryId 
      FROM product p 
      LEFT JOIN category c ON p.categoryId = c.id 
      WHERE p.active = 1
    `;
    const params: any[] = [];

    if (categoryId && categoryId !== 'all') {
      sql += ` AND (p.categoryId = ? OR c.name LIKE ?)`;
      params.push(categoryId, `%${categoryId}%`);
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY p.name ASC`;

    const [products]: any = await mysqlDb.query(sql, params);

    // Obtener variantes para cada producto
    const productsWithVariants = await Promise.all(products.map(async (p: any) => {
      const [variants]: any = await mysqlDb.query(`SELECT * FROM productvariant WHERE productId = ? AND active = 1`, [p.id]);
      return {
        ...p,
        category: p.categoryId ? { id: p.categoryId, name: p.categoryName } : null,
        variants: variants || []
      };
    }));

    return NextResponse.json(productsWithVariants);
  } catch (error: any) {
    console.error("MySQL GET Error:", error);
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
        price: parseFloat(data.price) || 0,
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
        supplierId: data.supplierId || null,
        customOptions: typeof data.customOptions === 'object' ? JSON.stringify(data.customOptions) : data.customOptions,
        variants: {
          create: (data.variants || []).map((v: any) => ({
            name: v.name,
            price: parseFloat(v.price) || 0,
            stock: parseInt(v.stock) || 0,
            sortOrder: v.sortOrder || 0,
            sku: v.sku || null
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
    // Extraemos ID y otros campos que NO deben ir en el update principal o necesitan trato especial
    const { id, variants, category, supplier, ...fields } = data;

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const product = await db.product.update({
      where: { id },
      data: {
        ...fields,
        price: fields.price !== undefined ? parseFloat(fields.price) : undefined,
        stock: fields.stock !== undefined ? parseInt(fields.stock) : undefined,
        salePrice: (fields.salePrice !== undefined && fields.salePrice !== null) ? parseFloat(fields.salePrice) : (fields.salePrice === null ? null : undefined),
        minQuantity: fields.minQuantity !== undefined ? parseInt(fields.minQuantity) : undefined,
        stepQuantity: fields.stepQuantity !== undefined ? parseInt(fields.stepQuantity) : undefined,
        tierPricing: typeof fields.tierPricing === 'object' ? JSON.stringify(fields.tierPricing) : fields.tierPricing,
        customOptions: typeof fields.customOptions === 'object' ? JSON.stringify(fields.customOptions) : fields.customOptions,
        variants: variants ? {
          deleteMany: {},
          create: variants.map((v: any) => ({
            name: v.name,
            price: parseFloat(v.price) || 0,
            stock: parseInt(v.stock) || 0,
            sortOrder: v.sortOrder || 0,
            sku: v.sku || null
          }))
        } : undefined
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
