'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  FolderPlus, 
  LayoutGrid, 
  List, 
  GripVertical, 
  Layers, 
  Info 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Category, Product } from '@/types'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableCategoryProps {
  category: any
  viewMode: 'grid' | 'list'
  handleOpen: (category: any) => void
  handleDelete: (id: string, count: number, confirmed?: boolean) => void
}

function SortableCategory({ category, viewMode, handleOpen, handleDelete }: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      {viewMode === 'grid' ? (
        <Card className="overflow-hidden border-none shadow-sm bg-muted/30 hover:bg-muted/50 transition-colors relative group rounded-2xl sm:rounded-3xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex justify-between items-start gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white rounded-lg transition-all shrink-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                  </button>
                  <h3 className="font-bold text-base sm:text-lg truncate">{category.name}</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 pl-8 sm:pl-9 mt-0.5">{category.description || 'Sin descripción'}</p>
                <div className="mt-2.5 flex items-center gap-2 pl-8 sm:pl-9 text-[10px] sm:text-xs">
                  <span className="bg-white px-2.5 py-1 rounded-full border border-slate-100 font-bold text-slate-500 shadow-sm">
                    {category._count?.products || 0} PRODUCTOS
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button 
                  onClick={() => handleOpen(category)}
                  className="p-2.5 sm:p-2 bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100/50 active:scale-90"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="p-2.5 sm:p-2 bg-white rounded-xl transition-all text-red-400 hover:text-red-600 shadow-sm border border-slate-100/50 active:scale-90"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-[2rem] sm:rounded-[2.5rem] border-none p-6 sm:p-8 gap-6 shadow-2xl">
                    <AlertDialogHeader className="gap-3">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                        <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 text-red-500" />
                      </div>
                      <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Eliminar categoría?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm sm:text-base">
                        Estás a punto de borrar la categoría <span className="font-extrabold text-slate-900">&quot;{category.name}&quot;</span>. Esta acción es permanente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-2">
                      <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 order-2 sm:order-1">Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(category.id, category._count?.products || 0, true)}
                        className="h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none order-1 sm:order-2"
                      >
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/20 border-b hover:bg-muted/40 transition-colors rounded-xl sm:rounded-2xl group">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white rounded-lg transition-all shrink-0">
              <GripVertical className="h-4 w-4 text-muted-foreground/30" />
            </button>
            <div className="h-9 w-9 sm:h-11 sm:w-11 bg-white rounded-xl flex items-center justify-center border text-[10px] sm:text-xs font-black text-slate-400 shrink-0 shadow-sm">
              {category.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">{category.name}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-tight">{category._count?.products || 0} PRODUCTOS</p>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
             <button 
              onClick={() => handleOpen(category)}
              className="p-2 sm:p-2.5 bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100/50 active:scale-90"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  className="p-2 sm:p-2.5 bg-white rounded-xl transition-all text-red-400 hover:text-red-600 shadow-sm border border-slate-100/50 active:scale-90"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-[2.5rem] border-none p-6 sm:p-8 gap-6 shadow-2xl">
                <AlertDialogHeader className="gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                    <Trash2 className="h-7 w-7 text-red-500" />
                  </div>
                  <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Eliminar categoría?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                    Vas a borrar <span className="font-extrabold text-slate-900">&quot;{category.name}&quot;</span>. Los productos asociados no se borrarán, pero quedarán sin categoría.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-2">
                  <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 order-2 sm:order-1">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDelete(category.id, category._count?.products || 0, true)}
                    className="h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none order-1 sm:order-2"
                  >
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}

interface CategoriesTabProps {
  categories: Category[]
  products?: Product[]
  onRefresh: () => void
}

export function CategoriesTab({ categories, products = [], onRefresh }: CategoriesTabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  // Calcular productos sin categoría
  const orphanedProducts = products.filter(p => !p.categoryId)
  const orphanedCount = orphanedProducts.length

  // Enriquecer categorías con conteos reales si se proporcionan productos
  const enrichedCategories = localCategories.map(cat => ({
    ...cat,
    _count: {
      products: products.filter(p => p.categoryId === cat.id).length
    }
  }))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleOpen = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || ''
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '', image: '' })
    }
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const url = '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      const body = editingCategory ? { ...formData, id: editingCategory.id } : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Error al guardar')

      toast({ title: 'Éxito', description: `Categoría ${editingCategory ? 'actualizada' : 'creada'} correctamente` })
      setIsOpen(false)
      onRefresh()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudo guardar la categoría', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, count: number, confirmed = false) => {
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast({ title: 'Éxito', description: 'Categoría eliminada' })
      onRefresh()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = localCategories.findIndex(item => item.id === active.id)
      const newIndex = localCategories.findIndex(item => item.id === over.id)
      
      const newItems = arrayMove(localCategories, oldIndex, newIndex)
      setLocalCategories(newItems)
      
      try {
        const itemsToUpdate = newItems.map((item, index) => ({
          id: item.id,
          sortOrder: index
        }))
        
        await fetch('/api/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'category', items: itemsToUpdate })
        })
      } catch (error) {
        console.error('Error reordering categories:', error)
        toast({ title: 'Error', description: 'No se pudo guardar el nuevo orden', variant: 'destructive' })
      } finally {
        onRefresh() // reset to server state
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Botones de acción flotantes para móvil si es necesario, o integrados arriba */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-[2.5rem] border shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A7C59]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-110" />
        
        <div className="flex-1 space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-[#4A7C59]/10 flex items-center justify-center">
               <Layers className="h-5 w-5 text-[#4A7C59]" />
             </div>
             Inventario Global
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1 ml-12">Organiza tu catálogo por categorías dinámicas.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 relative z-10">
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl sm:rounded-[1.5rem] backdrop-blur-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white shadow-lg text-black scale-105' : 'text-slate-400 hover:text-black'}`}
            >
              <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 ${viewMode === 'list' ? 'bg-white shadow-lg text-black scale-105' : 'text-slate-400 hover:text-black'}`}
            >
              <List className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          <button 
            onClick={() => handleOpen()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-black text-white px-8 py-4 sm:py-3.5 rounded-2xl sm:rounded-[1.5rem] hover:bg-black/90 transition-all shadow-xl shadow-black/10 active:scale-95 text-xs font-black uppercase tracking-widest leading-none h-14"
          >
            <Plus className="h-5 w-5" /> Nueva Categoría
          </button>
        </div>
      </div>

      <div className="bg-slate-50/40 rounded-[3.5rem] p-3 sm:p-8 border border-slate-100/50 min-h-[500px] relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
             <div className="relative">
                <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center shadow-xl animate-pulse">
                  <Layers className="h-8 w-8 text-[#4A7C59]" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[#4A7C59] border-4 border-slate-50 flex items-center justify-center">
                   <div className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                </div>
             </div>
             <div className="space-y-1 text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 leading-none">Actualizando</p>
               <p className="text-[10px] font-bold text-slate-400">Sincronizando con base de datos...</p>
             </div>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={localCategories.map(c => c.id)}
              strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" 
                : "flex flex-col gap-4 max-w-4xl mx-auto"
              }>
                {enrichedCategories.map((category) => (
                  <SortableCategory 
                    key={category.id} 
                    category={category} 
                    viewMode={viewMode}
                    handleOpen={handleOpen}
                    handleDelete={handleDelete}
                  />
                ))}

                {orphanedCount > 0 && (
                  <div className={`flex items-center justify-between p-6 sm:p-8 bg-blue-900/5 border-2 border-dashed border-blue-100 rounded-[2.5rem] group transition-all hover:bg-white hover:border-blue-400/30 hover:shadow-xl hover:shadow-blue-500/5 ${viewMode === 'list' ? 'w-full' : ''}`}>
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center border border-blue-50 text-xs font-bold text-blue-500 shadow-sm relative">
                        <div className="absolute inset-0 bg-blue-500/5 rounded-3xl animate-pulse" />
                        <span className="relative z-10 text-xl font-black">?</span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black text-slate-900 text-lg">Sin Categoría Definida</h3>
                        <p className="text-xs text-blue-500 font-black uppercase tracking-widest">{orphanedCount} productos pendientes</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 font-extrabold px-4 py-2 rounded-2xl text-[10px] uppercase tracking-widest">
                       MISCELÁNEA
                    </Badge>
                  </div>
                )}

                {localCategories.length === 0 && (
                  <div className="col-span-full py-32 text-center animate-in zoom-in duration-1000">
                    <div className="h-32 w-32 mx-auto mb-8 rounded-[3rem] bg-white border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-[#4A7C59]/30 transition-colors">
                      <FolderPlus className="h-12 w-12 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Comienza tu Catálogo</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10 px-6">Para empezar a vender, crea primero las categorías que darán forma a tu tienda online.</p>
                    <Button onClick={() => handleOpen()} className="bg-black text-white hover:bg-slate-800 rounded-[1.5rem] h-14 px-10 font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 leading-none">
                       Crear mi primera categoría
                    </Button>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="p-8 rounded-[3rem] bg-indigo-50/50 border border-indigo-100/50 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl saturate-200" />
        <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center shrink-0 shadow-xl border border-indigo-50 relative z-10 scale-110">
           <Info className="h-8 w-8 text-indigo-500" />
        </div>
        <div className="text-center sm:text-left relative z-10 space-y-2">
           <h4 className="text-base sm:text-lg font-black text-indigo-900 uppercase tracking-[0.2em]">Configuración de Reordenación</h4>
           <p className="text-xs sm:text-sm font-medium text-indigo-600/80 leading-relaxed max-w-2xl">
             Personaliza el flujo de navegación de tus clientes. Simplemente arrastra cualquiera de las tarjetas anteriores para establecer el orden de aparición exacto en el escaparate público.
           </p>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] sm:rounded-3xl bg-white/95 backdrop-blur-xl">
          <div className="bg-[#4A7C59] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-white/90">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mt-1">
                Panel de control de inventario
              </p>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label 
                htmlFor="name" 
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1"
              >
                Nombre de la categoría
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Álbumes de Boda"
                className="h-12 bg-slate-50 border-none rounded-xl font-bold uppercase tracking-tight placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-[#4A7C59]/20"
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="description" 
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1"
              >
                Descripción (opcional)
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción del grupo de productos..."
                className="w-full p-4 bg-slate-50 border-none rounded-xl font-medium text-sm text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-[#4A7C59]/20 outline-none resize-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="image" 
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1"
              >
                URL de imagen (miniatura)
              </label>
              <div className="relative group">
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="h-12 bg-slate-50 border-none rounded-xl font-mono text-xs text-[#4A7C59] placeholder:text-slate-300 pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-5 sm:p-6 bg-slate-50/50 border-t border-slate-100/50 flex-col sm:flex-row gap-3 sm:gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all order-2 sm:order-1 px-4"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="h-12 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#4A7C59] transition-all shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50 order-1 sm:order-2 px-6"
            >
              {loading ? 'Sincronizando...' : 'Guardar Cambios'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
