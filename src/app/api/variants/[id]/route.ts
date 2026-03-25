import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Buscamos en todos los productos quién tiene esta variante
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    const querySnapshot = await getDocs(productsRef);
    
    let foundVariant = null;
    let parentProduct = null;

    for (const d of querySnapshot.docs) {
      const data = d.data() as any;
      const variant = (data.variants || []).find((v: any) => v.id === id);
      if (variant) {
        foundVariant = variant;
        parentProduct = { id: d.id, ...data };
        break;
      }
    }
    
    if (!foundVariant) {
      return NextResponse.json({ error: 'Variante no encontrada en Firebase' }, { status: 404 })
    }
    
    return NextResponse.json({ ...(foundVariant as any), product: parentProduct })
  } catch (error: any) {
    console.error('Error fetching variant from Firebase:', error)
    return NextResponse.json({ error: 'Error al obtener variante de Firebase' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Buscamos el producto que contiene esta variante
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    const querySnapshot = await getDocs(productsRef);
    
    let productDoc: any = null;
    let variants: any[] = [];
    let updatedVariant: any = null;

    for (const d of querySnapshot.docs) {
      const data = d.data() as any;
      const vIndex = (data.variants || []).findIndex((v: any) => v.id === id);
      if (vIndex !== -1) {
        productDoc = d;
        variants = [...(data.variants || [])];
        variants[vIndex] = {
          ...variants[vIndex],
          ...body,
          id, // Preservar ID
          updatedAt: new Date().toISOString()
        };
        updatedVariant = variants[vIndex];
        break;
      }
    }

    if (!productDoc) {
      return NextResponse.json({ error: 'Variante no encontrada para actualizar' }, { status: 404 })
    }

    await updateDoc(productDoc.ref, {
      variants,
      updatedAt: serverTimestamp()
    });
    
    return NextResponse.json(updatedVariant)
  } catch (error: any) {
    console.error('Error updating variant in Firebase:', error)
    return NextResponse.json({ error: 'Error al actualizar variante en Firebase' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    const querySnapshot = await getDocs(productsRef);
    
    let productDoc: any = null;
    let variants: any[] = [];

    for (const d of querySnapshot.docs) {
      const data = d.data();
      const vIndex = (data.variants || []).findIndex((v: any) => v.id === id);
      if (vIndex !== -1) {
        productDoc = d;
        variants = (data.variants || []).filter((v: any) => v.id !== id);
        break;
      }
    }

    if (productDoc) {
      await updateDoc(productDoc.ref, {
        variants,
        updatedAt: serverTimestamp()
      });
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting variant from Firebase:', error)
    return NextResponse.json({ error: 'Error al eliminar variante de Firebase' }, { status: 500 })
  }
}
