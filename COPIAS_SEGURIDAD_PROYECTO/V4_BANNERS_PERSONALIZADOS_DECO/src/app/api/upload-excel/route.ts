import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  query, 
  where,
  limit,
  serverTimestamp
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado ningún archivo' }, { status: 400 })
    }

    // Read file content
    const buffer = await file.arrayBuffer()
    const text = new TextDecoder().decode(buffer)
    
    // Parse CSV (simple parser for CSV format)
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: 'El archivo debe tener al menos una fila de encabezados y una de datos' }, { status: 400 })
    }

    // Get headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    
    // Find column indices
    const nameIdx = headers.findIndex(h => h === 'nombre' || h === 'name' || h === 'producto')
    const priceIdx = headers.findIndex(h => h === 'precio' || h === 'price' || h === 'precio_unitario')
    const stockIdx = headers.findIndex(h => h === 'stock' || h === 'cantidad' || h === 'inventario')
    const descIdx = headers.findIndex(h => h === 'descripcion' || h === 'description' || h === 'desc')
    const categoryIdx = headers.findIndex(h => h === 'categoria' || h === 'category')
    const imageIdx = headers.findIndex(h => h === 'imagen' || h === 'image' || h === 'url_imagen')
    const idIdx = headers.findIndex(h => h === 'id' || h === 'codigo' || h === 'sku')

    if (nameIdx === -1 || priceIdx === -1) {
      return NextResponse.json({ 
        error: 'El archivo debe tener columnas para nombre y precio. Columnas detectadas: ' + headers.join(', ')
      }, { status: 400 })
    }

    // Parse data rows
    const results = { created: 0, updated: 0, errors: [] as string[] }
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Handle quoted values
      const values: string[] = []
      let current = ''
      let inQuotes = false
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const name = values[nameIdx]?.replace(/"/g, '')
      const priceStr = values[priceIdx]?.replace(/"/g, '')
      
      if (!name || !priceStr) continue

      const price = parseFloat(priceStr.replace(',', '.'))
      if (isNaN(price)) {
        results.errors.push(`Fila ${i + 1}: Precio inválido "${priceStr}"`)
        continue
      }

      const description = descIdx !== -1 ? values[descIdx]?.replace(/"/g, '') : ""
      const categoryName = categoryIdx !== -1 ? values[categoryIdx]?.replace(/"/g, '') : null
      const image = imageIdx !== -1 ? values[imageIdx]?.replace(/"/g, '') : null
      let productIdFromExcel = idIdx !== -1 ? values[idIdx]?.replace(/"/g, '') : null

      // Find or create category in Firebase
      let categoryId = "none"
      if (categoryName) {
        const catQuery = query(collection(db, COLLECTIONS.CATEGORIES), where("name", "==", categoryName), limit(1));
        const catSnap = await getDocs(catQuery);
        
        if (!catSnap.empty) {
          categoryId = catSnap.docs[0].id;
        } else {
          const newCat = await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
            name: categoryName,
            createdAt: serverTimestamp()
          });
          categoryId = newCat.id;
        }
      }

      // Check if product exists in Firebase
      let existingDoc: any = null;
      
      if (productIdFromExcel) {
        const docRef = doc(db, COLLECTIONS.PRODUCTS, productIdFromExcel);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) existingDoc = docSnap;
      }
      
      if (!existingDoc) {
        const pQuery = query(collection(db, COLLECTIONS.PRODUCTS), where("name", "==", name), limit(1));
        const pSnap = await getDocs(pQuery);
        if (!pSnap.empty) existingDoc = pSnap.docs[0];
      }

      const productData: any = {
        name,
        price,
        description,
        image,
        categoryId,
        updatedAt: serverTimestamp(),
        active: true
      };

      if (existingDoc) {
        // Actualizar usando la referencia del documento encontrado
        await setDoc(existingDoc.ref, productData, { merge: true });
        results.updated++
      } else {
        // Crear nuevo
        productData.createdAt = serverTimestamp();
        productData.sortOrder = 0;
        productData.hasVariants = false;
        productData.variants = [];
        
        if (productIdFromExcel) {
          await setDoc(doc(db, COLLECTIONS.PRODUCTS, productIdFromExcel), productData);
        } else {
          await addDoc(collection(db, COLLECTIONS.PRODUCTS), productData);
        }
        results.created++
      }
    }

    return NextResponse.json({
      message: 'Archivo procesado correctamente en Firebase',
      ...results
    })
  } catch (error: any) {
    console.error('Error processing Excel in Firebase:', error)
    return NextResponse.json({ error: 'Error al procesar el archivo en Firebase' }, { status: 500 })
  }
}

// Helper to use getDoc inside POST
import { getDoc } from "firebase/firestore";
