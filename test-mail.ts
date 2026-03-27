import { sendWelcomeEmails } from './src/lib/mail'

async function testMail() {
  console.log('Enviando correo de prueba...')
  try {
    await sendWelcomeEmails({
      dni: '12345678TEST',
      name: 'Tester Antigravity',
      email: 'pujaltefotografia@gmail.com', // Using a test email
      phone: '600000000'
    })
    console.log('✅ Correo de prueba enviado con éxito.')
  } catch (error) {
    console.error('❌ Error enviando correo de prueba:', error)
  }
}

testMail()
