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
  Tag as TagIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GalleryImage } from '@/lib/landing-config'
// Función de seguridad local para evitar ReferenceError
const fixPath = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return path.startsWith('/') ? path : `/${path}`
}


interface PacksTabProps {
  products: GalleryImage[]
  categories: string[]
  onUpdate: (newItems: GalleryImage[]) => void
}

export default function PacksTab({ products, categories, onUpdate }: PacksTabProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([])
  const [packName, setPackName] = useState('')
  const [packPrice, setPackPrice] = useState<number>(0)
  const [packCategory, setPackCategory] = useState<string>(categories[0] || '')

  const packs = products.filter(p => p.isPack)
  const nonPackProducts = products.filter(p => !p.isPack)

  const filteredProducts = nonPackProducts.filter(p => 
    p.alt.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreatePack = () => {
    if (!packName || selectedItems.length === 0) return

    const newPack: GalleryImage = {
      id: Date.now(),
      src: products.find(p => p.id === selectedItems[0])?.src || '', // Usamos la primera imagen como portada por defecto
      alt: packName,
      categoria: packCategory,
      precio: packPrice,
      isPack: true,
      packItems: selectedItems,
      activa: true,
      mostrarPrecio: true
    }

    onUpdate([...products, newPack])
    setIsCreating(false)
    resetForm()
  }

  const resetForm = () => {
    setPackName('')
    setPackPrice(0)
    setSelectedItems([])
    setSearchTerm('')
  }

  const handleDeletePack = (id: string | number) => {
    if (confirm('¿Eliminar este pack?')) {
      onUpdate(products.filter(p => p.id !== id))
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 px-1 md:px-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <span className="px-3 py-1 bg-[#4A7C59]/10 text-[#4A7C59] text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full italic">Sección Especial</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Gestión de <span className="text-[#4A7C59]">Packs</span></h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Crea combinaciones de productos con ofertas especiales.</p>
        </div>

        {!isCreating && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="w-full md:w-auto rounded-2xl bg-[#4A7C59] hover:bg-[#3d664a] text-white font-black uppercase tracking-widest text-[10px] h-14 md:h-16 px-8 shadow-xl shadow-[#4A7C59]/20 gap-3 transition-all active:scale-95 group"
          >
            <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
              <Plus className="h-4 w-4" />
            </div>
            Crear Pack
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="border-none shadow-2xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white mx-1 md:mx-0">
          <CardHeader className="p-6 md:p-8 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter italic text-slate-800 leading-tight">Configurar Nuevo Pack</CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Selecciona productos y define el precio.</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl h-10 w-10 p-0 hover:bg-slate-100 shrink-0">
                <XCircle className="h-6 w-6 text-slate-300" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-8 pt-4 space-y-6 md:space-y-8">
             <div className="flex flex-col xl:flex-row gap-6 md:gap-10">
                <div className="flex-1 space-y-6">
                   <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre del Pack</label>
                        <Input 
                          value={packName}
                          onChange={(e) => setPackName(e.target.value)}
                          placeholder="Ej: Pack Recién Nacido" 
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-bold italic uppercase tracking-tight" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Precio Pack (€)</label>
                          <Input 
                            type="number"
                            value={packPrice}
                            onChange={(e) => setPackPrice(Number(e.target.value))}
                            className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-black italic text-lg" 
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría</label>
                          <div className="relative">
                            <select 
                              value={packCategory}
                              onChange={(e) => setPackCategory(e.target.value)}
                              className="w-full h-14 rounded-2xl border-none bg-slate-50/50 shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-bold text-sm px-4 appearance-none uppercase tracking-widest"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                              <LayoutGrid className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="p-4 md:p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Productos en el Pack ({selectedItems.length})</h4>
                        {selectedItems.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                            onClick={() => setSelectedItems([])}
                          >
                            Vaciar
                          </Button>
                        )}
                      </div>
                      <ScrollArea className="h-[200px] md:h-[250px] pr-2">
                        <div className="space-y-2 pb-2">
                           {selectedItems.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-3xl opacity-40 bg-white/50">
                                <Package className="h-8 w-8 mb-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Añade productos desde la derecha</span>
                             </div>
                           ) : selectedItems.map(id => {
                             const p = products.find(prod => prod.id === id)
                             return (
                               <div key={id} className="flex items-center justify-between p-3 rounded-2xl bg-white group hover:shadow-md transition-all border border-slate-100">
                                  <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-100 overflow-hidden shadow-sm shrink-0">
                                        <img src={fixPath(p?.src || '')} className="w-full h-full object-cover" alt="" />
                                     </div>
                                     <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] md:text-xs font-black text-slate-800 uppercase tracking-tight italic truncate">{p?.alt}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{p?.categoria}</span>
                                     </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-9 w-9 p-0 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl shrink-0"
                                    onClick={() => setSelectedItems(prev => prev.filter(i => i !== id))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                               </div>
                             )
                           })}
                        </div>
                      </ScrollArea>
                      {selectedItems.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center px-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total productos</span>
                           <span className="text-sm font-black text-slate-800 italic">{selectedItems.length}</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex-1 space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A7C59]" />
                      <Input 
                        placeholder="Buscar productos..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-bold" 
                      />
                   </div>
                   <ScrollArea className="h-[350px] md:h-[550px] pr-2">
                      <div className="grid grid-cols-1 gap-2 pb-4">
                         {filteredProducts.map(p => {
                           const isSelected = selectedItems.includes(p.id)
                           return (
                             <button
                               key={p.id}
                               type="button"
                               onClick={() => {
                                 if (isSelected) setSelectedItems(prev => prev.filter(id => id !== p.id))
                                 else setSelectedItems(prev => [...prev, p.id])
                               }}
                               className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all text-left group ${
                                 isSelected 
                                 ? 'border-[#4A7C59] bg-[#4A7C59]/5' 
                                 : 'border-white bg-white hover:border-slate-100 hover:bg-slate-50'
                               }`}
                             >
                               <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl border border-slate-100 overflow-hidden bg-slate-50 shrink-0">
                                     <img src={fixPath(p.src)} className="w-full h-full object-cover" alt={p.alt} />
                                  </div>
                                  <div className="min-w-0">
                                     <p className="text-[10px] md:text-[11px] font-black text-slate-800 leading-tight uppercase tracking-tight italic truncate">{p.alt}</p>
                                     <Badge variant="secondary" className="mt-1 bg-white border border-slate-100 text-slate-400 text-[8px] font-bold uppercase tracking-widest">{p.categoria}</Badge>
                                  </div>
                               </div>
                               <div className={`h-6 w-6 md:h-7 md:w-7 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-[#4A7C59] border-[#4A7C59] text-white' : 'border-slate-100 bg-white group-hover:border-[#4A7C59]/30'}`}>
                                  {isSelected && <CheckCircle2 className="h-4 w-4" />}
                               </div>
                             </button>
                           )
                         })}
                      </div>
                   </ScrollArea>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 md:pt-8 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="w-full sm:w-auto rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 md:h-14 px-8">Cancelar</Button>
                <Button 
                  onClick={handleCreatePack}
                  disabled={!packName || selectedItems.length === 0}
                  className="w-full sm:w-auto rounded-2xl bg-[#4A7C59] hover:bg-[#3d664a] text-white font-black uppercase tracking-widest text-[10px] h-12 md:h-14 px-12 shadow-lg shadow-[#4A7C59]/10 active:scale-95"
                >
                  Publicar Pack
                </Button>
             </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packs.length === 0 ? (
            <div className="col-span-full py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-8">
                <div className="p-12 bg-white rounded-[3rem] shadow-2xl text-slate-100 relative group transition-all hover:scale-105">
                  <LayoutGrid className="h-20 w-20" />
                  <div className="absolute -top-4 -right-4 p-4 bg-[#4A7C59] rounded-[1.5rem] shadow-xl text-white">
                    <Package className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-300 italic">No hay packs diseñados</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">Agrupa tus productos para ofrecer descuentos por volumen o sets completos.</p>
                </div>
                <Button 
                  onClick={() => setIsCreating(true)}
                  variant="outline"
                  className="rounded-[1.5rem] border-[#4A7C59]/30 text-[#4A7C59] hover:bg-[#4A7C59] hover:text-white font-black uppercase tracking-widest text-[10px] px-10 h-14 bg-white shadow-xl shadow-[#4A7C59]/5 transition-all"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Crear pack ahora
                </Button>
            </div>
          ) : (
            packs.map(pack => (
              <Card key={pack.id} className="group relative border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white p-2 border border-slate-50 mx-1 md:mx-0">
                 <div className="aspect-[16/10] sm:aspect-[5/4] rounded-[1.8rem] md:rounded-[2rem] overflow-hidden relative">
                    <img src={fixPath(pack.src)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={pack.alt} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                    
                    <div className="absolute top-4 md:top-6 left-4 md:left-6 flex items-center gap-2">
                       <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black uppercase tracking-[0.2em] text-[7px] md:text-[8px] px-3 md:px-4 py-1.5 rounded-full">Pack Especial</Badge>
                       <Badge className="bg-[#4A7C59] text-white border-none font-black uppercase tracking-tight text-[9px] md:text-[10px] px-3 md:px-4 py-1.5 rounded-full italic">{pack.categoria}</Badge>
                    </div>

                    <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                       <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic leading-tight line-clamp-2">{pack.alt}</h3>
                       <div className="flex items-center gap-2 mt-2">
                          <Package className="h-3.5 w-3.5 text-[#4A7C59]" />
                          <p className="text-[9px] md:text-[10px] text-white/90 shadow-sm font-bold uppercase tracking-widest">{pack.packItems?.length || 0} productos</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-5 md:p-8 flex items-center justify-between bg-white">
                    <div>
                       <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5 md:mb-1">Precio Total</span>
                       <span className="text-2xl md:text-3xl font-black text-slate-900 italic tracking-tighter">{pack.precio}€</span>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         size="icon" 
                         variant="secondary" 
                         className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-slate-50 text-slate-400 hover:text-[#4A7C59] hover:bg-[#4A7C59]/10 transition-all active:scale-95"
                         onClick={() => {
                           setIsCreating(true)
                           setPackName(pack.alt)
                           setPackPrice(pack.precio || 0)
                           setPackCategory(pack.categoria)
                           setSelectedItems(pack.packItems || [])
                         }}
                       >
                          <Layout className="h-4 md:h-5 w-4 md:w-5" />
                       </Button>
                       <Button 
                         size="icon" 
                         variant="ghost" 
                         className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-rose-50 text-rose-300 hover:text-rose-500 hover:bg-rose-100 transition-all active:scale-95"
                         onClick={() => handleDeletePack(pack.id)}
                       >
                          <Trash2 className="h-4 md:h-5 w-4 md:w-5" />
                       </Button>
                    </div>
                 </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
