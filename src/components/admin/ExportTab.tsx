'use client'

import { useState } from 'react'
import { 
  Download, 
  FileText, 
  Users, 
  ShoppingCart, 
  Package, 
  Database,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Order, Product } from '@/types'
import { toast } from '@/hooks/use-toast'

interface ExportTabProps {
  orders: Order[]
  products: Product[]
}

export function ExportTab({ orders, products }: ExportTabProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const downloadFile = (data: any, filename: string, type: 'json' | 'csv') => {
    let content = ''
    if (type === 'json') {
      content = JSON.stringify(data, null, 2)
    } else {
      // Simple CSV conversion for flat objects
      if (data.length === 0) return
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map((row: any) => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      )
      content = [headers, ...rows].join('\n')
    }

    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${type}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type: 'orders' | 'customers' | 'products', format: 'json' | 'csv') => {
    setExporting(`${type}-${format}`)
    
    try {
      let data: any[] = []
      let filename = ''

      if (type === 'orders') {
        data = orders.map(o => ({
          id: o.id,
          cliente: o.customerName,
          email: o.customerEmail,
          telefono: o.customerPhone,
          total: o.total,
          estado: o.status,
          fecha: new Date(o.createdAt as any).toLocaleDateString(),
          dni: (o.customFields as any)?.dni || ''
        }))
        filename = `pedidos_pujalte_${new Date().toISOString().split('T')[0]}`
      } else if (type === 'customers') {
        const customerMap = new Map()
        orders.forEach(o => {
          const dni = (o.customFields as any)?.dni || o.customerEmail || o.customerPhone
          if (!customerMap.has(dni)) {
            customerMap.set(dni, {
              nombre: o.customerName,
              email: o.customerEmail,
              telefono: o.customerPhone,
              dni: (o.customFields as any)?.dni || '',
              total_invertido: o.total,
              num_pedidos: 1
            })
          } else {
            const c = customerMap.get(dni)
            c.total_invertido += o.total
            c.num_pedidos += 1
          }
        })
        data = Array.from(customerMap.values())
        filename = `clientes_pujalte_${new Date().toISOString().split('T')[0]}`
      } else if (type === 'products') {
        data = products.map(p => ({
          nombre: p.name,
          categoria: p.category,
          precio: p.price,
          activo: p.active ? 'SÍ' : 'NO'
        }))
        filename = `productos_pujalte_${new Date().toISOString().split('T')[0]}`
      }

      downloadFile(data, filename, format)
      toast({
        title: "Exportación completada",
        description: `Se ha descargado el archivo ${filename}.${format} con éxito.`
      })
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo de exportación.",
        variant: "destructive"
      })
    } finally {
      setExporting(null)
    }
  }

  const exportOptions = [
    { 
      id: 'orders', 
      label: 'Pedidos y Ventas', 
      icon: ShoppingCart, 
      desc: 'Historial completo de transacciones y estados.',
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      id: 'customers', 
      label: 'Base de Clientes (CRM)', 
      icon: Users, 
      desc: 'Datos de contacto, DNI e inversión acumulada.',
      color: 'bg-emerald-50 text-emerald-600'
    },
    { 
      id: 'products', 
      label: 'Catálogo de Productos', 
      icon: Package, 
      desc: 'Listado de productos, precios y stock.',
      color: 'bg-purple-50 text-purple-600'
    }
  ]

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto pb-20">
      <div className="space-y-1 px-4 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">Exportar Datos</h2>
        <div className="flex items-center gap-2 pt-1">
          <div className="h-1 w-6 sm:h-1.5 sm:w-8 rounded-full bg-[#4A7C59]" />
          <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Copia de Seguridad y CRM</p>
        </div>
      </div>

      <div className="grid gap-4 px-4 sm:px-0">
        {exportOptions.map((opt, i) => (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-[#4A7C59]/10 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl ${opt.color} shadow-sm transform group-hover:rotate-6 transition-transform`}>
                  <opt.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{opt.label}</h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">{opt.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => handleExport(opt.id as any, 'csv')}
                  disabled={exporting !== null}
                  className="h-12 px-6 rounded-2xl border-slate-100 font-bold text-xs gap-2 hover:bg-slate-50 hover:text-slate-900"
                >
                  <FileText className="h-4 w-4" /> EXCEL / CSV
                </Button>
                <Button 
                  onClick={() => handleExport(opt.id as any, 'json')}
                  disabled={exporting !== null}
                  className="h-12 px-6 rounded-2xl bg-[#4A7C59] hover:bg-[#3D6649] font-black text-xs gap-2 shadow-lg shadow-emerald-100 whitespace-nowrap"
                >
                  <Download className="h-4 w-4" /> JSON
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mx-4 sm:mx-0 p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4A7C59]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2 bg-[#4A7C59] rounded-xl">
                <Database className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight">Copia de Seguridad</h4>
            </div>
            <p className="text-slate-400 text-sm font-medium max-w-md">
              Te recomendamos descargar tus datos periódicamente para tener un respaldo fuera de la nube. Ideal para importar en Excel y analizar tus ventas.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#4A7C59]" />
                </div>
              ))}
            </div>
            <div className="pr-2">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Todo Protegido</p>
              <p className="text-[10px] font-bold text-slate-500">Listos para exportar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
