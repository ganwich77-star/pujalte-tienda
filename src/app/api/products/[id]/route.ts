import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Producto no encontrado en Firebase' }, { status: 404 })
    }
    
    return NextResponse.json({ id: docSnap.id, ...docSnap.data() })
  } catch (error: any) {
    console.error('Error fetching product from Firebase:', error)
    return NextResponse.json({ error: 'Error al obtener producto de Firebase' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, price, categoryId, image, active, hasVariants, variantType, sortOrder, variants } = body
    
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
    
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(String(price));
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (image !== undefined) updateData.image = image;
    if (active !== undefined) updateData.active = active;
    if (hasVariants !== undefined) updateData.hasVariants = hasVariants;
    if (variantType !== undefined) updateData.variantType = variantType;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(String(sortOrder));
    if (variants !== undefined) updateData.variants = variants;

    await updateDoc(docRef, updateData);
    
    return NextResponse.json({ id, ...updateData })
  } catch (error: any) {
    console.error('Error updating product in Firebase:', error)
    return NextResponse.json({ error: 'Error al actualizar producto en Firebase' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
    
    await deleteDoc(docRef);
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product from Firebase:', error)
    return NextResponse.json({ error: 'Error al eliminar producto de Firebase' }, { status: 500 })
  }
}
