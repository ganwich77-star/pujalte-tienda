import { db, mysqlDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Listar productos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || searchParams.get('category');
    const search = searchParams.get('search');
    const isAdmin = searchParams.get('admin') === 'true'; // Nuevo flag para admin

    let sql = `
      SELECT p.*, c.name as categoryName, c.id as categoryId 
      FROM product p 
      LEFT JOIN category c ON p.categoryId = c.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Si no es admin, solo mostrar activos
    if (!isAdmin) {
      sql += ` AND p.active = 1`;
    }

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

    // Obtener variantes
    const productsWithVariants = await Promise.all(products.map(async (p: any) => {
      const [variants]: any = await mysqlDb.query(`SELECT * FROM productvariant WHERE productId = ?`, [p.id]);
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

// POST: Crear producto
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Limpieza de datos antes de enviar a Prisma
    const { variants, category, supplier, categoryName, ...fields } = data;

    const product = await db.product.create({
      data: {
        name: fields.name,
        description: fields.description,
        price: parseFloat(fields.price) || 0,
        image: fields.image,
        stock: parseInt(fields.stock) || 0,
        categoryId: fields.categoryId,
        active: fields.active ?? true,
        showPrice: fields.showPrice ?? true,
        isPack: fields.isPack ?? false,
        hasVariants: fields.hasVariants ?? false,
        variantType: fields.variantType,
        variantBehavior: fields.variantBehavior,
        isNew: fields.isNew ?? false,
        isFeatured: fields.isFeatured ?? false,
        salePrice: fields.salePrice ? parseFloat(fields.salePrice) : null,
        minQuantity: parseInt(fields.minQuantity) || 1,
        stepQuantity: parseInt(fields.stepQuantity) || 1,
        tierPricing: typeof fields.tierPricing === 'object' ? JSON.stringify(fields.tierPricing) : (fields.tierPricing || "[]"),
        supplierId: fields.supplierId || null,
        customOptions: typeof fields.customOptions === 'object' ? JSON.stringify(fields.customOptions) : (fields.customOptions || "[]"),
        variants: {
          create: (variants || []).map((v: any) => ({
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

// PUT: Actualizar producto
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // EXTREMADAMENTE IMPORTANTE: Filtrar campos que NO existen en el modelo de Prisma
    // o que vienen de joins en el GET previo (como categoryName).
    const { 
      id, 
      variants, 
      category, 
      supplier, 
      categoryName, // Viene del JOIN en el GET
      createdAt,    // No lo actualizamos manualmente
      updatedAt,    // Prisma lo maneja solo
      ...fields     // El resto de campos que sí coinciden con el modelo
    } = data;

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const product = await db.product.update({
      where: { id: String(id) },
      data: {
        ...fields,
        price: fields.price !== undefined ? parseFloat(fields.price) : undefined,
        stock: fields.stock !== undefined ? parseInt(fields.stock) : undefined,
        salePrice: (fields.salePrice !== undefined && fields.salePrice !== null) ? parseFloat(fields.salePrice) : (fields.salePrice === null ? null : undefined),
        minQuantity: fields.minQuantity !== undefined ? parseInt(fields.minQuantity) : undefined,
        stepQuantity: fields.stepQuantity !== undefined ? parseInt(fields.stepQuantity) : undefined,
        tierPricing: typeof fields.tierPricing === 'object' ? JSON.stringify(fields.tierPricing) : (fields.tierPricing || undefined),
        customOptions: typeof fields.customOptions === 'object' ? JSON.stringify(fields.customOptions) : (fields.customOptions || undefined),
        variants: variants ? {
          deleteMany: {}, // Simplificamos: borrar todas y recrear (evita problemas de ID)
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
