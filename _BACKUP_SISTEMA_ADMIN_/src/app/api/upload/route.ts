import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Creamos un nombre único y lo metemos en una carpeta propia en Firebase Storage
    const cleanName = (file.name || 'foto.jpg').replace(/\s+/g, '-');
    const filename = `${Date.now()}-${cleanName}`;
    const storageRef = ref(storage, `comuniones2026/uploads/${filename}`);

    // Subimos el archivo directamente a Firebase
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    // Obtenemos la URL pública definitiva
    const downloadURL = await getDownloadURL(storageRef);

    return NextResponse.json({ 
      url: downloadURL,
      success: true 
    });
  } catch (error: any) {
    console.error('Error en upload a Firebase Storage:', error);
    return NextResponse.json({ error: 'Error al subir el archivo a la nube' }, { status: 500 });
  }
}
