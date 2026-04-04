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
    const toStr = (val: any) => (val === undefined || val === null) ? null : String(val);

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

    const toBool = (val: any) => (val === true || val === 1 || val === 'true') ? 1 : 0;
    const toNum = (val: any) => (val === undefined || val === null || val === '') ? 0 : parseFloat(String(val).replace(',', '.')) || 0;
    const toStr = (val: any) => (val === undefined || val === null) ? null : String(val);

    const f: any = {};
    if (body.name !== undefined) f.name = toStr(body.name);
    if (body.description !== undefined) f.description = toStr(body.description);
    if (body.price !== undefined) f.price = toNum(body.price);
    if (body.salePrice !== undefined) f.salePrice = (body.salePrice === null || body.salePrice === undefined || body.salePrice === '') ? null : toNum(body.salePrice);
    if (body.image) f.image = toStr(body.image);
    if (body.src) f.src = toStr(body.src);
    if (body.stock !== undefined) f.stock = parseInt(String(body.stock)) || 0;
    if (body.active !== undefined) f.active = toBool(body.active);
    if (body.showPrice !== undefined) f.showPrice = toBool(body.showPrice);
    if (body.isPack !== undefined) f.isPack = toBool(body.isPack);
    if (body.hasVariants !== undefined) f.hasVariants = toBool(body.hasVariants);
    if (body.isNew !== undefined) f.isNew = toBool(body.isNew);
    if (body.isFeatured !== undefined) f.isFeatured = toBool(body.isFeatured);
    if (body.categoryId !== undefined) f.categoryId = toStr(body.categoryId);
    if (body.supplierId !== undefined) f.supplierId = toStr(body.supplierId);
    if (body.variantType !== undefined) f.variantType = toStr(body.variantType);
    if (body.variantBehavior !== undefined) f.variantBehavior = toStr(body.variantBehavior);
    if (body.minQuantity !== undefined) f.minQuantity = parseInt(body.minQuantity) || 1;
    if (body.stepQuantity !== undefined) f.stepQuantity = parseInt(body.stepQuantity) || 1;
    if (body.tierPricing !== undefined) f.tierPricing = typeof body.tierPricing === 'object' ? JSON.stringify(body.tierPricing) : (toStr(body.tierPricing) || "[]");
    if (body.customOptions !== undefined) f.customOptions = typeof body.customOptions === 'object' ? JSON.stringify(body.customOptions) : (toStr(body.customOptions) || "[]");
    if (body.packItems !== undefined) f.packItems = Array.isArray(body.packItems) ? JSON.stringify(body.packItems) : (toStr(body.packItems) || "[]");
    if (body.fotosIncluidas !== undefined && body.fotosIncluidas !== null && body.fotosIncluidas !== '') {
      f.fotosIncluidas = Math.max(1, parseInt(String(body.fotosIncluidas)) || 1);
    }

    const keys = Object.keys(f);
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    const finalValues = keys.map(k => f[k] === undefined ? null : f[k]);
    finalValues.push(id);

    if (keys.length > 0) {
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
