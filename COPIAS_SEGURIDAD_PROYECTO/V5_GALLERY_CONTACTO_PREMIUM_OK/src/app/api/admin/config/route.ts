import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const filePath = path.join(process.cwd(), 'src/data/landing-config.json')
    
    // Guardar el archivo JSON
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, message: 'Configuración actualizada correctamente' })
  } catch (error) {
    console.error('Error al guardar la configuración:', error)
    return NextResponse.json(
      { success: false, message: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/landing-config.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error al leer la configuración' },
      { status: 500 }
    )
  }
}
