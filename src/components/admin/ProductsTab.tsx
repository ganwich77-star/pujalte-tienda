'use client'

import React, { useState } from 'react'
import { 
  Plus, Package, Edit, Trash2, Eye, EyeOff, ImageIcon, 
  ImageOff, Upload, GripVertical, Check, X as CloseIcon, ZoomIn, ZoomOut,
  ArrowUp, ArrowDown, Info, Sparkles, ArrowUpDown, Search, Filter
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
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
}

// Helper para arreglar rutas con el basePath de Hostinger
const fixPath = (path: string | undefined | null) => {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  let cleanPath = path.replace('/', '')
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`
  return `/pujaltefotografia${cleanPath}`
}

function SortableProductRow({ 
  product, 
  onEditProduct, 
  onUpdateProductField, 
  onToggleActive, 
  onDeleteProduct, 
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
      className={`group border-b border-slate-100 transition-colors h-20 ${isDragging ? 'bg-slate-50 shadow-inner' : 'hover:bg-slate-50/50'}`}
    >
      <TableCell className="w-16 pl-4">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-black/5 rounded-lg transition-colors">
            <GripVertical className="h-4 w-4 text-slate-300" />
          </div>
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={() => onSelect(product.id)}
            className="h-5 w-5 rounded-md border-slate-200"
          />
        </div>
      </TableCell>
      <TableCell className="w-20 px-2">
        <div 
          className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group/img cursor-pointer shadow-sm mx-auto transition-transform hover:scale-105 active:scale-95"
          onClick={() => onImageClick(product)}
        >
          {product.image ? (
            <>
              <img src={fixPath(product.image)} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon className="text-white h-5 w-5" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="h-6 w-6 text-slate-300" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1 py-1">
          <input 
            value={product.name} 
            onChange={(e) => onUpdateProductField(product.id, 'name', e.target.value)}
            className="font-bold text-base uppercase tracking-tight bg-transparent border-none focus:ring-0 p-0 w-full outline-none placeholder:text-slate-300 truncate"
            placeholder="Nombre del producto..."
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider">REF: {product.id.slice(-6).toUpperCase()}</span>
            {product.isNew && (
              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> NOVEDAD
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="w-56 px-4">
        <Select 
          value={product.categoryId || 'none'} 
          onValueChange={(val) => onUpdateProductField(product.id, 'categoryId', val === 'none' ? null : val)}
        >
          <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg text-xs font-bold uppercase tracking-wider px-3 shadow-sm transition-all">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="none" className="text-xs font-bold uppercase tracking-wider py-2">Sin Categoría</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold uppercase tracking-wider py-2">{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>      <TableCell className="w-48 px-2">
        <div className="flex items-center justify-end gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onToggleActive(product)}
            className={`h-9 w-9 rounded-lg border transition-all active:scale-90 ${
              product.active 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {product.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onEditProduct(product)} 
            className="h-9 w-9 rounded-lg bg-slate-900 text-white hover:bg-black transition-all active:scale-90"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-90">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-none p-8 gap-6 shadow-2xl">
              <AlertDialogHeader className="gap-4">
                <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                  <Trash2 className="h-8 w-8 text-red-500" />
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-slate-900 text-center uppercase tracking-tight">Eliminar Producto</AlertDialogTitle>
                <AlertDialogDescription className="text-base text-slate-500 font-medium text-center leading-relaxed">
                  ¿Confirmas que deseas retirar <span className="text-slate-900 font-bold">&quot;{product.name}&quot;</span> de la colección?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-4 justify-center">
                <AlertDialogCancel className="h-11 px-6 rounded-xl border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-xs">Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDeleteProduct(product.id)}
                  className="h-11 px-6 rounded-xl bg-red-500 text-white font-bold uppercase tracking-wider text-xs hover:bg-red-600 border-none shadow-lg shadow-red-200"
                >
                  Eliminar
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
  setIsProductDialogOpen,
  isProductDialogOpen,
  productForm,
  setProductForm,
  editingProduct,
  onSaveProduct,
  addVariant,
  updateVariant,
  removeVariant,
  resetProductForm
}: ProductsTabProps) {
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [croppingProduct, setCroppingProduct] = useState<Product | null>(null)
  const [cropForForm, setCropForForm] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc' | null}>({ key: '', direction: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const formImageInputRef = React.useRef<HTMLInputElement>(null)

  const sortedProducts = React.useMemo(() => {
    let filtered = [...products]

    // Filtrado por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.id.toLowerCase().includes(term)
      )
    }

    // Filtrado por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.categoryId === categoryFilter)
    }

    if (!sortConfig.key || !sortConfig.direction) return filtered

    return filtered.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      if (sortConfig.key === 'categoryId') {
        aVal = categories.find(c => c.id === aVal)?.name || ''
        bVal = categories.find(c => c.id === bVal)?.name || ''
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [products, sortConfig, categories, searchTerm, categoryFilter])

  const toggleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? products.map(p => p.id) : [])
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
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
    try {
      const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels)
      if (cropForForm) {
        setProductForm({ ...productForm, image: croppedImage })
        setCropForForm(false)
      } else if (croppingProduct) {
        onUpdateProductField(croppingProduct.id, 'image', croppedImage)
      }
      setCropImage(null)
      setCroppingProduct(null)
      toast({ title: 'Éxito', description: 'Imagen procesada correctamente' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Fallo al procesar imagen', variant: 'destructive' })
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
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id)
      const newIndex = products.findIndex((p) => p.id === over.id)
      onReorderProducts(arrayMove(products, oldIndex, newIndex))
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 border-b border-slate-200 shadow-sm relative z-20">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">
              Catálogo <span className="text-slate-300">2026</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px] px-3 py-1 rounded-full border-none tracking-wider">
                {products.length} PRODUCTOS
              </Badge>
              {selectedIds.length > 0 && (
                <Badge className="bg-emerald-500 text-white font-bold uppercase text-[10px] px-3 py-1 rounded-full border-none shadow-md tracking-wider">
                  {selectedIds.length} SELECCIONADOS
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="h-11 px-6 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ELIMINAR
            </Button>
          )}
          <Button 
            onClick={onAddProduct}
            className="bg-black text-white h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-95 group"
          >
            <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
            NUEVO PRODUCTO
          </Button>
        </div>
      {/* Toolbar - Búsqueda y Filtros */}
      <div className="bg-white px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 shadow-sm relative z-10">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="BUSCAR PRODUCTO POR NOMBRE O REF..."
            className="h-11 pl-12 rounded-xl bg-slate-50 border-slate-200 text-sm font-medium focus-visible:ring-black/5 focus-visible:bg-white transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[280px] h-11 rounded-xl bg-slate-50 border-slate-200 px-4 text-sm font-bold uppercase tracking-tight shadow-sm">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="CATEGORÍA" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              <SelectItem value="all" className="text-xs font-bold uppercase py-3">Todas las secciones</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold uppercase py-3">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="ghost" 
            onClick={() => {setSearchTerm(''); setCategoryFilter('all')}}
            className="h-11 w-11 rounded-xl text-slate-300 hover:text-black hover:bg-slate-100 bg-slate-50 border border-slate-200"
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
      </div>

      {/* Tabla Desktop Escalada */}
      <ScrollArea className="flex-1 hidden md:block">
        <div className="p-12 lg:p-20">
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent h-14 border-b border-slate-200">
                  <TableHead className="w-16 pl-4 text-center">
                    <Checkbox 
                      checked={selectedIds.length === products.length && products.length > 0} 
                      onCheckedChange={handleSelectAll}
                      className="h-5 w-5 rounded-md border-slate-200"
                    />
                  </TableHead>
                  <TableHead className="w-24 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Miniatura</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-100/50 transition-colors text-xs font-bold uppercase tracking-wider text-slate-400"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Nombre {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 w-56">Categoría</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400 w-48">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sortedProducts} strategy={verticalListSortingStrategy}>
                    {sortedProducts.map((product) => (
                      <SortableProductRow 
                        key={product.id} 
                        product={product}
                        onEditProduct={onEditProduct}
                        onUpdateProductField={onUpdateProductField}
                        onToggleActive={onToggleActive}
                        onDeleteProduct={onDeleteProduct}
                        categories={categories}
                        onImageClick={(p: any) => {
                          setCroppingProduct(p)
                          setCropImage(fixPath(p.image))
                          setCropForForm(false)
                        }}
                        isSelected={selectedIds.includes(product.id)}
                        onSelect={handleSelect}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </TableBody>
            </Table>
          </div>
        </div>
      </ScrollArea>

      {/* Mobile Experience (Giga Cards) */}
      <ScrollArea className="flex-1 md:hidden bg-slate-50/50">
        <div className="space-y-16 px-10 py-16 pb-64">
          {sortedProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-[4rem] border border-slate-100 p-12 space-y-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all relative overflow-hidden group"
            >
              <div className="flex items-start gap-10">
                <div 
                  className="h-48 w-48 rounded-[3rem] overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50 shadow-inner group-active:scale-95 transition-transform"
                  onClick={() => {
                    setCroppingProduct(product)
                    setCropImage(fixPath(product.image))
                    setCropForForm(false)
                  }}
                >
                  {product.image ? (
                    <img src={fixPath(product.image)} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-16 w-16 text-slate-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-6 py-4">
                  <div className="flex items-start gap-6">
                    <Checkbox 
                      checked={selectedIds.includes(product.id)} 
                      onCheckedChange={() => handleSelect(product.id)}
                      className="h-12 w-12 rounded-[1.5rem] border-slate-200 mt-1 border-2"
                    />
                    <h3 className="font-black text-4xl uppercase tracking-tighter text-slate-900 leading-[0.8]">{product.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="rounded-2xl border-slate-100 text-xs font-black uppercase text-slate-400 bg-slate-50 px-6 py-3 tracking-widest">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Sin Categoría'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-8 pt-4">
                <Button 
                  onClick={() => onEditProduct(product)}
                  className="col-span-1 h-10 rounded-xl bg-slate-900 hover:bg-black text-white shadow-lg"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onUpdateProductField(product.id, 'active', !product.active)}
                  className={`col-span-1 h-10 rounded-xl border flex items-center justify-center transition-all ${
                    product.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {product.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onUpdateProductField(product.id, 'isNew', !product.isNew)}
                  className={`col-span-1 h-10 rounded-xl transition-all border ${
                    product.isNew ? 'bg-amber-50 text-amber-500 border-amber-200 shadow-sm' : 'bg-white border-slate-200 text-slate-200'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="col-span-1 h-10 rounded-xl shadow-sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[90vw] max-w-sm rounded-2xl p-6 bg-white border-none shadow-2xl">
                    <AlertDialogHeader className="gap-2">
                      <AlertDialogTitle className="text-lg font-bold uppercase tracking-tight text-center">ELIMINAR PRODUCTO</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 text-sm text-center">Esta acción retirará el elemento de la tienda de forma inmediata.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3 flex-col sm:flex-row justify-center">
                      <AlertDialogCancel className="h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] flex-1 border-slate-200">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteProduct(product.id)} className="h-10 rounded-xl bg-red-500 hover:bg-red-600 font-bold uppercase tracking-wider text-[10px] flex-1 border-none shadow-lg">Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Hidden File Inputs */}
      <Input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageFileChange} />
      <Input type="file" ref={formImageInputRef} className="hidden" accept="image/*" onChange={handleFormImageFileChange} />

      {/* Crop Modal */}
      <Dialog open={!!cropImage} onOpenChange={(open) => !open && setCropImage(null)}>
        <DialogContent className="max-w-xl w-[90vw] max-h-[85vh] border-none bg-black rounded-3xl p-0 overflow-hidden shadow-2xl">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight leading-none">Ajustar Imagen</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Laboratorio Digital</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCropImage(null)} className="h-8 w-8 text-white/50 hover:bg-white/10 rounded-lg">
                <CloseIcon className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 relative min-h-[400px]">
              <Cropper
                image={cropImage || ''}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="px-8 py-8 bg-black border-t border-white/10 space-y-6">
              <div className="flex items-center gap-4">
                <ZoomOut className="text-white/40 h-4 w-4" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-white h-1 rounded-full cursor-pointer"
                />
                <ZoomIn className="text-white/40 h-4 w-4" />
              </div>
              
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCropImage(null)}
                  className="flex-1 h-11 rounded-xl font-bold uppercase tracking-wider text-[10px] border-white/10 text-white/50 hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleApplyCrop}
                  className="flex-[2] h-11 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-white text-black hover:bg-slate-100 shadow-lg"
                >
                  Confirmar Fotografía
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Edit Modal XL */}
      <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
        if (!open) resetProductForm()
        setIsProductDialogOpen(open)
      }}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden border-none bg-white rounded-3xl p-0 flex flex-col mx-auto shadow-2xl">
            <DialogHeader className="px-8 py-6 border-b border-slate-100 flex-shrink-0 bg-white z-10">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  {editingProduct ? <Edit className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-slate-900">
                    {editingProduct ? 'Modificar' : 'Nuevo'} Producto
                  </DialogTitle>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de Catálogo</p>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-8 py-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  {/* Left: Image Selection */}
                  <div className="md:col-span-4 space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Imagen del Producto</Label>
                      <div 
                        className="aspect-square w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:bg-slate-100 transition-all shadow-inner"
                        onClick={() => formImageInputRef.current?.click()}
                      >
                        {productForm.image ? (
                          <div className="relative w-full h-full">
                            <img src={fixPath(productForm.image)} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <Button variant="secondary" size="sm" className="rounded-lg font-bold uppercase tracking-wider text-[10px] h-8 px-4">
                                <Upload className="h-3 w-3 mr-2" />
                                Cambiar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-300">
                            <Upload className="h-10 w-10 mb-3 opacity-30" />
                            <p className="font-bold text-[10px] uppercase tracking-wider text-center px-4">Subir Imagen</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div 
                      onClick={() => setProductForm({...productForm, isNew: !productForm.isNew})}
                      className={`rounded-xl p-3 border transition-all cursor-pointer flex items-center gap-3 select-none ${
                        productForm.isNew 
                          ? 'bg-amber-50 border-amber-200 shadow-sm' 
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        productForm.isNew ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-300 shadow-sm'
                      }`}>
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <Label className={`text-xs font-bold uppercase cursor-pointer tracking-tight block leading-none transition-colors ${
                          productForm.isNew ? 'text-amber-700' : 'text-slate-400'
                        }`}>Novedad</Label>
                        <p className={`text-[9px] font-medium uppercase mt-1 tracking-wider ${
                          productForm.isNew ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          {productForm.isNew ? 'Etiqueta Activa' : 'Activar Etiqueta'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Core Info */}
                  <div className="md:col-span-8 space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="productName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Producto</Label>
                      <Input 
                        id="productName" 
                        value={productForm.name} 
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="rounded-xl h-11 text-base font-bold bg-slate-50 border-slate-200 px-4 focus:bg-white transition-all shadow-sm"
                        placeholder="Ej: Pack Platinum"
                      />
                    </div>
 
                     <div className="space-y-3">
                       <Label htmlFor="category" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría</Label>
                       <Select 
                         value={productForm.categoryId || 'none'} 
                         onValueChange={(val) => setProductForm({...productForm, categoryId: val === 'none' ? null : val})}
                       >
                         <SelectTrigger className="rounded-xl h-11 text-sm font-bold bg-slate-50 border-slate-200 px-4 uppercase tracking-tight shadow-sm">
                           <SelectValue placeholder="Seleccionar categoría" />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                           <SelectItem value="none" className="text-xs font-bold uppercase py-2">Sin Clasificación</SelectItem>
                           {categories.map((cat: any) => (
                             <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold uppercase py-2">{cat.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
 
                     <div className="space-y-3">
                       <Label htmlFor="description" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</Label>
                       <Textarea 
                         id="description" 
                         value={productForm.description || ''} 
                         onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                         placeholder="Escribe los detalles del producto..."
                         className="rounded-xl min-h-[100px] resize-none text-sm bg-slate-50 border-slate-200 px-4 py-3 focus:bg-white transition-all shadow-sm"
                       />
                     </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="productPrice" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio Base (€)</Label>
                        <Input 
                          id="productPrice" 
                          type="number"
                          step="0.01"
                          value={productForm.price} 
                          onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                          className="rounded-xl h-11 text-lg font-bold bg-slate-50 border-slate-200 px-4 text-center shadow-sm"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="productSalePrice" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio Oferta (€)</Label>
                        <Input 
                          id="productSalePrice" 
                          type="number"
                          step="0.01"
                          value={productForm.salePrice || ''} 
                          onChange={(e) => setProductForm({...productForm, salePrice: e.target.value ? Number(e.target.value) : null})}
                          className="rounded-xl h-11 text-lg font-bold bg-emerald-50 text-emerald-600 border-emerald-100 px-4 text-center shadow-sm"
                          placeholder="Opcional"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variants Control */}
                <div className="pt-8 border-t border-slate-100 space-y-6">
                  <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl shadow-lg border border-white/5 h-16">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <ArrowUpDown className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Label className="text-sm font-bold uppercase text-white leading-none block tracking-tight">Variantes de Producto</Label>
                        <p className="text-[8px] text-slate-400 font-medium uppercase mt-1 tracking-wider">Tallas o formatos específicos</p>
                      </div>
                    </div>
                    <Switch 
                      checked={productForm.hasVariants} 
                      onCheckedChange={(checked) => setProductForm({...productForm, hasVariants: checked})}
                      className="scale-75 origin-right"
                    />
                  </div>

                  <AnimatePresence>
                    {productForm.hasVariants && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Tipo de Atributo</Label>
                            <Input 
                              value={productForm.variantType || ''} 
                              onChange={(e) => setProductForm({...productForm, variantType: e.target.value})}
                              placeholder="Ej: Talla"
                              className="bg-slate-50 border-slate-200 rounded-lg h-10 text-sm font-bold px-4 uppercase tracking-tight"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Comportamiento</Label>
                            <Select 
                              value={productForm.variantBehavior || 'replace'} 
                              onValueChange={(val: any) => setProductForm({...productForm, variantBehavior: val})}
                            >
                              <SelectTrigger className="bg-slate-50 border-slate-200 rounded-lg h-10 text-xs font-bold px-4 uppercase">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                <SelectItem value="replace" className="text-xs font-bold uppercase py-2">Precio Fijo</SelectItem>
                                <SelectItem value="add" className="text-xs font-bold uppercase py-2">Añadir al Base</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {productForm.variants?.map((variant: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group transition-all">
                              <Input 
                                placeholder="Opción..." 
                                value={variant.name} 
                                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                className="bg-white border-slate-200 h-10 text-sm font-bold flex-[3] rounded-lg px-4 uppercase tracking-tight"
                              />
                              <Input 
                                type="number" 
                                placeholder="€" 
                                value={variant.price} 
                                onChange={(e) => updateVariant(index, 'price', Number(e.target.value))}
                                className="bg-white border-slate-200 h-10 text-sm font-bold flex-1 rounded-lg text-center"
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeVariant(index)}
                                className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={addVariant}
                          className="w-full h-10 border-dashed border-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-50 transition-all"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Añadir Variante
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Visibility Controls */}
                <div className="grid grid-cols-2 gap-6 pt-4">
                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white text-slate-400 flex items-center justify-center shadow-sm">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <Label className="text-sm font-bold uppercase text-slate-900 block tracking-tight">Mostrar Precio</Label>
                        <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">{productForm.showPrice ? 'Público' : 'Privado'}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={productForm.showPrice !== false} 
                      onCheckedChange={(checked) => setProductForm({...productForm, showPrice: checked})}
                      className="scale-90"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/10 text-emerald-400 flex items-center justify-center">
                        <Eye className="h-4 w-4" />
                      </div>
                      <div>
                        <Label className="text-sm font-bold uppercase text-white block tracking-tight">Visible Web</Label>
                        <p className="text-[9px] text-slate-500 font-medium uppercase mt-1">{productForm.active ? 'Activo' : 'Borrador'}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={productForm.active !== false} 
                      onCheckedChange={(checked) => setProductForm({...productForm, active: checked})}
                      className="data-[state=checked]:bg-emerald-500 scale-90"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="px-8 py-6 border-t border-slate-100 flex items-center gap-4 bg-white z-20">
              <Button 
                variant="outline" 
                onClick={() => setIsProductDialogOpen(false)}
                className="flex-1 h-11 rounded-xl font-bold uppercase tracking-wider text-[10px] text-slate-400 border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </Button>
              <Button 
                onClick={onSaveProduct}
                className="flex-[2] h-11 rounded-xl font-bold uppercase tracking-wider text-xs bg-black text-white hover:bg-slate-800 shadow-lg active:scale-95 transition-all border-none"
              >
                {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
              </Button>
            </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}
