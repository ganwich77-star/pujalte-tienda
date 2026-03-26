'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  ImageIcon, Trash2, Upload, PlusCircle, LayoutGrid, Eye, EyeOff, GripVertical, Package, Plus, Pencil, ChevronDown, ChevronUp, Settings2, CheckCircle2, XCircle
} from 'lucide-react'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { GalleryImage, LandingConfig } from '@/lib/landing-config'
import { fixPath } from '@/lib/utils'

interface ProductsTabProps {
  config: LandingConfig;
  setConfig: (config: LandingConfig) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, aspect: number, callback: (url: string) => void) => void;
  injectPreset: (presetName: string) => void;
  handleImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  presets: Record<string, any>;
  categories: string[];
}

// Modal de confirmación elegante
function DeleteConfirmModal({ open, productName, onConfirm, onCancel }: {
  open: boolean
  productName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-sm p-0 border-0 rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-red-50 to-rose-100 p-8 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-red-100 border-4 border-white shadow-lg flex items-center justify-center">
            <Trash2 className="h-7 w-7 text-red-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">¿Eliminar producto?</h3>
            <p className="text-sm text-slate-500">
              Se borrará <span className="font-bold text-slate-700">&ldquo;{productName}&rdquo;</span> de forma permanente.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-white shadow-sm hover:bg-slate-50 transition-all border border-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SortableProductRow({ 
  img, 
  handleFileUpload, 
  config, 
  setConfig,
  categories,
  isDragging
}: { 
  img: GalleryImage, 
  handleFileUpload: any, 
  config: LandingConfig, 
  setConfig: any,
  categories: string[],
  isDragging?: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: img.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  }

  const updateImg = (updates: Partial<GalleryImage>) => {
    const newGaleria = config.galeria.map(g => 
      g.id === img.id ? { ...g, ...updates } : g
    )
    setConfig({...config, galeria: newGaleria})
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group relative bg-white mb-2 rounded-[1.5rem] border transition-all duration-300 ${
        isDragging ? 'shadow-2xl border-[#4A7C59] scale-[1.02]' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
      } ${isExpanded ? 'ring-2 ring-black/5 border-black/10' : ''}`}
    >
      {/* CABECERA REDUCIDA */}
      <div 
        className="flex items-center gap-4 p-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 text-slate-300 hover:text-black transition-colors rounded-lg">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex-shrink-0">
          {img.src ? (
            <img src={fixPath(img.src)} alt={img.alt} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-200 absolute inset-0 m-auto" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <h4 className="font-bold text-slate-800 text-sm truncate">{img.alt || 'Sin título'}</h4>
          <div className="flex items-center gap-3 mt-0.5">
             <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-50 px-2 py-0.5 rounded-full">
                {img.categoria}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-1 pr-2">
           {img.activa ? (
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
           ) : (
              <div className="w-2 h-2 rounded-full bg-slate-300" />
           )}
           <div className={`p-1.5 rounded-xl transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
              <ChevronDown className="h-4 w-4" />
           </div>
        </div>
      </div>

      {/* CONTENIDO DESPLEGABLE */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
           {/* Info Principal */}
           <div className="space-y-4">
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Título de la foto</Label>
                 <Input 
                   value={img.alt} 
                   onChange={(e) => updateImg({ alt: e.target.value })}
                   className="h-10 bg-slate-50/50 border-none rounded-xl font-bold text-sm focus:bg-white transition-all shadow-inner"
                 />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Categoría</Label>
                 <Select value={img.categoria} onValueChange={(val) => updateImg({ categoria: val })}>
                    <SelectTrigger className="h-10 bg-slate-50/50 border-none rounded-xl font-bold text-xs uppercase tracking-wider shadow-inner">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                       {categories.map(cat => (
                         <SelectItem key={cat} value={cat} className="capitalize font-bold text-xs py-2">{cat}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
           </div>

            {/* Precio y Variantes */}
            <div className="space-y-4 border-l border-slate-100 pl-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Precio Base (€)</Label>
                     <Input 
                       type="number"
                       value={img.precio || ''} 
                       onChange={(e) => updateImg({ precio: parseFloat(e.target.value) || 0 })}
                       className="h-10 bg-slate-50/50 border-none rounded-xl font-bold text-sm focus:bg-white transition-all shadow-inner"
                       placeholder="0.00"
                     />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-transparent hover:bg-white transition-colors shadow-inner self-end mb-0.5">
                     <div className="flex flex-col">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variantes</Label>
                        <p className="text-[9px] text-slate-400">{img.hasVariants ? 'Activadas' : 'Desactivadas'}</p>
                     </div>
                     <Switch checked={img.hasVariants || false} onCheckedChange={(c) => updateImg({ hasVariants: c })} />
                  </div>
               </div>

               {img.hasVariants && (
                 <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Tipo de Variantes</Label>
                       <Select 
                         value={img.variantBehavior || 'replace'} 
                         onValueChange={(val: any) => updateImg({ variantBehavior: val })}
                       >
                          <SelectTrigger className="h-10 bg-black text-white border-none rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                             <SelectItem value="replace" className="text-xs py-2">Precio de Variante (Sustituye al base)</SelectItem>
                             <SelectItem value="add" className="text-xs py-2">Suplemento (Se suma al base)</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Listado de Variantes/Suplementos</Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[9px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                            onClick={() => {
                              const newVariants = [...(img.variants || []), { id: Date.now().toString(), name: '', price: 0 }];
                              updateImg({ variants: newVariants });
                            }}
                          >
                             <Plus className="h-3 w-3 mr-1" /> Añadir
                          </Button>
                       </div>

                       <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                          {(img.variants || []).map((variant, vIdx) => (
                            <div key={variant.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                               <Input 
                                 placeholder="Nombre (ej: XL, Tapa dura...)" 
                                 value={variant.name}
                                 onChange={(e) => {
                                   const newVariants = [...(img.variants || [])];
                                   newVariants[vIdx].name = e.target.value;
                                   updateImg({ variants: newVariants });
                                 }}
                                 className="h-8 text-[11px] border-none bg-slate-50 focus:bg-white flex-1"
                               />
                               <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-100">
                                  <span className="text-[10px] text-slate-400 font-bold">€</span>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
                                    value={variant.price || ''}
                                    onChange={(e) => {
                                      const newVariants = [...(img.variants || [])];
                                      newVariants[vIdx].price = parseFloat(e.target.value) || 0;
                                      updateImg({ variants: newVariants });
                                    }}
                                    className="h-8 w-16 text-[11px] border-none bg-transparent font-bold focus:ring-0"
                                  />
                               </div>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                 onClick={() => {
                                   const newVariants = (img.variants || []).filter((_, i) => i !== vIdx);
                                   updateImg({ variants: newVariants });
                                 }}
                               >
                                  <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                            </div>
                          ))}
                          {(img.variants || []).length === 0 && (
                            <p className="text-[10px] text-slate-300 italic text-center py-2">No hay variantes añadidas</p>
                          )}
                       </div>
                    </div>
                 </div>
               )}

               {/* Acciones */}
               <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                  <div className="flex flex-col">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visible en Web</Label>
                      <Switch className="mt-1" checked={img.activa} onCheckedChange={(c) => updateImg({ activa: c })} />
                  </div>

                  <div className="flex gap-2">
                     <label className="h-10 bg-black text-white hover:bg-slate-800 rounded-xl px-4 flex items-center justify-center cursor-pointer transition-all shadow-lg shadow-black/5">
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Cambiar</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, 1/1, (url: string) => updateImg({ src: url }))}
                        />
                     </label>

                     <Button 
                       variant="ghost" 
                       className="h-10 w-10 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-100"
                       onClick={() => setConfirmDelete(true)}
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
               </div>
            </div>
        </div>
      )}

      <DeleteConfirmModal
        open={confirmDelete}
        productName={img.alt}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          const newGaleria = config.galeria.filter(g => g.id !== img.id)
          setConfig({...config, galeria: newGaleria})
          setConfirmDelete(false)
        }}
      />
    </div>
  )
}

export default function ProductsTab({ 
  config, 
  setConfig, 
  handleFileUpload, 
  categories 
}: ProductsTabProps) {
  const [activeGalleryTab, setActiveGalleryTab] = useState('todos')

  const sensors = useSensors(
    useSensor(PointerSensor, {
       activationConstraint: {
          distance: 8,
       },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = config.galeria.findIndex((item) => item.id === active.id)
      const newIndex = config.galeria.findIndex((item) => item.id === over.id)

      const newGaleria = arrayMove(config.galeria, oldIndex, newIndex)
      setConfig({ ...config, galeria: newGaleria })
    }
  }

  const filteredGallery = config.galeria.filter(
    img => activeGalleryTab === 'todos' || img.categoria === activeGalleryTab
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER SUPERIOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 bg-[#4A7C59]/5 rounded-full blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-[#4A7C59]/10" />
        
        <div className="flex flex-col gap-5 relative z-10">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/10">
                 <ImageIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">PRODUCTOS</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">Gestiona los productos de tu tienda</p>
              </div>
           </div>

           <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 w-fit no-scrollbar overflow-x-auto">
             {['todos', ...categories].map(cat => (
               <button
                 key={cat}
                 onClick={() => setActiveGalleryTab(cat)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${
                   activeGalleryTab === cat 
                   ? 'bg-white text-black shadow-md ring-1 ring-black/5' 
                   : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 {cat}
               </button>
             ))}
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button 
             onClick={() => {
               const newId = Date.now();
               setConfig({
                 ...config,
                 galeria: [{ 
                   id: newId, 
                   src: '', 
                   alt: 'Nueva Foto', 
                   categoria: activeGalleryTab === 'todos' ? 'social' : activeGalleryTab,
                   activa: true
                 }, ...config.galeria]
               })
             }}
            variant="outline" 
            className="h-12 rounded-[1.2rem] border-slate-200 text-[11px] font-black uppercase tracking-widest px-5 hover:bg-slate-50"
          >
            <PlusCircle className="h-4 w-4 mr-2 text-slate-400" />
            Añadir Borrador
          </Button>

          <label className="h-12 bg-black hover:bg-slate-800 text-white gap-3 rounded-[1.2rem] px-6 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.2)] flex items-center cursor-pointer transition-all transform active:scale-95">
            <Upload className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Subir Imagen</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/png,image/jpeg,image/webp,image/*"
              onChange={(e) => handleFileUpload(e, 1/1, (url) => {
                const newId = Date.now();
                setConfig({
                  ...config,
                  galeria: [{ 
                    id: newId, 
                    src: url, 
                    alt: 'Nueva Imagen', 
                    categoria: activeGalleryTab === 'todos' ? 'social' : activeGalleryTab,
                    activa: true
                  }, ...config.galeria]
                })
              })}
            />
          </label>
        </div>
      </div>

      {/* LISTADO DE PRODUCTOS */}
      <div className="space-y-3">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={filteredGallery.map(img => img.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredGallery.map((img) => (
              <SortableProductRow 
                key={img.id} 
                img={img} 
                handleFileUpload={handleFileUpload}
                config={config}
                setConfig={setConfig}
                categories={categories}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        {filteredGallery.length === 0 && (
          <div className="py-32 bg-white/50 border border-dashed border-slate-200 rounded-[3rem] text-center space-y-5">
            <div className="h-20 w-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
               <ImageIcon className="h-8 w-8 text-slate-300" />
            </div>
            <div className="space-y-1">
               <p className="text-lg font-black text-slate-800">No hay productos en esta categoría</p>
               <p className="text-sm text-slate-400">Escoge otra categoría o sube un producto nuevo arriba.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
