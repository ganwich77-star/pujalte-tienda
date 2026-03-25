import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    
    // Referencia a nuestra colección blindada
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    
    // Consulta filtrada según visibilidad o todos para el admin
    let q;
    if (all) {
      q = query(productsRef, orderBy("sortOrder", "asc"));
    } else {
      q = query(productsRef, where("active", "==", true), orderBy("sortOrder", "asc"));
    }
    
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));

    return NextResponse.json(products)
  } catch (error: any) {
    console.error('Error fetching products from Firebase:', error)
    return NextResponse.json({ error: error.message || 'Error al obtener productos de Firebase' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, categoryId, image, hasVariants, variantType, variants, sortOrder } = body
    
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    
    // Objeto base para Firebase
    const productData = {
      name: name || "",
      description: description || "",
      price: parseFloat(String(price)) || 0,
      categoryId: categoryId || "none",
      image: image || null,
      active: true,
      hasVariants: hasVariants || false,
      variantType: variantType || null,
      sortOrder: sortOrder || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      variants: Array.isArray(variants) ? variants.map((v: any, i: number) => ({
        id: `v-${Date.now()}-${i}`,
        name: v.name || "",
        sku: v.sku || "",
        price: parseFloat(String(v.price)) || 0,
        stock: parseInt(String(v.stock)) || 0,
        sortOrder: v.sortOrder !== undefined ? v.sortOrder : i,
        active: true
      })) : []
    };

    const docRef = await addDoc(productsRef, productData);
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...productData,
      createdAt: new Date().toISOString(), // Mock para la respuesta JSON
      updatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error creating product in Firebase:', error)
    return NextResponse.json({ error: 'Error al crear producto en Firebase' }, { status: 500 })
  }
}
