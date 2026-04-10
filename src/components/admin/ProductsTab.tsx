'use client'

import React, { useState } from 'react'
import { 
  Plus, Package, Edit, Trash2, Eye, EyeOff, Save, ImageIcon, 
  ImageOff, Upload, MoreVertical, GripVertical, Check, X as CloseIcon, ZoomIn, ZoomOut,
  ArrowUpDown, ArrowUp, ArrowDown, Info, AlertCircle, Banknote, Sparkles, Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Checkbox } from "@/components/ui/checkbox"
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'
import { toast } from '@/hooks/use-toast'
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
import { Card, CardContent } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Product, Category } from '@/types'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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

interface ProductsTabProps {
  products: Product[]
  categories: Category[]
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onUpdateProductField: (id: string, field: string, value: any) => void
  onToggleActive: (product: Product) => void
  onDeleteProduct: (id: string) => void
  onReorderProducts: (products: Product[]) => void
  formatPrice: (price: number) => string
  showImages: boolean
  setShowImages: (show: boolean) => void
  isProductDialogOpen: boolean
  setIsProductDialogOpen: (open: boolean) => void
  productForm: any
  setProductForm: (form: any) => void
  editingProduct: Product | null
  onSaveProduct: () => void
  addVariant: () => void
  updateVariant: (index: number, field: string, value: any) => void
  removeVariant: (index: number) => void,
  resetProductForm: () => void
  suppliers?: any[]
}

// Helper para arreglar rutas con el basePath de Hostinger
const fixPath = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  let cleanPath = path.replace('/', '')
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`
  return `/pujaltefotografia${cleanPath}`
}

function SortableProductRow({ 
  product, 
  showImages, 
  onEditProduct, 
  onUpdateProductField, 
  onToggleActive, 
  onDeleteProduct, 
  formatPrice,
  categories,
  onImageClick,
  isSelected,
  onSelect
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style}
      className={`group border-b border-border/40 transition-colors h-24 sm:h-24 ${isDragging ? 'bg-primary/5 shadow-inner' : 'hover:bg-muted/30'}`}
    >
      <TableCell className="w-8 sm:w-10 pl-3 sm:pl-6 h-24 sm:h-24">
        <div className="flex items-center gap-2 sm:gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 hover:bg-black/5 rounded-lg transition-colors">
            <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={() => onSelect(product.id)}
            className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-black data-[state=checked]:border-black h-4 w-4 sm:h-5 sm:w-5"
          />
        </div>
      </TableCell>
      <TableCell className="w-16 sm:w-20 pl-1 sm:pl-2">
        <div 
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-muted/30 border border-border/40 group/img cursor-pointer shadow-sm mx-auto sm:ml-2"
          onClick={() => onImageClick(product)}
        >
          {product.image ? (
            <>
              <img src={fixPath(product.image)} alt={product.name} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon className="text-white h-5 w-5" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="h-6 w-6 text-muted-foreground/20" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="min-w-[140px] sm:min-w-[200px]">
        <div className="flex flex-col gap-0.5 sm:gap-1 py-1">
          <input 
            value={product.name} 
            onChange={(e) => onUpdateProductField(product.id, 'name', e.target.value)}
            className="font-black text-xs sm:text-[13px] uppercase tracking-tight bg-transparent border-none focus:ring-0 p-0 w-full outline-none placeholder:opacity-20 truncate"
            placeholder="Nombre..."
          />
          <span className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-30 px-0.5">#{product.id.slice(-6).toUpperCase()}</span>
        </div>
      </TableCell>
      <TableCell className="w-32 sm:w-48 text-center px-2 sm:px-4">
        <Select 
          value={product.categoryId || 'none'} 
          onValueChange={(val) => onUpdateProductField(product.id, 'categoryId', val === 'none' ? null : val)}
        >
          <SelectTrigger className="h-8 sm:h-9 border-none bg-muted/30 hover:bg-muted/50 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] uppercase font-black tracking-widest px-2 sm:px-4 focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            <SelectItem value="none" className="text-[10px] font-bold uppercase tracking-widest py-3">Sin Categoría</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-bold uppercase tracking-widest py-3">{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="min-w-[140px] sm:min-w-[180px] text-center p-2 sm:p-4">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {/* Toggle Active (Estado) */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onToggleActive(product)}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl border transition-all shadow-sm active:scale-95 ${
              product.active 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
            title={product.active ? 'Habilitado' : 'Oculto'}
          >
            {product.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>

          {/* Novedad */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onUpdateProductField(product.id, 'isNew', !product.isNew)}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl border transition-all shadow-sm active:scale-95 ${
              product.isNew 
                ? 'bg-amber-50 text-amber-500 border-amber-100 hover:bg-amber-100' 
                : 'bg-slate-50 text-slate-300 border-slate-100 hover:bg-slate-100'
            }`}
            title={product.isNew ? 'Novedad Activa' : 'Marcar como Novedad'}
          >
            <Sparkles className="h-4 w-4" />
          </Button>

          {/* Editar */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onEditProduct(product)} 
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Edit className="h-4 w-4" />
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="rounded-[2.5rem] border-none p-8 gap-6 shadow-2xl">
              <AlertDialogHeader className="gap-3">
                <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                  <Trash2 className="h-7 w-7 text-red-500" />
                </div>
                <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">¿Eliminar producto?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                  Estás a punto de eliminar <span className="font-extrabold text-slate-900">&quot;{product.name}&quot;</span>. Esta acción no se puede deshacer y desaparecerá de la tienda.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDeleteProduct(product.id)}
                  className="h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none"
                >
                  Sí, eliminar ahora
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function ProductsTab({ 
  products, 
  categories,
  onAddProduct,
  onEditProduct, 
  onUpdateProductField, 
  onToggleActive, 
  onDeleteProduct, 
  onReorderProducts, 
  formatPrice,
  showImages,
  setShowImages,
  isProductDialogOpen,
  setIsProductDialogOpen,
  productForm,
  setProductForm,
  editingProduct,
  onSaveProduct,
  addVariant,
  updateVariant,
  removeVariant,
  resetProductForm,
  suppliers = []
}: ProductsTabProps) {
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [croppingProduct, setCroppingProduct] = useState<Product | null>(null)
  const [cropForForm, setCropForForm] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc' | null}>({ key: '', direction: null })

  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const formImageInputRef = React.useRef<HTMLInputElement>(null)

  const sortedProducts = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return products

    return [...products].sort((a: any, b: any) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      if (sortConfig.key === 'categoryId') {
        const catA = categories.find(c => c.id === aVal)?.name || ''
        const catB = categories.find(c => c.id === bVal)?.name || ''
        aVal = catA
        bVal = catB
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [products, sortConfig, categories])

  const toggleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = () => {
    selectedIds.forEach(id => onDeleteProduct(id))
    setSelectedIds([])
  }

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleApplyCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return
    setIsUploadingImage(true)
    
    try {
      const croppedBase64 = await getCroppedImg(cropImage, croppedAreaPixels)
      
      // Convertir base64 a File para la subida
      const response = await fetch(croppedBase64)
      const blob = await response.blob()
      const file = new File([blob], `producto-${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadRes.ok) throw new Error('Error al subir imagen a la nube')
      
      const { url } = await uploadRes.json()
      
      if (cropForForm) {
        setProductForm({ ...productForm, image: url })
        setCropForForm(false)
        toast({ title: 'Imagen lista', description: 'La foto se ha subido correctamente' })
      } else if (croppingProduct) {
        onUpdateProductField(croppingProduct.id, 'image', url)
      }
      
      setCropImage(null)
      setCroppingProduct(null)
    } catch (e: any) {
      console.error(e)
      toast({ 
        title: 'Error de subida', 
        description: e.message || 'No se pudo procesar o subir la imagen', 
        variant: 'destructive' 
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCropImage(reader.result as string)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  const handleFormImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCropForForm(true)
        setCropImage(reader.result as string)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id)
      const newIndex = products.findIndex((p) => p.id === over.id)
      const newProducts = arrayMove(products, oldIndex, newIndex)
      onReorderProducts(newProducts)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Premium Unificado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 sm:p-16 bg-black/5 rounded-full blur-3xl -mr-8 -mt-8 sm:-mr-12 sm:-mt-12 transition-all group-hover:bg-black/10" />
        
        <div className="flex flex-col gap-1.5 sm:gap-2 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-black flex items-center justify-center text-white shadow-2xl shadow-black/20 transform transition-transform group-hover:scale-110">
              <Package className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">ELEMENTOS</h2>
              <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de catálogo</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto relative z-10">
          {selectedIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex-1 sm:flex-none rounded-xl sm:rounded-2xl gap-2 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] px-4 sm:px-6 h-10 sm:h-11 shadow-lg shadow-red-500/20 active:scale-95"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 w-4" />
                  <span>Borrar {selectedIds.length}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none p-6 sm:p-8 gap-6 shadow-2xl w-[92vw] max-w-md mx-auto">
                <AlertDialogHeader className="gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                    <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 text-red-500" />
                  </div>
                  <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Eliminar {selectedIds.length} elementos?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-slate-500 font-medium leading-relaxed">
                    Esta acción no se puede deshacer. Los elementos seleccionados se borrarán permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                  <AlertDialogCancel className="flex-1 h-11 sm:h-12 px-4 sm:px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkDelete}
                    className="flex-1 h-11 sm:h-12 px-4 sm:px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={onAddProduct} className="flex-1 sm:flex-none rounded-xl sm:rounded-2xl gap-2 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] px-4 sm:px-6 h-10 sm:h-11 bg-black hover:bg-black/90 text-white shadow-xl shadow-black/10 active:scale-95">
            <Plus className="h-3 w-3 sm:h-4 w-4" />
            <span className="truncate">Nuevo Elemento</span>
          </Button>
        </div>
      </div>

      <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-2xl shadow-black/5 overflow-hidden bg-white/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)] sm:h-[65vh] w-full">
            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto min-w-full">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <Table className="min-w-full">
                  <TableHeader className="bg-muted/40 sticky top-0 z-20 backdrop-blur-md">
                    <TableRow className="border-b border-border/40 hover:bg-transparent h-14">
                      <TableHead className="w-14 pl-6 h-14">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={selectedIds.length === products.length && products.length > 0}
                            onCheckedChange={handleSelectAll}
                            className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-black data-[state=checked]:border-black h-5 w-5"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="w-20 h-14 uppercase text-[10px] font-black tracking-widest opacity-50 pl-4">FOTO</TableHead>
                      
                      <TableHead 
                        className="min-w-[200px] h-14 uppercase text-[10px] font-black tracking-widest opacity-50 cursor-pointer hover:text-black transition-colors"
                        onClick={() => toggleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Nombre
                          {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-20" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="w-48 h-14 uppercase text-[10px] font-black tracking-widest opacity-50 text-center cursor-pointer hover:text-black transition-colors"
                        onClick={() => toggleSort('categoryId')}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Cat.
                          {sortConfig.key === 'categoryId' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-20" />}
                        </div>
                      </TableHead>
                      <TableHead className="w-52 text-center h-14 uppercase text-[10px] font-black tracking-widest opacity-50">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext items={sortedProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                      {sortedProducts.length > 0 ? sortedProducts.map(product => (
                        <SortableProductRow 
                          key={product.id}
                          product={product}
                          showImages={showImages}
                          onEditProduct={onEditProduct}
                          onUpdateProductField={onUpdateProductField}
                          onToggleActive={onToggleActive}
                          onDeleteProduct={onDeleteProduct}
                          formatPrice={formatPrice}
                          categories={categories}
                          isSelected={selectedIds.includes(product.id)}
                          onSelect={handleSelect}
                          onImageClick={(p: Product) => {
                            setCroppingProduct(p)
                            imageInputRef.current?.click()
                          }}
                        />
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium">
                            No hay productos en esta categoría
                          </TableCell>
                        </TableRow>
                      )}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden space-y-3 p-4">
              {sortedProducts.length > 0 ? sortedProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedIds.includes(product.id)} 
                        onCheckedChange={() => handleSelect(product.id)}
                        className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-black data-[state=checked]:border-black h-5 w-5"
                      />
                    </div>
                    
                    <div 
                      className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted/30 border border-border/40 shrink-0"
                      onClick={() => {
                        setCroppingProduct(product)
                        imageInputRef.current?.click()
                      }}
                    >
                      {product.image ? (
                        <img src={fixPath(product.image)} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-6 w-6 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-xs uppercase tracking-tight text-slate-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-30">
                        #{product.id.slice(-6).toUpperCase()}
                      </p>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-slate-500 border-slate-200">
                          {categories.find(c => c.id === product.categoryId)?.name || 'Sin Categoría'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => onToggleActive(product)}
                        className={`h-10 w-10 rounded-xl border transition-all ${
                          product.active 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {product.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>

                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => onUpdateProductField(product.id, 'isNew', !product.isNew)}
                        className={`h-10 w-10 rounded-xl border transition-all ${
                          product.isNew 
                            ? 'bg-amber-50 text-amber-500 border-amber-100' 
                            : 'bg-slate-50 text-slate-300 border-slate-100'
                        }`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => onEditProduct(product)} 
                        className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-red-50 text-red-500 border border-red-100">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none p-8 gap-6 shadow-2xl w-[92vw] mx-auto">
                          <AlertDialogHeader className="gap-3">
                            <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                              <Trash2 className="h-7 w-7 text-red-500" />
                            </div>
                            <AlertDialogTitle className="text-xl font-black text-slate-900 tracking-tight">¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                              Estás a punto de eliminar <span className="font-extrabold text-slate-900">"{product.name}"</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3 mt-2">
                            <AlertDialogCancel className="h-12 px-6 rounded-xl">Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDeleteProduct(product.id)}
                              className="h-12 px-6 rounded-xl bg-red-500"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                   <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No hay productos disponibles</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Inputs ocultos para carga de imágenes */}
      <input 
        type="file" 
        ref={imageInputRef} 
        className="hidden" 
        accept="image/png,image/jpeg,image/webp,image/*"
        onChange={handleImageFileChange}
      />
      <input 
        type="file" 
        ref={formImageInputRef} 
        className="hidden" 
        accept="image/png,image/jpeg,image/webp,image/*"
        onChange={handleFormImageFileChange}
      />

      {/* Diálogo de Recorte */}
      <Dialog open={!!cropImage} onOpenChange={() => {
        setCropImage(null)
        setCroppingProduct(null)
        setCropForForm(false)
      }}>
        <DialogContent className="max-w-2xl w-[95vw] bg-white rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden outline-none mx-auto">
          <div className="p-5 sm:p-8 pb-4">
            <DialogTitle className="text-lg sm:text-2xl font-black uppercase tracking-tighter">Ajustar Imagen</DialogTitle>
            <p className="text-[10px] sm:text-sm text-muted-foreground font-medium uppercase tracking-widest">Reencuadra la foto para que quede perfecta</p>
          </div>
          
          <div className="relative h-[280px] sm:h-[400px] bg-slate-900 w-full overflow-hidden">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="p-6 sm:p-8 pt-6 space-y-6">
            <div className="flex items-center gap-4">
              <ZoomOut className="h-4 w-4 text-slate-400" />
              <input 
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-black h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
              <ZoomIn className="h-4 w-4 text-slate-400" />
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setCropImage(null)
                  setCroppingProduct(null)
                  setCropForForm(false)
                }}
                className="rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-[10px] h-11 px-5 sm:px-8 border border-slate-100"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleApplyCrop}
                disabled={isUploadingImage}
                className="rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-[10px] h-11 px-5 sm:px-8 bg-black text-white hover:bg-black/90 shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50"
              >
                {isUploadingImage ? 'Subiendo...' : 'Aplicar y Subir'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Producto (Crear/Editar) */}
      <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
        if (!open) resetProductForm()
        setIsProductDialogOpen(open)
      }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden bg-white rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-2xl p-0 flex flex-col mx-auto">
          <div className="p-5 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                {editingProduct ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900 leading-none">
                  {editingProduct ? 'Editar Elemento' : 'Nuevo Elemento'}
                </DialogTitle>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de catálogo</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Columna Izquierda: Imagen */}
                <div className="md:col-span-5 space-y-4">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imagen Principal</Label>
                    <div 
                      className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 overflow-hidden relative group cursor-pointer hover:bg-slate-100 transition-all hover:border-slate-300"
                      onClick={() => formImageInputRef.current?.click()}
                    >
                      {productForm.image ? (
                        <div className="relative w-full h-full group">
                          <img src={fixPath(productForm.image)} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 transform -translate-y-4 group-hover:translate-y-0 transition-transform">
                                <Upload className="h-6 w-6 text-white" />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 transition-transform group-hover:scale-110">
                            <Upload className="h-6 w-6" />
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Subir fotografía</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                    <div className="flex gap-3">
                      <Info className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest leading-relaxed">
                        Recomendamos usar imágenes cuadradas (1:1) para mantener la consistencia visual en la tienda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Datos */}
                <div className="md:col-span-7 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        Nombre del Elemento <span className="text-red-400">*</span>
                      </Label>
                      <Input 
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50/50 px-5 text-sm font-bold focus:bg-white focus:border-slate-900 transition-all uppercase tracking-tight"
                        placeholder="Ej: PACK DE NAVIDAD"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</Label>
                      <Select 
                        value={productForm.categoryId || 'none'} 
                        onValueChange={(val) => setProductForm({ ...productForm, categoryId: val === 'none' ? null : val })}
                      >
                        <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50/50 px-5 text-xs font-black uppercase tracking-widest focus:bg-white focus:border-slate-900 transition-all">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="none" className="text-[10px] font-bold uppercase tracking-widest py-3">Sin Categoría</SelectItem>
                          {categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-bold uppercase tracking-widest py-3 italic">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Base</Label>
                        <div className="relative">
                          <Input 
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50/50 pl-8 pr-5 text-sm font-bold focus:bg-white focus:border-slate-900 transition-all"
                          />
                          <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor</Label>
                        <Select 
                          value={productForm.supplierId || 'none'} 
                          onValueChange={(val) => setProductForm({ ...productForm, supplierId: val === 'none' ? null : val })}
                        >
                          <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50/50 px-5 text-xs font-black uppercase tracking-widest focus:bg-white focus:border-slate-900 transition-all">
                            <SelectValue placeholder="Ninguno" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="none" className="text-[10px] font-bold uppercase tracking-widest py-3 italic">Ninguno</SelectItem>
                            {suppliers.map((sup: any) => (
                              <SelectItem key={sup.id} value={sup.id} className="text-[10px] font-bold uppercase tracking-widest py-3">{sup.name.toUpperCase()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción Detallada</Label>
                    <Textarea 
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="min-h-[140px] rounded-[1.5rem] border-slate-100 bg-slate-50/50 p-5 text-xs font-bold leading-relaxed focus:bg-white focus:border-slate-900 transition-all uppercase tracking-tight"
                      placeholder="Escribe aquí los detalles del producto..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between group">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-black text-slate-900 uppercase tracking-tight italic">Habilitar Elemento</Label>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">¿Mostrar en la tienda?</p>
                      </div>
                      <Switch 
                        checked={productForm.active}
                        onCheckedChange={(checked) => setProductForm({ ...productForm, active: checked })}
                        className="data-[state=checked]:bg-[#4A7C59]"
                      />
                    </div>
                    
                    <div className="h-px bg-slate-100 w-full" />
                    
                    <div className="flex items-center justify-between group">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-black text-slate-900 uppercase tracking-tight italic">Marcar como Novedad</Label>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Añade distintivo visual</p>
                      </div>
                      <Switch 
                        checked={productForm.isNew}
                        onCheckedChange={(checked) => setProductForm({ ...productForm, isNew: checked })}
                        className="data-[state=checked]:bg-amber-400"
                      />
                    </div>

                    <div className="h-px bg-slate-100 w-full" />
                    
                    <div className="flex items-center justify-between group">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-black text-slate-900 uppercase tracking-tight italic">Fotos Incluidas</Label>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Límite por este producto</p>
                      </div>
                      <div className="w-24">
                        <Input 
                          type="number"
                          value={productForm.fotosIncluidas || 0}
                          onChange={(e) => setProductForm({ ...productForm, fotosIncluidas: Number(e.target.value) })}
                          className="h-10 rounded-xl text-center font-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-[2rem]">
            <Button 
              variant="outline" 
              onClick={() => {
                resetProductForm()
                setIsProductDialogOpen(false)
              }}
              className="h-12 px-6 rounded-xl border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-slate-900 transition-all active:scale-95"
            >
              Cancelar
            </Button>
            <Button 
              onClick={onSaveProduct}
              className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3"
            >
              <Save className="h-4 w-4" />
              {editingProduct ? 'ACTUALIZAR DATOS' : 'CREAR EN TIENDA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
