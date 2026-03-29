import { db } from './src/lib/db'

async function main() {
  try {
    const order = await db.order.create({
      data: {
        customerName: "Test Name",
        customerEmail: "test@example.com",
        customerPhone: "123456789",
        total: 100,
        status: "pending",
        paymentMethod: "cash",
        items: {
          create: [
            {
              productId: "cmdf0l7600000v9", // just need some id ideally, but string works as long as it handles relations no it doesn't map to products! It's just a string in OrderItem
              productName: "Test Product",
              quantity: 1,
              price: 100,
              fileUrl: "https://firebasestorage.googleapis.com/v0/b/asistente-digital-comuniones.firebasestorage.app/o/comuniones2026%2Fuploads%2F1711234567890-my-super-long-file-name.jpg?alt=media&token=8b8e0b23-3b1a-4b9e-9b8a-2b1c3d4e5f6a",
              fileName: "foto.jpg"
            }
          ]
        }
      }
    });
    console.log("Success:", order.id);
  } catch (e: any) {
    console.error("PRISMA ERROR:", e.message);
  }
}

main()
