import { NextResponse } from 'next/server'
import { sendSelectionEmail } from '@/lib/mail'

export async function POST(req: Request) {
  try {
    const { clientName, slug, summary } = await req.json()

    if (!clientName || !slug || !summary) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    await sendSelectionEmail(clientName, slug, summary)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in selection API:', error)
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }
}
