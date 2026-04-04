import { db } from "@/lib/db"; // v2-forced-recompilation
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!(db as any).supplier) {
      console.warn("DEBUG - db.supplier is undefined in GET");
      return NextResponse.json([]);
    }
    const suppliers = await db.supplier.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("GET Suppliers Error:", error);
    return NextResponse.json([], { status: 500 }); // Retorna array vacío en error
  }
}

export async function POST(request: Request) {
  let data;
  try {
    data = await request.json();
    console.log("DEBUG - Prisma Models available in API:", Object.keys(db).filter(k => !k.startsWith("_")));
    
    if (!(db as any).supplier) {
      throw new Error("El modelo 'supplier' no está inicializado en Prisma.");
    }

    const supplier = await db.supplier.create({
      data: {
        name: data.name,
        url: data.url,
        contactName: data.contactName,
        phone: data.phone
      }
    });
    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("POST Supplier Error Details:", {
      message: error.message,
      stack: error.stack,
      data
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, _count, ...fields } = data; // Destructuramos _count para no enviarlo a Prisma
    
    if (!(db as any).supplier) {
      throw new Error("El modelo 'supplier' no está inicializado en Prisma.");
    }

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const supplier = await db.supplier.update({
      where: { id },
      data: fields
    });
    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("PUT Supplier Error Details:", {
      message: error.message,
      stack: error.stack,
      data: (request as any).jsonBody // we can't easily re-read it here without careful handling
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!(db as any).supplier) {
      throw new Error("El modelo 'supplier' no está inicializado en Prisma.");
    }

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    
    await db.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Supplier Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
