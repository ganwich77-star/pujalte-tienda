import { db, mysqlDb } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Listar productos (Ya usa MySQL)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || searchParams.get('category');
    const search = searchParams.get('search');
    const isAdmin = searchParams.get('admin') === 'true';

    const where: any = {};
    
    if (!isAdmin) {
      where.active = true;
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true }
        },
        supplier: {
          select: { id: true, name: true }
        },
        variants: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Prisma GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear producto via SQL Directo
export async function POST(request: Request) {
  const logPath = '/Users/pujaltefotografia/Desktop/DESARROLLO APP Y WEB/LANDING PUJALTE BASECODE/my-project/debug_api.log';
  try {
    const body = await request.json();
    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] POST START - Prisma Mode\n`);
    
    // Generar ID si no viene
    const id = body.id || Math.random().toString(36).substring(2, 15);

    const toBool = (val: any) => (val === true || val === 1 || val === 'true');
    const toNum = (val: any) => (val === undefined || val === null || val === '') ? 0 : parseFloat(String(val).replace(',', '.')) || 0;
    const toStr = (val: any) => (val === undefined || val === null || val === 'none' || val === '') ? null : String(val);

    const product = await db.product.create({
      data: {
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
        variantType: toStr(body.variantType),
        variantBehavior: toStr(body.variantBehavior) || "replace",
        minQuantity: parseInt(body.minQuantity) || 1,
        stepQuantity: parseInt(body.stepQuantity) || 1,
        tierPricing: typeof body.tierPricing === 'object' ? JSON.stringify(body.tierPricing) : (toStr(body.tierPricing) || "[]"),
        customOptions: typeof body.customOptions === 'object' ? JSON.stringify(body.customOptions) : (toStr(body.customOptions) || "[]"),
        packItems: Array.isArray(body.packItems) ? JSON.stringify(body.packItems) : (toStr(body.packItems) || "[]"),
        fotosIncluidas: body.fotosIncluidas !== undefined ? Math.max(0, parseInt(String(body.fotosIncluidas)) || 0) : 1,
        variants: {
          create: (body.variants || []).filter((v: any) => v.name || v.price !== undefined).map((v: any) => ({
            id: Math.random().toString(36).substring(2, 12),
            name: toStr(v.name) || "",
            price: toNum(v.price),
            stock: parseInt(v.stock) || 0,
            sku: (v.sku && String(v.sku).trim() !== '') ? String(v.sku) : null,
            sortOrder: parseInt(v.sortOrder) || 0
          }))
        }
      }
    });

    return NextResponse.json({ success: true, id: product.id });
  } catch (error: any) {
    console.error("Prisma POST Error:", error);
    fs.appendFileSync(logPath, `POST Error: ${error.message}\n`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar producto via SQL Directo
export async function PUT(request: Request) {
  const logPath = '/Users/pujaltefotografia/Desktop/DESARROLLO APP Y WEB/LANDING PUJALTE BASECODE/my-project/debug_api.log';
  try {
    const body = await request.json();
    const id = body.id;
    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] PUT START - ID: ${id} - Prisma Mode\n`);
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const toBool = (val: any) => (val === true || val === 1 || val === 'true');
    const toNum = (val: any) => (val === undefined || val === null || val === '') ? 0 : parseFloat(String(val).replace(',', '.')) || 0;
    const toStr = (val: any) => (val === undefined || val === null || val === 'none' || val === '') ? null : String(val);

    const updateData: any = {};
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
          updateData[key] = toBool(val);
        } else if (['price', 'salePrice'].includes(key)) {
          updateData[key] = (val === null || val === undefined || val === '') ? null : toNum(val);
        } else if (['stock', 'minQuantity', 'stepQuantity', 'fotosIncluidas'].includes(key)) {
          updateData[key] = parseInt(String(val)) || 0;
        } else if (['tierPricing', 'customOptions', 'packItems'].includes(key)) {
          updateData[key] = typeof val === 'object' ? JSON.stringify(val) : (toStr(val) || "[]");
        } else {
          updateData[key] = toStr(val);
        }
      }
    }

    fs.appendFileSync(logPath, `Fields processed. Variants incoming: ${body.variants ? body.variants.length : 'none'}\n`);

    // Gestionar variantes (borrar y crear para simplificar como hacíamos antes)
    if (body.variants !== undefined) {
      fs.appendFileSync(logPath, `Deleting variants for product: ${id}\n`);
      await db.productVariant.deleteMany({ where: { productId: id } });
      fs.appendFileSync(logPath, `Variants deleted.\n`);
      if (Array.isArray(body.variants)) {
        updateData.variants = {
          create: body.variants.filter((v: any) => v.name || v.price !== undefined).map((v: any) => ({
            id: Math.random().toString(36).substring(2, 12),
            name: toStr(v.name) || "",
            price: toNum(v.price),
            stock: parseInt(v.stock) || 0,
            sku: (v.sku && String(v.sku).trim() !== '') ? String(v.sku) : null,
            sortOrder: parseInt(v.sortOrder) || 0
          }))
        };
      }
    }

    fs.appendFileSync(logPath, `UpdateData: ${JSON.stringify(updateData)}\n`);

    const result = await db.product.update({
      where: { id },
      data: updateData
    });

    fs.appendFileSync(logPath, `[${new Date().toISOString()}] PUT SUCCESS - Updated ID: ${result.id}\n`);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Prisma PUT Error:", error);
    fs.appendFileSync(logPath, `PUT Error: ${error.message}\n`);
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
