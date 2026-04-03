import { db } from './src/lib/db'

async function testOrder() {
  console.log('🚀 [TEST] Intentando crear pedido de prueba...')
  try {
    const order = await db.order.create({
      data: {
        customerName: 'Pepe Test Mágico',
        customerPhone: '600000000',
        customerEmail: 'pepe@pujaltefotografia.es',
        total: 1.0,
        status: 'pending',
        paymentMethod: 'Cash',
        clientId: 'alicia-en-el-pais-de-las-maravillas'
      }
    })
    console.log('✅ [TEST] ¡PEDIDO CREADO CON ÉXITO! ID:', order.id)
  } catch (err) {
    console.error('❌ [TEST] ERROR AL CREAR PEDIDO:', err)
  } finally {
    process.exit()
  }
}

testOrder()
