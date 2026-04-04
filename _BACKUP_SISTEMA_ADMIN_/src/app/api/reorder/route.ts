import { NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  writeBatch,
  doc,
  serverTimestamp
} from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { type, items } = await req.json()

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const batch = writeBatch(db);
    const collectionName = type === 'product' ? COLLECTIONS.PRODUCTS : COLLECTIONS.CATEGORIES;

    items.forEach((item: any) => {
      const docRef = doc(db, collectionName, item.id);
      batch.update(docRef, {
        sortOrder: item.sortOrder || 0,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in reorder API Firestore:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
