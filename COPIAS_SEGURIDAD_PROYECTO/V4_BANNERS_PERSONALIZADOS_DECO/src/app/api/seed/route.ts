import { NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  doc, 
  setDoc, 
  serverTimestamp
} from "firebase/firestore";

export async function GET() {
  try {
    // 1. Crear categorías
    const categories = [
      { id: 'cat-cuadros', name: 'Cuadros', description: 'Arte y decoración' },
      { id: 'cat-ropa', name: 'Ropa', description: 'Prendas de vestir' },
      { id: 'cat-accesorios', name: 'Accesorios', description: 'Complementos y accesorios' },
      { id: 'cat-impresiones', name: 'Impresiones', description: 'Posters y láminas' }
    ];

    for (const cat of categories) {
      await setDoc(doc(db, COLLECTIONS.CATEGORIES, cat.id), {
        ...cat,
        createdAt: serverTimestamp()
      }, { merge: true });
    }

    // 2. Crear productos con variantes (embebidas)
    const productsData = [
      {
        id: 'prod-cuadro-1',
        name: 'Cuadro Atardecer',
        description: 'Hermosa pintura al óleo de un atardecer sobre el mar.',
        price: 49.99,
        categoryId: 'cat-cuadros',
        image: '/products/cuadro-atardecer.png',
        hasVariants: true,
        variantType: 'Tamaño',
        active: true,
        sortOrder: 0,
        variants: [
          { id: 'v1', name: 'Pequeño (30x40cm)', price: 29.99, stock: 20, sortOrder: 1, active: true },
          { id: 'v2', name: 'Mediano (50x70cm)', price: 49.99, stock: 15, sortOrder: 2, active: true },
          { id: 'v3', name: 'Grande (70x100cm)', price: 79.99, stock: 10, sortOrder: 3, active: true }
        ]
      },
      {
        id: 'prod-poster-1',
        name: 'Poster Minimalista',
        description: 'Diseño minimalista perfecto para espacios modernos.',
        price: 15.99,
        categoryId: 'cat-impresiones',
        image: '/products/poster-minimal.png',
        hasVariants: true,
        variantType: 'Tamaño',
        active: true,
        sortOrder: 1,
        variants: [
          { id: 'v4', name: 'A4 (21x30cm)', price: 12.99, stock: 30, sortOrder: 1, active: true },
          { id: 'v5', name: 'A3 (30x42cm)', price: 18.99, stock: 25, sortOrder: 2, active: true }
        ]
      },
      {
        id: 'prod-lamina-1',
        name: 'Lámina Botánica',
        description: 'Hermosa lámina con ilustración botánica.',
        price: 9.99,
        categoryId: 'cat-impresiones',
        image: '/products/lamina-botanica.png',
        hasVariants: false,
        active: true,
        sortOrder: 2,
        variants: []
      }
    ];

    for (const prod of productsData) {
      await setDoc(doc(db, COLLECTIONS.PRODUCTS, prod.id), {
        ...prod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return NextResponse.json({
      message: 'Datos de demostración creados en Firebase exitosamente',
      categories: categories.length,
      products: productsData.length
    })
  } catch (error: any) {
    console.error('Error seeding Firebase:', error)
    return NextResponse.json({ error: 'Error al crear datos de demostración en Firebase' }, { status: 500 })
  }
}
