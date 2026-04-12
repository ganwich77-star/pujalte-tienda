import { db, mysqlDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Listar productos (Ya usa MySQL)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || searchParams.get('category');
    const search = searchParams.get('search');
    const isAdmin = searchParams.get('admin') === 'true';

    let sql = `
      SELECT p.*, c.name as categoryName, c.id as categoryId 
      FROM product p 
      LEFT JOIN category c ON p.categoryId = c.id 
      WHERE 1=1
    `;
    const params: any[] = [];

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

    const productsWithVariants = await Promise.all(products.map(async (p: any) => {
      const [variants]: any = await mysqlDb.query(`SELECT * FROM productvariant WHERE productId = ? ORDER BY sortOrder ASC`, [p.id]);
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

// POST: Crear producto via SQL Directo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = Math.random().toString(36).substring(2, 15);

    const toBool = (val: any) => (val === true || val === 1 || val === 'true') ? 1 : 0;
    const toNum = (val: any) => (val === undefined || val === null || val === '') ? 0 : parseFloat(String(val).replace(',', '.')) || 0;
    const toStr = (val: any) => (val === undefined || val === null || val === 'none' || val === '') ? null : String(val);

    const fieldsToInsert: any = {
      id,
      name: toStr(body.name) || "Producto nuevo",
      description: toStr(body.description) || "",
      price: toNum(body.price),
      salePrice: (body.salePrice === null || body.salePrice === undefined || body.salePrice === '') ? null : toNum(body.salePrice),
      image: toStr(body.image),
      stock: parseInt(body.stock) || 0,
      active: toBool(body.active),
      showPrice: toBool(body.showPrice),
      isPack: toBool(body.isPack),
      hasVariants: toBool(body.hasVariants),
      isNew: toBool(body.isNew),
      isFeatured: toBool(body.isFeatured),
      categoryId: toStr(body.categoryId),
      supplierId: toStr(body.supplierId),
      variantType: toStr(body.variantType) || "",
      variantBehavior: toStr(body.variantBehavior) || "replace",
      minQuantity: parseInt(body.minQuantity) || 1,
      stepQuantity: parseInt(body.stepQuantity) || 1,
      tierPricing: typeof body.tierPricing === 'object' ? JSON.stringify(body.tierPricing) : (toStr(body.tierPricing) || "[]"),
      customOptions: typeof body.customOptions === 'object' ? JSON.stringify(body.customOptions) : (toStr(body.customOptions) || "[]"),
      packItems: Array.isArray(body.packItems) ? JSON.stringify(body.packItems) : (toStr(body.packItems) || "[]"),
      fotosIncluidas: body.fotosIncluidas !== undefined ? Math.max(0, parseInt(String(body.fotosIncluidas)) || 0) : 1
    };

    const keysArr = Object.keys(fieldsToInsert);
    const keysNames = keysArr.map(k => `\`${k}\``).join(', ');
    const placeholders = keysArr.map(() => '?').join(', ');
    const finalValues = keysArr.map(k => fieldsToInsert[k] === undefined ? null : fieldsToInsert[k]);

    await mysqlDb.query(
      `INSERT INTO product (${keysNames}, createdAt, updatedAt) VALUES (${placeholders}, NOW(), NOW())`,
      finalValues
    );

    // Insertar variantes
    if (body.variants && Array.isArray(body.variants)) {
      for (const v of body.variants) {
        if (!v.name && v.price === undefined) continue;
        
        const vParams = [
          Math.random().toString(36).substring(2, 12),
          id,
          toStr(v.name) || "",
          toNum(v.price),
          parseInt(v.stock) || 0,
          (v.sku && String(v.sku).trim() !== '') ? String(v.sku) : null,
          parseInt(v.sortOrder) || 0
        ].map(p => p === undefined ? null : p);

        await mysqlDb.query(
          `INSERT INTO productvariant (id, productId, name, price, stock, sku, sortOrder, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          vParams
        );
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("SQL POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar producto via SQL Directo
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const f: any = {};
    const toBool = (val: any) => (val === true || val === 1 || val === 'true') ? 1 : 0;
    const toNum = (val: any) => (val === undefined || val === null || val === '') ? 0 : parseFloat(String(val).replace(',', '.')) || 0;
    const toStr = (val: any) => (val === undefined || val === null || val === 'none' || val === '') ? null : String(val);

    const allowedFields = [
      'name', 'description', 'image', 'price', 'salePrice', 'stock', 'active', 
      'showPrice', 'isPack', 'hasVariants', 'isNew', 'isFeatured', 'categoryId', 
      'supplierId', 'variantType', 'variantBehavior', 'minQuantity', 'stepQuantity', 
      'tierPricing', 'customOptions', 'packItems', 'fotosIncluidas'
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        const val = body[key];
        if (['active', 'showPrice', 'isPack', 'hasVariants', 'isNew', 'isFeatured'].includes(key)) {
          f[key] = toBool(val);
        } else if (['price', 'salePrice'].includes(key)) {
          f[key] = (val === null || val === undefined || val === '') ? null : toNum(val);
        } else if (['stock', 'minQuantity', 'stepQuantity', 'fotosIncluidas'].includes(key)) {
          f[key] = parseInt(String(val)) || 0;
        } else if (['tierPricing', 'customOptions', 'packItems'].includes(key)) {
          f[key] = typeof val === 'object' ? JSON.stringify(val) : (toStr(val) || "[]");
        } else {
          f[key] = toStr(val);
        }
      }
    }

    const keys = Object.keys(f);
    if (keys.length > 0) {
      const setClause = keys.map(k => `\u0060${k}\u0060 = ?`).join(', ');
      const finalValues = keys.map(k => f[k]);
      finalValues.push(id);
      await mysqlDb.query(`UPDATE product SET ${setClause}, updatedAt = NOW() WHERE id = ?`, finalValues);
    }

    // Variantes
    if (body.variants && Array.isArray(body.variants)) {
      await mysqlDb.query(`DELETE FROM productvariant WHERE productId = ?`, [id]);
      for (const v of body.variants) {
        if (!v.name && v.price === undefined) continue;
        
        const vParams = [
          Math.random().toString(36).substring(2, 12),
          id,
          toStr(v.name) || "",
          toNum(v.price),
          parseInt(v.stock) || 0,
          (v.sku && String(v.sku).trim() !== '') ? String(v.sku) : null,
          parseInt(v.sortOrder) || 0
        ].map(p => p === undefined ? null : p);

        await mysqlDb.query(
          `INSERT INTO productvariant (id, productId, name, price, stock, sku, sortOrder, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          vParams
        );
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("SQL PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar via SQL Directo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (ids) {
      const idList = ids.split(',');
      for (const currentId of idList) {
        await mysqlDb.query(`DELETE FROM productvariant WHERE productId = ?`, [currentId]);
        await mysqlDb.query(`DELETE FROM product WHERE id = ?`, [currentId]);
      }
      return NextResponse.json({ success: true });
    }

    if (id) {
      await mysqlDb.query(`DELETE FROM productvariant WHERE productId = ?`, [id]);
      await mysqlDb.query(`DELETE FROM product WHERE id = ?`, [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  } catch (error: any) {
    console.error("SQL DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
