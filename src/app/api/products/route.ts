import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    const categoryId = searchParams.get('categoryId')
    
    let q = query(collection(db, COLLECTIONS.PRODUCTS), orderBy('sortOrder', 'asc'));
    
    if (!all) {
      q = query(collection(db, COLLECTIONS.PRODUCTS), where('active', '==', true), orderBy('sortOrder', 'asc'));
    }
    
    if (categoryId && categoryId !== 'all') {
      // Note: Firestore might require a composite index if combining filters and orderBy.
      // For simplicity, we'll filter in memory if categoryId is provided and not 'all'
      // Or we can try to add the where clause if simple enough.
    }
    
    const querySnapshot = await getDocs(q);
    let products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (categoryId && categoryId !== 'all') {
      products = products.filter((p: any) => p.categoryId === categoryId);
    }

    // Optional: Fetch categories to mimic Prisma's include if needed by frontend
    // But usually frontend handles category mapping or doesn't strictly need the object if it has categoryId.

    return NextResponse.json(products)
  } catch (error: any) {
    console.error('Error fetching products from Firebase:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, description, price, categoryId, image,
      hasVariants, variantType, variants, sortOrder,
      variantBehavior, isPack, packItems, showPrice
    } = body
    
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
      name: name || "",
      description: description || "",
      price: parseFloat(String(price)) || 0,
      categoryId: categoryId === 'none' ? null : categoryId,
      image: image || null,
      active: true,
      showPrice: showPrice !== undefined ? showPrice : true,
      isPack: isPack || false,
      packItems: isPack ? (typeof packItems === 'string' ? JSON.parse(packItems || '[]') : (packItems || [])) : [],
      hasVariants: hasVariants || false,
      variantType: variantType || null,
      variantBehavior: variantBehavior || 'add',
      sortOrder: sortOrder || 0,
      variants: Array.isArray(variants) ? variants.map((v: any, i: number) => ({
        id: v.id || `v-${Date.now()}-${i}`,
        name: v.name || "",
        sku: v.sku || "",
        price: parseFloat(String(v.price)) || 0,
        stock: parseInt(String(v.stock)) || 0,
        sortOrder: v.sortOrder !== undefined ? v.sortOrder : i,
        active: true,
        createdAt: new Date().toISOString()
      })) : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const newDoc = await getDoc(docRef);
    return NextResponse.json({ id: docRef.id, ...newDoc.data() })
  } catch (error: any) {
    console.error('Error creating product in Firebase:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, variants, ...data } = body

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
    
    // Process data to match expected types
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp()
    };

    if (data.categoryId === 'none') updateData.categoryId = null;
    if (data.price !== undefined) updateData.price = parseFloat(String(data.price));
    if (data.packItems) {
        updateData.packItems = typeof data.packItems === 'string' ? JSON.parse(data.packItems) : data.packItems;
    }

    if (variants) {
      updateData.variants = variants.map((v: any, i: number) => ({
        id: v.id || `v-${Date.now()}-${i}`,
        name: v.name || "",
        sku: v.sku || "",
        price: parseFloat(String(v.price)) || 0,
        stock: parseInt(String(v.stock)) || 0,
        sortOrder: v.sortOrder !== undefined ? v.sortOrder : i,
        active: v.active !== undefined ? v.active : true,
        createdAt: v.createdAt || new Date().toISOString()
      }));
    }

    await updateDoc(docRef, updateData);
    const updatedSnap = await getDoc(docRef);

    return NextResponse.json({ id, ...updatedSnap.data() })
  } catch (error: any) {
    console.error('Error updating product in Firebase:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
    await deleteDoc(docRef);
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product from Firebase:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
