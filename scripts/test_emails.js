require('dotenv').config();
const { sendWelcomeEmails, sendOrderEmails } = require('../src/lib/mail');

async function test() {
  const testData = {
    dni: '12345678X',
    name: 'Cliente de Prueba',
    email: 'hola@pujaltefotografia.es', 
    phone: '600000000'
  };

  const testOrder = {
    id: 'ord_test_123456',
    trackingNumber: 'PUJ-789-XYZ',
    customerName: 'Cliente de Prueba',
    customerEmail: 'hola@pujaltefotografia.es',
    total: 45.50,
    items: [
      { productName: 'Pack Comunión Premium', quantity: 1, price: 35.00 },
      { productName: 'Ampliación 20x30', quantity: 1, price: 10.50 }
    ]
  };

  console.log('🚀 Iniciando envío de correos de prueba...');

  try {
    console.log('--- Enviando Email de Bienvenida ---');
    await sendWelcomeEmails(testData);
    
    console.log('--- Enviando Email de Pedido ---');
    await sendOrderEmails(testOrder);

    console.log('✅ ¡Correos de prueba enviados correctamente a hola@pujaltefotografia.es!');
  } catch (error) {
    console.error('❌ Error enviando pruebas:', error);
  }
}

test();
