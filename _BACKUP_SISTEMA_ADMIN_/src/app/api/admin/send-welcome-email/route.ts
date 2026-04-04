import { NextResponse } from 'next/server'
import { sendWelcomeEmails } from '@/lib/mail'

export async function POST(req: Request) {
  try {
    const { dni, name, email, phone } = await req.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Nombre y Email son obligatorios' }, { status: 400 })
    }

    await sendWelcomeEmails({ dni, name, email, phone: phone || '' })

    return NextResponse.json({ success: true, message: 'Email de bienvenida enviado' })
  } catch (error: any) {
    console.error('Error enviando email manual:', error)
    return NextResponse.json({ error: 'Error al enviar el email' }, { status: 500 })
  }
}
