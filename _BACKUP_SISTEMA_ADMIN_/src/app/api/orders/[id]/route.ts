import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, paymentStatus } = body
    
    const docRef = doc(db, COLLECTIONS.ORDERS, id);
    
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

    await updateDoc(docRef, updateData);
    
    return NextResponse.json({ id, ...updateData })
  } catch (error: any) {
    console.error('Error updating order in Firebase:', error)
    return NextResponse.json({ error: 'Error al actualizar pedido en Firebase' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const docRef = doc(db, COLLECTIONS.ORDERS, id);
    
    await deleteDoc(docRef);
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting order from Firebase:', error)
    return NextResponse.json({ error: 'Error al eliminar pedido de Firebase' }, { status: 500 })
  }
}
