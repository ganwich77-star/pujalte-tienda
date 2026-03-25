import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  getCountFromServer,
  serverTimestamp
} from "firebase/firestore";

export async function GET() {
  try {
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const q = query(categoriesRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('Error fetching categories from Firebase:', error)
    return NextResponse.json({ error: 'Error al obtener categorías de Firebase' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, image } = body
    
    if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const newCategory = {
      name,
      description: description || "",
      image: image || null,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(categoriesRef, newCategory);
    
    return NextResponse.json({ id: docRef.id, ...newCategory })
  } catch (error: any) {
    console.error('Error creating category in Firebase:', error)
    return NextResponse.json({ error: 'Error al crear categoría en Firebase' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, image } = body
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;

    await updateDoc(docRef, updateData);
    
    return NextResponse.json({ id, ...updateData })
  } catch (error: any) {
    console.error('Error updating category in Firebase:', error)
    return NextResponse.json({ error: 'Error al actualizar categoría en Firebase' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    /* Se permite eliminar incluso con productos, quedarán huérfanos según el aviso del admin */
    const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
    await deleteDoc(docRef);
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting category from Firebase:', error)
    return NextResponse.json({ error: 'Error al eliminar categoría de Firebase' }, { status: 500 })
  }
}
