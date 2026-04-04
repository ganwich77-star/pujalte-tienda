import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado ningún archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: 'El archivo debe tener al menos una fila de encabezados y una de datos' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    const nameIdx = headers.findIndex(h => h === 'nombre' || h === 'name' || h === 'producto');
    const priceIdx = headers.findIndex(h => h === 'precio' || h === 'price' || h === 'precio_unitario');
    const stockIdx = headers.findIndex(h => h === 'stock' || h === 'cantidad' || h === 'inventario');
    const descIdx = headers.findIndex(h => h === 'descripcion' || h === 'description' || h === 'desc');
    const categoryIdx = headers.findIndex(h => h === 'categoria' || h === 'category' || h === 'categorias');
    const imageIdx = headers.findIndex(h => h === 'imagen' || h === 'image' || h === 'url_imagen');
    const idIdx = headers.findIndex(h => h === 'id' || h === 'codigo' || h === 'sku');

    if (nameIdx === -1 || priceIdx === -1) {
      return NextResponse.json({ 
        error: 'El archivo debe tener columnas para nombre y precio. Columnas detectadas: ' + headers.join(', ')
      }, { status: 400 });
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };
    
    // Obtener todas las categorías existentes para mapear por nombre rápido
    const allCategories = await db.category.findMany();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parser de CSV simple manejando comillas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else current += char;
      }
      values.push(current.trim());

      const name = values[nameIdx]?.replace(/"/g, '');
      const priceStr = values[priceIdx]?.replace(/"/g, '');
      if (!name || !priceStr) continue;

      const price = parseFloat(priceStr.replace(',', '.'));
      if (isNaN(price)) {
        results.errors.push(`Fila ${i + 1}: Precio inválido "${priceStr}"`);
        continue;
      }

      const description = descIdx !== -1 ? values[descIdx]?.replace(/"/g, '') : "";
      const categoryName: string | null = categoryIdx !== -1 ? values[categoryIdx]?.replace(/"/g, '') || null : null;
      const image: string | null = imageIdx !== -1 ? values[imageIdx]?.replace(/"/g, '') || null : null;
      const sku: string | null = idIdx !== -1 ? values[idIdx]?.replace(/"/g, '') || null : null;

      // Buscar o crear categoría en Prisma
      let categoryId: string | null = null;
      if (categoryName) {
        // Normalizamos el nombre para buscar coincidencias
        const normalizedInput = categoryName.trim().toLowerCase();
        let existingCat = allCategories.find(c => c.name.toLowerCase() === normalizedInput);
        
        if (existingCat) {
          categoryId = existingCat.id;
        } else {
          // Si no existe, la creamos (o podrías dejarlo como null si prefieres 'Sin Categoría')
          try {
            const newCat = await db.category.create({
              data: { name: categoryName.trim() }
            });
            categoryId = newCat.id;
            // Actualizamos la lista local para no duplicar en el mismo CSV
            allCategories.push(newCat);
          } catch (e) {
            console.error("Error creating category:", categoryName, e);
          }
        }
      }

      // Buscar si el producto ya existe (por nombre o SKU si tenemos)
      const existingProduct = await db.product.findFirst({
        where: {
          OR: [
            { name: name },
            ...(sku ? [{ id: sku }] : [])
          ]
        }
      });

      const productData: any = {
        name,
        price,
        description,
        image: image || null,
        stock: stockIdx !== -1 ? (parseInt(values[stockIdx]) || 0) : 0,
        categoryId: categoryId,
        active: true,
        showPrice: true
      };

      if (existingProduct) {
        await db.product.update({
          where: { id: existingProduct.id },
          data: productData
        });
        results.updated++;
      } else {
        await db.product.create({
          data: {
            ...productData,
            sortOrder: 0,
            hasVariants: false
          }
        });
        results.created++;
      }
    }

    return NextResponse.json({
      message: 'Archivo procesado correctamente en la base de datos única (Neon).',
      ...results
    });
  } catch (error: any) {
    console.error('Error processing CSV:', error);
    return NextResponse.json({ error: 'Error al procesar el archivo en el servidor: ' + error.message }, { status: 500 });
  }
}
