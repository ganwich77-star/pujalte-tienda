'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  ImageIcon, Trash2, Upload, PlusCircle, LayoutGrid, Eye, EyeOff, GripVertical, Package, Plus, Pencil, Banknote, ChevronDown, ChevronUp, Settings2, CheckCircle2, XCircle
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
            <h3 className="text-lg font-black text-slate-800 tracking-tight">¿Eliminar artículo?</h3>
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

function ProductDetailModal({ open, product, onSave, onCancel }: { 
  open: boolean
  product: GalleryImage
  onSave: (updates: Partial<GalleryImage>) => void
  onCancel: () => void 
}) {
  const [localProduct, setLocalProduct] = useState<GalleryImage>(product)

  useEffect(() => {
    setLocalProduct(product)
  }, [product, open])

  const addVariant = () => {
    const newVariants = [
      ...(localProduct.variants || []),
      { id: Date.now().toString(), name: 'Nueva opción', price: 0, sortOrder: (localProduct.variants?.length || 0) }
    ]
    setLocalProduct({ ...localProduct, hasVariants: true, variants: newVariants })
  }

  const updateVariant = (id: string, updates: any) => {
    const newVariants = localProduct.variants?.map(v => v.id === id ? { ...v, ...updates } : v)
    setLocalProduct({ ...localProduct, variants: newVariants })
  }

  const removeVariant = (id: string) => {
    const newVariants = localProduct.variants?.filter(v => v.id !== id)
    setLocalProduct({ ...localProduct, variants: newVariants, hasVariants: newVariants && newVariants.length > 0 })
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-xl p-0 border-0 rounded-[2rem] shadow-2xl overflow-hidden bg-white">
        <div className="bg-slate-50/50 p-8 space-y-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white">
                <Settings2 className="h-5 w-5" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Opciones Avanzadas</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{product.alt}</p>
             </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">¿Tiene opciones o medidas?</Label>
                      <p className="text-[10px] text-slate-400 italic">Activa esto si el usuario debe elegir entre varias opciones.</p>
                   </div>
                   <Switch 
                     checked={localProduct.hasVariants} 
                     onCheckedChange={(c) => setLocalProduct({ ...localProduct, hasVariants: c, variants: c ? (localProduct.variants || []) : [] })} 
                   />
                </div>

                {localProduct.hasVariants && (
                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre del selector (Ej: Medida, Acabado)</Label>
                       <Input 
                         value={localProduct.variantType || ''} 
                         onChange={(e) => setLocalProduct({ ...localProduct, variantType: e.target.value })}
                         placeholder="Ej: Medida"
                         className="bg-slate-50 border-none rounded-xl"
                       />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lógica de Precio</Label>
                       <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setLocalProduct({ ...localProduct, variantBehavior: 'replace' })}
                            className={`p-3 rounded-xl border text-[11px] font-bold transition-all ${
                              localProduct.variantBehavior === 'replace' 
                              ? 'bg-black text-white border-black' 
                              : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                             Precio Base Cero (Sustituye)
                          </button>
                          <button
                            onClick={() => setLocalProduct({ ...localProduct, variantBehavior: 'add' })}
                            className={`p-3 rounded-xl border text-[11px] font-bold transition-all ${
                              localProduct.variantBehavior === 'add' 
                              ? 'bg-black text-white border-black' 
                              : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                             Suplemento (Suma al Base)
                          </button>
                       </div>
                    </div>
                  </div>
                )}
             </div>

             {localProduct.hasVariants && (
                <div className="space-y-3">
                   <div className="flex items-center justify-between px-1">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Listado de Opciones</Label>
                      <Button variant="ghost" size="sm" onClick={addVariant} className="h-7 text-[10px] font-black uppercase text-[#4A7C59] bg-[#4A7C59]/10 rounded-lg hover:bg-[#4A7C59]/20">
                         <Plus className="h-3 w-3 mr-1" /> Añadir
                      </Button>
                   </div>
                   
                   <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {localProduct.variants?.map((v) => (
                        <div key={v.id} className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                           <Input 
                             value={v.name} 
                             onChange={(e) => updateVariant(v.id, { name: e.target.value })}
                             placeholder="Nombre"
                             className="flex-1 bg-slate-50/50 border-none text-[12px] font-bold rounded-xl h-9"
                           />
                           <div className="flex items-center gap-1 bg-slate-50 rounded-xl px-2 h-9 border border-slate-50">
                              <Input 
                                type="number"
                                step="0.01"
                                value={v.price} 
                                onChange={(e) => updateVariant(v.id, { price: parseFloat(e.target.value) || 0 })}
                                className="w-14 bg-transparent border-none text-[12px] font-black tabular-nums text-right p-0 h-full focus:ring-0"
                              />
                              <span className="text-[10px] font-bold opacity-30">€</span>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => removeVariant(v.id)} className="h-8 w-8 text-slate-300 hover:text-red-500 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>

          <div className="flex gap-3 pt-4">
             <Button variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-2xl font-bold text-slate-500 border-slate-200">Cancelar</Button>
             <Button onClick={() => { onSave(localProduct); onCancel(); }} className="flex-1 h-12 rounded-2xl font-black bg-[#4A7C59] hover:bg-[#3D664A] text-white shadow-xl shadow-emerald-100">Aplicar</Button>
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
  const [showDetails, setShowDetails] = useState(false)
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
          <h4 className="font-bold text-slate-800 text-sm truncate">{img.alt || 'Sin nombre'}</h4>
          <div className="flex items-center gap-3 mt-0.5">
             <span className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] bg-[#4A7C59]/5 px-2 py-0.5 rounded-full">
                {img.precio || 0}€
             </span>
             <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-50 px-2 py-0.5 rounded-full">
                {img.categoria}
             </span>
             {img.hasVariants && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[8px] font-black h-4 px-1.5 rounded-md uppercase tracking-tighter shadow-none border-none">
                  Variantes
                </Badge>
             )}
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
        <div className="px-5 pb-5 pt-2 border-t border-slate-50 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
           {/* Info Principal */}
           <div className="space-y-4">
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Nombre Comercial</Label>
                 <Input 
                   value={img.alt} 
                   onChange={(e) => updateImg({ alt: e.target.value })}
                   className="h-10 bg-slate-50/50 border-none rounded-xl font-bold text-sm focus:bg-white transition-all shadow-inner"
                 />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Descripción corta</Label>
                 <Input 
                   value={img.descripcion || ''} 
                   onChange={(e) => updateImg({ descripcion: e.target.value })}
                   className="h-10 bg-slate-50/50 border-none rounded-xl text-xs italic focus:bg-white transition-all shadow-inner"
                 />
              </div>
           </div>

           {/* Precio y Categoría */}
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Precio Base</Label>
                    <div className="relative">
                       <Input 
                         type="number"
                         step="0.01"
                         value={img.precio || 0} 
                         onChange={(e) => updateImg({ precio: parseFloat(e.target.value) || 0 })}
                         className="h-10 bg-slate-50/50 border-none rounded-xl font-black tabular-nums transition-all shadow-inner pr-8"
                       />
                       <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-300">€</span>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Visible</Label>
                    <div className="h-10 flex items-center justify-center bg-slate-50/50 rounded-xl shadow-inner border border-transparent group-hover:bg-white transition-colors">
                       <Switch checked={img.activa} onCheckedChange={(c) => updateImg({ activa: c })} />
                    </div>
                 </div>
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

           {/* Acciones de Producto */}
           <div className="flex flex-col gap-2 justify-end">
              <div className="flex gap-2">
                 <Button 
                   className={`flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${img.hasVariants ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-900 hover:bg-black text-white'}`}
                   onClick={() => setShowDetails(true)}
                 >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Opciones / Variantes
                 </Button>
                 
                 <Button
                   variant="outline"
                   className={`h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                     (img.mostrarPrecio ?? true) ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400'
                   }`}
                   onClick={() => updateImg({ mostrarPrecio: !(img.mostrarPrecio ?? true) })}
                 >
                    <Banknote className="h-4 w-4 mr-2" />
                    { (img.mostrarPrecio ?? true) ? 'Visible' : 'Oculto' }
                 </Button>
              </div>

              <div className="flex gap-2">
                 <label className="flex-1 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-xl flex items-center justify-center cursor-pointer transition-all">
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Foto</span>
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
      )}

      <ProductDetailModal
        open={showDetails}
        product={img}
        onCancel={() => setShowDetails(false)}
        onSave={(updates) => updateImg(updates)}
      />

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
  injectPreset, 
  handleImportCSV, 
  presets, 
  categories 
}: ProductsTabProps) {
  const [activeGalleryTab, setActiveGalleryTab] = useState('todos')
  const [showGalleryImages, setShowGalleryImages] = useState(true)

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
                 <Package className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestionar Artículos</h2>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 rounded-[1.2rem] bg-white border-slate-200 text-[11px] font-black uppercase tracking-widest px-5 flex items-center gap-2 hover:bg-slate-50 transition-all">
                 <LayoutGrid className="h-4 w-4 text-slate-400" />
                 Lotes / CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-[2rem] border-slate-100 shadow-2xl p-4 space-y-3">
              <div className="space-y-1 px-2">
                 <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-0">Plantillas de Packs</DropdownMenuLabel>
                 <p className="text-[9px] text-slate-400 leading-none">Carga productos predefinidos al instante.</p>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.keys(presets).map(key => (
                  <button 
                    key={key} 
                    onClick={() => injectPreset(key)} 
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#4A7C59]/5 text-slate-600 font-bold text-xs transition-all group/btn"
                  >
                     <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:shadow-sm">
                        <Plus className="h-4 w-4 text-slate-400" />
                     </div>
                     {key}
                  </button>
                ))}
              </div>
              <DropdownMenuSeparator className="bg-slate-50" />
              <div className="space-y-3 p-2">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-0 text-center">Importar Catálogo</DropdownMenuLabel>
                <label className="flex flex-col items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 p-6 rounded-[1.5rem] border-dashed border-2 border-slate-200 transition-all cursor-pointer group/import">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover/import:scale-110 transition-transform">
                     <Upload className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subir .CSV (Excel)</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                </label>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
             onClick={() => {
               const newId = Date.now();
               setConfig({
                 ...config,
                 galeria: [{ 
                   id: newId, 
                   src: '', 
                   alt: 'Nuevo Artículo', 
                   categoria: activeGalleryTab === 'todos' ? 'social' : activeGalleryTab,
                   activa: true,
                   precio: 0,
                   stock: 0,
                   mostrarPrecio: true
                 }, ...config.galeria]
               })
             }}
            variant="outline" 
            className="h-12 rounded-[1.2rem] border-slate-200 text-[11px] font-black uppercase tracking-widest px-5 hover:bg-slate-50"
          >
            <PlusCircle className="h-4 w-4 mr-2 text-slate-400" />
            Borrador vacío
          </Button>

          <label className="h-12 bg-black hover:bg-slate-800 text-white gap-3 rounded-[1.2rem] px-6 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.2)] flex items-center cursor-pointer transition-all transform active:scale-95">
            <Upload className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Añadir con Foto</span>
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
                    activa: true,
                    precio: 0,
                    stock: 0,
                    mostrarPrecio: true
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
               <Package className="h-8 w-8 text-slate-300" />
            </div>
            <div className="space-y-1">
               <p className="text-lg font-black text-slate-800">No hay productos aquí</p>
               <p className="text-sm text-slate-400">Escoge otra categoría o crea uno nuevo arriba.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
