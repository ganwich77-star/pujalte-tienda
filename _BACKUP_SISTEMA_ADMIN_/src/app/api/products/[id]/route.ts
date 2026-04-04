import { db, mysqlDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [products]: any = await mysqlDb.query(
      `SELECT p.*, c.name as categoryName 
       FROM product p 
       LEFT JOIN category c ON p.categoryId = c.id 
       WHERE p.id = ?`, 
      [id]
    );

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [variants]: any = await mysqlDb.query(`SELECT * FROM productvariant WHERE productId = ? ORDER BY sortOrder ASC`, [id]);

    return NextResponse.json({
      ...products[0],
      variants: variants || []
    });
  } catch (error: any) {
    console.error("MySQL GET ID Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const toBool = (val: any) => (val === true || val === 1 || val === 'true') ? 1 : 0;
    const toNum = (val: any) => {
       if (val === undefined || val === null || val === '') return 0;
       return parseFloat(String(val).replace(',', '.')) || 0;
    };
    const toStr = (val: any) => (val === undefined || val === null) ? null : String(val);

    // 1. Construir objeto de campos asegurando valores válidos
    const fields: any = {
      name: toStr(body.name) || "Sin nombre",
      description: toStr(body.description) || "",
      image: toStr(body.image),
      price: toNum(body.price),
      salePrice: (body.salePrice === null || body.salePrice === undefined || body.salePrice === '') ? null : toNum(body.salePrice),
      stock: parseInt(body.stock) || 0,
      active: toBool(body.active),
      showPrice: toBool(body.showPrice),
      isPack: toBool(body.isPack),
      hasVariants: toBool(body.hasVariants),
      isNew: toBool(body.isNew),
      isFeatured: toBool(body.isFeatured),
      categoryId: toStr(body.categoryId),
      supplierId: toStr(body.supplierId),
      variantType: toStr(body.variantType),
      variantBehavior: toStr(body.variantBehavior) || "replace",
      minQuantity: parseInt(body.minQuantity) || 1,
      stepQuantity: parseInt(body.stepQuantity) || 1,
      tierPricing: typeof body.tierPricing === 'object' ? JSON.stringify(body.tierPricing) : (toStr(body.tierPricing) || "[]"),
      customOptions: typeof body.customOptions === 'object' ? JSON.stringify(body.customOptions) : (toStr(body.customOptions) || "[]"),
      packItems: typeof body.packItems === 'object' ? JSON.stringify(body.packItems) : (toStr(body.packItems) || "[]")
    };

    // 2. Limpieza final Anti-Undefined (Bulletproof)
    const keys = Object.keys(fields);
    const setClause = keys.map(key => `\`${key}\` = ?`).join(', ');
    const finalValues = keys.map(key => fields[key] === undefined ? null : fields[key]);
    
    // IMPORTANTE: Asegurar que el ID no sea undefined (Next.js 15 requiere await params)
    finalValues.push(id || body.id);

    await mysqlDb.query(
      `UPDATE product SET ${setClause}, updatedAt = NOW() WHERE id = ?`,
      finalValues.map(v => v === undefined ? null : v)
    );

    // 3. Variantes con limpieza similar
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
    console.error("SQL UPDATE ERROR:", error);
    return NextResponse.json({ error: "Error de servidor: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await mysqlDb.query(`DELETE FROM productvariant WHERE productId = ?`, [id]);
    await mysqlDb.query(`DELETE FROM product WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("MySQL DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
