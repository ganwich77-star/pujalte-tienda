import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: true, 
  auth: {
    user: process.env.MAIL_USER || 'hola@pujaltefotografia.es',
    pass: process.env.MAIL_PASS || 'Jpm17pass71-',
  },
})

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pujaltefotografia.es'

export const sendOrderEmails = async (order: any, isCash: boolean = false) => {
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
          <strong>LOPD:</strong> Responsable: Pepe Pujalte Molina. Finalidad: Gestión de su pedido. Email: pedidos@pujaltefotografia.es.
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #333; letter-spacing: 3px; font-weight: bold;">PUJALTE CREATIVE STUDIO</p>
        </div>
      </div>
    </div>
  `

  const adminEmailHtml = `
    <div style="font-family: sans-serif; padding: 30px; border: 2px solid #ACC3B1; border-radius: 24px; background: #1a1a1a; color: #ffffff; max-width: 600px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
      <h2 style="color: #ACC3B1; margin: 0 0 20px 0; letter-spacing: 1px; font-size: 20px;">🚀 ${isCash ? 'AVISO: PEDIDO PENDIENTE' : 'NUEVO PEDIDO RECIBIDO'}</h2>
      
      <div style="background: #222; padding: 25px; border-radius: 20px; margin-bottom: 25px; border: 1px solid #333;">
        <p style="margin: 0 0 12px 0;"><strong style="color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Cliente:</strong><br/> <span style="font-size: 16px; font-weight: bold;">${customerName}</span></p>
        <p style="margin: 0 0 12px 0;"><strong style="color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Email:</strong><br/> ${customerEmail}</p>
        <p style="margin: 0 0 12px 0;"><strong style="color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Teléfono:</strong><br/> ${order.customerPhone || 'N/A'}</p>
        <p style="margin: 0 0 12px 0;"><strong style="color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Dirección:</strong><br/> ${order.address || 'Recogida en tienda'}</p>
        <p style="margin: 0 0 12px 0;"><strong style="color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Método Pago:</strong><br/> ${isCash ? '💵 EFECTIVO / PAGO MANUAL' : '💳 PASARELA ONLINE'}</p>
        ${order.notes ? `<p style="margin: 0;"><strong style="color: #ff9800; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Notas del Pedido:</strong><br/> <span style="color: #ff9800;">${order.notes}</span></p>` : ''}
      </div>

      <h3 style="font-size: 11px; text-transform: uppercase; color: #555; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px; letter-spacing: 2px; font-weight: 800;">Desglose del Pedido 📦</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${items.map((item: any) => `
          <tr style="border-bottom: 1px solid #222;">
            <td style="padding: 15px 0;">
              <div style="font-weight: bold; color: #ffffff; font-size: 14px;">🛍️ ${item.productName}</div>
              ${item.variantName ? `<div style="font-size: 11px; color: #ACC3B1;">Variante: ${item.variantName}</div>` : ''}
              ${item.note ? `<div style="font-size: 11px; color: #ff9800; margin-top: 5px; font-style: italic;">📝 Nota: ${item.note}</div>` : ''}
              ${item.fileUrl ? `
                <div style="margin-top: 8px;">
                  <a href="${item.fileUrl}" style="color: #ACC3B1; font-size: 10px; text-decoration: underline;">🔗 Ver archivo adjunto</a>
                </div>
              ` : ''}
            </td>
            <td style="padding: 15px 0; text-align: center; color: #ACC3B1; font-weight: bold;">x${item.quantity}</td>
            <td style="padding: 15px 0; text-align: right; font-weight: 800; color: #ffffff;">
              ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity)}
            </td>
          </tr>
        `).join('')}
        <tr>
          <td colspan="2" style="padding-top: 25px; font-size: 16px; font-weight: 900; color: #666; letter-spacing: 1px;">TOTAL PEDIDO</td>
          <td style="padding-top: 25px; text-align: right; font-size: 22px; font-weight: 900; color: #ACC3B1;">
            ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total)}
          </td>
        </tr>
      </table>

      <div style="margin-top: 40px; font-size: 9px; color: #333; text-align: center; letter-spacing: 1px;">ID: ${id} • Pujalte Creative Studio</div>
    </div>
  `

  try {
    // Solo enviamos al cliente si NO es pago en efectivo (según petición de Jose)
    if (!isCash) {
      await transporter.sendMail({
        from: `"Pujalte Creative Studio" <${process.env.MAIL_USER || 'pedidos@pujaltefotografia.es'}>`,
        to: customerEmail,
        subject: `✅ Pedido Confirmado - ${trackingNumber || id.slice(-6)}`,
        html: customerEmailHtml,
      })
    }

    // Al administrador (Jose) se le avisa SIEMPRE
    await transporter.sendMail({
      from: isCash ? `"Aviso de Pedido" <${process.env.MAIL_USER || 'hola@pujaltefotografia.es'}>` : `"Gestión de Pedidos" <${process.env.MAIL_USER || 'hola@pujaltefotografia.es'}>`,
      to: 'pedidos@pujaltefotografia.es, apps@pujaltefotografia.es',
      subject: isCash ? `⚠️ PEDIDO PENDIENTE: ${customerName}` : `🚀 NUEVO PEDIDO: ${customerName}`,
      html: adminEmailHtml,
    })

    console.log(`Correos gestionados para el pedido ${id} (isCash: ${isCash})`)
  } catch (error) {
    console.error('Fallo al enviar correos de pedido:', error)
  }
}

export const sendWelcomeEmails = async (client: { dni: string, name: string, email: string, phone: string }) => {
  const { dni, name, email, phone } = client

  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenidos a Pujalte Creative Studio</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1e293b; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
        
        <!-- Cabecera con Logo -->
        <div style="background: #4A7C59; padding: 40px 20px; text-align: center;">
          <img src="${baseUrl}/logo_ia.png" alt="Pujalte Creative Studio" style="max-height: 80px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; line-height: 1.1; color: #ffffff;">BIENVENIDOS A<br/>PUJALTE CREATIVE STUDIO</h1>
          <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;">
            "La tecnología al servicio de los recuerdos"
          </p>
        </div>

        <div style="padding: 50px 40px;">
          <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 25px;">
            Hola <strong>${name}</strong>,
          </p>
          
          <p style="font-size: 15px; line-height: 1.6; color: #64748b; margin-bottom: 30px;">
            Te hemos dado de alta en nuestra plataforma de clientes. <strong>Para poder entrar y gestionar tu cuenta</strong>, solo tienes que confirmar tu alta pulsando el siguiente botón:
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="https://pujalte-tienda.vercel.app/" style="display: inline-block; background: #4A7C59; color: #ffffff; padding: 20px 50px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 15px; letter-spacing: 0.05em; text-transform: uppercase;">
              CONFIRMAR MI CUENTA
            </a>
          </div>

          <!-- Sección Credenciales -->
          <div style="background: #f8fafc; padding: 40px; border-radius: 24px; margin-top: 40px; border: 2px solid #e2e8f0;">
            <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: 800; color: #4A7C59; text-transform: uppercase; letter-spacing: 0.15em; text-align: center;">🎨 TUS DATOS DE ACCESO 🔒</p>
            
            <div style="background: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 15px;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">👤 USUARIO</p>
              <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 900; color: #1e293b; letter-spacing: -0.02em;">${name.split(' ')[0].toUpperCase()}</p>
            </div>

            <div style="background: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">🔑 CONTRASEÑA (TU DNI)</p>
              <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 900; color: #4A7C59; letter-spacing: 0.05em;">${dni}</p>
            </div>

            <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b; text-align: center; font-style: italic;">
              Usa estos datos cada vez que quieras finalizar un pedido o ver el estado de tu cuenta.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
            Si no quieres recibir correos sobre nuestras nuevas campañas o promociones, puedes desactivarlas en cualquier momento pulsando aquí: 
            <a href="#" style="color: #4A7C59; text-decoration: underline; font-weight: 600;">Desactivar notificaciones</a>
          </p>
          <div style="margin-top: 20px;">
            <p style="margin: 0; font-size: 11px; color: #cbd5e1; letter-spacing: 3px; font-weight: bold; text-transform: uppercase;">PUJALTE CREATIVE STUDIO</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const adminHtml = `
    <div style="font-family: sans-serif; padding: 30px; border: 2px solid #4A7C59; border-radius: 16px; background: #1a1a1a; color: #ffffff; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4A7C59; margin: 0 0 20px 0; letter-spacing: 1px;">👤 NUEVO CLIENTE REGISTRADO</h2>
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
      subject: `Bienvenidos a Pujalte Creative Studio 🚀`,
      html: customerHtml,
    })

    await transporter.sendMail({
      from: '"Gestión de Clientes" <hola@pujaltefotografia.es>',
      to: 'pedidos@pujaltefotografia.es, apps@pujaltefotografia.es',
      subject: `👤 NUEVO REGISTRO: ${name} (${dni})`,
      html: adminHtml,
    })
    
    console.log(`Correos de bienvenida enviados para ${dni} (Pujalte Creative Studio)`)
  } catch (error) {
    console.error('Error enviando correos de bienvenida:', error)
    throw error
  }
}

export const sendSelectionEmail = async (clientName: string, clientSlug: string, summary: string) => {
  const adminEmailHtml = `
    <div style="font-family: sans-serif; padding: 40px; background-color: #1a1a1a; color: #ffffff; border-radius: 24px; max-width: 650px; margin: 0 auto; border: 1px solid #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4A7C59; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px;">📸 NUEVA SELECCIÓN</h1>
        <p style="color: #666; text-transform: uppercase; font-size: 11px; letter-spacing: 2px; margin-top: 10px;">Cliente: ${clientName} (${clientSlug.toUpperCase()})</p>
      </div>
      
      <div style="background: #222; padding: 30px; border-radius: 16px; border: 1px solid #333; margin-bottom: 30px;">
        <h2 style="color: #4A7C59; font-size: 14px; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">Resumen del Pedido:</h2>
        <div style="white-space: pre-wrap; font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.8; color: #ACC3B1;">
          ${summary}
        </div>
      </div>

      <div style="text-align: center; font-size: 10px; color: #444; border-top: 1px solid #222; padding-top: 20px;">
        PUJALTE CREATIVE STUDIO • SISTEMA DE GESTIÓN AUTOMÁTICA
      </div>
    </div>
  `

  await transporter.sendMail({
    from: '"Gestión de Galería" <hola@pujaltefotografia.es>',
    to: 'pedidos@pujaltefotografia.es, apps@pujaltefotografia.es',
    subject: `📸 SELECCIÓN: ${clientName} (${clientSlug.toUpperCase()})`,
    html: adminEmailHtml,
  })
}
