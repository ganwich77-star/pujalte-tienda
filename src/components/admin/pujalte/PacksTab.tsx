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
import { fixPath } from '@/lib/utils'

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-[#4A7C59]/10 text-[#4A7C59] text-[10px] font-black uppercase tracking-widest rounded-full italic">Sección Especial</span>
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Gestión de <span className="text-[#4A7C59]">Packs</span></h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Crea combinaciones de productos con ofertas especiales.</p>
        </div>

        {!isCreating && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="rounded-2xl bg-[#4A7C59] hover:bg-[#3d664a] text-white font-black uppercase tracking-widest text-[10px] h-14 px-8 shadow-xl shadow-[#4A7C59]/20 gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Plus className="h-4 w-4" />
            </div>
            Crear Pack
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter italic text-slate-800">Cofigurar Nuevo Pack</CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Selecciona los productos y define el precio del pack.</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl h-10 w-10 p-0 hover:bg-slate-100">
                <XCircle className="h-6 w-6 text-slate-300" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-8">
             <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre del Pack</label>
                        <Input 
                          value={packName}
                          onChange={(e) => setPackName(e.target.value)}
                          placeholder="Ej: Pack Recién Nacido" 
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-bold italic uppercase tracking-tight" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
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
                          <select 
                            value={packCategory}
                            onChange={(e) => setPackCategory(e.target.value)}
                            className="w-full h-14 rounded-2xl border-none bg-slate-50/50 shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-bold text-sm px-4 appearance-none uppercase tracking-widest"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                   </div>

                   <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Productos en el Pack ({selectedItems.length})</h4>
                      </div>
                      <ScrollArea className="h-[250px] pr-4">
                        <div className="space-y-2">
                           {selectedItems.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-3xl opacity-40">
                                <Package className="h-8 w-8 mb-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Añade productos desde la lista</span>
                             </div>
                           ) : selectedItems.map(id => {
                             const p = products.find(prod => prod.id === id)
                             return (
                               <div key={id} className="flex items-center justify-between p-3 rounded-2xl bg-white group hover:shadow-md transition-all border border-slate-100">
                                  <div className="flex items-center gap-3">
                                     <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shadow-sm">
                                        <img src={fixPath(p?.src || '')} className="w-full h-full object-cover" alt="" />
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight italic">{p?.alt}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p?.categoria}</span>
                                     </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-9 w-9 p-0 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
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
                        <div className="pt-4 border-t border-slate-200 flex justify-between items-center px-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total productos</span>
                           <span className="text-sm font-black text-slate-800 italic">{selectedItems.length}</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A7C59]" />
                      <Input 
                        placeholder="Buscar productos..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-bold" 
                      />
                   </div>
                   <ScrollArea className="h-[550px] pr-4">
                      <div className="grid grid-cols-1 gap-2">
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
                               className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all text-left ${
                                 isSelected 
                                 ? 'border-[#4A7C59] bg-[#4A7C59]/5' 
                                 : 'border-white bg-white hover:border-slate-100 hover:bg-slate-50'
                               }`}
                             >
                               <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-xl border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                                     <img src={fixPath(p.src)} className="w-full h-full object-cover" alt={p.alt} />
                                  </div>
                                  <div>
                                     <p className="text-[11px] font-black text-slate-800 leading-tight uppercase tracking-tight italic">{p.alt}</p>
                                     <Badge variant="secondary" className="mt-1 bg-white border border-slate-100 text-slate-400 text-[8px] font-bold uppercase tracking-widest">{p.categoria}</Badge>
                                  </div>
                               </div>
                               <div className={`h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#4A7C59] border-[#4A7C59] text-white' : 'border-slate-100 bg-white'}`}>
                                  {isSelected && <CheckCircle2 className="h-4 w-4" />}
                               </div>
                             </button>
                           )
                         })}
                      </div>
                   </ScrollArea>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-8">Cancelar</Button>
                <Button 
                  onClick={handleCreatePack}
                  disabled={!packName || selectedItems.length === 0}
                  className="rounded-2xl bg-[#4A7C59] hover:bg-[#3d664a] text-white font-black uppercase tracking-widest text-[10px] h-12 px-12 shadow-lg shadow-[#4A7C59]/10"
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
              <Card key={pack.id} className="group relative border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white p-2 border border-slate-50">
                 <div className="aspect-[5/4] rounded-[2rem] overflow-hidden relative">
                    <img src={fixPath(pack.src)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={pack.alt} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                    
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                       <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black uppercase tracking-[0.2em] text-[8px] px-4 py-1.5 rounded-full">Pack Especial</Badge>
                       <Badge className="bg-[#4A7C59] text-white border-none font-black uppercase tracking-tight text-[10px] px-4 py-1.5 rounded-full italic">{pack.categoria}</Badge>
                    </div>

                    <div className="absolute bottom-8 left-8 right-8">
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-tight">{pack.alt}</h3>
                       <div className="flex items-center gap-2 mt-2">
                          <Package className="h-3.5 w-3.5 text-[#4A7C59]" />
                          <p className="text-[10px] text-white shadow-sm font-bold uppercase tracking-widest">{pack.packItems?.length || 0} productos incluidos</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-8 flex items-center justify-between bg-white">
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Precio Total</span>
                       <span className="text-3xl font-black text-slate-900 italic tracking-tighter">{pack.precio}€</span>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         size="icon" 
                         variant="ghost" 
                         className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-[#4A7C59] hover:bg-[#4A7C59]/5 transition-all"
                         onClick={() => {
                           setIsCreating(true)
                           setPackName(pack.alt)
                           setPackPrice(pack.precio || 0)
                           setPackCategory(pack.categoria)
                           setSelectedItems(pack.packItems || [])
                         }}
                       >
                          <Layout className="h-5 w-5" />
                       </Button>
                       <Button 
                         size="icon" 
                         variant="ghost" 
                         className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-300 hover:text-rose-500 hover:bg-rose-100 transition-all"
                         onClick={() => handleDeletePack(pack.id)}
                       >
                          <Trash2 className="h-5 w-5" />
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
