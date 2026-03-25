'use client'

import React, { useState } from 'react'
import { 
  Plus, Package, Edit, Trash2, Eye, EyeOff, Save, ImageIcon, 
  ImageOff, Upload, MoreVertical, GripVertical, Check, X as CloseIcon, ZoomIn, ZoomOut,
  ArrowUpDown, ArrowUp, ArrowDown, Info, AlertCircle
} from 'lucide-react'
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
      className={`group border-b border-border/40 transition-colors h-24 ${isDragging ? 'bg-primary/5 shadow-inner' : 'hover:bg-muted/30'}`}
    >
      <TableCell className="w-10 pl-6 h-24">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 -ml-2 hover:bg-black/5 rounded-lg transition-colors">
            <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={() => onSelect(product.id)}
            className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-black data-[state=checked]:border-black"
          />
        </div>
      </TableCell>
      <TableCell className="w-20">
        <div 
          className="relative w-16 h-16 rounded-2xl overflow-hidden bg-muted/30 border border-border/40 group/img cursor-pointer shadow-sm ml-2"
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
      <TableCell className="min-w-[200px]">
        <div className="flex flex-col">
          <span className="font-black text-sm uppercase tracking-tight line-clamp-1">{product.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-30 px-1">#{product.id.slice(0, 8)}</span>
        </div>
      </TableCell>
      <TableCell className="w-28 text-right">
        <div className="flex items-center gap-1 group/price justify-end pr-6">
          <input 
            type="number"
            step="0.01"
            value={product.price} 
            onChange={(e) => onUpdateProductField(product.id, 'price', parseFloat(e.target.value) || 0)}
            className="font-black tabular-nums text-base bg-transparent border-none focus:ring-0 p-0 w-16 text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[10px] font-black opacity-30">€</span>
        </div>
      </TableCell>
      <TableCell className="w-48 text-center">
        <Select 
          value={product.categoryId || 'none'} 
          onValueChange={(val) => onUpdateProductField(product.id, 'categoryId', val === 'none' ? null : val)}
        >
          <SelectTrigger className="h-9 border-none bg-muted/30 hover:bg-muted/50 rounded-2xl text-[10px] uppercase font-black tracking-widest px-4 focus:ring-1 focus:ring-primary/20">
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
      <TableCell className="w-48 text-center h-24">
        <div className="flex items-center justify-center gap-2">
          {/* Toggle Active */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onToggleActive(product)}
            className={`h-9 w-9 rounded-xl transition-all ${
              product.active 
                ? 'text-green-500 bg-green-50 hover:bg-green-100' 
                : 'text-muted-foreground/30 bg-muted/20 hover:bg-red-50 hover:text-red-500'
            }`}
            title={product.active ? 'Visible en tienda' : 'Oculto en tienda'}
          >
            {product.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>

          {/* Edit */}
          <Button size="icon" variant="ghost" onClick={() => onEditProduct(product)} className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <Edit className="h-4 w-4" />
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">
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
                  Estás a punto de eliminar <span className="font-extrabold text-slate-900">&quot;{product.name}&quot;</span>. Esta acción no se puede deshacer y el producto desaparecerá de la tienda.
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
    try {
      const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels)
      if (cropForForm) {
        setProductForm({ ...productForm, image: croppedImage })
        setCropForForm(false)
        toast({ title: 'Imagen preparada', description: 'La foto se guardará al guardar el producto' })
      } else if (croppingProduct) {
        onUpdateProductField(croppingProduct.id, 'image', croppedImage)
      }
      setCropImage(null)
      setCroppingProduct(null)
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'No se pudo procesar la imagen', variant: 'destructive' })
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
    useSensor(PointerSensor),
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Catálogo de Productos</h2>
          <p className="text-sm text-muted-foreground font-medium">Gestiona tu catálogo y stock</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="rounded-2xl gap-2 font-bold uppercase tracking-widest text-[10px] px-6 h-11 shadow-lg shadow-red-500/20 animate-in fade-in zoom-in duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  Borrar {selectedIds.length}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2.5rem] border-none p-8 gap-6 shadow-2xl">
                <AlertDialogHeader className="gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                    <Trash2 className="h-7 w-7 text-red-500" />
                  </div>
                  <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">¿Eliminar {selectedIds.length} productos?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                    Esta acción no se puede deshacer. Los productos seleccionados se borrarán permanentemente del catálogo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                  <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkDelete}
                    className="h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none"
                  >
                    Sí, eliminar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setIsProductDialogOpen(true)} className="rounded-2xl gap-2 font-bold uppercase tracking-widest text-[10px] px-6 h-11 bg-black hover:bg-black/90 text-white shadow-xl shadow-black/10">
            <Plus className="h-4 w-4" />
            Añadir Producto
          </Button>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 overflow-hidden bg-white/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <ScrollArea className="h-[65vh]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader className="bg-muted/40 sticky top-0 z-20 backdrop-blur-md">
                  <TableRow className="border-b border-border/40 hover:bg-transparent h-14">
                    <TableHead className="w-10 pl-6 h-14">
                      <div className="flex items-center gap-3">
                        <div className="w-8" />
                        <Checkbox 
                          checked={selectedIds.length === products.length && products.length > 0}
                          onCheckedChange={handleSelectAll}
                          className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-20 h-14 uppercase text-[10px] font-black tracking-widest opacity-50 pl-4">Vista</TableHead>
                    
                    <TableHead 
                      className="min-w-[200px] h-14 uppercase text-[10px] font-black tracking-widest opacity-50 cursor-pointer hover:text-black transition-colors"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Nombre / Identidad
                        {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-20" />}
                      </div>
                    </TableHead>

                    <TableHead 
                      className="w-28 h-14 uppercase text-[10px] font-black tracking-widest opacity-50 text-right pr-6 cursor-pointer hover:text-black transition-colors"
                      onClick={() => toggleSort('price')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Precio
                        {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-20" />}
                      </div>
                    </TableHead>

                    <TableHead 
                      className="w-48 h-14 uppercase text-[10px] font-black tracking-widest opacity-50 text-center cursor-pointer hover:text-black transition-colors"
                      onClick={() => toggleSort('categoryId')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Categoría
                        {sortConfig.key === 'categoryId' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-20" />}
                      </div>
                    </TableHead>

                    <TableHead 
                      className="w-48 text-center h-14 uppercase text-[10px] font-black tracking-widest opacity-50 cursor-pointer hover:text-black transition-colors"
                      onClick={() => toggleSort('active')}
                    >
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
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                          No hay productos en esta categoría
                        </TableCell>
                      </TableRow>
                    )}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Inputs ocultos para carga de imágenes */}
      <input 
        type="file" 
        ref={imageInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleImageFileChange}
      />
      <input 
        type="file" 
        ref={formImageInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFormImageFileChange}
      />

      {/* Diálogo de Recorte */}
      <Dialog open={!!cropImage} onOpenChange={() => {
        setCropImage(null)
        setCroppingProduct(null)
        setCropForForm(false)
      }}>
        <DialogContent className="max-w-2xl bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Ajustar Imagen</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">Reencuadra la foto para que quede perfecta</p>
          </div>
          
          <div className="relative h-[400px] bg-muted w-full">
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

          <div className="p-8 pt-6 space-y-6">
            <div className="flex items-center gap-4">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <input 
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-black h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setCropImage(null)
                  setCroppingProduct(null)
                  setCropForForm(false)
                }}
                className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 px-8"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleApplyCrop}
                className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 px-8 bg-black text-white hover:bg-black/90 shadow-lg shadow-black/10"
              >
                Guardar Imagen
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
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden bg-white rounded-[2rem] border-none shadow-2xl p-0 flex flex-col">
          <div className="p-5 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-50">
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestión de catálogo</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsProductDialogOpen(false)} className="rounded-xl h-8 w-8 hover:bg-slate-100 transition-colors">
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Imagen Principal</Label>
                <div 
                  className="aspect-square rounded-[2rem] border-2 border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-4 overflow-hidden relative group cursor-pointer hover:bg-muted/30 transition-all hover:border-black/20"
                  onClick={() => formImageInputRef.current?.click()}
                >
                  {productForm.image ? (
                    <div className="relative w-full h-full group">
                      <img src={fixPath(productForm.image)} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <Button 
                          variant="secondary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            formImageInputRef.current?.click();
                          }}
                          className="rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white/90 text-black border-none shadow-2xl hover:bg-white"
                        >
                          <Upload className="h-3 w-3 mr-2" />
                          Cambiar Foto
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 group-hover:rotate-6 transition-all duration-500">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div className="text-center px-6">
                        <p className="font-black text-[10px] uppercase tracking-widest leading-none mb-1">Subir Imagen</p>
                        <p className="text-[9px] opacity-50 italic">Formato cuadrado recomendado</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-center p-4 bg-muted/20 rounded-2xl border border-dashed border-border/40">
                <p className="text-[9px] uppercase font-black tracking-[0.2em] opacity-30">Tip de diseño</p>
                <p className="text-xs font-medium text-muted-foreground italic">Usa fotos con fondo limpio para un catálogo premium.</p>
              </div>
            </div>

            <div className="md:col-span-7 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="productName" className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Nombre</Label>
                <Input 
                  id="productName" 
                  value={productForm.name} 
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="rounded-xl h-11 text-sm font-bold bg-slate-50/50 border-none focus-visible:ring-1 focus-visible:ring-[#4A7C59]/20"
                  placeholder="Ej: Lona 70x160"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="productPrice" className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Precio Base</Label>
                  <div className="relative">
                    <Input 
                      id="productPrice" 
                      type="number"
                      step="0.01"
                        value={productForm.price ?? ''} 
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="rounded-xl h-11 text-sm font-black bg-slate-50/50 border-none pl-8 focus-visible:ring-1 focus-visible:ring-[#4A7C59]/20"
                      placeholder="0.00"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-30">€</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Categoría</Label>
                  <Select 
                    value={productForm.categoryId || 'none'} 
                    onValueChange={(val) => setProductForm({...productForm, categoryId: val === 'none' ? null : val})}
                  >
                    <SelectTrigger className="rounded-xl h-11 text-sm font-bold bg-slate-50/50 border-none focus:ring-1 focus:ring-[#4A7C59]/20">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="none" className="text-xs font-medium">Sin Categoría</SelectItem>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-xs font-medium">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="productDescription" className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1 text-slate-400">Descripción (Opcional)</Label>
                <textarea
                  id="productDescription"
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full min-h-[80px] rounded-xl p-3 text-xs font-medium bg-slate-50/50 border-none focus:ring-1 focus:ring-[#4A7C59]/20 resize-none placeholder:opacity-30"
                  placeholder="Detalles adicionales del producto..."
                />
              </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 md:col-span-12">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black uppercase tracking-widest">¿Tiene Suplementos?</Label>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Ej: Tallas, acabados, extras...</p>
                  </div>
                  <Switch 
                    checked={productForm.hasVariants} 
                    onCheckedChange={(checked) => setProductForm({...productForm, hasVariants: checked})}
                    className="data-[state=checked]:bg-black"
                  />
                </div>

                {productForm.hasVariants && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                       <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4A7C59] bg-[#4A7C59]/5 px-3 py-1 rounded-full">Suplementos</Label>
                    </div>
                    
                    <div className="space-y-2">
                      {productForm.variants?.map((variant: any, index: number) => (
                        <div key={index} className="flex gap-3 items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group/variant relative transition-all duration-300">
                          <div className="flex-1 space-y-1">
                            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-300 ml-1 italic">Nombre</Label>
                            <Input 
                              placeholder="..."
                              value={variant.name}
                              onChange={(e) => updateVariant(index, 'name', e.target.value)}
                              className="h-8 rounded-lg border-none bg-white text-xs font-bold px-3 focus:ring-1 focus:ring-[#4A7C59]/20 transition-all shadow-sm"
                            />
                          </div>
                          <div className="w-24 space-y-1 relative">
                            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-300 ml-1 italic">Extra</Label>
                            <div className="relative">
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={variant.price}
                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                className="h-8 rounded-lg border-none bg-white text-xs font-black tabular-nums text-right pr-7 focus:ring-1 focus:ring-[#4A7C59]/20 transition-all shadow-sm"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black opacity-20 text-[9px]">€</span>
                            </div>
                          </div>
                          <div className="pt-4">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeVariant(index)}
                              className="h-8 w-8 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        onClick={addVariant}
                        className="w-full h-9 rounded-xl border-dashed border-2 border-slate-200 hover:border-[#4A7C59]/40 hover:bg-[#4A7C59]/5 hover:text-[#4A7C59] gap-2 text-[9px] font-black uppercase tracking-wider transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Añadir Opción
                      </Button>

                      <div className="p-3 rounded-xl bg-orange-50/30 border border-orange-100 flex gap-3 mt-2 items-start">
                        <AlertCircle className="h-3.5 w-3.5 text-orange-400 mt-0.5" />
                        <p className="text-[9px] text-orange-900/60 leading-tight font-medium">
                          <span className="font-bold uppercase tracking-wider text-orange-700/60">Nota:</span> Se sumará el importe del suplemento al precio base del producto.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl mt-4 hover:bg-slate-50 transition-all group/vis">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-all duration-500 ${productForm.active !== false ? 'bg-[#4A7C59] text-white' : 'bg-white text-slate-300'}`}>
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest block leading-none">Visible</Label>
                      <p className="text-[9px] text-slate-400 font-medium italic">En el catálogo</p>
                    </div>
                  </div>
                  <Switch 
                    checked={productForm.active !== false} 
                    onCheckedChange={(checked) => setProductForm({...productForm, active: checked})}
                    className="data-[state=checked]:bg-[#4A7C59] scale-90"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setIsProductDialogOpen(false)}
              className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={onSaveProduct}
                className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-8 bg-[#4A7C59] text-white hover:bg-[#3d664a] shadow-lg shadow-[#4A7C59]/20"
              >
                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
