'use client'

import React, { useState } from 'react'
import { Plus, Trash2, GripVertical, Save, X, Edit2, Layers, Tag as TagIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GalleryImage } from '@/lib/landing-config'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CategoryItemProps {
  id: string
  name: string
  onDelete: (name: string) => void
  onEdit: (oldName: string, newName: string) => void
  count: number
}

const SortableCategoryItem = ({ id, name, onDelete, onEdit, count }: CategoryItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  }

  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(name)

  const handleSave = () => {
    if (tempName.trim()) {
      onEdit(name, tempName.trim())
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 mb-2 bg-[#F8FAFC] rounded-2xl border border-slate-100 transition-all duration-300 hover:border-[#4A7C59]/20 hover:bg-white hover:shadow-xl hover:shadow-[#4A7C59]/5 ${isDragging ? 'ring-2 ring-[#4A7C59] shadow-2xl scale-[1.02]' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-[#4A7C59]">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="h-9 text-sm rounded-xl border-slate-200 focus:ring-[#4A7C59] focus:border-[#4A7C59]"
              autoFocus
            />
            <Button size="icon" onClick={handleSave} variant="ghost" className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 rounded-xl">
              <Save className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={() => setIsEditing(false)} variant="ghost" className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#4A7C59] shadow-sm">
                <TagIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{name}</span>
              <Badge variant="secondary" className="bg-[#4A7C59]/5 text-[#4A7C59] border-none text-[10px] font-bold px-2 py-0 h-5">
                {count} {count === 1 ? 'producto' : 'productos'}
              </Badge>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl hover:bg-white" onClick={() => {
              setTempName(name)
              setIsEditing(true)
            }}>
              <Edit2 className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(name)}
        className="h-9 w-9 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface CategoriesTabProps {
  categories: string[]
  products: GalleryImage[]
  onUpdate: (newCategories: string[]) => void
}

export default function CategoriesTab({ categories, products, onUpdate }: CategoriesTabProps) {
  const [newCategory, setNewCategory] = useState('')

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
      const oldIndex = categories.indexOf(active.id as string)
      const newIndex = categories.indexOf(over.id as string)
      onUpdate(arrayMove(categories, oldIndex, newIndex))
    }
  }

  const handleAdd = () => {
    const trimmed = newCategory.trim().toLowerCase()
    if (trimmed && !categories.map(c => c.toLowerCase()).includes(trimmed)) {
      onUpdate([...categories, newCategory.trim()])
      setNewCategory('')
    }
  }

  const handleDelete = (name: string) => {
    if (confirm(`¿Eliminar categoría "${name}"?`)) {
      onUpdate(categories.filter(c => c !== name))
    }
  }

  const handleEdit = (oldName: string, newName: string) => {
    if (oldName === newName) return
    onUpdate(categories.map(c => c === oldName ? newName : c))
  }

  return (
    <div className="space-y-6">
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#4A7C59]/10 flex items-center justify-center text-[#4A7C59]">
                    <Layers className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-800">Categorías</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Organización del Portfolio</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="Nueva categoría..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="h-10 w-64 rounded-xl border-slate-200 bg-white"
                />
                <Button onClick={handleAdd} className="h-10 bg-[#4A7C59] hover:bg-[#3d664a] text-white rounded-xl px-5 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-[#4A7C59]/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                </Button>
            </div>
        </header>

        <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-6 border border-slate-100 shadow-sm min-h-[400px]">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={categories}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                        {categories.map((cat) => (
                            <SortableCategoryItem
                                key={cat}
                                id={cat}
                                name={cat}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                count={products.filter(p => p.categoria === cat).length}
                            />
                        ))}
                        
                        {(() => {
                            const orphanCount = products.filter(p => !categories.includes(p.categoria)).length
                            if (orphanCount > 0) {
                                return (
                                    <div className="flex items-center gap-3 p-3 mb-2 bg-amber-50 rounded-2xl border border-amber-100/50">
                                        <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                                            <TagIcon className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-amber-900 uppercase tracking-tight italic">SIN CATEGORÍA</span>
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none text-[10px] font-bold px-2 py-0 h-5">
                                                {orphanCount} productos
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        })()}

                        {categories.length === 0 && products.length === 0 && (
                            <div className="col-span-2 py-12 text-center text-slate-400 uppercase tracking-widest text-xs font-bold">
                                No hay categorías definidas
                            </div>
                        )}
                    </div>
                </SortableContext>
            </DndContext>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
             <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <X className="h-4 w-4" />
             </div>
             <p className="text-[11px] text-amber-800 leading-relaxed font-bold uppercase tracking-tight">
                <strong>Importante:</strong> Al renombrar o eliminar una categoría, los productos antiguos mantendrán su etiqueta original hasta que los edites manualmente en la pestaña de galería.
             </p>
        </div>
    </div>
  )
}
