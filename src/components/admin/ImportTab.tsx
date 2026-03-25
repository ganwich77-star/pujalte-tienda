'use client'

import { useRef } from 'react'
import { FileSpreadsheet, Download, Upload, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ImportTabProps {
  uploading: boolean
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDownloadTemplate: () => void
}

export function ImportTab({ uploading, onFileUpload, onDownloadTemplate }: ImportTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" /> 
          Importar Productos desde Excel/CSV
        </CardTitle>
        <CardDescription>
          Sube un archivo CSV o Excel con tus productos. Los productos con el mismo nombre o ID se actualizarán automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={onDownloadTemplate} className="gap-2 flex-1">
            <Download className="h-4 w-4" /> Descargar Plantilla
          </Button>
          <div className="flex-1">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".csv,.xlsx,.xls" 
              onChange={onFileUpload} 
              className="hidden" 
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading} 
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
              ) : (
                <><Upload className="h-4 w-4" /> Subir Archivo CSV/Excel</>
              )}
            </Button>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 space-y-3">
          <h4 className="font-semibold text-orange-800">Formato del archivo</h4>
          <p className="text-sm text-orange-700">El archivo debe tener las siguientes columnas (los nombres son flexibles):</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Badge variant="secondary" className="bg-orange-200 text-orange-800">nombre</Badge> <span>Nombre del producto *</span></div>
            <div className="flex items-center gap-2"><Badge variant="secondary" className="bg-orange-200 text-orange-800">precio</Badge> <span>Precio unitario *</span></div>
            <div className="flex items-center gap-2"><Badge variant="secondary" className="bg-orange-200 text-orange-800">stock</Badge> <span>Cantidad disponible</span></div>
            <div className="flex items-center gap-2"><Badge variant="secondary" className="bg-orange-200 text-orange-800">descripcion</Badge> <span>Descripción breve</span></div>
            <div className="flex items-center gap-2"><Badge variant="secondary" className="bg-orange-200 text-orange-800">categoria</Badge> <span>Nombre de categoría</span></div>
            <div className="flex items-center gap-2"><Badge variant="secondary" className="bg-orange-200 text-orange-800">imagen</Badge> <span>URL de la imagen</span></div>
          </div>
          <p className="text-xs text-orange-600 pt-2 font-medium italic">* Los campos con asterisco son obligatorios para nuevos productos.</p>
        </div>
      </CardContent>
    </Card>
  )
}
