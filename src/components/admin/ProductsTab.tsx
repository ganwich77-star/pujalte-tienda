'use client'

import React, { useState } from 'react'
import {
  Plus, Package, Edit, Trash2, Eye, EyeOff, ImageIcon,
  ImageOff, Upload, GripVertical, Check, X as CloseIcon, ZoomIn, ZoomOut,
  ArrowUp, ArrowDown, Info, Sparkles, ArrowUpDown, Search, Filter, ShoppingCart,
  ChevronDown, ChevronUp, Percent, Settings2, Loader2, Palette, Star
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Checkbox } from "@/components/ui/checkbox"
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useDebounce } from '../../hooks/use-debounce'

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
  onSaveProduct: (data?: any) => void
  addVariant: () => void
  updateVariant: (index: number, field: string, value: any) => void
  removeVariant: (index: number) => void
  isSaving: boolean
  resetProductForm: () => void
  suppliers?: any[]
}

// Quitamos la versión local de fixPath y usamos la de @/lib/utils importada arriba (línea 47)

// Componente DebouncedInput para edición rápida sin lag de red
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number,
  onChange: (val: string | number) => void,
  debounce?: number
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [value, setValue] = useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const debouncedValue = useDebounce(value, debounce)

  React.useEffect(() => {
    // Usamos comparación laxa para evitar bucles entre string (input) y number (db)
    if (debouncedValue != initialValue) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, initialValue])

  return (
    <input
      {...props}
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
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
  onSelect,
  suppliers = []
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
      className={`group border-b border-slate-50 transition-colors h-16 ${isDragging ? 'bg-slate-50 shadow-inner' : 'hover:bg-slate-50/50'}`}
    >
      <TableCell className="w-14 pl-4">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-black/5 rounded-lg transition-colors">
            <GripVertical className="h-4 w-4 text-slate-300" />
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(product.id)}
            className="h-5 w-5 rounded-md border-slate-200"
          />
        </div>
      </TableCell>
      <TableCell className="w-16 px-2">
        <div
          className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group/img cursor-pointer shadow-sm mx-auto transition-transform hover:scale-105 active:scale-95"
          onClick={() => onImageClick(product)}
        >
          {product.image ? (
            <img src={fixPath(product.image)} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="h-6 w-6 text-slate-300" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5 py-1">
          <DebouncedInput
            value={product.name}
            onChange={(val) => onUpdateProductField(product.id, 'name', val)}
            className="font-bold text-sm uppercase tracking-tight bg-transparent border-none focus:ring-0 p-0 w-full outline-none placeholder:text-slate-300 truncate"
            placeholder="NOMBRE..."
          />
          <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
            REF: {String(product.id || '').slice(-6).toUpperCase() || 'S/N'}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-40 px-2 lg:px-4 text-center">
        <Select
          value={product.categoryId || 'none'}
          onValueChange={(val) => onUpdateProductField(product.id, 'categoryId', val === 'none' ? null : val)}
        >
          <SelectTrigger className="h-8 border-none bg-slate-50/50 rounded-lg text-[9px] font-black uppercase tracking-widest px-2 shadow-sm hover:bg-white transition-all mx-auto max-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="none" className="text-[9px] font-black uppercase tracking-widest py-2">Sin Sección</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id} className="text-[9px] font-black uppercase tracking-widest py-2 text-center">{cat.name.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="w-32 px-2 text-center">
        <Select
          value={product.supplierId || 'none'}
          onValueChange={(val) => onUpdateProductField(product.id, 'supplierId', val === 'none' ? null : val)}
        >
          <SelectTrigger className="h-8 border-none bg-slate-50/50 rounded-lg text-[9px] font-black uppercase tracking-widest px-2 shadow-sm hover:bg-white transition-all mx-auto max-w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="none" className="text-[9px] font-black uppercase tracking-widest py-2">Sin Proveedor</SelectItem>
            {(Array.isArray(suppliers) ? suppliers : []).map((sup: any) => (
              <SelectItem key={sup.id} value={sup.id} className="text-[9px] font-black uppercase tracking-widest py-2 text-center">{sup.name.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="w-32 text-right pr-4">
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            <DebouncedInput
              value={product.salePrice || product.price}
              onChange={(val) => onUpdateProductField(product.id, product.salePrice ? 'salePrice' : 'price', parseFloat(String(val)) || 0)}
              className="w-14 bg-transparent border-none p-0 text-right font-black text-sm focus:ring-0 outline-none"
            />
            <span className="text-[10px] font-black text-slate-300">€</span>
          </div>
          {product.salePrice > 0 && (
            <span className="text-[9px] font-bold text-slate-300 line-through leading-none">Base: {product.price}€</span>
          )}
        </div>
      </TableCell>

      <TableCell className="w-44 px-2">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggleActive(product)}
            className={`h-8 w-8 rounded-lg border transition-all active:scale-90 ${
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
            className="h-8 w-8 rounded-lg bg-slate-900 text-white hover:bg-black transition-all active:scale-90"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-90">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl p-8 shadow-2xl">
              <AlertDialogHeader className="gap-4">
                <AlertDialogTitle className="text-xl font-black uppercase text-center tracking-tight">Eliminar Producto</AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium text-slate-500 text-center">
                  ¿Confirmas que deseas retirar <span className="text-slate-900 font-bold">&quot;{product.name}&quot;</span>? Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6 gap-3">
                <AlertDialogCancel className="font-bold uppercase text-[10px] tracking-widest rounded-xl">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteProduct(product.id)} className="font-bold uppercase text-[10px] tracking-widest rounded-xl bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
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
  isSaving,
  resetProductForm,
  suppliers = []
}: ProductsTabProps) {
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [activePromoTab, setActivePromoTab] = useState<'variants' | 'quantities' | 'tiers' | 'custom_options'>('variants')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isPromoOpen, setIsPromoOpen] = useState(true)
  const [croppingProduct, setCroppingProduct] = useState<Product | null>(null)
  const [cropForForm, setCropForForm] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null)
  const [isBulkAction, setIsBulkAction] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc' | null}>({ key: '', direction: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchSuggestions = React.useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    return products.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5)
  }, [products, searchTerm])

  // Asegura que al abrir el diálogo de producto, la pestaña por defecto sea Variantes
  React.useEffect(() => {
    if (isProductDialogOpen) {
      setActivePromoTab('variants');
    }
  }, [isProductDialogOpen]);

  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const formImageInputRef = React.useRef<HTMLInputElement>(null)

  const sortedProducts = React.useMemo(() => {
    let filtered = [...products]

    // Filtrado por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        String(p.id || '').toLowerCase().includes(term)
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
        aVal = categories.find(c => c.id === aVal || c.name === aVal)?.name || ''
        bVal = categories.find(c => c.id === bVal || c.name === bVal)?.name || ''
      }
      if (sortConfig.key === 'supplierId') {
        aVal = (Array.isArray(suppliers) ? suppliers : []).find((s: any) => s.id === aVal)?.name || ''
        bVal = (Array.isArray(suppliers) ? suppliers : []).find((s: any) => s.id === bVal)?.name || ''
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
    setIsBulkAction(true)
    setProductToDeleteId(null)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    setDeleteProgress(0)
    try {
      if (isBulkAction) {
        const total = selectedIds.length
        // Se itera para poder mostrar el progreso exacto y no saturar la conexión
        for (let i = 0; i < selectedIds.length; i++) {
          await onDeleteProduct(selectedIds[i])
          setDeleteProgress(Math.round(((i + 1) / total) * 100))
        }
        setSelectedIds([])
      } else if (productToDeleteId) {
        await onDeleteProduct(productToDeleteId)
      }

      toast({
        title: isBulkAction ? "BORRADO MASIVO COMPLETADO" : "PRODUCTO ELIMINADO",
        description: isBulkAction
          ? `SE HAN ELIMINADO ${selectedIds.length} PRODUCTOS CORRECTAMENTE.`
          : "EL PRODUCTO HA SIDO BORRADO DE TU CATÁLOGO.",
        className: "bg-emerald-500 text-white border-none font-black rounded-xl",
      })
      setShowDeleteDialog(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "ERROR AL ELIMINAR",
        description: "HUBO UN PROBLEMA AL PROCESAR LA SOLICITUD.",
        variant: "destructive",
        className: "bg-red-500 text-white border-none font-black rounded-xl",
      })
    } finally {
      setIsDeleting(false)
      setDeleteProgress(0)
      setProductToDeleteId(null)
      setIsBulkAction(false)
    }
  }

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleApplyCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return
    setIsUploadingImage(true)
    try {
      const croppedImageBase64 = await getCroppedImg(cropImage, croppedAreaPixels)
      
      // Convertir base64 a Blob para subirlo como archivo
      const response = await fetch(croppedImageBase64)
      const blob = await response.blob()
      
      const formData = new FormData()
      formData.append('file', blob, 'product-image.jpg')
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadRes.ok) throw new Error('Error al subir imagen')
      
      const uploadData = await uploadRes.json()
      const imageUrl = uploadData.url

      if (cropForForm) {
        setProductForm((prev: any) => ({ ...prev, image: imageUrl }))
        setCropForForm(false)
      } else if (croppingProduct) {
        onUpdateProductField(croppingProduct.id, 'image', imageUrl)
      }
      setCropImage(null)
      setCroppingProduct(null)
      toast({ title: 'Éxito', description: 'Imagen subida correctamente' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Fallo al subir la imagen', variant: 'destructive' })
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
        <div className="relative flex-1 w-full group/search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 transition-colors group-focus-within/search:text-black" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="BUSCAR PRODUCTO POR NOMBRE O REF..."
            className="h-11 pl-12 pr-10 rounded-xl bg-slate-50 border-slate-200 text-sm font-medium focus-visible:ring-black/5 focus-visible:bg-white transition-all shadow-sm uppercase tracking-tight"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg bg-slate-200/50 flex items-center justify-center hover:bg-black hover:text-white transition-all"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          )}

          <AnimatePresence>
            {showSuggestions && searchSuggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50 z-[100] shadow-black/10"
                onMouseLeave={() => setShowSuggestions(false)}
              >
                {searchSuggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSearchTerm(p.name)
                      setShowSuggestions(false)
                    }}
                    className="w-full h-14 px-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left group/item"
                  >
                    <div className="h-9 w-9 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 shadow-sm">
                      {p.image ? (
                        <img src={fixPath(p.image)} className="w-full h-full object-cover transition-transform group-hover/item:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20"><Package className="h-4 w-4" /></div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black text-slate-900 uppercase truncate leading-none mb-1">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded-md">REF: {String(p.id).slice(-6).toUpperCase()}</span>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic">{formatPrice(p.price || 0)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
              <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest py-3">TODAS LAS CATEGORIAS</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-black uppercase tracking-widest py-3">
                  {cat.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sortConfig.key && (
            <Button
              onClick={() => onReorderProducts(sortedProducts)}
              className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              FIJAR ORDEN ACTUAL
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {setSearchTerm(''); setCategoryFilter('all'); setSortConfig({ key: '', direction: null })}}
            className="h-11 w-11 rounded-xl text-slate-300 hover:text-black hover:bg-slate-100 bg-slate-50 border border-slate-200 shadow-sm"
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 hidden md:block">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-separate border-spacing-0">
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent h-12">
                  <TableHead className="w-14 pl-4">
                    <Checkbox checked={selectedIds.length === products.length} onCheckedChange={handleSelectAll} className="h-5 w-5 rounded-md border-slate-300" />
                  </TableHead>
                  <TableHead className="w-16 px-2 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Preview</TableHead>
                  <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Producto y Referencia</TableHead>
                  <TableHead className="w-40 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Categoría</TableHead>
                  <TableHead className="w-40 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Proveedor</TableHead>
                  <TableHead className="w-32 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">PVP</TableHead>
                  <TableHead className="w-44 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Acciones</TableHead>
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
                      suppliers={suppliers}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </ScrollArea>

      {/* Mobile Experience (Compacted List) */}
      <ScrollArea className="flex-1 md:hidden bg-slate-50/50">
        <div className="space-y-2 px-3 py-4 pb-32">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group flex gap-3 items-center"
            >
              {/* Miniatura */}
              <div
                className="h-14 w-14 rounded-lg overflow-hidden border border-slate-50 flex-shrink-0 bg-slate-50"
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
                    <ImageOff className="h-6 w-6 text-slate-200" />
                  </div>
                )}
              </div>

              {/* Info Principal */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                   <Checkbox
                    checked={selectedIds.includes(product.id)}
                    onCheckedChange={() => handleSelect(product.id)}
                    className="h-4 w-4 rounded border-slate-200"
                  />
                  <h3 className="font-bold text-xs uppercase tracking-tight text-slate-800 truncate">{product.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">
                     REF: {String(product.id || '').slice(-4).toUpperCase() || '####'}
                   </span>
                   <span className="text-slate-200">•</span>
                   <span className="text-[10px] font-black text-[#4A7C59]">
                    {(Number(product.salePrice) || Number(product.price) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                   </span>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEditProduct(product)}
                  className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 border border-slate-100"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-red-50 text-red-400 border border-red-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[90vw] max-w-sm rounded-2xl p-6 bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-sm font-black uppercase text-center">Eliminar?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 flex gap-2">
                      <AlertDialogCancel className="h-9 rounded-xl text-[10px] uppercase font-black flex-1 border-slate-100">No</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteProduct(product.id)} className="h-9 rounded-xl text-[10px] uppercase font-black flex-1 bg-red-500">Sí, Borrar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {sortedProducts.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
               <Package className="h-8 w-8 text-slate-200 mx-auto mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sin productos</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Hidden File Inputs */}
      <Input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageFileChange} />
      <Input type="file" ref={formImageInputRef} className="hidden" accept="image/*" onChange={handleFormImageFileChange} />

      {/* Crop Modal */}
      <Dialog open={!!cropImage} onOpenChange={(isOpen) => !isOpen && setCropImage(null)}>
        <DialogContent className="sm:max-w-[600px] w-[90vw] max-h-[85vh] border-none bg-black rounded-3xl p-0 overflow-hidden shadow-2xl">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-black" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white uppercase tracking-tight leading-none">Ajustar Imagen</DialogTitle>
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
                  variant="ghost"
                  onClick={() => setCropImage(null)}
                  className="flex-1 h-11 rounded-xl font-bold uppercase tracking-wider text-[10px] border border-white/10 bg-transparent text-white/50 hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleApplyCrop}
                  disabled={isUploadingImage}
                  className="flex-[2] h-11 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-white text-black hover:bg-slate-100 shadow-lg"
                >
                  {isUploadingImage ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  {isUploadingImage ? 'Subiendo...' : 'Confirmar Fotografía'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Edit Modal XL - DISEÑO PREMIUM COMPACTO */}
      <Dialog open={isProductDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) resetProductForm()
        setIsProductDialogOpen(isOpen)
      }}>
        <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[95vh] lg:max-h-[88vh] overflow-hidden border-none bg-white rounded-[2rem] p-0 flex flex-col mx-auto shadow-2xl">
            {/* HEADER COMPACTO */}
            <DialogHeader className="px-6 py-3 bg-[#1a1f2c] flex-shrink-0 z-10 relative overflow-hidden">
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
              <div className="px-6 py-4 space-y-4 pb-8">

                {/* SECCIÓN 1: GENERAL */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left: Image Selection */}
                    <div className="md:col-span-4 space-y-4">
                      <div className="flex flex-col items-center gap-4">
                        <div
                          className="relative group w-24 h-24"
                          onClick={() => formImageInputRef.current?.click()}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-50 shadow-md transition-transform group-hover:scale-[1.02] cursor-pointer bg-slate-50">
                            {(productForm.image || productForm.src) ? (
                              <img src={fixPath(productForm.image || productForm.src)} alt="Preview" className="w-full h-full object-cover" />
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
                          onClick={() => setProductForm((prev: any) => ({...prev, isNew: !prev.isNew}))}
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
                            onCheckedChange={(checked) => setProductForm((prev: any) => ({...prev, isNew: checked}))}
                            onClick={(e) => e.stopPropagation()}
                            className="scale-75 data-[state=checked]:bg-amber-500"
                          />
                        </div>

                        {/* FAVORITO */}
                        <div
                          onClick={() => setProductForm((prev: any) => ({...prev, isFeatured: !prev.isFeatured}))}
                          className={`w-full rounded-2xl p-3 border transition-all cursor-pointer flex items-center justify-between select-none ${
                            productForm.isFeatured
                              ? 'bg-blue-50 border-blue-200 shadow-sm'
                              : 'bg-slate-50 border-slate-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Star className={`h-4 w-4 ${productForm.isFeatured ? 'text-blue-500' : 'text-slate-300'}`} />
                            <Label className={`text-[9px] font-black uppercase cursor-pointer tracking-tight ${
                                productForm.isFeatured ? 'text-blue-800' : 'text-slate-400'
                            }`}>Favorito</Label>
                          </div>
                          <Switch
                            checked={!!productForm.isFeatured}
                            onCheckedChange={(checked) => setProductForm((prev: any) => ({...prev, isFeatured: checked}))}
                            onClick={(e) => e.stopPropagation()}
                            className="scale-75 data-[state=checked]:bg-blue-600"
                          />
                        </div>

                        {/* PRECIO OFERTA COMPACTO BAJO NOVEDAD */}
                        <div className="w-full space-y-2">
                          <div
                            onClick={() => {
                              const isOffered = !!productForm.salePrice;
                              setProductForm((prev: any) => ({
                                ...prev,
                                salePrice: isOffered ? null : (prev.price ? prev.price * 0.9 : 0)
                              }))
                            }}
                            className={`w-full rounded-2xl p-3 border transition-all cursor-pointer flex items-center justify-between select-none ${
                              productForm.salePrice
                                ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                : 'bg-slate-50 border-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Percent className={`h-4 w-4 ${productForm.salePrice ? 'text-emerald-500' : 'text-slate-300'}`} />
                              <Label className={`text-[9px] font-black uppercase cursor-pointer tracking-tight ${
                                  productForm.salePrice ? 'text-emerald-800' : 'text-slate-400'
                              }`}>Oferta</Label>
                            </div>
                            <Switch
                              checked={!!productForm.salePrice}
                              onCheckedChange={(checked) => setProductForm((prev: any) => ({...prev, salePrice: checked ? (prev.price ? prev.price * 0.9 : 0) : null}))}
                              onClick={(e) => e.stopPropagation()}
                              className="scale-75 data-[state=checked]:bg-emerald-500"
                            />
                          </div>

                          {!!productForm.salePrice && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full"
                            >
                              <div className="relative">
                                <Input
                                  type="number" step="0.01"
                                  value={productForm.salePrice || ''}
                                  onChange={(e) => setProductForm((prev: any) => ({...prev, salePrice: e.target.value ? Number(e.target.value) : 0}))}
                                  className="rounded-xl h-9 text-xs font-black bg-emerald-50/50 border-emerald-100 text-emerald-800 pl-3 pr-8 focus:bg-white transition-all italic text-center"
                                  placeholder="0.00"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-400 opacity-60 italic">€</span>
                              </div>
                            </motion.div>
                          )}

                          {/* FOTOS INCLUIDAS: ACCESO RÁPIDO */}
                          <div className="w-full space-y-2 pt-2 border-t border-slate-100/50 mt-2">
                             <div className="flex items-center gap-2 mb-1 px-1">
                                <ImageIcon className="h-3 w-3 text-[#4A7C59]" />
                                <Label className="text-[7.5px] font-black text-[#4A7C59] uppercase tracking-widest italic leading-none">Fotos Incluidas</Label>
                             </div>
                             <div className="relative group">
                                <Input
                                  type="number"
                                  value={productForm.fotosIncluidas === 0 ? '' : (productForm.fotosIncluidas || '')}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    setProductForm((prev: any) => ({...prev, fotosIncluidas: isNaN(val) ? 0 : val}));
                                  }}
                                  className="rounded-2xl h-12 text-sm font-black bg-emerald-50/30 border-emerald-100/50 text-center px-1 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-inner no-spinner text-[#4A7C59]"
                                  placeholder="1"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-emerald-600 bg-white px-2 py-0.5 rounded-md border border-emerald-100 shadow-sm uppercase tracking-widest italic">
                                  FOTOS
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Core Info */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="grid grid-cols-[1fr_90px] gap-4 bg-slate-50/50 p-3 rounded-[1.5rem] border border-slate-100/50 items-end">
                        <div className="space-y-1.5 min-w-0">
                          <Label className="text-[9px] font-black text-blue-300 uppercase tracking-widest ml-1">Nombre Comercial</Label>
                          <Input
                            value={productForm.name || ''}
                            onChange={(e) => {
                              const newVal = e.target.value.toUpperCase();
                              setProductForm((prev: any) => ({...prev, name: newVal}));
                            }}
                            className="rounded-xl h-11 text-sm font-black bg-white border-transparent px-4 focus:bg-white focus:border-blue-100 transition-all shadow-sm"
                            placeholder="NOMBRE..."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black text-blue-300 uppercase tracking-widest ml-1">Precio</Label>
                          <div className="relative group/price w-full" style={{ height: '44px' }}>
                            <Input
                              type="number"
                              step="0.01"
                              value={productForm.price || ''}
                              onChange={(e) => {
                                 const val = e.target.value === '' ? 0 : Number(e.target.value);
                                 setProductForm((prev: any) => ({ ...prev, price: isNaN(val) ? 0 : val }));
                               }}
                              style={{ height: '44px', minHeight: '44px' }}
                              className="rounded-xl !h-[44px] text-md font-black bg-white border border-slate-100 pl-3 pr-8 text-right shadow-sm group-hover/price:shadow-md transition-all w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 font-black text-[10px] opacity-40">€</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-[1.5rem] border border-slate-100/50 items-end">
                        <div className="flex flex-col gap-2 min-w-0">
                          <Label className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em] ml-2">Categoría</Label>
                          <Select
                            value={productForm.categoryId || 'none'}
                            onValueChange={(val) => setProductForm({...productForm, categoryId: val === 'none' ? null : val})}
                          >
                            <SelectTrigger
                              style={{ height: '44px', minHeight: '44px' }}
                              className="rounded-xl !h-[44px] text-[10px] font-black bg-white border border-slate-100 px-4 uppercase tracking-widest shadow-sm hover:shadow-md transition-all w-full overflow-hidden flex items-center"
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
                        <div className="flex flex-col gap-2 min-w-0">
                           <Label className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em] ml-2">Proveedor</Label>
                           <Select
                            value={productForm.supplierId || 'none'}
                            onValueChange={(val) => setProductForm({...productForm, supplierId: val === 'none' ? null : val})}
                          >
                            <SelectTrigger
                              style={{ height: '44px', minHeight: '44px' }}
                              className="rounded-xl !h-[44px] text-[10px] font-black bg-white border border-slate-100 px-4 uppercase tracking-widest shadow-sm hover:shadow-md transition-all w-full overflow-hidden flex items-center"
                            >
                              <SelectValue placeholder="SIN PROVEEDOR" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              <SelectItem value="none" className="text-[10px] font-black uppercase tracking-widest">Sin Proveedor</SelectItem>
                              {suppliers.map((sup: any) => (
                                <SelectItem key={sup.id} value={sup.id} className="text-[10px] font-black uppercase tracking-widest">{sup.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

                {/* SECCIÓN TÉCNICA UNIFICADA: CANTIDADES, ESCALADO Y VARIANTES */}
                <section className="space-y-4">
                    <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                      {/* BARRA DE NAVEGACIÓN ÚNICA: REFINADA */}
                      <div className="p-1.5 space-y-1 bg-slate-50/40 border-b border-slate-50">
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => setActivePromoTab('variants')}
                            className={`flex flex-col items-center justify-center gap-0.5 h-12 rounded-[0.8rem] transition-all duration-300 select-none ${
                                activePromoTab === 'variants'
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                                : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                            }`}
                          >
                            <Settings2 className={`h-3 w-3 ${activePromoTab === 'variants' ? 'text-white' : 'text-slate-400'}`} />
                            <div className="flex flex-col items-center leading-none">
                              <span className="text-[7.5px] font-black uppercase tracking-wider">VARIANTES</span>
                              <span className={`text-[5.5px] font-bold uppercase tracking-tighter opacity-70 ${activePromoTab === 'variants' ? 'text-white/60' : 'text-slate-400'}`}>Opciones</span>
                            </div>
                          </button>

                          <button
                             onClick={() => setActivePromoTab('custom_options' as any)}
                             className={`flex flex-col items-center justify-center gap-0.5 h-12 rounded-[0.8rem] transition-all duration-300 select-none ${
                               activePromoTab === 'custom_options'
                                 ? 'bg-orange-600 text-white shadow-md shadow-orange-100'
                                 : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                             }`}
                           >
                             <Palette className={`h-3 w-3 ${activePromoTab === 'custom_options' ? 'text-white' : 'text-slate-400'}`} />
                             <div className="flex flex-col items-center leading-none">
                               <span className="text-[7.5px] font-black uppercase tracking-wider">PERSONALIZA</span>
                               <span className={`text-[5.5px] font-bold uppercase tracking-tighter opacity-70 ${activePromoTab === 'custom_options' ? 'text-orange-100' : 'text-slate-400'}`}>Formas</span>
                             </div>
                           </button>

                           <button
                             onClick={() => setActivePromoTab('quantities')}
                             className={`flex flex-col items-center justify-center gap-0.5 h-12 rounded-[0.8rem] transition-all duration-300 select-none ${
                               activePromoTab === 'quantities'
                                 ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                 : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                             }`}
                           >
                             <Package className={`h-3 w-3 ${activePromoTab === 'quantities' ? 'text-white' : 'text-slate-400'}`} />
                             <div className="flex flex-col items-center leading-none">
                               <span className="text-[7.5px] font-black uppercase tracking-wider">CANTIDADES</span>
                               <span className={`text-[5.5px] font-bold uppercase tracking-tighter opacity-70 ${activePromoTab === 'quantities' ? 'text-blue-100' : 'text-slate-400'}`}>Operativa</span>
                             </div>
                           </button>

                           <button
                             onClick={() => setActivePromoTab('tiers')}
                             className={`flex flex-col items-center justify-center gap-0.5 h-12 rounded-[0.8rem] transition-all duration-300 select-none ${
                               activePromoTab === 'tiers'
                                 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                                 : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                             }`}
                           >
                             <ArrowUpDown className={`h-3 w-3 ${activePromoTab === 'tiers' ? 'text-white' : 'text-slate-400'}`} />
                             <div className="flex flex-col items-center leading-none">
                               <span className="text-[7.5px] font-black uppercase tracking-wider">ESCALADO</span>
                               <span className={`text-[5.5px] font-bold uppercase tracking-tighter opacity-70 ${activePromoTab === 'tiers' ? 'text-emerald-100' : 'text-slate-400'}`}>Ofertas</span>
                             </div>
                           </button>
                        </div>
                      </div>

                      <div className="bg-white min-h-[350px]">
                          {activePromoTab === 'quantities' && (
                            <div className="p-5 space-y-6">
                              <div className="grid grid-cols-2 gap-3">
                                {/* FOTOS MOVIDO A SIDEBAR */}

                                <div className="space-y-1.5">
                                  <Label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Mínimo Inicial</Label>
                                  <div className="relative group">
                                    <Input
                                      type="number"
                                      value={productForm.minQuantity || 1}
                                      onChange={(e) => setProductForm({...productForm, minQuantity: Number(e.target.value)})}
                                      className="rounded-2xl h-12 text-sm font-black bg-slate-50 border-transparent text-center px-1 focus:bg-white focus:ring-4 focus:ring-blue-100/30 transition-all shadow-inner [appearance:textfield]"
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Salto / Paso</Label>
                                  <div className="relative group">
                                    <Input
                                      type="number"
                                      value={productForm.stepQuantity || 1}
                                      onChange={(e) => setProductForm({...productForm, stepQuantity: Number(e.target.value)})}
                                      className="rounded-2xl h-12 text-sm font-black bg-slate-50 border-transparent text-center px-1 focus:bg-white focus:ring-4 focus:ring-blue-100/30 transition-all shadow-inner [appearance:textfield]"
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-blue-50/40 to-white rounded-[2rem] p-5 border border-blue-100/20 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="h-6 w-6 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-100">
                                    <Sparkles className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">PREVISUALIZACIÓN TIENDA</span>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between px-1">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase">PVP Unitario:</span>
                                     <span className="text-[10px] font-black text-slate-700">{productForm.price || 0} €</span>
                                  </div>
                                  <div className="flex items-center justify-between p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100/50 border border-blue-400/20">
                                     <div className="flex flex-col">
                                       <span className="text-[8px] font-black text-blue-50 uppercase tracking-widest">SI PIDE EL MÍNIMO ({productForm.minQuantity || 1} UDS.):</span>
                                       <span className="text-[9px] font-medium text-blue-200/80 italic leading-none">Precio final por pack</span>
                                     </div>
                                     <span className="text-base font-black text-white tracking-tighter">
                                       {(() => {
                                         const tiers = Array.isArray(productForm.tierPricing) ? productForm.tierPricing : [];
                                         const applicableTier = [...tiers]
                                           .sort((a, b) => b.minQty - a.minQty)
                                           .find(t => (productForm.minQuantity || 1) >= t.minQty);
                                         const pricePerUnit = applicableTier ? applicableTier.price : (productForm.price || 0);
                                         return (pricePerUnit * (productForm.minQuantity || 1)).toLocaleString('es-ES', { minimumFractionDigits: 2 });
                                       })()} €
                                     </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activePromoTab === 'tiers' && (
                            <div className="p-6 space-y-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tramos de Descuento</h5>
                                  <Badge variant="outline" className="text-[8px] font-black bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg">PROMOCIÓN ACTIVA</Badge>
                                </div>

                                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                  {(!productForm.tierPricing || (Array.isArray(productForm.tierPricing) && productForm.tierPricing.length === 0)) ? (
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-10 bg-slate-50/20">
                                       <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
                                         <Plus className="h-6 w-6 text-slate-200" />
                                       </div>
                                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Configura descuentos automáticos por volumen</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {(Array.isArray(productForm.tierPricing) ? productForm.tierPricing : []).map((tier: any, index: number) => (
                                        <div key={index} className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-2xl hover:bg-slate-50 transition-colors group/tier border border-transparent hover:border-slate-100">
                                          <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-300 uppercase">Mín</span>
                                            <Input
                                              type="number"
                                              value={tier.minQty}
                                              onChange={(e) => {
                                                const tiers = [...productForm.tierPricing];
                                                tiers[index].minQty = Number(e.target.value);
                                                setProductForm({...productForm, tierPricing: tiers});
                                              }}
                                              className="bg-white border-slate-100 h-11 text-xs font-black text-slate-900 rounded-xl pl-8 text-center w-full focus-visible:ring-emerald-100 shadow-sm"
                                            />
                                          </div>

                                          <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-emerald-300 uppercase">PVP</span>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              value={tier.price}
                                              onChange={(e) => {
                                                const tiers = [...productForm.tierPricing];
                                                tiers[index].price = Number(e.target.value);
                                                setProductForm({...productForm, tierPricing: tiers});
                                              }}
                                              className="bg-white border-emerald-100 h-11 text-xs font-black text-emerald-600 rounded-xl pl-8 text-center w-full focus-visible:ring-emerald-200/30 shadow-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-400/50">€</span>
                                          </div>

                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              const tiers = productForm.tierPricing.filter((_: any, i: number) => i !== index);
                                              setProductForm({...productForm, tierPricing: tiers});
                                            }}
                                            className="h-11 w-11 shrink-0 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/tier:opacity-100"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <Button
                                  onClick={() => {
                                    const tiers = Array.isArray(productForm.tierPricing) ? [...productForm.tierPricing] : [];
                                    const lastPrice = tiers.length > 0 ? tiers[tiers.length-1].price : productForm.price;
                                    tiers.push({ minQty: 10, price: Number((lastPrice * 0.95).toFixed(2)) });
                                    setProductForm({...productForm, tierPricing: tiers});
                                  }}
                                  className="w-full bg-slate-900 text-white hover:bg-black rounded-2xl h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                  <Plus className="h-4 w-4 transition-transform group-hover/btn:rotate-90" />
                                  Añadir Tramo de Precio
                                </Button>
                              </div>
                            </div>
                          )}

                          {activePromoTab === 'variants' && (
                            <div className="p-6 space-y-6">
                              <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                  <div className="h-7 w-7 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                                    <Settings2 className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Configuración de Variantes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Activar Variantes</span>
                                  <Switch
                                    checked={productForm.hasVariants}
                                    onCheckedChange={(checked) => setProductForm({...productForm, hasVariants: checked})}
                                    className="scale-75 data-[state=checked]:bg-blue-500"
                                  />
                                </div>
                              </div>

                              {productForm.hasVariants ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Propiedad</label>
                                      <Input value={productForm.variantType || ''} onChange={(e) => setProductForm({...productForm, variantType: e.target.value})} placeholder="EJ: TAMAÑO" className="bg-slate-50 rounded-xl h-10 text-[9px] font-black px-4 uppercase shadow-inner border-transparent focus:bg-white focus:border-slate-100 transition-all font-inter" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lógica de Precio</label>
                                      <Select value={productForm.variantBehavior || 'replace'} onValueChange={(val: any) => setProductForm({...productForm, variantBehavior: val})}>
                                        <SelectTrigger className="bg-slate-50 rounded-xl h-10 text-[9px] font-black px-4 uppercase border-transparent shadow-inner focus:bg-white focus:border-slate-100 transition-all font-inter">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                          <SelectItem value="replace" className="text-[9px] font-black uppercase">Precio Fijo</SelectItem>
                                          <SelectItem value="add" className="text-[9px] font-black uppercase">+ Importe Extra</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 py-1">
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
                                    className="w-full text-[9px] font-black text-slate-400 hover:text-blue-500 hover:bg-blue-50 uppercase tracking-widest h-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 group/addv"
                                  >
                                    <Plus className="h-4 w-4 transition-transform group-hover/addv:rotate-90" /> Añadir Opción Técnica
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-10 bg-slate-50/20">
                                   <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
                                     <Settings2 className="h-6 w-6 text-slate-200" />
                                   </div>
                                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center max-w-[200px]">Crea opciones técnicas como tamaños, colores o materiales</p>
                                   <Button
                                    onClick={() => setProductForm({...productForm, hasVariants: true})}
                                    className="mt-4 bg-slate-900 text-white rounded-xl px-6 h-10 text-[9px] font-black uppercase tracking-widest"
                                   >
                                    Activar Ahora
                                   </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {activePromoTab === 'custom_options' && (
                            <div className="flex flex-col h-[450px]">
                              {/* CABECERA COMPACTA STICKY */}
                              <div className="p-4 flex items-center justify-between border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-10 rounded-t-3xl">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-lg bg-orange-600 flex items-center justify-center shadow-md">
                                    <Palette className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">Personalizar Formas</span>
                                </div>
                                <Badge variant="outline" className="text-[7px] font-black bg-orange-50 text-orange-600 border-orange-100 uppercase py-0 h-4">PRECIO FIJO</Badge>
                              </div>

                              {/* ÁREA DE CONTENIDO CON SCROLL */}
                              <ScrollArea className="flex-1 px-4 py-2 bg-slate-50/20">
                                <div className="space-y-2 py-2">
                                  {(() => {
                                    let options: any[] = [];
                                    try {
                                      if (productForm.customOptions) {
                                        options = typeof productForm.customOptions === 'string' 
                                          ? JSON.parse(productForm.customOptions) 
                                          : productForm.customOptions;
                                      }
                                    } catch (e) { options = []; }
                                    
                                    if (options.length === 0) {
                                      return (
                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-6 bg-white/50 my-2">
                                           <Palette className="h-5 w-5 text-slate-200 mb-2" />
                                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center">Sin formas configuradas</p>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="space-y-2">
                                        {options.map((opt: any, idx: number) => (
                                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2 relative group hover:border-orange-200 transition-all">
                                            <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                                              <div className="flex items-center gap-2 flex-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                                                <input 
                                                  value={opt.titleRaw !== undefined ? opt.titleRaw : (opt.title || '')}
                                                  onChange={(e) => {
                                                    const newOpts = [...options];
                                                    newOpts[idx].titleRaw = e.target.value;
                                                    newOpts[idx].title = e.target.value.toUpperCase();
                                                    setProductForm({...productForm, customOptions: JSON.stringify(newOpts)});
                                                  }}
                                                  className="bg-transparent border-none p-0 text-[8px] font-black text-slate-900 uppercase tracking-widest italic w-full focus:outline-none focus:ring-0 placeholder:text-slate-300"
                                                  placeholder="NOMBRE OPCIÓN..."
                                                />
                                              </div>
                                              <button 
                                                onClick={() => {
                                                  const newOpts = [...options];
                                                  newOpts.splice(idx, 1);
                                                  setProductForm({...productForm, customOptions: JSON.stringify(newOpts)});
                                                }}
                                                className="h-5 w-5 rounded-md flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                            
                                            <div className="px-1">
                                              <Input 
                                                value={opt.valuesRaw !== undefined ? opt.valuesRaw : (opt.values?.join(', ') || '')} 
                                                onChange={(e) => {
                                                  const newOpts = [...options];
                                                  newOpts[idx].valuesRaw = e.target.value;
                                                  newOpts[idx].values = e.target.value.split(',').map((v: string) => v.trim()).filter((v: string) => v !== '');
                                                  setProductForm({...productForm, customOptions: JSON.stringify(newOpts)});
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                  }
                                                }}
                                                placeholder="VALORES: CIRCULO, ESTRELLA..." 
                                                className="bg-slate-50/50 rounded-lg h-9 text-[9px] font-bold px-3 uppercase border-none focus:ring-1 focus:ring-orange-100 transition-all font-mono" 
                                              />
                                            </div>
                                            
                                            <div className="flex items-center justify-between px-1 pt-0.5">
                                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Es Obligatoria</span>
                                              <Switch 
                                                checked={opt.required} 
                                                onCheckedChange={(checked) => {
                                                  const newOpts = [...options];
                                                  newOpts[idx].required = checked;
                                                  setProductForm({...productForm, customOptions: JSON.stringify(newOpts)});
                                                }}
                                                className="scale-75 data-[state=checked]:bg-orange-500" 
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </ScrollArea>

                              <div className="p-4 bg-white border-t border-slate-100 rounded-b-3xl">
                                <Button 
                                  onClick={() => {
                                    let options: any[] = [];
                                    try {
                                      options = productForm.customOptions ? JSON.parse(productForm.customOptions) : [];
                                    } catch (e) { options = []; }
                                    options.push({ title: 'FORMA', values: [], required: true });
                                    setProductForm({...productForm, customOptions: JSON.stringify(options)});
                                  }}
                                  className="w-full bg-orange-600 text-white hover:bg-black rounded-xl h-10 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 flex items-center justify-center gap-2 group/addp"
                                >
                                  <Plus className="h-3 w-3 transition-transform group-hover/addp:scale-125" />
                                  AÑADIR NUEVA FORMA
                                </Button>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 transition-all hover:bg-slate-50">
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black uppercase text-slate-900 leading-none">VISIBILIDAD</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Ver Precio</p>
                    </div>
                    <Switch checked={productForm.showPrice !== false} onCheckedChange={(checked) => setProductForm({...productForm, showPrice: checked})} className="scale-75 data-[state=checked]:bg-blue-500" />
                  </div>
                  <div className={`rounded-2xl p-4 flex items-center justify-between border transition-all duration-300 ${
                    productForm.active !== false
                      ? 'bg-emerald-50/30 border-emerald-100'
                      : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <div className="flex flex-col">
                      <p className={`text-[8px] font-black uppercase leading-none ${productForm.active !== false ? 'text-emerald-600' : 'text-slate-900'}`}>ESTADO</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{productForm.active !== false ? 'Activo' : 'Inactivo'}</p>
                    </div>
                    <Switch checked={productForm.active !== false} onCheckedChange={(checked) => setProductForm({...productForm, active: checked})} className="scale-75 data-[state=checked]:bg-emerald-500" />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* ACCIONES COMPACTAS */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-4 bg-white z-20">
              <Button
                variant="outline"
                onClick={() => setIsProductDialogOpen(false)}
                className="flex-1 h-10 rounded-xl font-black uppercase text-[9px] text-slate-400 border-slate-100 border-2"
              >
                Cancelar
              </Button>
              <Button
                disabled={isSaving}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSaveProduct(productForm);
                }}
                className="flex-[2] h-10 rounded-xl font-black uppercase text-[9px] bg-black text-white hover:bg-slate-900 shadow-lg active:scale-95 transition-all flex items-center justify-center"
              >
                {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                {editingProduct ? 'Guardar Cambios' : 'Publicar'}
              </Button>
            </div>
          </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMACIÓN DE BORRADO DINÁMICO (INDIVIDUAL O MASIVO) */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2.5rem] p-12 border-none shadow-2xl bg-white sm:max-w-[450px]">
          <AlertDialogHeader className="space-y-6">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center shadow-inner">
              <Trash2 className="h-10 w-10 animate-pulse" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl font-black uppercase text-center tracking-tight text-slate-900 leading-none">
                {isBulkAction ? `ELIMINAR ${selectedIds.length} PRODUCTOS` : 'ELIMINAR PRODUCTO'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-slate-500 text-center uppercase tracking-widest leading-relaxed">
                {isBulkAction
                  ? 'Esta acción retirará todos los elementos seleccionados de la tienda de forma permanente.'
                  : 'Esta acción retirará este elemento de la tienda de forma inmediata.'}
                <br />
                <span className="text-red-500 font-black mt-2 inline-block">¿CONFIRMAS LA OPERACIÓN?</span>
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          {isDeleting && (
            <div className="mt-8 space-y-3">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${deleteProgress}%` }}
                  className="h-full bg-red-500"
                />
              </div>
              <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-tighter">Procesando: {deleteProgress}%</p>
            </div>
          )}

          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest flex-1 border-slate-200 hover:bg-slate-50 transition-all"
            >
              CANCELAR
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={isDeleting}
              className="h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-widest flex-1 border-none shadow-lg shadow-red-100 transition-all active:scale-95"
            >
              {isDeleting ? 'ELIMINANDO...' : 'CONFIRMAR BORRADO'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
