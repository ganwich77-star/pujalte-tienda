'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  ImageIcon, Trash2, Upload, PlusCircle, LayoutGrid, Eye, EyeOff, GripVertical, Package, Plus
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
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
          {/* Icono */}
          <div className="w-16 h-16 rounded-full bg-red-100 border-4 border-white shadow-lg flex items-center justify-center">
            <Trash2 className="h-7 w-7 text-red-500" />
          </div>

          {/* Texto */}
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">¿Eliminar artículo?</h3>
            <p className="text-sm text-slate-500">
              Se borrará <span className="font-bold text-slate-700">&ldquo;{productName}&rdquo;</span> de forma permanente.
            </p>
          </div>

          {/* Botones */}
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
  showGalleryImages, 
  handleFileUpload, 
  config, 
  setConfig,
  categories,
  isDragging
}: { 
  img: GalleryImage, 
  showGalleryImages: boolean, 
  handleFileUpload: any, 
  config: LandingConfig, 
  setConfig: any,
  categories: string[],
  isDragging?: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    position: 'relative' as const,
    backgroundColor: isDragging ? 'white' : 'transparent',
  }

  const updateImg = (updates: Partial<GalleryImage>) => {
    const newGaleria = config.galeria.map(g => 
      g.id === img.id ? { ...g, ...updates } : g
    )
    setConfig({...config, galeria: newGaleria})
  }

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={`group/row transition-colors border-slate-100/50 ${isDragging ? 'shadow-2xl ring-1 ring-[#4A7C59]/20' : 'hover:bg-slate-50/50'}`}
    >
      <TableCell className="w-[40px] pl-6">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-[#4A7C59] transition-colors rounded-lg hover:bg-[#4A7C59]/5">
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>

      <TableCell className="w-[80px]">
        <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center group/img shadow-sm">
          {img.src ? (
            <img src={fixPath(img.src)} alt={img.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-300" />
          )}
          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]">
            <Upload className="h-4 w-4 text-white mb-1" />
            <span className="text-[8px] font-bold text-white uppercase tracking-widest">Cambiar</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 1/1, (url: string) => updateImg({ src: url }))}
            />
          </label>
        </div>
      </TableCell>

      <TableCell className="w-[280px] max-w-[280px]">
        <div className="space-y-1 py-2 overflow-hidden">
          <input 
            value={img.alt} 
            onChange={(e) => updateImg({ alt: e.target.value })}
            placeholder="Nombre del producto..."
            className="w-full bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-normal text-sm h-6 truncate"
          />
          <input 
            value={img.descripcion || ''} 
            placeholder="Descripción opcional..."
            onChange={(e) => updateImg({ descripcion: e.target.value })}
            className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-slate-400 font-medium h-4 italic truncate"
          />
        </div>
      </TableCell>

      <TableCell className="w-[180px]">
        <Select 
          value={img.categoria} 
          onValueChange={(val) => updateImg({ categoria: val })}
        >
          <SelectTrigger className="h-10 w-full bg-slate-50 border-slate-100 text-slate-600 font-bold hover:bg-white hover:border-[#4A7C59]/20 transition-all rounded-xl px-4 text-[11px] uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl overflow-hidden">
            {categories.map(cat => (
              <SelectItem key={cat} value={cat} className="capitalize text-xs font-bold py-3 focus:bg-[#4A7C59]/5 focus:text-[#4A7C59]">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>


      <TableCell className="text-center w-[100px]">
        <button
          onClick={() => updateImg({ activa: !img.activa })}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            img.activa 
              ? 'bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20' 
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          {img.activa ? 'Visible' : 'Oculto'}
        </button>
      </TableCell>

      <TableCell className="text-right pr-6">
        <div className="flex items-center justify-end gap-1">
           <Button 
             size="icon" 
             variant="ghost" 
             onClick={() => setConfirmDelete(true)}
             className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50/50 transition-all"
           >
             <Trash2 className="h-4 w-4" />
           </Button>
        </div>
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
      </TableCell>
    </TableRow>
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
    useSensor(PointerSensor),
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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm w-full">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3 bg-gray-50/50 p-2 px-3 rounded-xl border border-gray-50">
            <Switch 
              id="show-images" 
              checked={showGalleryImages} 
              onCheckedChange={setShowGalleryImages} 
              className="data-[state=checked]:bg-black scale-90"
            />
            <Label htmlFor="show-images" className="text-[10px] font-bold tracking-widest uppercase text-gray-400 cursor-pointer">
              Imágenes
            </Label>
          </div>
          <div className="h-4 w-px bg-gray-100 hidden lg:block" />
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-x-auto max-w-[400px] no-scrollbar">
            {['todos', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveGalleryTab(cat)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                  activeGalleryTab === cat 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl bg-white border-gray-200 text-xs font-semibold px-4 flex items-center gap-2">
                 <LayoutGrid className="h-4 w-4" />
                 Importar / Plantillas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl border-gray-100 shadow-xl p-2">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 py-1.5">Plantillas de Packs</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(presets).map(key => (
                <DropdownMenuItem key={key} onClick={() => injectPreset(key)} className="rounded-xl cursor-pointer">
                   {key}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 py-1.5">Desde Excel</DropdownMenuLabel>
              <div className="px-2 pb-2">
                <label className="flex items-center gap-2 w-full bg-gray-50 hover:bg-gray-100 p-2 rounded-xl text-xs font-semibold cursor-pointer border-dashed border-2 border-gray-200 transition-all">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Subir Excel (.csv)
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                </label>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
             onClick={() => {
               setConfig({
                 ...config,
                 galeria: [...config.galeria, { 
                   id: Date.now(), 
                   src: '', 
                   alt: 'Nuevo Item', 
                   categoria: activeGalleryTab === 'todos' ? 'social' : activeGalleryTab,
                   activa: true,
                   precio: 0,
                   stock: 0
                 }]
               })
             }}
            variant="ghost" 
            className="rounded-xl border border-gray-200 text-xs font-semibold px-4"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Sin foto
          </Button>

          <label className="bg-black hover:bg-gray-800 text-white gap-2 rounded-xl px-4 py-2 shadow-sm flex items-center cursor-pointer transition-all flex-shrink-0">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">Nuevo Producto</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 1/1, (url) => {
                setConfig({
                  ...config,
                  galeria: [...config.galeria, { 
                    id: Date.now(), 
                    src: url, 
                    alt: 'Nueva Imagen', 
                    categoria: activeGalleryTab === 'todos' ? 'social' : activeGalleryTab,
                    activa: true,
                    precio: 0,
                    stock: 0
                  }]
                })
              })}
            />
          </label>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-[2rem] overflow-hidden">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-100">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[80px] text-[10px] font-bold tracking-widest uppercase">Img</TableHead>
                <TableHead className="text-[10px] font-bold tracking-widest uppercase">Nombre</TableHead>
                <TableHead className="text-[10px] font-bold tracking-widest uppercase">Categoría</TableHead>
                <TableHead className="text-[10px] font-bold tracking-widest uppercase text-center">Estado</TableHead>
                <TableHead className="text-[10px] font-bold tracking-widest uppercase text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext 
                items={filteredGallery.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredGallery.map((img) => (
                  <SortableProductRow 
                    key={img.id} 
                    img={img} 
                    showGalleryImages={showGalleryImages}
                    handleFileUpload={handleFileUpload}
                    config={config}
                    setConfig={setConfig}
                    categories={categories}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
        
        {filteredGallery.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <ImageIcon className="h-12 w-12 text-gray-100 mx-auto" />
            <p className="text-gray-400 font-light">No hay productos en esta categoría</p>
          </div>
        )}
      </Card>
    </div>
  )
}
