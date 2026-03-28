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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pujaltefotografia.es'

export const sendOrderEmails = async (order: any) => {
  const { customerName, customerEmail, items, total, id, trackingNumber } = order

  const itemsHtml = items.map((item: any) => `
    <tr style="border-bottom: 1px solid #333;">
      <td style="padding: 15px 0;">
        <div style="font-weight: bold; color: #ffffff; font-size: 15px;">🛍️ ${item.productName}</div>
        ${item.variantName ? `<div style="font-size: 12px; color: #ACC3B1;">Variante: ${item.variantName}</div>` : ''}
        ${item.fileUrl ? `
          <div style="margin-top: 10px;">
            <a href="${item.fileUrl}" style="background: #ACC3B1; color: #1a1a1a; padding: 6px 12px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 11px; display: inline-block;">📸 DESCARGAR FOTO</a>
          </div>
        ` : ''}
        <div style="font-size: 12px; color: #888; margin-top: 4px;">Precio uni: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price)}</div>
      </td>
      <td style="padding: 15px 0; text-align: center; color: #ACC3B1; font-weight: bold;">x${item.quantity}</td>
      <td style="padding: 15px 0; text-align: right; font-weight: 800; color: #ffffff;">
        ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  const customerEmailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; background: #1a1a1a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
      <div style="background: #ACC3B1; padding: 40px 20px; text-align: center; color: #1a1a1a;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 2px; line-height: 1.1;">✨ ¡PEDIDO<br/>CONFIRMADO! ✨</h1>
      </div>

      <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 50px; margin-bottom: 15px;">🚀</div>
          <h2 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0;">¡Ya tenemos tu solicitud!</h2>
          <p style="color: #888; font-size: 16px; margin-top: 10px;">Hola <strong>${customerName}</strong>, gracias por tu compra.</p>
        </div>

        ${trackingNumber ? `
        <div style="background: #222; color: white; padding: 25px; border-radius: 16px; text-align: center; margin: 30px 0; border: 1px solid #333;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666;">Número de seguimiento:</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 900; color: #ACC3B1; letter-spacing: 2px;">${trackingNumber}</p>
        </div>
        ` : ''}

        <h3 style="font-size: 12px; text-transform: uppercase; color: #555; border-bottom: 1px solid #333; padding-bottom: 10px; margin-top: 40px; letter-spacing: 1px;">Detalles de tu compra 🧾</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding-top: 25px; font-size: 18px; font-weight: 900; color: #888;">TOTAL</td>
            <td style="padding-top: 25px; text-align: right; font-size: 24px; font-weight: 900; color: #ACC3B1;">
              ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total)}
            </td>
          </tr>
        </table>

        <div style="background: #222; border: 1px dashed #333; padding: 25px; border-radius: 16px; margin-top: 40px;">
          <h4 style="margin: 0 0 15px 0; color: #ACC3B1; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">💡 Información Importante:</h4>
          <table style="width: 100%;">
            <tr><td style="vertical-align: top; padding-bottom: 10px; font-size: 13px; color: #888;">📸 <strong>Fotos:</strong> Las de estudio no están incluidas de serie.</td></tr>
            <tr><td style="vertical-align: top; padding-bottom: 10px; font-size: 13px; color: #888;">🎨 <strong>Procesado:</strong> Si adjuntaste foto, se procesa en su estado original.</td></tr>
          </table>
        </div>

        <p style="text-align: center; margin-top: 40px; font-size: 15px; color: #ffffff;">¡Mil gracias por confiar en nosotros! ❤️</p>

        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #333; font-size: 10px; color: #444; text-align: justify; line-height: 1.4;">
          <strong>LOPD:</strong> Responsable: Pepe Pujalte Molina. Finalidad: Gestión de su pedido. Email: hola@pujaltefotografia.es.
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #333; letter-spacing: 3px; font-weight: bold;">PUJALTE CREATIVE STUDIO</p>
        </div>
      </div>
    </div>
  `

  const adminEmailHtml = `
    <div style="font-family: sans-serif; padding: 30px; border: 2px solid #ACC3B1; border-radius: 16px; background: #1a1a1a; color: #ffffff; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ACC3B1; margin: 0 0 20px 0; letter-spacing: 1px;">🚀 NUEVO PEDIDO RECIBIDO</h2>
      
      <div style="background: #222; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #333;">
        <p style="margin: 0 0 10px 0;"><strong style="color: #666; text-transform: uppercase; font-size: 10px;">Cliente:</strong><br/> ${customerName}</p>
        <p style="margin: 0 0 10px 0;"><strong style="color: #666; text-transform: uppercase; font-size: 10px;">Email:</strong><br/> ${customerEmail}</p>
        <p style="margin: 0 0 0 0;"><strong style="color: #666; text-transform: uppercase; font-size: 10px;">Teléfono:</strong><br/> ${order.customerPhone || 'N/A'}</p>
      </div>

      <h3 style="font-size: 12px; text-transform: uppercase; color: #555; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px; letter-spacing: 1px;">Productos y Archivos 📦</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding-top: 25px; font-size: 18px; font-weight: 900; color: #888;">TOTAL</td>
          <td style="padding-top: 25px; text-align: right; font-size: 24px; font-weight: 900; color: #ACC3B1;">
            ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total)}
          </td>
        </tr>
      </table>

      <div style="margin-top: 40px; font-size: 10px; color: #444; text-align: right;">ID Pedido: ${id}</div>
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
      from: '"Gestión de Pedidos" <hola@pujaltefotografia.es>',
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

  const customerHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; background: #1a1a1a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
      <div style="background: #ACC3B1; padding: 40px 20px; text-align: center; color: #1a1a1a;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 1px; line-height: 1.1;">✨ ¡BIENVENIDO A<br/>PUJALTE CREATIVE STUDIO! ✨</h1>
      </div>

      <div style="padding: 50px 40px; text-align: center;">
        <h2 style="font-size: 28px; font-weight: 800; margin: 0 0 25px 0; color: #ffffff;">¡Hola, <span style="color: #ACC3B1;">${name}</span>!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cccccc; margin-bottom: 30px;">
          Nos hace mucha ilusión darte la bienvenida. <br/>
          Gracias por confiar en <strong>Pujalte Creative Studio</strong>. Tu registro ya está activo y estamos listos para trabajar en tus proyectos.
        </p>

        <div style="background: #222; padding: 30px; border-radius: 20px; margin-bottom: 40px; border: 1px solid #333;">
          <p style="font-style: italic; color: #888; margin: 0 0 20px 0; font-size: 15px;">"Tu confianza es el motor de nuestra creatividad."</p>
          
          <p style="font-size: 13px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Tu acceso exclusivo como cliente es tu identificación:</p>
          
          <div style="background: #2a2a2a; border-radius: 12px; padding: 15px; display: inline-block; width: 100%; box-sizing: border-box; text-align: left; border: 1.5px solid #333;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 45px;">
                  <div style="background: #6D28D9; color: white; width: 40px; height: 40px; border-radius: 8px; text-align: center; line-height: 40px; font-weight: bold; font-size: 14px;">ID</div>
                </td>
                <td style="padding-left: 15px;">
                  <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px;">DNI DE CLIENTE</div>
                  <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 1px;">${dni}</div>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <a href="${baseUrl}" style="display: inline-block; background: #ACC3B1; color: #1a1a1a; padding: 22px 50px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 16px; letter-spacing: 1px; text-transform: uppercase;">
          ACCEDER A LA TIENDA
        </a>

        <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #333; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #666; letter-spacing: 3px; font-weight: bold;">PUJALTE CREATIVE STUDIO</p>
          <p style="margin: 10px 0 0 0; color: #222; font-size: 20px;">· · ·</p>
        </div>
      </div>
    </div>
  `

  const adminHtml = `
    <div style="font-family: sans-serif; padding: 30px; border: 2px solid #ACC3B1; border-radius: 16px; background: #1a1a1a; color: #ffffff;">
      <h2 style="color: #ACC3B1; margin: 0 0 20px 0; letter-spacing: 1px;">👤 NUEVO CLIENTE REGISTRADO</h2>
      <p style="border-bottom: 1px solid #333; padding-bottom: 10px;"><strong style="color: #666;">Nombre:</strong> ${name}</p>
      <p style="border-bottom: 1px solid #333; padding-bottom: 10px;"><strong style="color: #666;">DNI:</strong> ${dni}</p>
      <p style="border-bottom: 1px solid #333; padding-bottom: 10px;"><strong style="color: #666;">Email:</strong> ${email}</p>
      <p style="border-bottom: 1px solid #333; padding-bottom: 10px;"><strong style="color: #666;">Teléfono:</strong> ${phone}</p>
      <div style="margin-top: 25px; background: #332100; padding: 25px; border-radius: 16px; border: 1px solid #5c3b00;">
        <h4 style="margin: 0 0 10px 0; color: #ff9800; font-size: 16px;">💰 Gestión de Pagos:</h4>
        <a href="${baseUrl}/api/admin/enable-cash?dni=${encodeURIComponent(dni)}&email=${encodeURIComponent(email)}" 
           style="display: inline-block; background: #ff9800; color: #000; padding: 15px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; margin-top: 10px;">
           ✅ ACTIVAR PAGO MANUAL PARA ${name}
        </a>
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from: '"Pujalte Creative Studio" <hola@pujaltefotografia.es>',
      to: email,
      subject: `👋 ¡Bienvenido a Pujalte Creative Studio, ${name}!`,
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
