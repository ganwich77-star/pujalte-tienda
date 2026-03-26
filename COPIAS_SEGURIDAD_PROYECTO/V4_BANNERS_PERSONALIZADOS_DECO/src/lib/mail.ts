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

  // 1. CORREO PARA EL CLIENTE (RECIBO PREMIUM)
  const customerEmailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff; padding: 0; border: 1px solid #eeeeee; border-radius: 16px; overflow: hidden;">
      
      <!-- HEADER ALEGRE -->
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

        <!-- TRACKING BOX -->
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

        <!-- INFO BOX -->
        <div style="background: #fdfdfd; border: 1px dashed #4A7C59; padding: 25px; border-radius: 12px; margin-top: 40px;">
          <h4 style="margin: 0 0 15px 0; color: #4A7C59; font-size: 13px; text-transform: uppercase;">💡 Información para ti:</h4>
          <table style="width: 100%;">
            <tr>
              <td style="vertical-align: top; padding-bottom: 10px; font-size: 13px; color: #555;">📸 <strong>Fotos:</strong> Las de estudio no están incluidas de serie.</td>
            </tr>
            <tr>
              <td style="vertical-align: top; padding-bottom: 10px; font-size: 13px; color: #555;">🎨 <strong>Procesado:</strong> Si adjuntaste foto, se procesa en su estado original.</td>
            </tr>
            <tr>
              <td style="vertical-align: top; font-size: 13px; color: #555;">🚀 <strong>Próximos Pasos:</strong> Te avisaremos en cuanto esté listo para envío/recogida.</td>
            </tr>
          </table>
        </div>

        <p style="text-align: center; margin-top: 40px; font-size: 15px; color: #333;">
          ¡Mil gracias por dejarnos ser parte de vuestros recuerdos! ❤️
        </p>

        <!-- LOPD FOOTER -->
        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #aaaaaa; text-align: justify; line-height: 1.4;">
          <strong>PROTECCIÓN DE DATOS (LOPD):</strong> En cumplimiento del RGPD y la LOPDGDD, le informamos que sus datos personales son tratados por <strong>Pepe Pujalte Molina</strong> para la gestión de su pedido y la relación comercial. Puede ejercer sus derechos de acceso, rectificación, supresión y otros previstos legalmente enviando un email a <a href="mailto:hola@pujaltefotografia.es" style="color: #4A7C59; text-decoration: none;">hola@pujaltefotografia.es</a>. Sus datos se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales.
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 12px; color: #999; margin: 0;">Pujalte Creative Studio &copy; 2026</p>
          <a href="https://pujaltefotografia.es" style="font-size: 11px; color: #4A7C59; text-decoration: none; font-weight: bold;">www.pujaltefotografia.es</a>
        </div>
      </div>
    </div>
  `

    const customFields = order.customFields || {}
    const dni = customFields.dni || ""

    const adminEmailHtml = `
      <div style="font-family: sans-serif; padding: 30px; border: 4px solid #4A7C59; border-radius: 12px; background: #f9fffb;">
        <h2 style="color: #4A7C59; margin: 0 0 20px 0;">🚀 ¡NUEVO PEDIDO RECIBIDO!</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <p><strong>👤 Cliente:</strong> ${customerName}</p>
          <p><strong>🆔 DNI:</strong> ${dni}</p>
          <p><strong>📧 Email:</strong> ${customerEmail}</p>
          <p><strong>🔢 Seguimiento:</strong> <span style="color: #4A7C59; font-weight: bold;">${trackingNumber || 'N/A'}</span></p>
          <p><strong>💰 Total:</strong> ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total)}</p>
        </div>
        
        <div style="margin-top: 25px; background: #fff4e5; padding: 20px; border-radius: 12px; border: 1px solid #ffcc80;">
          <h4 style="margin: 0 0 10px 0; color: #e65100;">💰 Gestión de Pagos:</h4>
          <p style="font-size: 13px; color: #5d4037;">Si deseas que este cliente pueda pagar en <strong>Efectivo</strong> en sus próximas compras, pulsa el botón:</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/enable-cash?dni=${encodeURIComponent(dni)}&email=${encodeURIComponent(customerEmail)}" 
             style="display: inline-block; background: #e65100; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin-top: 10px;">
             ✅ HABILITAR PAGO EN EFECTIVO
          </a>
        </div>

        <p style="margin-top: 25px;">Accede al panel de administración para ver detalles:</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin" style="display: inline-block; background: #4A7C59; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">ABRIR PANEL DE CONTROL</a>
      </div>
    `

  try {
    // Para el cliente
    await transporter.sendMail({
      from: '"Pujalte Creative Studio" <hola@pujaltefotografia.es>',
      to: customerEmail,
      subject: `✅ Pedido Confirmado - ${trackingNumber || id.slice(-6)} - Pujalte Creative Studio`,
      html: customerEmailHtml,
    })

    // Para Pujalte (Admin + Apps)
    await transporter.sendMail({
      from: '"Tienda Online" <hola@pujaltefotografia.es>',
      to: 'hola@pujaltefotografia.es, apps@pujaltefotografia.es',
      subject: `🚀 NUEVO PEDIDO: ${customerName} (${trackingNumber || id.slice(-6)})`,
      html: adminEmailHtml,
    })

    console.log(`Correos enviados con éxito para el pedido ${trackingNumber || id}`)
  } catch (error) {
    console.error('Fallo al enviar correos:', error)
  }
}
