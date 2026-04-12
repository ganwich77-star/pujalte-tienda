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

    // 1. Construir objeto de campos dinámico para soportar actualizaciones parciales
    const allowedFields = [
      'name', 'description', 'image', 'price', 'salePrice', 'stock', 'active', 
      'showPrice', 'isPack', 'hasVariants', 'isNew', 'isFeatured', 'categoryId', 
      'supplierId', 'variantType', 'variantBehavior', 'minQuantity', 'stepQuantity', 
      'tierPricing', 'customOptions', 'packItems', 'fotosIncluidas'
    ];

    const fieldsToUpdate: any = {};
    
    // Mapeo y transformación de campos según el tipo esperado
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        const val = body[key];
        if (['active', 'showPrice', 'isPack', 'hasVariants', 'isNew', 'isFeatured'].includes(key)) {
          fieldsToUpdate[key] = toBool(val);
        } else if (['price', 'salePrice'].includes(key)) {
          fieldsToUpdate[key] = (val === null || val === undefined || val === '') ? null : toNum(val);
        } else if (['stock', 'minQuantity', 'stepQuantity', 'fotosIncluidas'].includes(key)) {
          fieldsToUpdate[key] = parseInt(String(val)) || 0;
        } else if (['tierPricing', 'customOptions', 'packItems'].includes(key)) {
          fieldsToUpdate[key] = typeof val === 'object' ? JSON.stringify(val) : toStr(val);
        } else {
          fieldsToUpdate[key] = toStr(val);
        }
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0 && !body.variants) {
       return NextResponse.json({ success: true, message: "No fields to update" });
    }

    // 2. Ejecutar UPDATE solo si hay campos de producto para actualizar
    if (Object.keys(fieldsToUpdate).length > 0) {
      const keys = Object.keys(fieldsToUpdate);
      const setClause = keys.map(key => `\u0060${key}\u0060 = ?`).join(', ');
      const values = keys.map(key => fieldsToUpdate[key]);
      values.push(id);

      await mysqlDb.query(
        `UPDATE product SET ${setClause} WHERE id = ?`,
        values
      );
    }

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
          `INSERT INTO productvariant (id, productId, name, price, stock, sku, sortOrder) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
