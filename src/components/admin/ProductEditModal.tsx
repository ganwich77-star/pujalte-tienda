'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  X as CloseIcon, Upload, ZoomIn, ZoomOut, Save, Trash2, 
  Trash, Plus, Euro, BarChart3, Layers2, Info, LayoutGrid, CheckCircle2,
  Package, Sparkles, Percent, Hash, Ruler, Eye, Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Product, Category } from '@/types'
import { toast } from '@/hooks/use-toast'

interface ProductEditModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null // Para edición
  initialData?: any // Para creación
  categories: Category[]
  onSave: (data: any) => void
}

export default function ProductEditModal({ 
  isOpen, 
  onClose, 
  product, 
  initialData,
  categories, 
  onSave 
}: ProductEditModalProps) {
  const [formData, setFormData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'prices' | 'variants' | 'image'>('info')
  
  // Image states
  const [image, setImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isCropping, setIsCropping] = useState(false)

  useEffect(() => {
    if (product) {
      // Normalización de tierPricing si viene como string
      let parsedTiers = product.tierPricing;
      if (typeof parsedTiers === 'string') {
        try {
          parsedTiers = JSON.parse(parsedTiers);
        } catch (e) {
          parsedTiers = [];
        }
      }

      setFormData({
        ...product,
        tierPricing: Array.isArray(parsedTiers) ? parsedTiers : [],
        variants: product.variants || []
      })
    } else if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        salePrice: null,
        categoryId: categories[0]?.id || '',
        active: true,
        showPrice: true,
        isNew: false,
        isFeatured: false,
        minQuantity: 1,
        stepQuantity: 1,
        tierPricing: [],
        variants: [],
        hasVariants: false,
        variantBehavior: 'add'
      })
    }
    setActiveTab('info')
    setImage(null)
    setIsCropping(false)
  }, [product, initialData, categories, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result as string)
        setIsCropping(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropSave = async () => {
    try {
      if (image && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels)
        handleInputChange('image', croppedImage)
        setIsCropping(false)
        setImage(null)
        toast({ title: 'Imagen actualizada' })
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Error al recortar la imagen', variant: 'destructive' })
    }
  }

  // Tier Pricing Handlers
  const addTier = () => {
    const currentTiers = Array.isArray(formData.tierPricing) ? formData.tierPricing : []
    handleInputChange('tierPricing', [...currentTiers, { minQty: 0, price: 0 }])
  }

  const removeTier = (index: number) => {
    const currentTiers = [...formData.tierPricing]
    currentTiers.splice(index, 1)
    handleInputChange('tierPricing', currentTiers)
  }

  const updateTier = (index: number, field: string, value: any) => {
    const currentTiers = [...formData.tierPricing]
    currentTiers[index] = { ...currentTiers[index], [field]: value }
    handleInputChange('tierPricing', currentTiers)
  }

  // Variant Handlers
  const addVariant = () => {
    const currentVariants = Array.isArray(formData.variants) ? formData.variants : []
    handleInputChange('variants', [
      ...currentVariants, 
      { id: `v-${Date.now()}`, name: '', price: 0, active: true, sortOrder: currentVariants.length }
    ])
  }

  const removeVariant = (index: number) => {
    const currentVariants = [...formData.variants]
    currentVariants.splice(index, 1)
    handleInputChange('variants', currentVariants)
  }

  const updateVariant = (index: number, field: string, value: any) => {
    const currentVariants = [...formData.variants]
    currentVariants[index] = { ...currentVariants[index], [field]: value }
    handleInputChange('variants', currentVariants)
  }

  if (!formData) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 border-none bg-slate-50/95 backdrop-blur-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[85vh]">
        
        {/* SIDE NAV - Premium */}
        <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="h-10 w-10 bg-[#4A7C59] rounded-xl flex items-center justify-center shadow-lg shadow-[#4A7C59]/20">
               <Package className="h-5 w-5 text-white" />
            </div>
            <div>
               <p className="text-[10px] font-black text-[#4A7C59] uppercase tracking-widest italic">Edición Central</p>
               <p className="text-xs font-bold text-white uppercase italic tracking-tighter">Motor Unificado</p>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
            <ModalTab active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={Info} label="Detalles" />
            <ModalTab active={activeTab === 'prices'} onClick={() => setActiveTab('prices')} icon={Euro} label="Precios" />
            <ModalTab active={activeTab === 'variants'} onClick={() => setActiveTab('variants')} icon={Layers2} label="Variantes" />
            <ModalTab active={activeTab === 'image'} onClick={() => setActiveTab('image')} icon={LayoutGrid} label="Multimedia" />
          </nav>

          <div className="mt-auto hidden md:block px-2 pt-6 border-t border-white/5">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                 <CheckCircle2 className="h-3 w-3 text-[#4A7C59]" />
                 <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Estado de Guardado</span>
              </div>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-tight">Configurado para MySQL Master Node</p>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/40">
          <ScrollArea className="flex-1 p-6 md:p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div 
                  key="info" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Configuración General</h3>
                      <Badge className="bg-[#4A7C59] text-white rounded-lg px-3 py-1 font-black italic uppercase text-[9px]">ID: {formData.id?.slice(-6) || 'NUEVO'}</Badge>
                   </div>

                   <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                           Nombre del Producto <Sparkles className="h-3 w-3 text-[#4A7C59]" />
                        </Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="TITULO VISIBLE"
                          className="h-14 font-black uppercase italic tracking-tighter text-lg px-6 rounded-2xl border-2 border-slate-100 focus:border-[#4A7C59] transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Categoría Asignada</Label>
                           <Select value={formData.categoryId || 'none'} onValueChange={(v) => handleInputChange('categoryId', v === 'none' ? null : v)}>
                              <SelectTrigger className="h-12 border-2 border-slate-100 rounded-xl font-bold uppercase text-[11px] tracking-widest">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-none shadow-2xl">
                                 <SelectItem value="none" className="uppercase font-black text-[9px] tracking-widest py-3">SIN CATEGORÍA</SelectItem>
                                 {categories.map(cat => (
                                   <SelectItem key={cat.id} value={cat.id} className="uppercase font-black text-[9px] tracking-widest py-3">
                                      {cat.name}
                                   </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center block">Estado del Producto</Label>
                           <div className="flex items-center justify-center gap-4 h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4">
                              <Switch 
                                checked={formData.active} 
                                onCheckedChange={(v) => handleInputChange('active', v)}
                                className="data-[state=checked]:bg-[#4A7C59]"
                              />
                              <span className="text-[10px] font-black uppercase text-slate-600 italic">
                                 {formData.active ? 'PUBLICADO' : 'OCULTO'}
                              </span>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Descripción Detallada</Label>
                         <Textarea 
                           value={formData.description || ''} 
                           onChange={(e) => handleInputChange('description', e.target.value)}
                           className="min-h-[120px] rounded-2xl border-2 border-slate-100 font-bold text-xs p-6 italic leading-relaxed text-slate-500 focus:border-slate-300 transition-all"
                           placeholder="Describe las características principales..."
                         />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                         <VisualFeatureToggle 
                           active={!!formData.isNew} 
                           onChange={(v) => handleInputChange('isNew', v)} 
                           icon={<Sparkles className="h-4 w-4" />} 
                           label="Novedad" 
                           color="amber"
                         />
                         <VisualFeatureToggle 
                           active={!!formData.isFeatured} 
                           onChange={(v) => handleInputChange('isFeatured', v)} 
                           icon={<Tag className="h-4 w-4" />} 
                           label="Destacado" 
                           color="indigo"
                         />
                         <VisualFeatureToggle 
                           active={formData.showPrice !== false} 
                           onChange={(v) => handleInputChange('showPrice', v)} 
                           icon={<BarChart3 className="h-4 w-4" />} 
                           label="PVP Público"
                           color="emerald"
                         />
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'prices' && (
                <motion.div 
                  key="prices" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-6">Tarifas y Escalados</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <PriceInput 
                        label="Precio Base" 
                        value={formData.price} 
                        onChange={(v) => handleInputChange('price', v)} 
                        icon={Euro}
                        highlight
                      />
                      <PriceInput 
                        label="Precio Oferta" 
                        value={formData.salePrice} 
                        onChange={(v) => handleInputChange('salePrice', v)} 
                        icon={Percent}
                        placeholder="NINGUNA"
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <PriceInput 
                        label="Cantidad Mínima" 
                        value={formData.minQuantity || 1} 
                        onChange={(v) => handleInputChange('minQuantity', Math.max(1, Math.round(v)))} 
                        icon={Hash}
                        suffix="UDS"
                      />
                      <PriceInput 
                        label="Paso de Cantidad" 
                        value={formData.stepQuantity || 1} 
                        onChange={(v) => handleInputChange('stepQuantity', Math.max(1, Math.round(v)))} 
                        icon={Ruler}
                        suffix="STEP"
                      />
                   </div>

                   <div className="mt-8">
                      <div className="flex items-center justify-between mb-6">
                         <div>
                            <h4 className="font-black text-slate-900 uppercase italic text-sm tracking-tight">Escalado de Precios (B2B)</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest">Descuentos por volumen para este producto</p>
                         </div>
                         <Button onClick={addTier} className="bg-slate-950 hover:bg-black rounded-xl px-6 font-black uppercase text-[10px] h-10 italic">
                            Añadir Tramo
                         </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {formData.tierPricing?.map((tier: any, i: number) => (
                           <motion.div 
                             layout 
                             key={i} 
                             initial={{ opacity: 0, scale: 0.9 }} 
                             animate={{ opacity: 1, scale: 1 }}
                             className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 group hover:bg-white hover:shadow-xl transition-all"
                           >
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <Label className="text-[8px] font-black text-slate-400 uppercase italic">MIN. QTY</Label>
                                    <Input 
                                      type="number" 
                                      value={tier.minQty} 
                                      onChange={(e) => updateTier(i, 'minQty', parseInt(e.target.value) || 0)}
                                      className="h-10 border-none bg-white rounded-lg font-black text-sm italic no-spinner text-center"
                                    />
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-[8px] font-black text-[#4A7C59] uppercase italic">PVP UNID.</Label>
                                    <Input 
                                      type="number" 
                                      step="any"
                                      value={tier.price} 
                                      onChange={(e) => updateTier(i, 'price', parseFloat(e.target.value) || 0)}
                                      className="h-10 border-none bg-white rounded-lg font-black text-sm italic no-spinner text-[#4A7C59] text-center"
                                    />
                                 </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeTier(i)}
                                className="h-10 w-10 text-slate-200 hover:text-red-500 rounded-xl"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </motion.div>
                         ))}
                      </div>
                      
                      {(!formData.tierPricing || formData.tierPricing.length === 0) && (
                        <div className="bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
                           <p className="text-xs font-black uppercase tracking-widest text-slate-300 italic">No hay tramos de precio configurados</p>
                        </div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'variants' && (
                <motion.div 
                  key="variants" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center transition-all duration-500 ${formData.hasVariants ? 'bg-indigo-600 text-white shadow-xl rotate-6' : 'bg-slate-50 text-slate-200'}`}>
                               <Layers2 className="h-8 w-8" />
                            </div>
                            <div>
                               <h3 className="font-black text-slate-900 uppercase text-xl italic tracking-tighter">Opciones y Formatos</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest leading-none">Habilita variaciones de este producto</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100">
                            <Switch 
                               checked={formData.hasVariants} 
                               onCheckedChange={(v) => handleInputChange('hasVariants', v)}
                               className="scale-125 data-[state=checked]:bg-indigo-600"
                            />
                            <span className={`text-[10px] font-black uppercase italic tracking-widest ${formData.hasVariants ? 'text-indigo-600' : 'text-slate-300'}`}>
                               {formData.hasVariants ? 'SI' : 'NO'}
                            </span>
                         </div>
                      </div>

                      {formData.hasVariants && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-8 pt-4"
                        >
                           <div className="grid grid-cols-2 gap-4">
                              <BehaviorOption 
                                active={formData.variantBehavior === 'add'} 
                                onClick={() => handleInputChange('variantBehavior', 'add')}
                                icon={Plus}
                                label="Sumar al Base"
                                subLabel="Ideal para extras"
                                color="emerald"
                              />
                              <BehaviorOption 
                                active={formData.variantBehavior === 'replace'} 
                                onClick={() => handleInputChange('variantBehavior', 'replace')}
                                icon={Sparkles}
                                label="Precio Único"
                                subLabel="Selección de formato"
                                color="indigo"
                              />
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-center justify-between px-2">
                                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Lista de Variaciones</Label>
                                 <Button onClick={addVariant} className="h-10 bg-slate-950 hover:bg-black rounded-xl px-6 font-black uppercase text-[10px] italic">
                                    Añadir Opción
                                 </Button>
                              </div>

                              <div className="space-y-3">
                                 {formData.variants?.map((v: any, i: number) => (
                                   <motion.div 
                                     layout 
                                     key={v.id} 
                                     className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all"
                                   >
                                      <div className="flex-1">
                                         <Input 
                                           value={v.name} 
                                           onChange={(e) => updateVariant(i, 'name', e.target.value)}
                                           placeholder="Ej: PACK PREMIUM"
                                           className="h-11 border-none bg-white rounded-xl font-black text-xs uppercase px-5 italic tracking-tighter"
                                         />
                                      </div>
                                      <div className="w-32 relative">
                                          <Input 
                                            type="number"
                                            step="any"
                                            value={v.price} 
                                            onChange={(e) => updateVariant(i, 'price', parseFloat(e.target.value) || 0)}
                                            className="h-11 border-none bg-white rounded-xl font-black text-sm text-center italic no-spinner pr-8"
                                          />
                                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-200 text-sm">€</span>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeVariant(i)}
                                        className="h-11 w-11 text-slate-200 hover:text-red-500 rounded-xl"
                                      >
                                         <Trash2 className="h-4 w-4" />
                                      </Button>
                                   </motion.div>
                                 ))}
                              </div>
                           </div>
                        </motion.div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'image' && (
                <motion.div 
                  key="image" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-6">Activos Multimedia</h3>

                   {isCropping ? (
                      <div className="space-y-6">
                         <div className="relative h-[400px] w-full bg-slate-950 rounded-[40px] overflow-hidden shadow-2xl">
                            <Cropper
                              image={image!}
                              crop={crop}
                              zoom={zoom}
                              aspect={1}
                              onCropChange={setCrop}
                              onCropComplete={onCropComplete}
                              onZoomChange={setZoom}
                            />
                         </div>
                         <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100">
                            <div className="flex-1 flex items-center gap-4">
                               <ZoomOut className="h-5 w-5 text-slate-400" />
                               <Input 
                                 type="range" 
                                 min={1} max={3} step={0.1} 
                                 value={zoom} 
                                 onChange={(e) => setZoom(parseFloat(e.target.value))}
                                 className="flex-1 accent-[#4A7C59]"
                               />
                               <ZoomIn className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="flex items-center gap-3">
                               <Button variant="ghost" onClick={() => setIsCropping(false)} className="rounded-xl font-black uppercase italic text-[10px]">Cancelar</Button>
                               <Button onClick={handleCropSave} className="bg-[#4A7C59] hover:bg-[#3d664a] text-white rounded-xl px-8 font-black uppercase text-[10px] h-11 italic shadow-lg shadow-[#4A7C59]/20">Confirmar Recorte</Button>
                            </div>
                         </div>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                         <div className="space-y-4">
                            <div className="aspect-square bg-slate-50 rounded-[50px] border-4 border-white shadow-2xl relative overflow-hidden group">
                               {formData.image ? (
                                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                               ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                                     <Package className="h-20 w-20 mb-4 opacity-50" />
                                     <p className="font-black italic uppercase tracking-widest text-[10px]">Sin imagen activa</p>
                                  </div>
                               )}
                               <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                                  <label className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-950 cursor-pointer hover:scale-110 transition-transform shadow-xl">
                                     <Upload className="h-6 w-6" />
                                     <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                  </label>
                                  {formData.image && (
                                     <Button 
                                       onClick={() => handleInputChange('image', null)} 
                                       className="h-14 w-14 bg-red-500 rounded-2xl flex items-center justify-center text-white hover:bg-red-600 hover:scale-110 transition-transform shadow-xl"
                                     >
                                        <Trash className="h-6 w-6" />
                                     </Button>
                                  )}
                               </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic text-center">Formato recomendado: Cuadrado 1:1</p>
                         </div>
                         <div className="space-y-8 bg-slate-50/50 p-10 rounded-[40px] border border-slate-100 shadow-inner">
                            <div className="space-y-4">
                               <h4 className="font-black text-slate-900 uppercase italic text-sm tracking-tight flex items-center gap-3">
                                  <Info className="h-4 w-4 text-[#4A7C59]" /> Consejos de Diseño
                               </h4>
                               <ul className="space-y-3">
                                  {['Fondo neutro o premium', 'Iluminación uniforme', 'Recorte centrado', 'Calidad HD optimizada'].map((tip, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase italic">
                                       <div className="h-1.5 w-1.5 rounded-full bg-[#4A7C59]" />
                                       {tip}
                                    </li>
                                  ))}
                               </ul>
                            </div>
                            <Button className="w-full h-14 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-2xl font-black uppercase italic tracking-widest text-[10px] transition-all relative overflow-hidden group">
                               <span className="relative z-10 flex items-center justify-center gap-3">
                                  <Upload className="h-4 w-4 text-[#4A7C59]" />
                                  Subir Nueva Imagen
                               </span>
                               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                            </Button>
                         </div>
                      </div>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* FOOTER */}
          <div className="p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
             <div className="hidden sm:flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-[#4A7C59] animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Ready to Sync</span>
             </div>
             <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none h-12 rounded-xl font-black uppercase tracking-widest text-[10px] italic">Cancelar</Button>
                <Button 
                  onClick={() => onSave(formData)} 
                  className="flex-1 sm:flex-none h-14 rounded-3xl bg-slate-950 text-white px-12 font-black uppercase tracking-[0.2em] text-[11px] italic shadow-2xl shadow-slate-200 hover:bg-black transition-all group"
                >
                   <Save className="h-4 w-4 mr-3 text-[#4A7C59] group-hover:scale-125 transition-transform" />
                   GUARDAR PRODUCTO
                </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ModalTab({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-14 flex items-center gap-4 px-6 rounded-2xl transition-all duration-300 relative ${active ? 'bg-white/10 text-[#4A7C59]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-[#4A7C59] text-white shadow-lg shadow-[#4A7C59]/20 rotate-6' : 'bg-white/5'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">{label}</span>
      {active && (
        <motion.div 
          layoutId="modalSidebarActive" 
          className="absolute left-0 w-1 h-6 bg-[#4A7C59] rounded-full" 
        />
      )}
    </button>
  )
}

function PriceInput({ label, value, onChange, icon: Icon, highlight, placeholder, suffix }: { label: string, value: any, onChange: (v: number) => void, icon: any, highlight?: boolean, placeholder?: string, suffix?: string }) {
  return (
    <div className={`bg-white p-5 rounded-[32px] border-2 border-slate-50 transition-all hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 group ${highlight ? 'ring-2 ring-[#4A7C59]/10' : ''}`}>
       <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all">
             <Icon className="h-4 w-4" />
          </div>
          <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{label}</Label>
       </div>
       <div className="relative">
          <Input 
            type="number"
            step="any"
            value={value ?? ''} 
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`h-12 border-none bg-slate-50/50 rounded-xl font-black text-xl text-center focus:bg-white no-spinner transition-all italic tracking-tighter ${highlight ? 'text-[#4A7C59]' : ''}`}
            placeholder={placeholder || "0"}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-200 italic">{suffix || '€'}</span>
       </div>
    </div>
  )
}

function VisualFeatureToggle({ active, onChange, icon, label, color }: { active: boolean, onChange: (v: boolean) => void, icon: React.ReactNode, label: string, color: string }) {
  const colors: any = {
    amber: active ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-100 text-slate-400',
    indigo: active ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-100 text-slate-400',
    emerald: active ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-100 text-slate-400',
  }

  return (
    <div className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all gap-3 ${active ? 'bg-white border-slate-200 shadow-md scale-[1.02]' : 'bg-transparent border-slate-100 opacity-60'}`}>
       <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${colors[color]}`}>
             {icon}
          </div>
          <span className="text-[9px] font-black uppercase italic tracking-widest text-slate-900">{label}</span>
       </div>
       <Switch checked={active} onCheckedChange={onChange} className={`scale-90 data-[state=checked]:${color === 'amber' ? 'bg-amber-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
    </div>
  )
}

function BehaviorOption({ active, onClick, icon: Icon, label, subLabel, color }: { active: boolean, onClick: () => void, icon: any, label: string, subLabel: string, color: string }) {
  const styles: any = {
    emerald: active ? 'bg-slate-950 text-white ring-4 ring-emerald-500/10' : 'bg-white text-slate-400 border-2 border-slate-100 opacity-60 hover:opacity-100',
    indigo: active ? 'bg-slate-950 text-white ring-4 ring-indigo-500/10' : 'bg-white text-slate-400 border-2 border-slate-100 opacity-60 hover:opacity-100',
  }

  return (
    <button
      onClick={onClick}
      className={`h-28 rounded-[32px] flex flex-col items-center justify-center gap-2 transition-all duration-500 relative overflow-hidden w-full ${styles[color]}`}
    >
       <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/10' : 'bg-slate-50'}`}>
          <Icon className="h-5 w-5" />
       </div>
       <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest italic">{label}</p>
          <p className={`text-[8px] font-bold uppercase italic opacity-40 ${active ? 'text-white' : ''}`}>{subLabel}</p>
       </div>
       {active && (
         <div className={`absolute top-4 right-4 h-1.5 w-1.5 rounded-full ${color === 'emerald' ? 'bg-emerald-400' : 'bg-indigo-400'} shadow-lg animate-pulse`} />
       )}
    </button>
  )
}
