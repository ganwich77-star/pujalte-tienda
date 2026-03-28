'use client'

import React, { useState, useMemo } from 'react'
import { 
  Search, Plus, Filter, MoreVertical, Pencil, Trash2, 
  Eye, EyeOff, Sparkles, SlidersHorizontal, Package,
  Tag, Download, Upload, AlertCircle, ShoppingBag, PlusCircle,
  ImageIcon, BarChart3, Layers2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ProductEditModal from './ProductEditModal'
import { LandingConfig, GalleryImage } from '@/lib/landing-config'
// Función de seguridad local para evitar ReferenceError
const fixPath = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return path.startsWith('/') ? path : `/${path}`
}


interface ProductsTabProps {
  config: LandingConfig
  setConfig: (config: LandingConfig) => void
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, aspect: number, callback: (url: string) => void) => void
  injectPreset: (name: string) => void
  handleImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void
  presets: any
  categories: string[]
}

export default function ProductsTab({ 
  config, 
  setConfig, 
  handleFileUpload,
  injectPreset,
  handleImportCSV,
  presets,
  categories
}: ProductsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [editingProduct, setEditingProduct] = useState<GalleryImage | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | number | null>(null)

  const products = config.galeria || []

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.alt.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (product.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.categoria === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const handleToggleField = (id: string | number, field: keyof GalleryImage) => {
    const updatedGaleria = config.galeria.map(item => {
      if (item.id === id) {
        return { ...item, [field]: !item[field] }
      }
      return item
    })
    setConfig({ ...config, galeria: updatedGaleria })
  }

  const handleDelete = (id: string | number) => {
    const updatedGaleria = config.galeria.filter(item => item.id !== id)
    setConfig({ ...config, galeria: updatedGaleria })
    setProductToDelete(null)
  }

  const handleEdit = (product: GalleryImage) => {
    setEditingProduct(product)
    setIsEditModalOpen(true)
  }

  const handleSaveProduct = (updatedProduct: GalleryImage) => {
    const updatedGaleria = config.galeria.map(item => 
      item.id === updatedProduct.id ? updatedProduct : item
    )
    setConfig({ ...config, galeria: updatedGaleria })
    setIsEditModalOpen(false)
    setEditingProduct(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">
            <Package className="h-8 w-8 text-[#4A7C59]" />
            Catálogo de Productos
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Gestiona tu galería, stock y precios inteligentes</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-100 font-bold uppercase tracking-widest text-[10px] gap-3 hover:bg-slate-50 transition-all">
                <Plus className="h-4 w-4" /> Nuevo Producto
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[220px]">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 py-2">Opciones de Creación</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  const newId = Date.now()
                  const newItem: GalleryImage = {
                    id: newId,
                    src: '',
                    alt: 'Nuevo Producto',
                    categoria: categories[0] || 'social',
                    activa: true,
                    precio: 0,
                    mostrarPrecio: true
                  }
                  setConfig({ ...config, galeria: [...config.galeria, newItem] })
                  handleEdit(newItem)
                }}
                className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest gap-3 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-emerald-500" /> Crear desde cero
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-50 mx-2" />
              {Object.keys(presets || {}).map(p => (
                <DropdownMenuItem 
                  key={p} 
                  onClick={() => injectPreset(p)}
                  className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest gap-3 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-blue-500" /> Cargar {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="h-14 w-14 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all p-0 relative overflow-hidden group">
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
              <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#4A7C59] transition-colors" />
              <input type="file" className="hidden" accept=".csv" onChange={handleImportCSV} />
            </label>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
          <Input 
            placeholder="BUSCAR POR NOMBRE O DESCRIPCIÓN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-16 pl-14 pr-8 bg-white border-2 border-slate-100 rounded-[28px] focus:border-[#4A7C59] focus:ring-0 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
          />
        </div>
        <div className="md:col-span-4 relative group">
          <Filter className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-16 pl-14 pr-8 bg-white border-2 border-slate-100 rounded-[28px] focus:border-[#4A7C59] outline-none text-[10px] font-black uppercase tracking-widest transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="all">TODAS LAS CATEGORÍAS</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-2/5">Producto</th>
                <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-[120px]">Categoría</th>
                <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-[150px]">Precio</th>
                <th className="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-[100px]">PVP</th>
                <th className="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-[100px]">Novedad</th>
                <th className="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-[100px]">Estado</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.tr 
                    layout
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-6">
                        <div className="relative group/img">
                          <div className="h-16 w-16 md:h-20 md:w-20 rounded-3xl overflow-hidden bg-slate-100 border-2 border-white shadow-lg flex-shrink-0 transition-transform duration-500 group-hover/img:scale-110">
                            {product.src ? (
                              <img src={fixPath(product.src)} alt={product.alt} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          {product.isNew && (
                            <div className="absolute -top-2 -left-2 bg-amber-400 text-black p-1.5 rounded-xl shadow-lg animate-bounce border-2 border-white">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="max-w-[300px]">
                          <h4 className="text-base font-black text-slate-800 uppercase tracking-tight line-clamp-1">{product.alt}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 line-clamp-1 italic">
                            {product.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <Badge variant="secondary" className="bg-slate-100/50 text-slate-400 text-[7px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border-none hover:bg-slate-100 transition-colors">
                        {product.categoria}
                      </Badge>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black tracking-tight italic ${product.salePrice ? 'text-slate-300 line-through text-xs' : 'text-slate-900'}`}>
                            {formatPrice(product.precio || 0)}
                          </span>
                          {product.salePrice && (
                            <span className="text-sm font-black text-emerald-600 tracking-tight italic">
                              {formatPrice(product.salePrice)}
                            </span>
                          )}
                        </div>
                        {product.tierPricing && JSON.parse(product.tierPricing).length > 0 && (
                          <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1 mt-1 bg-blue-50 px-1.5 py-0.5 rounded-md w-fit">
                            <BarChart3 className="h-2 w-2" /> Precios Escalados
                          </span>
                        )}
                        {product.hasVariants && (
                          <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1 mt-1 bg-orange-50 px-1.5 py-0.5 rounded-md w-fit">
                            <Layers2 className="h-2 w-2" /> Con Variantes
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <button 
                        onClick={() => handleToggleField(product.id, 'mostrarPrecio')}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto transition-all ${product.mostrarPrecio !== false ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100/50' : 'bg-slate-50 text-slate-200'}`}
                      >
                        <Tag className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <button 
                        onClick={() => handleToggleField(product.id, 'isNew')}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto transition-all ${product.isNew ? 'bg-amber-400 text-black shadow-lg shadow-amber-100/50 rotate-12' : 'bg-slate-50 text-slate-200 hover:bg-slate-100'}`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <button 
                        onClick={() => handleToggleField(product.id, 'activa')}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto transition-all ${product.activa !== false ? 'bg-[#4A7C59] text-white shadow-lg shadow-emerald-100/30' : 'bg-red-50 text-red-200 hover:bg-red-100'}`}
                      >
                        {product.activa !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(product)}
                          className="h-11 w-11 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-slate-100 transition-all">
                              <MoreVertical className="h-5 w-5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px]">
                            <DropdownMenuItem onClick={() => handleEdit(product)} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest gap-3 cursor-pointer">
                              <SlidersHorizontal className="h-4 w-4 text-slate-400" /> Configuración Avanzada
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                            <DropdownMenuItem onClick={() => setProductToDelete(product.id)} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest gap-3 text-red-500 hover:bg-red-50 focus:bg-red-50 cursor-pointer">
                              <Trash2 className="h-4 w-4" /> Eliminar Permanente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-50/30">
             <div className="h-24 w-24 rounded-[32px] bg-white shadow-2xl flex items-center justify-center mb-8 border border-slate-100 rotate-6">
                <Search className="h-10 w-10 text-slate-100" />
             </div>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">No se han encontrado resultados</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Prueba con otros términos o filtros</p>
             <Button 
               variant="link" 
               onClick={() => { setSearchTerm(''); setSelectedCategory('all') }}
               className="mt-6 text-[#4A7C59] font-black text-[10px] uppercase tracking-widest"
             >
               Limpiar todos los filtros
             </Button>
          </div>
        )}
      </div>

      {/* Persistence Info */}
      <div className="flex items-center justify-center gap-2 py-8 opacity-40">
        <AlertCircle className="h-4 w-4" />
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
          * LOS CAMBIOS DE NOVEDAD Y ESTADO SE GUARDAN AL PULSAR "GUARDAR" EN EL PANEL SUPERIOR
        </p>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <ProductEditModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          product={editingProduct} 
          categories={categories}
          onSave={handleSaveProduct}
        />
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-3xl text-center"
            >
              <div className="h-24 w-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Trash2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic mb-3">¿ELIMINAR PRODUCTO?</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">
                ESTA ACCIÓN ES PERMANENTE Y BORRARÁ TODA LA CONFIGURACIÓN Y VARIANTES DEL PRODUCTO.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setProductToDelete(null)}
                  className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-slate-100"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(productToDelete)}
                  className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-red-500 hover:bg-red-600 shadow-xl shadow-red-200"
                >
                  Eliminar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
