'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, FolderPlus, LayoutGrid, List, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Category } from '@/types'
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
    <div ref={setNodeRef} style={style}>
      {viewMode === 'grid' ? (
        <Card className="overflow-hidden border-none shadow-sm bg-muted/30 hover:bg-muted/50 transition-colors relative group">
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white rounded transition-opacity">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                  </button>
                  <h3 className="font-bold text-lg">{category.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 pl-7">{category.description || 'Sin descripción'}</p>
                <div className="mt-2 flex items-center gap-2 pl-7">
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full border">
                    {category._count?.products || 0} productos
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpen(category)}
                  className="p-2 bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100/50"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="p-2 bg-white rounded-lg transition-all text-red-400 hover:text-red-600 shadow-sm border border-slate-100/50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2.5rem] border-none p-8 gap-6 shadow-2xl">
                    <AlertDialogHeader className="gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                        <Trash2 className="h-7 w-7 text-red-500" />
                      </div>
                      <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">¿Eliminar categoría?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                        Estás a punto de borrar la categoría <span className="font-extrabold text-slate-900">&quot;{category.name}&quot;</span>. Esta acción es permanente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                      <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(category.id, category._count?.products || 0, true)}
                        className="h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none"
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
        <div className="flex items-center justify-between p-4 bg-muted/20 border-b hover:bg-muted/40 transition-colors rounded-xl group">
          <div className="flex items-center gap-4">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white rounded transition-opacity">
              <GripVertical className="h-4 w-4 text-muted-foreground/30" />
            </button>
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border text-xs font-bold text-muted-foreground">
              {category.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold">{category.name}</h3>
              <p className="text-xs text-muted-foreground">{category._count?.products || 0} productos activos</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button 
              onClick={() => handleOpen(category)}
              className="p-2 bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100/50"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  className="p-2 bg-white rounded-xl transition-all text-red-400 hover:text-red-600 shadow-sm border border-slate-100/50"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2.5rem] border-none p-8 gap-6 shadow-2xl">
                <AlertDialogHeader className="gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                    <Trash2 className="h-7 w-7 text-red-500" />
                  </div>
                  <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">¿Eliminar categoría?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                    Vas a borrar <span className="font-extrabold text-slate-900">&quot;{category.name}&quot;</span>. Los productos asociados no se borrarán, pero quedarán sin categoría.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                  <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDelete(category.id, category._count?.products || 0, true)}
                    className="h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none"
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
  onRefresh: () => void
}

export function CategoriesTab({ categories, onRefresh }: CategoriesTabProps) {
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
    // El servidor ya no bloquea esto, y el aviso del diálogo confirma que se pueden borrar.
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
        console.error('Failed to update order:', error)
        toast({ title: 'Error', description: 'No se pudo guardar el nuevo orden', variant: 'destructive' })
        onRefresh() // reset to server state
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Gestionar Categorías</h2>
          <div className="flex bg-muted p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-muted-foreground hover:text-black'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-muted-foreground hover:text-black'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
            Arrastra para reordenar
          </p>
        </div>
        <button 
          onClick={() => handleOpen()}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl hover:bg-black/90 transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" /> Nueva Categoría
        </button>
      </div>

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
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "flex flex-col gap-2"
          }>
            {localCategories.map((category) => (
              <SortableCategory 
                key={category.id} 
                category={category} 
                viewMode={viewMode}
                handleOpen={handleOpen}
                handleDelete={handleDelete}
              />
            ))}

            {localCategories.length === 0 && (
              <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border-2 border-dashed">
                <FolderPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No hay categorías creadas aún.</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white/95 backdrop-blur-xl">
          <div className="bg-[#4A7C59] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-white/90">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <p className="text-[#4A7C59]-100/60 text-[10px] font-bold uppercase tracking-wider mt-1">
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

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100/50 gap-2 sm:gap-0">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-[2] h-12 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#4A7C59] transition-all shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Sincronizando...' : 'Guardar Cambios'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

