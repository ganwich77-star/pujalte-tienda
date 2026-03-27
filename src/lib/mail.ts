import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: true, 
  auth: {
    user: process.env.MAIL_USER || 'hola@pujaltefotografia.es',
    pass: process.env.MAIL_PASS,
  },
})

export const sendOrderEmails = async (order: any) => {
  const { customerName, customerEmail, items, total, id, trackingNumber } = order

  const itemsHtml = items.map((item: any) => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 15px 0;">
        <div style="font-weight: bold; color: #1a1a1a; font-size: 15px;">🛍️ ${item.productName}</div>
        <div style="font-size: 12px; color: #777; margin-top: 4px;">Precio uni: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price)}</div>
      </td>
      <td style="padding: 15px 0; text-align: center; color: #444; font-weight: bold;">x${item.quantity}</td>
      <td style="padding: 15px 0; text-align: right; font-weight: 800; color: #1a1a1a;">
        ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  const customerEmailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff; padding: 0; border: 1px solid #eeeeee; border-radius: 16px; overflow: hidden;">
      <div style="background: #4A7C59; padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">✨ PUJALTE ✨</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: 400; letter-spacing: 4px; opacity: 0.9;">CREATIVE STUDIO · 2026</p>
      </div>

      <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 50px; margin-bottom: 10px;">🎉</div>
          <h2 style="font-size: 24px; font-weight: 800; color: #1a1a1a; margin: 0;">¡Pedido Confirmado!</h2>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">Hola <strong>${customerName}</strong>, ¡ya tenemos tu solicitud!</p>
        </div>

        ${trackingNumber ? `
        <div style="background: #1a1a1a; color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; tracking: 2px; color: #aaa;">Su número de seguimiento:</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #4A7C59; letter-spacing: 2px;">${trackingNumber}</p>
        </div>
        ` : ''}

        <h3 style="font-size: 14px; text-transform: uppercase; color: #999; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px;">Detalles de tu compra 🧾</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding-top: 25px; font-size: 20px; font-weight: 900; color: #1a1a1a;">TOTAL</td>
            <td style="padding-top: 25px; text-align: right; font-size: 24px; font-weight: 900; color: #4A7C59;">
              ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total)}
            </td>
          </tr>
        </table>

        <div style="background: #fdfdfd; border: 1px dashed #4A7C59; padding: 25px; border-radius: 12px; margin-top: 40px;">
          <h4 style="margin: 0 0 15px 0; color: #4A7C59; font-size: 13px; text-transform: uppercase;">💡 Información para ti:</h4>
          <table style="width: 100%;">
            <tr><td style="vertical-align: top; padding-bottom: 10px; font-size: 13px; color: #555;">📸 <strong>Fotos:</strong> Las de estudio no están incluidas de serie.</td></tr>
            <tr><td style="vertical-align: top; padding-bottom: 10px; font-size: 13px; color: #555;">🎨 <strong>Procesado:</strong> Si adjuntaste foto, se procesa en su estado original.</td></tr>
          </table>
        </div>

        <p style="text-align: center; margin-top: 40px; font-size: 15px; color: #333;">¡Mil gracias! ❤️</p>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #aaaaaa; text-align: justify; line-height: 1.4;">
          <strong>LOPD:</strong> Responsable: Pepe Pujalte Molina. Finalidad: Gestión de su pedido. Email: hola@pujaltefotografia.es.
        </div>
      </div>
    </div>
  `

  const adminEmailHtml = `
    <div style="font-family: sans-serif; padding: 30px; border: 4px solid #4A7C59; border-radius: 12px; background: #f9fffb;">
      <h2 style="color: #4A7C59; margin: 0 0 20px 0;">🚀 NUEVO PEDIDO</h2>
      <p><strong>Cliente:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Total:</strong> ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total)}</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `"Pujalte Creative Studio" <${process.env.MAIL_USER || 'hola@pujaltefotografia.es'}>`,
      to: customerEmail,
      subject: `✅ Pedido Confirmado - ${trackingNumber || id.slice(-6)}`,
      html: customerEmailHtml,
    })

    await transporter.sendMail({
      from: '"Tienda Online" <hola@pujaltefotografia.es>',
      to: 'hola@pujaltefotografia.es, apps@pujaltefotografia.es',
      subject: `🚀 NUEVO PEDIDO: ${customerName}`,
      html: adminEmailHtml,
    })

    console.log(`Correos enviados para el pedido ${id}`)
  } catch (error) {
    console.error('Fallo al enviar correos de pedido:', error)
  }
}

export const sendWelcomeEmails = async (client: { dni: string, name: string, email: string, phone: string }) => {
  const { dni, name, email, phone } = client

  console.log('--- Intentando enviar correos de bienvenida ---')
  console.log('Cliente:', email)
  console.log('Configuración SMTP:', {
    host: process.env.MAIL_HOST || 'smtp.hostinger.com',
    user: process.env.MAIL_USER || 'hola@pujaltefotografia.es',
    passDefined: !!process.env.MAIL_PASS
  })

  const customerHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 16px; overflow: hidden; background: #fff;">
       <div style="background: #4A7C59; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900;">✨ ¡BIENVENIDO A PUJALTE! ✨</h1>
      </div>
      <div style="padding: 30px; text-align: center;">
        <h2 style="color: #1a1a1a;">¡Hola ${name}!</h2>
        <p>Gracias por registrarte. A partir de ahora podrás realizar tus pedidos usando solo tu DNI <strong>${dni}</strong>.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left;">
          <p><strong>🆔 DNI:</strong> ${dni}</p>
          <p><strong>📱 Teléfono:</strong> ${phone}</p>
        </div>
        <p style="margin-top: 30px; font-weight: bold; color: #4A7C59;">Pujalte Creative Studio</p>
      </div>
    </div>
  `

  const adminHtml = `
    <div style="font-family: sans-serif; padding: 30px; border: 4px solid #4A7C59; border-radius: 12px; background: #f9fffb;">
      <h2 style="color: #4A7C59; margin: 0 0 20px 0;">👤 NUEVO CLIENTE REGISTRADO</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>DNI:</strong> ${dni}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${phone}</p>
      <div style="margin-top: 25px; background: #fff4e5; padding: 20px; border-radius: 12px; border: 1px solid #ffcc80;">
        <h4 style="margin: 0 0 10px 0; color: #e65100;">💰 Gestión de Pagos:</h4>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/enable-cash?dni=${encodeURIComponent(dni)}&email=${encodeURIComponent(email)}" 
           style="display: inline-block; background: #e65100; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin-top: 10px;">
           ✅ ACTIVAR PAGO MANUAL PARA ${name}
        </a>
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from: '"Pujalte Creative Studio" <hola@pujaltefotografia.es>',
      to: email,
      subject: `👋 ¡Bienvenido, ${name}!`,
      html: customerHtml,
    })

    await transporter.sendMail({
      from: '"Gestión de Clientes" <hola@pujaltefotografia.es>',
      to: 'hola@pujaltefotografia.es, apps@pujaltefotografia.es',
      subject: `👤 NUEVO REGISTRO: ${name} (${dni})`,
      html: adminHtml,
    })
    
    console.log(`Correos de bienvenida enviados para ${dni}`)
  } catch (error) {
    console.error('Error enviando correos de bienvenida:', error)
    throw error
  }
}
