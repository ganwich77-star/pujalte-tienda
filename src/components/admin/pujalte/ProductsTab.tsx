'use client'

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Edit, 
  Filter, 
  Eye, 
  EyeOff,
  Sparkles,
  MoreVertical,
  Type,
  Layout,
  Layers,
  BarChart3,
  Layers2,
  Settings2,
  Tag,
  Pencil,
  AlertCircle,
  PlusCircle,
  Package,
  SlidersHorizontal,
  LayoutGrid
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast'
import { Product } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface ProductsTabProps {
  products: Product[]
  categories: string[]
  onUpdateProductField: (id: string, field: string, value: any) => void
  onDeleteProduct: (id: string) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onSaveProduct: (data: any) => Promise<boolean>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, aspect: number, callback: (url: string) => void) => void
}

export default function ProductsTab({ 
  products, 
  categories,
  onUpdateProductField,
  onDeleteProduct,
  onAddProduct,
  onEditProduct,
  onSaveProduct,
  handleFileUpload
}: ProductsTabProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<keyof Product | 'none'>('none')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof Product) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const nameMatch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const descMatch = (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSearch = nameMatch || descMatch
      
      const cat = product.categoryId || ''
      const matchesCategory = selectedCategory === 'all' || cat === selectedCategory
      return matchesSearch && matchesCategory
    })

    if (sortBy !== 'none') {
      result.sort((a, b) => {
        const valA = a[sortBy]
        const valB = b[sortBy]

        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1

        let comparison = 0
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB)
        } else {
          comparison = (valA as any) > (valB as any) ? 1 : -1
        }

        return sortOrder === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [products, searchTerm, selectedCategory, sortBy, sortOrder])

  const handleToggleField = (id: string, field: string) => {
    const product = products.find(p => p.id === id)
    if (product) {
      onUpdateProductField(id, field, !(product as any)[field])
    }
  }

  const handleDelete = (id: string) => {
    onDeleteProduct(id)
    setProductToDelete(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0)
  }

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="h-16 w-16 bg-[#4A7C59] rounded-[24px] flex items-center justify-center shadow-xl shadow-[#4A7C59]/20 transition-transform hover:rotate-12">
              <Package className="h-8 w-8 text-white" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Catálogo Cromos</h2>
              <p className="text-[10px] font-black text-[#4A7C59] uppercase tracking-[0.3em] mt-1 ml-0.5 opacity-80">Gestión de Galería e Inventario</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={onAddProduct}
            className="h-14 px-8 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-[0.2em] text-[11px] italic shadow-xl shadow-slate-200 hover:bg-black transition-all hover:-translate-y-1"
          >
            <Plus className="h-5 w-5 mr-3" /> Añadir Producto
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-8 relative group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
           <Input 
             placeholder="BUSCAR CROMO POR NOMBRE O DESCRIPCIÓN..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="h-16 pl-14 pr-8 bg-white border-2 border-slate-50 rounded-3xl focus:border-[#4A7C59] focus:ring-0 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
           />
        </div>
        <div className="md:col-span-4 relative group">
           <Filter className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
           <select 
             value={selectedCategory}
             onChange={(e) => setSelectedCategory(e.target.value)}
             className="w-full h-16 pl-14 pr-8 bg-white border-2 border-slate-50 rounded-3xl focus:border-[#4A7C59] outline-none text-[10px] font-black uppercase tracking-widest transition-all shadow-sm appearance-none cursor-pointer"
           >
             <option value="all">TODAS LAS CATEGORÍAS</option>
             {categories.map(cat => (
               <option key={cat} value={cat}>{cat.toUpperCase()}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] border-2 border-slate-50 overflow-hidden shadow-sm hover:shadow-2xl hover:border-slate-100 transition-all group relative"
            >
              {/* Product Image Stage */}
              <div className="aspect-square relative overflow-hidden bg-slate-50">
                {product.image ? (
                  <img 
                    src={product.image.startsWith('http') || product.image.startsWith('data:') ? product.image : `/${product.image}`} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                    <ImageIcon className="h-16 w-16 mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Sin Activo</span>
                  </div>
                )}
                
                {/* Status Floaties */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {!product.active && (
                    <Badge className="bg-white/90 text-red-500 font-black uppercase text-[8px] tracking-[0.2em] backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border-2 border-red-50">
                      Oculto
                    </Badge>
                  )}
                  {product.isNew && (
                    <Badge className="bg-amber-400 text-black font-black uppercase text-[8px] tracking-[0.2em] backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border-2 border-white">
                      <Sparkles className="h-3 w-3 mr-2" /> Novedad
                    </Badge>
                  )}
                </div>

                {/* Price Tag Overlay */}
                <div className="absolute bottom-6 left-6">
                  <div className="bg-slate-950 text-white font-black text-sm px-4 py-2 rounded-2xl shadow-2xl skew-x-[-10deg]">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {/* Quick Actions Hover Overlay */}
                <div className="absolute inset-x-6 bottom-6 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                  <Button 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl bg-white text-slate-900 shadow-xl hover:bg-[#4A7C59] hover:text-white transition-all scale-90 group-hover:scale-100"
                    onClick={() => onEditProduct(product)}
                  >
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Data Stage */}
              <div className="p-8 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl leading-tight group-hover:text-[#4A7C59] transition-colors truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">REF: #{product.id.slice(0, 6).toUpperCase()}</p>
                       <span className="h-1 w-1 rounded-full bg-slate-200" />
                       <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 text-slate-400 bg-slate-50">
                        {product.categoryId || 'SIN ASIGNAR'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-slate-50 bg-[#F8FAFC]/50 -mx-8 px-8 py-4">
                  <div className="flex gap-2">
                     <button 
                        onClick={() => handleToggleField(product.id, 'active')}
                        className={`h-10 px-4 rounded-xl flex items-center justify-center transition-all border-none font-black text-[9px] uppercase tracking-widest italic ${product.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500 opacity-60'}`}
                     >
                        {product.active ? <Eye className="h-3.5 w-3.5 mr-2" /> : <EyeOff className="h-3.5 w-3.5 mr-2" />}
                        {product.active ? 'Público' : 'Privado'}
                     </button>
                  </div>

                  <div className="flex gap-2">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEditProduct(product)}
                        className="h-10 w-10 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl"
                     >
                        <Pencil className="h-4 w-4" />
                     </Button>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setProductToDelete(product.id)}
                        className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
          <div className="h-28 w-28 rounded-[3rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner rotate-12">
            <Search className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Sin hallazgos</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs mx-auto italic leading-relaxed">No hay cromos que coincidan con los criterios actuales. Refina tu búsqueda.</p>
          </div>
          <Button 
            onClick={() => { setSearchTerm(''); setSelectedCategory('all') }}
            variant="outline"
            className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-8"
          >
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Persistence Note */}
      <div className="flex items-center justify-center gap-3 py-10 opacity-20 group hover:opacity-100 transition-opacity">
        <div className="h-1 w-12 bg-slate-300 rounded-full" />
        <AlertCircle className="h-5 w-5 text-slate-400" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 truncate italic">
          Data Engine Sync Active v4.0
        </p>
        <div className="h-1 w-12 bg-slate-300 rounded-full" />
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="rounded-[3rem] border-none shadow-3xl p-12 max-w-sm overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
          <AlertDialogHeader className="space-y-8">
            <div className="h-24 w-24 rounded-[2.5rem] bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-xl shadow-red-500/10 rotate-6 group-hover:rotate-0 transition-transform">
              <Trash2 className="h-12 w-12" />
            </div>
            <div className="space-y-3 text-center">
              <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic">¿EXPULSAR CROMO?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] italic leading-relaxed">
                ESTA ACCIÓN ELIMINARÁ EL PRODUCTO Y TODOS SUS ACTIVOS DE LA BASE DE DATOS DE LA TIENDA.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-12 gap-4 flex-col sm:flex-row">
            <AlertDialogCancel className="h-14 rounded-2xl border-2 border-slate-100 font-black uppercase tracking-widest text-[10px] flex-1 hover:bg-slate-50">Mantener</AlertDialogCancel>
            <AlertDialogAction 
              className="h-14 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-[10px] flex-1 border-none shadow-2xl shadow-red-200 hover:bg-red-600 hover:scale-105 transition-all"
              onClick={() => productToDelete && handleDelete(productToDelete)}
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
