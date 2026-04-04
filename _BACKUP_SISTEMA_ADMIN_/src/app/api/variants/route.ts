import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  arrayUnion,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, name, sku, price, stock, attributes, image, sortOrder } = body
    
    if (!productId) return NextResponse.json({ error: 'ProductId requerido' }, { status: 400 });

    const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    
    const newVariant = {
      id: `v-${Date.now()}`,
      name,
      sku: sku || "",
      price: parseFloat(String(price)) || 0,
      stock: parseInt(String(stock)) || 0,
      attributes: attributes || null,
      image: image || null,
      sortOrder: sortOrder || 0,
      active: true,
      createdAt: new Date().toISOString()
    };

    await updateDoc(productRef, {
      variants: arrayUnion(newVariant),
      updatedAt: serverTimestamp()
    });
    
    return NextResponse.json(newVariant)
  } catch (error: any) {
    console.error('Error creating variant in Firebase:', error)
    return NextResponse.json({ error: 'Error al crear variante en Firebase' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    if (productId) {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const productData = docSnap.data();
        return NextResponse.json(productData.variants || [])
      }
      return NextResponse.json([]);
    }
    
    // Si no hay productId, devolvemos todas las variantes de todos los productos (flatMap)
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    const querySnapshot = await getDocs(productsRef);
    const allVariants = querySnapshot.docs.flatMap(doc => {
      const data = doc.data();
      return (data.variants || []).map((v: any) => ({ ...v, productId: doc.id, productName: data.name }));
    });

    return NextResponse.json(allVariants)
  } catch (error: any) {
    console.error('Error fetching variants from Firebase:', error)
    return NextResponse.json({ error: 'Error al obtener variantes de Firebase' }, { status: 500 })
  }
}
