import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

export async function GET() {
  try {
    const q = query(collection(db, COLLECTIONS.CATEGORIES), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('Error fetching categories from Firebase:', error)
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, active, order } = body
    
    const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
      name: name || "",
      slug: slug || "",
      active: active !== undefined ? active : true,
      order: order || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const newDoc = await getDoc(docRef);
    return NextResponse.json({ id: docRef.id, ...newDoc.data() })
  } catch (error: any) {
    console.error('Error creating category in Firebase:', error)
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    const updatedSnap = await getDoc(docRef);
    return NextResponse.json({ id, ...updatedSnap.data() })
  } catch (error: any) {
    console.error('Error updating category in Firebase:', error)
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
    await deleteDoc(docRef);
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting category from Firebase:', error)
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 })
  }
}
