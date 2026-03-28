'use client'

import React, { useState } from 'react'
import { 
  Plus, Package, Edit, Trash2, Eye, EyeOff, ImageIcon, 
  ImageOff, Upload, GripVertical, Check, X as CloseIcon, ZoomIn, ZoomOut,
  ArrowUp, ArrowDown, Info, Sparkles, ArrowUpDown, Search, Filter, ShoppingCart,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Checkbox } from "@/components/ui/checkbox"
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Definición local de seguridad para evitar ReferenceError
const fixPath = (path: string | null | undefined) => {
  if (!path) return ''
  if (!path || path.startsWith('http') || path.startsWith('data:')) return path || ''
  return path.startsWith('/') ? path : `/${path}`
}

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

// Quitamos la versión local de fixPath y usamos la de @/lib/utils importada arriba (línea 47)

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
      <TableCell className="w-40 px-2 lg:px-4">
        <Select 
          value={product.categoryId || 'none'} 
          onValueChange={(val) => onUpdateProductField(product.id, 'categoryId', val === 'none' ? null : val)}
        >
          <SelectTrigger className="h-10 border-slate-100 bg-slate-50/50 rounded-xl text-[10px] font-bold uppercase tracking-widest px-3 shadow-sm hover:bg-white transition-all">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="none" className="text-[10px] font-bold uppercase tracking-widest py-3">Sin Categoría</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-bold uppercase tracking-widest py-3">{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      
      <TableCell className="w-40 text-right pr-4">
        <div className="flex flex-col items-end gap-0.5">
          {product.salePrice ? (
            <>
              <span className="text-xs font-black text-emerald-500 leading-none">{product.salePrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
              <span className="text-[9px] font-bold text-slate-300 line-through leading-none">{product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
            </>
          ) : (
            <span className="text-sm font-black text-slate-900">{product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
          )}
        </div>
      </TableCell>

      <TableCell className="w-44 px-2">
        <div className="flex items-center justify-end gap-2.5">
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

function SortableVariantRow({ index, variant, updateVariant, removeVariant }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `variant-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.6 : 1
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-3 bg-white p-3 rounded-2xl shadow-xs border ${isDragging ? 'border-blue-200 shadow-lg' : 'border-slate-100 hover:border-slate-200'} transition-all group`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-400 h-8 w-8 flex items-center justify-center transition-colors">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <Input 
          value={variant.name} 
          onChange={(e) => updateVariant(index, 'name', e.target.value)} 
          className="bg-slate-50 border-transparent h-10 text-[10px] font-black rounded-xl px-4 uppercase flex-1 focus:bg-white transition-all shadow-inner placeholder:text-slate-300" 
          placeholder="NOMBRE (EJ: 15X15)" 
        />
      </div>
      <div className="relative w-28">
        <Input 
          type="number" 
          value={variant.price || ''} 
          onChange={(e) => updateVariant(index, 'price', Number(e.target.value))} 
          className="bg-slate-50 border-transparent h-10 text-[10px] font-black rounded-xl pr-8 text-right w-full focus:bg-white transition-all shadow-inner" 
          placeholder="0" 
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">€</span>
      </div>
      <button 
        onClick={() => removeVariant(index)} 
        className="h-10 w-10 flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
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
  const [showQuantities, setShowQuantities] = useState(false)
  const [showTierPricing, setShowTierPricing] = useState(false)
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
          <Button 
            variant="outline"
            className="h-11 w-11 rounded-xl bg-slate-50 border-slate-200 text-slate-400 group-focus-within:text-black group-focus-within:bg-white transition-all shadow-sm p-0"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[280px] h-11 rounded-xl bg-slate-50 border-slate-200 px-4 text-[10px] font-black uppercase tracking-widest shadow-sm">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="CATEGORÍA" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest py-3">TODAS LAS SECCIONES</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-black uppercase tracking-widest py-3">
                  {cat.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="ghost" 
            onClick={() => {setSearchTerm(''); setCategoryFilter('all')}}
            className="h-11 w-11 rounded-xl text-slate-300 hover:text-black hover:bg-slate-100 bg-slate-50 border border-slate-200 shadow-sm"
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabla Desktop Escalada */}
      <ScrollArea className="flex-1 hidden md:block">
        <div className="p-12 lg:p-20">
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                    <TableHead className="w-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Miniatura</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-slate-100/50 transition-colors text-xs font-bold uppercase tracking-wider text-slate-400"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        Nombre {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                      </div>
                    </TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-40">Categoría</TableHead>
                    <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-40">Precio</TableHead>
                    <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-44">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                </TableBody>
              </Table>
            </DndContext>
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
                  <div className="flex flex-wrap items-center gap-4">
                    <Badge variant="outline" className="rounded-2xl border-slate-100 text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-5 py-2.5 tracking-widest">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Sin Categoría'}
                    </Badge>
                    <div className="flex items-center gap-3">
                      {product.salePrice ? (
                        <>
                          <span className="text-xl font-black text-emerald-500">{product.salePrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                          <span className="text-xs font-bold text-slate-300 line-through">{product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                        </>
                      ) : (
                        <span className="text-xl font-black text-slate-900">{product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                      )}
                    </div>
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

      {/* Product Edit Modal XL - DISEÑO PREMIUM COMPACTO */}
      <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
        if (!open) resetProductForm()
        setIsProductDialogOpen(open)
      }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden border-none bg-white rounded-[2.5rem] p-0 flex flex-col mx-auto shadow-2xl">
            {/* HEADER COMPACTO */}
            <DialogHeader className="px-8 py-4 bg-[#1a1f2c] flex-shrink-0 z-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-10 w-10 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-xl backdrop-blur-md border border-white/10">
                  {editingProduct ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-lg font-black uppercase tracking-tighter text-white leading-none">
                    {editingProduct ? 'Modificar' : 'Nuevo'} Producto
                  </DialogTitle>
                  <p className="text-[8px] text-blue-400 font-black uppercase tracking-[0.2em] mt-1 opacity-70">Gestión v2.1</p>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0 bg-white">
              <div className="px-8 py-6 space-y-6 pb-12">
                
                {/* SECCIÓN 1: GENERAL */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left: Image Selection */}
                    <div className="md:col-span-4 space-y-4">
                      <div className="flex flex-col items-center gap-4">
                        <div 
                          className="relative group w-32 h-32"
                          onClick={() => formImageInputRef.current?.click()}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-50 shadow-md transition-transform group-hover:scale-[1.02] cursor-pointer bg-slate-50">
                            {productForm.image ? (
                              <img src={fixPath(productForm.image)} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                                <ImageIcon className="h-8 w-8 opacity-20" />
                              </div>
                            )}
                          </div>
                          <div className="absolute bottom-1 right-1 bg-white h-8 w-8 rounded-full shadow-lg flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-black transition-colors">
                            <Upload className="h-4 w-4" />
                          </div>
                        </div>
                        
                        <div 
                          onClick={() => setProductForm({...productForm, isNew: !productForm.isNew})}
                          className={`w-full rounded-2xl p-3 border transition-all cursor-pointer flex items-center justify-between select-none ${
                            productForm.isNew 
                              ? 'bg-amber-50 border-amber-200 shadow-sm' 
                              : 'bg-slate-50 border-slate-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className={`h-4 w-4 ${productForm.isNew ? 'text-amber-500' : 'text-slate-300'}`} />
                            <Label className={`text-[9px] font-black uppercase cursor-pointer tracking-tight ${
                                productForm.isNew ? 'text-amber-800' : 'text-slate-400'
                            }`}>Novedad</Label>
                          </div>
                          <Switch 
                            checked={!!productForm.isNew} 
                            onCheckedChange={(checked) => setProductForm({...productForm, isNew: checked})}
                            className="scale-75 data-[state=checked]:bg-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Core Info */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-blue-300 uppercase tracking-widest ml-1">Nombre Comercial</Label>
                        <Input 
                          value={productForm.name} 
                          onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                          className="rounded-xl h-11 text-sm font-black bg-slate-50 border-transparent px-4 focus:bg-white focus:border-blue-100 transition-all uppercase"
                          placeholder="NOMBRE..."
                        />
                      </div>

                      <div className="grid grid-cols-[1fr_85px] gap-3 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100/50 items-end">
                        <div className="flex flex-col gap-2 min-w-0">
                          <Label className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em] ml-2">Categoría</Label>
                          <Select 
                            value={productForm.categoryId || 'none'} 
                            onValueChange={(val) => setProductForm({...productForm, categoryId: val === 'none' ? null : val})}
                          >
                            <SelectTrigger 
                              style={{ height: '56px', minHeight: '56px' }}
                              className="rounded-2xl !h-[56px] text-[10px] font-black bg-white border border-slate-100 px-5 uppercase tracking-widest shadow-sm hover:shadow-md transition-all w-full overflow-hidden flex items-center"
                            >
                              <SelectValue placeholder="SELECCIONAR" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              <SelectItem value="none" className="text-[10px] font-black uppercase tracking-widest">Sin Clasificar</SelectItem>
                              {categories.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-black uppercase tracking-widest">{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em] ml-2">Precio</Label>
                          <div className="relative group/price w-full" style={{ height: '56px' }}>
                            <Input 
                              type="number"
                              step="0.01"
                              value={productForm.price || ''} 
                              onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                              style={{ height: '56px', minHeight: '56px' }}
                              className="rounded-2xl !h-[56px] text-md font-black bg-white border border-slate-100 pl-3 pr-8 text-right shadow-sm group-hover/price:shadow-md transition-all w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 font-black text-[10px] opacity-40">€</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-blue-300 uppercase tracking-widest ml-1">Descripción</Label>
                        <Textarea 
                          value={productForm.description || ''} 
                          onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                          className="rounded-xl min-h-[70px] text-xs bg-slate-50 border-transparent px-4 py-2 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECCIÓN 2: PEDIDOS Y PROMOCIÓN */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                    {/* Cantidades Card */}
                    <div className="bg-white rounded-[1.5rem] flex flex-col border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                      <button 
                        onClick={() => {
                          const newState = !showQuantities;
                          setShowQuantities(newState);
                          setShowTierPricing(newState);
                        }}
                        className={`p-4 flex justify-between items-center w-full transition-colors ${showQuantities ? 'bg-blue-50/50 border-b border-blue-100/20' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 min-w-[32px] rounded-xl flex items-center justify-center transition-all ${showQuantities ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110' : 'bg-slate-100 text-slate-400'}`}>
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col items-start overflow-hidden">
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Cantidades</h4>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1 leading-none uppercase">Configuración base</p>
                          </div>
                        </div>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all border ${showQuantities ? 'rotate-180 bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-400 group-hover:border-blue-200'}`}>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {showQuantities && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="flex-1 flex flex-col"
                          >
                            <div className="p-5 flex-1 flex flex-col gap-5">
                              {/* CABECERA ALINEADA CON PANEL DERECHO */}
                              <div className="grid grid-cols-[1fr_1fr_40px] gap-4 px-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Mínimo</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad</span>
                                <div /> {/* Hueco para simetría con Escalado */}
                              </div>

                              <div className="grid grid-cols-[1fr_1fr_40px] gap-4 items-center">
                                <Input 
                                  type="number" 
                                  value={productForm.minQuantity} 
                                  onChange={(e) => setProductForm({...productForm, minQuantity: Number(e.target.value)})} 
                                  className="rounded-2xl h-12 text-sm font-black bg-slate-50 border-transparent text-center px-1 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  placeholder="0"
                                />
                                <Input 
                                  type="number" 
                                  value={productForm.stepQuantity} 
                                  onChange={(e) => setProductForm({...productForm, stepQuantity: Number(e.target.value)})} 
                                  className="rounded-2xl h-12 text-sm font-black bg-slate-50 border-transparent text-center px-1 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  placeholder="0"
                                />
                                <div />
                              </div>

                              {/* BLOQUE DE EJEMPLO ABAJO COMO ESTABA */}
                              <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/50 relative overflow-hidden mt-auto mb-1">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="h-5 w-5 rounded-lg bg-blue-500 flex items-center justify-center">
                                    <Sparkles className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Ejemplo en tienda</span>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between px-1">
                                     <span className="text-[10px] font-bold text-slate-500">Tramo Inicial:</span>
                                     <span className="text-[10px] font-black text-slate-800">{productForm.price || 0}€</span>
                                  </div>
                                  <div className="flex items-center justify-between p-2.5 bg-blue-600 rounded-xl shadow-md border border-blue-400/20">
                                     <span className="text-[9px] font-black text-blue-50/90 uppercase">Con Mínimo ({productForm.minQuantity}):</span>
                                     <span className="text-[12px] font-black text-white">
                                       {(() => {
                                         const tiers = Array.isArray(productForm.tierPricing) ? productForm.tierPricing : [];
                                         const applicableTier = [...tiers]
                                           .sort((a, b) => b.minQty - a.minQty)
                                           .find(t => productForm.minQuantity >= t.minQty);
                                         const displayPrice = applicableTier ? applicableTier.price : (productForm.price || 0);
                                         return displayPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 });
                                       })()}€
                                     </span>
                                  </div>
                                  <p className="text-[9px] text-blue-500/80 font-medium italic text-center pt-1">
                                    * El carrito forzará múltiplos de {productForm.stepQuantity}.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Escalado Card */}
                    <div className="bg-white rounded-[1.5rem] flex flex-col border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                      <button 
                        onClick={() => {
                          const newState = !showTierPricing;
                          setShowTierPricing(newState);
                          setShowQuantities(newState);
                        }}
                        className={`p-4 flex justify-between items-center w-full transition-colors ${showTierPricing ? 'bg-emerald-50/50 border-b border-emerald-100/20' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 min-w-[32px] rounded-xl flex items-center justify-center transition-all ${showTierPricing ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-110' : 'bg-slate-100 text-slate-400'}`}>
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col items-start">
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Escalado</h4>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1 leading-none uppercase">Promoción por volumen</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all border ${showTierPricing ? 'rotate-180 bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                             <ChevronDown className="h-4 w-4" />
                           </div>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {showTierPricing && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="flex-1"
                          >
                            <div className="p-5 flex flex-col h-full gap-5">
                              {/* CABECERA DE TABLA: SIMETRÍA TOTAL CON PANEL IZQUIERDO */}
                              <div className="grid grid-cols-[1fr_1fr_40px] gap-2 px-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">Mínimo</span>
                                <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest ml-1 text-center">Precio</span>
                                <div />
                              </div>

                              <div className="flex-1 flex flex-col min-h-[140px] max-h-[350px] overflow-y-auto scrollbar-hide pr-1">
                                {(!productForm.tierPricing || (Array.isArray(productForm.tierPricing) && productForm.tierPricing.length === 0)) ? (
                                  <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2.5rem] p-10 bg-slate-50/10">
                                     <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                       <Plus className="h-5 w-5 text-slate-200" />
                                     </div>
                                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin tramos definidos</p>
                                  </div>
                                ) : (
                                  <div className="w-full space-y-3 pt-1">
                                    {(Array.isArray(productForm.tierPricing) ? productForm.tierPricing : []).map((tier: any, index: number) => (
                                      <div key={index} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center group/tier">
                                        <Input 
                                          type="number" 
                                          value={tier.minQty} 
                                          onChange={(e) => {
                                            const tiers = [...productForm.tierPricing];
                                            tiers[index].minQty = Number(e.target.value);
                                            setProductForm({...productForm, tierPricing: tiers});
                                          }} 
                                          className="bg-slate-50 border-transparent h-12 text-sm font-black text-slate-900 rounded-2xl text-center px-1 w-full focus-visible:ring-emerald-100 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                          placeholder="0"
                                        />
                                        
                                        <Input 
                                          type="number" 
                                          step="0.01" 
                                          value={tier.price} 
                                          onChange={(e) => {
                                            const tiers = [...productForm.tierPricing];
                                            tiers[index].price = Number(e.target.value);
                                            setProductForm({...productForm, tierPricing: tiers});
                                          }} 
                                          className="bg-emerald-50/20 border-transparent h-12 text-sm font-black text-emerald-600 rounded-2xl text-center px-1 w-full focus-visible:ring-emerald-200/30 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                          placeholder="0"
                                        />

                                        <button 
                                          onClick={() => {
                                            const tiers = productForm.tierPricing.filter((_: any, i: number) => i !== index);
                                            setProductForm({...productForm, tierPricing: tiers});
                                          }}
                                          className="h-10 w-10 flex items-center justify-center text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                            {/* BOTÓN AÑADIR (NUEVA UBICACIÓN): ACCIÓN PRINCIPAL AL PIE */}
                            <div className="px-1 pt-2 pb-1 border-t border-slate-50 mt-1">
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const tiers = Array.isArray(productForm.tierPricing) ? [...productForm.tierPricing] : [];
                                  tiers.push({ minQty: 10, price: Number((productForm.price * 0.9).toFixed(2)) });
                                  setProductForm({...productForm, tierPricing: tiers});
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black h-11 rounded-[1.2rem] uppercase tracking-[0.15em] border-none shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
                              >
                                <Plus className="h-4 w-4 transition-transform group-hover/btn:rotate-90" />
                                Añadir nuevo tramo
                              </Button>
                            </div>

                            {/* RESUMEN DE TRAMOS (Pie de tarjeta) */}
                            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-dashed border-emerald-200/50 mt-2">
                              <div className="flex items-center gap-2.5 mb-2.5">
                                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Resumen de Escalado:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {(!productForm.tierPricing || productForm.tierPricing.length === 0) ? (
                                   <span className="text-[9px] font-bold text-slate-400 italic">No hay descuentos por volumen definidos...</span>
                                 ) : (
                                    productForm.tierPricing.map((t: any, idx: number) => (
                                      <Badge key={idx} className="bg-white border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black px-2 shadow-sm border">
                                        +{t.minQty} uds. → {(t.price || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                                      </Badge>
                                    ))
                                 )}
                              </div>
                            </div>
                           </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                </section>

                {/* SECCIÓN DE OFERTA: AQUÍ SE DEFINE EL PRECIO TACHADO */}
                <div className="bg-[#2d4a3e] rounded-[1.8rem] p-5 flex items-center justify-between border border-emerald-500/20 shadow-lg shadow-emerald-900/10">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Precio Oferta</p>
                      <p className="text-[8px] font-bold text-emerald-400/50 uppercase tracking-tighter mt-1">Activa el tachado automático</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     {!!productForm.salePrice && (
                       <div className="relative">
                         <Input 
                           type="number" step="0.01"
                           value={productForm.salePrice || ''} 
                           onChange={(e) => setProductForm({...productForm, salePrice: e.target.value ? Number(e.target.value) : null})}
                           className="rounded-lg h-9 w-28 text-xs font-black bg-white/10 border-white/10 text-white pl-3 pr-8 focus-visible:ring-emerald-500/20 shadow-inner"
                         />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-400 opacity-60">€</span>
                       </div>
                     )}
                     <Switch 
                      checked={!!productForm.salePrice} 
                      onCheckedChange={(checked) => setProductForm({...productForm, salePrice: checked ? productForm.price * 0.8 : null})}
                      className="scale-75 data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>

                {/* VARIANTES ESPECIALES COMPACTAS */}
                <section>
                  <div className="bg-[#1a1f2c] rounded-2xl p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <ArrowUpDown className="h-4 w-4 text-blue-400" />
                      <h3 className="text-[10px] font-black uppercase tracking-tight">Variantes</h3>
                    </div>
                    <Switch checked={productForm.hasVariants} onCheckedChange={(checked) => setProductForm({...productForm, hasVariants: checked})} className="scale-75 data-[state=checked]:bg-blue-500" />
                  </div>

                  {productForm.hasVariants && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Propiedad</label>
                          <Input value={productForm.variantType || ''} onChange={(e) => setProductForm({...productForm, variantType: e.target.value})} placeholder="EJ: TAMAÑO" className="bg-white rounded-xl h-10 text-[9px] font-black px-4 uppercase shadow-sm border-slate-100/50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lógica de Precio</label>
                          <Select value={productForm.variantBehavior || 'replace'} onValueChange={(val: any) => setProductForm({...productForm, variantBehavior: val})}>
                            <SelectTrigger className="bg-white rounded-xl h-10 text-[9px] font-black px-4 uppercase border-slate-100/50 shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="replace" className="text-[9px] font-black uppercase">Precio Fijo</SelectItem>
                              <SelectItem value="add" className="text-[9px] font-black uppercase">+ Importe Extra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-hide py-1">
                        <DndContext 
                          sensors={sensors} 
                          collisionDetection={closestCenter} 
                          onDragEnd={(event) => {
                            const { active, over } = event
                            if (over && active.id !== over.id) {
                              const oldId = active.id as string
                              const newId = over.id as string
                              const oldIndex = parseInt(oldId.split('-')[1])
                              const newIndex = parseInt(newId.split('-')[1])
                              
                              const variants = productForm.variants || []
                              const newVariants = [...variants]
                              const [movedItem] = newVariants.splice(oldIndex, 1)
                              newVariants.splice(newIndex, 0, movedItem)
                              
                              setProductForm({ ...productForm, variants: newVariants })
                            }
                          }}
                        >
                          <SortableContext 
                            items={(productForm.variants || []).map((_: any, i: number) => `variant-${i}`)} 
                            strategy={verticalListSortingStrategy}
                          >
                            {(productForm.variants || []).map((variant: any, index: number) => (
                              <SortableVariantRow 
                                key={`variant-${index}`}
                                id={`variant-${index}`}
                                index={index} 
                                variant={variant} 
                                updateVariant={updateVariant} 
                                removeVariant={removeVariant} 
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={addVariant} 
                        className="w-full text-[9px] font-black text-slate-400 hover:text-blue-500 hover:bg-blue-50 uppercase tracking-widest h-11 bg-white border border-dashed border-slate-200 rounded-xl transition-all active:scale-95"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Añadir Opción Técnica
                      </Button>
                    </motion.div>
                  )}
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
                    <p className="text-[9px] font-black uppercase text-slate-900 leading-none">Ver Precio</p>
                    <Switch checked={productForm.showPrice !== false} onCheckedChange={(checked) => setProductForm({...productForm, showPrice: checked})} className="scale-75" />
                  </div>
                  <div className="bg-[#1a1f2c] rounded-xl p-3 flex items-center justify-between border border-white/5">
                    <p className="text-[9px] font-black uppercase text-white leading-none">Activo</p>
                    <Switch checked={productForm.active !== false} onCheckedChange={(checked) => setProductForm({...productForm, active: checked})} className="scale-75 data-[state=checked]:bg-emerald-500" />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* ACCIONES COMPACTAS */}
            <div className="px-8 py-4 border-t border-slate-100 flex items-center gap-4 bg-white z-20">
              <Button 
                variant="outline" 
                onClick={() => setIsProductDialogOpen(false)}
                className="flex-1 h-10 rounded-xl font-black uppercase text-[9px] text-slate-400 border-slate-100 border-2"
              >
                Cancelar
              </Button>
              <Button 
                onClick={onSaveProduct}
                className="flex-[2] h-10 rounded-xl font-black uppercase text-[9px] bg-black text-white hover:bg-slate-900 shadow-lg"
              >
                {editingProduct ? 'Guardar Cambios' : 'Publicar'}
              </Button>
            </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}
