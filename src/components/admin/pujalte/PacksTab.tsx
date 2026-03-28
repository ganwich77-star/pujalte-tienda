'use client'

import React, { useState } from 'react'
import { 
  LayoutGrid, 
  Plus, 
  Trash2, 
  Package, 
  Search, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Layout,
  Tag as TagIcon,
  Pencil,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Product } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface PacksTabProps {
  products: Product[]
  categories: string[]
  onUpdateProductField: (id: string, field: string, value: any) => void
  onDeleteProduct: (id: string) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
}

export default function PacksTab({ 
  products, 
  categories, 
  onUpdateProductField,
  onDeleteProduct,
  onAddProduct,
  onEditProduct
}: PacksTabProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [packName, setPackName] = useState('')
  const [packPrice, setPackPrice] = useState<number>(0)
  const [packCategory, setPackCategory] = useState<string>('PAQUETES')

  const packs = products.filter(p => p.isPack)
  const nonPackProducts = products.filter(p => !p.isPack)

  const filteredProducts = nonPackProducts.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.categoryId || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreatePack = () => {
    // In a unified DB, we would call onAddProduct with initial values
    // But for now, we'll let the user use the main "Add Product" flow 
    // or we could trigger a specific "Pack" creation.
    // Given the user wants "Cromos" and "Packs" in the DB, 
    // I'll suggest using the main Edit Modal which already handles isPack.
    onAddProduct()
    setIsCreating(false)
  }

  const handleDeletePack = (id: string) => {
    onDeleteProduct(id)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0)
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 md:px-0">
        <div className="flex items-center gap-4">
           <div className="h-16 w-16 bg-[#4A7C59] rounded-[24px] flex items-center justify-center shadow-xl shadow-[#4A7C59]/20 transition-transform hover:-rotate-12">
              <Package className="h-8 w-8 text-white" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Gestión de Packs</h2>
              <p className="text-[10px] font-black text-[#4A7C59] uppercase tracking-[0.3em] mt-1 ml-0.5 opacity-80">COMBINACIONES ESTRATÉGICAS</p>
           </div>
        </div>

        <Button 
          onClick={onAddProduct}
          className="h-14 px-8 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-[0.2em] text-[11px] italic shadow-xl shadow-slate-200 hover:bg-black transition-all hover:-translate-y-1"
        >
          <Plus className="h-5 w-5 mr-3" /> Diseñar Nuevo Pack
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {packs.length === 0 ? (
          <div className="col-span-full py-40 bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-10">
              <div className="h-32 w-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-slate-100 rotate-6 group hover:rotate-0 transition-transform duration-500">
                <LayoutGrid className="h-16 w-16" />
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-400 italic">No hay packs en la base de datos</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">Define conjuntos de productos con precios promocionales para aumentar el ticket medio.</p>
              </div>
              <Button 
                onClick={onAddProduct}
                variant="outline"
                className="rounded-2xl border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[10px] px-12 h-14 bg-white shadow-xl hover:bg-slate-950 hover:text-white transition-all"
              >
                Comenzar diseño
              </Button>
          </div>
        ) : (
          packs.map(pack => {
            const items = typeof pack.packItems === 'string' ? JSON.parse(pack.packItems || '[]') : (pack.packItems || [])
            return (
              <motion.div 
                layout
                key={pack.id} 
                className="group relative bg-white rounded-[3rem] border-2 border-slate-50 overflow-hidden shadow-sm hover:shadow-3xl hover:border-slate-100 transition-all duration-500"
              >
                 <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                    <img 
                      src={pack.image ? (pack.image.startsWith('http') ? pack.image : `/${pack.image}`) : '/placeholder.jpg'} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      alt={pack.name} 
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    <div className="absolute top-6 left-6">
                       <Badge className="bg-[#4A7C59] text-white border-none font-black uppercase tracking-widest text-[8px] px-4 py-2 rounded-xl shadow-lg italic">
                        {pack.categoryId || 'PACK'}
                       </Badge>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none truncate">{pack.name}</h3>
                       <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg">
                            <Package className="h-3 w-3 text-[#4A7C59]" />
                            <p className="text-[9px] text-white font-black uppercase tracking-widest">{items.length} Componentes</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-8 flex items-center justify-between bg-white border-t border-slate-50">
                    <div>
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 block mb-1 italic">Oferta Pack</span>
                       <span className="text-3xl font-black text-slate-900 italic tracking-tighter">{formatPrice(pack.price)}</span>
                    </div>
                    <div className="flex gap-3">
                       <Button 
                         size="icon" 
                         variant="ghost" 
                         className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-95"
                         onClick={() => onEditProduct(pack)}
                       >
                          <Pencil className="h-5 w-5" />
                       </Button>
                       <Button 
                         size="icon" 
                         variant="ghost" 
                         className="h-12 w-12 rounded-2xl bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all active:scale-95"
                         onClick={() => onDeleteProduct(pack.id)}
                       >
                          <Trash2 className="h-5 w-5" />
                       </Button>
                    </div>
                 </div>

                 {/* Expansion hover line */}
                 <div className="absolute bottom-0 left-0 w-0 h-1 bg-[#4A7C59] group-hover:w-full transition-all duration-700" />
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
