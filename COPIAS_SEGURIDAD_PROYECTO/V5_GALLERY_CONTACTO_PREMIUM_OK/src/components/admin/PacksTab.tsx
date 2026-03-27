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
  ChevronRight,
  PlusCircle,
  Layout
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Product, Category } from '@/types'

interface PacksTabProps {
  products: Product[]
  categories: Category[]
}

export function PacksTab({ products, categories }: PacksTabProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  const packs = products.filter(p => p.isPack)

  const filteredProducts = products.filter(p => 
    !p.isPack && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     categories.find(c => c.id === p.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-[#4A7C59]/10 text-[#4A7C59] text-[10px] font-black uppercase tracking-widest rounded-full">Ofertas</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de <span className="text-[#4A7C59]">Packs</span></h2>
          <p className="text-slate-500 font-medium italic">Agrupa tus productos para crear ofertas irresistibles.</p>
        </div>

        <Button 
          onClick={() => setIsCreating(true)}
          className="rounded-[1.25rem] bg-[#4A7C59] hover:bg-[#3d664a] text-white font-black uppercase tracking-widest text-[10px] h-14 px-8 shadow-xl shadow-[#4A7C59]/20 gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Plus className="h-4 w-4" />
          </div>
          Crear Nuevo Pack
        </Button>
      </div>

      {isCreating ? (
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-50/50">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter">Configurar Pack</CardTitle>
                <CardDescription className="text-slate-400 font-medium">Selecciona los productos que formarán parte de este pack</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl h-10 w-10 p-0 hover:bg-slate-200">
                <XCircle className="h-6 w-6 text-slate-300" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-8">
             <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre del Pack</label>
                      <Input placeholder="Ej: Pack Comunión Premium" className="h-14 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-bold" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Precio Final del Pack</label>
                      <div className="relative">
                        <Input type="number" placeholder="0.00" className="h-14 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-black pl-10 text-lg tabular-nums" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black opacity-20 text-lg">€</span>
                      </div>
                   </div>
                   <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#4A7C59]">Productos Seleccionados ({selectedItems.length})</h4>
                      <ScrollArea className="h-[200px] pr-4">
                        <div className="space-y-2">
                           {selectedItems.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-100 rounded-2xl opacity-40">
                                <Package className="h-8 w-8 mb-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Añade productos desde la lista</span>
                             </div>
                           ) : selectedItems.map(id => {
                             const p = products.find(prod => prod.id === id)
                             return (
                               <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group hover:bg-slate-100 transition-all">
                                  <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 rounded-lg bg-white overflow-hidden shadow-sm">
                                        <img src={p?.image || ''} className="w-full h-full object-cover" alt="" />
                                     </div>
                                     <span className="text-xs font-bold text-slate-700">{p?.name}</span>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 text-red-300 hover:text-red-500"
                                    onClick={() => setSelectedItems(prev => prev.filter(i => i !== id))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                               </div>
                             )
                           })}
                        </div>
                      </ScrollArea>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar productos..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#4A7C59]/10 font-medium" 
                      />
                   </div>
                   <ScrollArea className="h-[450px] pr-4">
                      <div className="grid grid-cols-1 gap-3">
                         {filteredProducts.map(p => {
                           const isSelected = selectedItems.includes(p.id)
                           return (
                             <button
                               key={p.id}
                               onClick={() => {
                                 if (isSelected) setSelectedItems(prev => prev.filter(id => id !== p.id))
                                 else setSelectedItems(prev => [...prev, p.id])
                               }}
                               className={`flex items-center justify-between p-4 rounded-[1.5rem] border-2 transition-all text-left ${
                                 isSelected 
                                 ? 'border-[#4A7C59] bg-[#4A7C59]/5' 
                                 : 'border-white bg-white hover:border-slate-200'
                               }`}
                             >
                               <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-xl border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                                     {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 m-3" /> }
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-slate-900 leading-tight">{p.name}</p>
                                     <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest">{categories.find(c => c.id === p.categoryId)?.name || 'Sin Categoría'}</Badge>
                                  </div>
                               </div>
                               <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#4A7C59] border-[#4A7C59] text-white' : 'border-slate-100'}`}>
                                  {isSelected && <CheckCircle2 className="h-4 w-4" />}
                               </div>
                             </button>
                           )
                         })}
                      </div>
                   </ScrollArea>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-2xl font-bold uppercase tracking-widest text-[10px] h-12 px-6">Cancelar</Button>
                <Button className="rounded-2xl bg-[#4A7C59] hover:bg-[#3d664a] text-white font-black uppercase tracking-widest text-[10px] h-12 px-10 shadow-lg shadow-[#4A7C59]/10">Publicar Pack</Button>
             </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {packs.length === 0 ? (
            <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-6">
                <div className="p-8 bg-white rounded-[2.5rem] shadow-xl text-slate-200">
                  <LayoutGrid className="h-16 w-16" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-400">No hay packs activos</h3>
                  <p className="text-sm text-slate-300 font-medium italic">Empieza creando tu primer pack de productos.</p>
                </div>
                <Button 
                  onClick={() => setIsCreating(true)}
                  variant="outline"
                  className="rounded-2xl border-[#4A7C59]/30 text-[#4A7C59] hover:bg-[#4A7C59] hover:text-white font-bold uppercase tracking-widest text-[10px] px-8 h-12"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Crear el primero
                </Button>
            </div>
          ) : (
            packs.map(pack => (
              <Card key={pack.id} className="group relative border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white cursor-pointer overflow-hidden p-1">
                 <div className="aspect-[4/3] rounded-[2rem] overflow-hidden relative">
                    <img src={pack.image || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={pack.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    
                    <div className="absolute top-5 left-5">
                       <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black uppercase tracking-[0.2em] text-[8px] px-3 py-1">Pack Especial</Badge>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                       <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{pack.name}</h3>
                       <p className="text-xs text-white/60 font-medium italic mt-1">{JSON.parse(pack.packItems || '[]').length} productos incluidos</p>
                    </div>
                 </div>
                 <div className="p-6 flex items-center justify-between">
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7C59] block mb-1">Precio Pack</span>
                       <span className="text-2xl font-black text-slate-900 tabular-nums">{pack.price}€</span>
                    </div>
                    <div className="flex gap-2">
                       <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900">
                          <Layout className="h-4 w-4" />
                       </Button>
                       <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-red-50 text-red-300 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
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
