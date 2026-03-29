'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ShoppingCart, Plus, Info, Sparkles, Tag, TrendingDown, Settings2, ArrowRight, Star, Image as ImageIcon, X, Palette, Loader2, Camera, Upload, Trash2, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductVariant, StoreConfig } from '@/types'
import { fixPath, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ProductCardProps {
  product: Product
  config: StoreConfig
  formatPrice: (price: number) => string
  handleAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void
}

export function ProductCard({ product, config, formatPrice, handleAddToCart }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedCustomOptions, setSelectedCustomOptions] = useState<Record<string, string>>({})
  const [added, setAdded] = useState(false)
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [personalizationNote, setPersonalizationNote] = useState('')
  const minQty = product.minQuantity || 1
  const stepQty = product.stepQuantity || 1
  
  const [quantity, setQuantity] = useState(minQty)

  const tiers = useMemo(() => {
    try {
      const p = typeof product.tierPricing === 'string' ? JSON.parse(product.tierPricing) : product.tierPricing;
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }, [product.tierPricing]);

  const getUnitPrice = (qty: number) => {
    let price = product.salePrice ? Number(product.salePrice) : Number(product.price);
    if (tiers.length > 0) {
      const applicableTier = [...tiers]
        .sort((a, b) => b.minQty - a.minQty)
        .find(t => qty >= t.minQty);
      if (applicableTier) price = applicableTier.price;
    }
    return price;
  }

  const activeBasePrice = getUnitPrice(quantity)
  const displayPrice = (selectedVariant 
    ? (product.variantBehavior === 'replace' ? Number(selectedVariant.price) : activeBasePrice + Number(selectedVariant.price)) 
    : activeBasePrice) * quantity

  const hasDiscount = !!product.salePrice || (tiers.length > 0 && activeBasePrice < (product.salePrice ? Number(product.salePrice) : Number(product.price)))
  const originalBasePrice = Number(product.price)
  const originalPrice = (selectedVariant 
    ? (product.variantBehavior === 'replace' ? Number(selectedVariant.price) : originalBasePrice + Number(selectedVariant.price)) 
    : originalBasePrice) * quantity

  const onAdd = () => {
    // Combinamos la variante con la nota de personalización y la foto
    let finalNote = personalizationNote

    // Añadimos las opciones dinámicas seleccionadas
    Object.entries(selectedCustomOptions).forEach(([key, val]) => {
      finalNote = finalNote ? `${finalNote} | ${key}: ${val}` : `${key}: ${val}`;
    });

    if (selectedVariant) {
      finalNote = finalNote ? `${selectedVariant.name} | ${finalNote}` : selectedVariant.name
    }
    if (uploadedUrl) {
      finalNote = finalNote ? `${finalNote} | FOTO: ${uploadedUrl}` : `FOTO: ${uploadedUrl}`
    }

    // Pasamos el producto, variante, cantidad Y las notas que incluyen todo
    const productWithNotes = { ...product, notes: finalNote }
    handleAddToCart(productWithNotes as any, selectedVariant || undefined, quantity)
    
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      setOpen(false)
      setQuantity(minQty)
      setUploadedUrl(null)
      setPersonalizationNote('')
      setSelectedCustomOptions({})
    }, 1500)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.url) {
        setUploadedUrl(data.url)
      }
    } catch (err) {
      console.error("Error uploading file:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const sortedTiers = tiers.length > 0 ? [...tiers].sort((a, b) => a.minQty - b.minQty) : [];
  const nextTier = sortedTiers.find((t: any) => t.minQty > quantity);
  const currentTier = tiers.length > 0 ? [...tiers].sort((a, b) => b.minQty - a.minQty).find((t: any) => quantity >= t.minQty) : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ y: -8 }} className="group cursor-pointer flex flex-col gap-3">
          <div className="relative aspect-square w-full bg-white rounded-[2.5rem] overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] group-hover:shadow-[0_25px_50px_-12px_rgba(74,124,89,0.2)] transition-all duration-700 border border-white/50">
            {config.showImages && product.image ? (
              <img 
                src={fixPath(product.image)} 
                alt={product.name} 
                loading="lazy" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 rounded-[2.5rem]" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-200">
                 <ImageIcon className="h-12 w-12 opacity-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {product.isFeatured && (
                <div className="bg-slate-900 text-white text-[7px] sm:text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-slate-900/20 uppercase tracking-widest">
                  <Star className="h-2 w-2 sm:h-3 sm:w-3 fill-white" />
                  <span>Destacado</span>
                </div>
              )}
              {product.isNew && (
                <div className="bg-amber-400 text-white text-[7px] sm:text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-amber-400/20 uppercase tracking-widest">
                  <Sparkles className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span>Novedad</span>
                </div>
              )}
              {(product.salePrice || tiers.length > 0) && (
                <div className="bg-emerald-500 text-white text-[7px] sm:text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20 uppercase tracking-widest">
                  <Tag className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span>Oferta</span>
                </div>
              )}
            </div>
            <div className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
               <Info className="h-4 w-4 text-slate-800" />
            </div>
          </div>
          <div className="px-2 text-center mt-1">
             <h3 className="text-[10px] sm:text-[13px] font-bold text-slate-800 leading-tight truncate px-1 uppercase tracking-tight">{product.name}</h3>
             <div className="mt-0.5 flex flex-col items-center">
                {product.showPrice !== false ? (
                  <>
                    {hasDiscount && <span className="text-[10px] font-bold text-slate-400/60 line-through tracking-tight mb-[-2px]">{formatPrice(originalBasePrice)}</span>}
                    <span className={`text-[12px] sm:text-[16px] font-black tracking-tighter ${hasDiscount ? 'text-red-500' : 'text-slate-900'}`}>{formatPrice(activeBasePrice)}</span>
                  </>
                ) : <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ver más</span>}
             </div>
          </div>
        </motion.div>
      </DialogTrigger>

      {/* Modal ampliado para ver la foto a gran tamaño */}
      <DialogContent showCloseButton={false} className="w-[95vw] max-h-[95vh] sm:max-w-[550px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[2.5rem] sm:rounded-[3rem] focus:outline-none flex flex-col transition-all">
        <div className="relative flex-1 flex flex-col overflow-hidden">
            <div className="relative aspect-square w-full overflow-hidden bg-slate-50 min-h-[250px] sm:min-h-0">
              <img src={fixPath(product.image || '')} alt={product.name} className="w-full h-full object-cover transition-all duration-500" />
              
              {/* Botón de cierre en la esquina superior derecha */}
              <button 
                onClick={() => setOpen(false)}
                className="fixed top-6 right-6 z-[250] h-11 w-11 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-all border border-white/10 shadow-2xl group"
              >
                <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
              </button>

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-5 right-5">
                 <DialogTitle className="text-xl sm:text-2xl font-black text-white leading-none tracking-tight uppercase italic underline decoration-blue-500 decoration-3 underline-offset-4">
                    {product.name}
                 </DialogTitle>
              </div>
            </div>

            <div className="p-4 sm:p-7 flex-1 flex flex-col gap-3 sm:gap-6 overflow-y-auto custom-scrollbar">
                {product.description && (
                  <div className="bg-slate-50 p-3 sm:p-5 rounded-[1.2rem] sm:rounded-[2rem] border border-slate-100 flex-shrink-0">
                    <p className="text-[9px] sm:text-[11px] leading-tight text-slate-500 font-bold uppercase text-center italic tracking-tight whitespace-pre-line">
                       {product.description}
                    </p>
                  </div>
                )}

               {product.hasVariants && product.variants.length > 0 && (
                  <div className="flex-shrink-0 -mt-1 sm:-mt-2">
                    <div className="flex items-center gap-2 px-1 mb-1.5 pt-2">
                      <Settings2 className="h-3 w-3 text-slate-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none italic">Opciones</span>
                    </div>
                    <Select
                      value={selectedVariant?.id || 'base'}
                      onValueChange={(v) => {
                        if (v === 'base') setSelectedVariant(null)
                        else setSelectedVariant(product.variants.find(vr => vr.id === v) || null)
                      }}
                    >
                      <SelectTrigger className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl border-none bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-5 shadow-lg">
                        <SelectValue placeholder="ELIGE UNA OPCIÓN..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-white/10 shadow-2xl p-1 bg-slate-900 text-white min-w-[280px]">
                        <SelectItem value="base" className="text-[10px] font-black uppercase rounded-lg py-3 focus:bg-white/10 focus:text-white transition-colors">
                          <div className="flex items-center justify-between w-full"><span>{product.name}</span><span className="text-white/60 ml-4 font-bold">Desde {formatPrice(activeBasePrice)}</span></div>
                        </SelectItem>
                        {product.variants.filter(v => v.name).map(variant => (
                          <SelectItem key={variant.id} value={variant.id} className="text-[10px] font-black uppercase rounded-lg py-3 focus:bg-white/10 focus:text-white transition-colors">
                            <div className="flex items-center justify-between w-full gap-8"><span>{variant.name}</span><span className="text-white/60 font-bold">{formatPrice(product.variantBehavior === 'replace' ? Number(variant.price) : activeBasePrice + Number(variant.price))}</span></div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* OPCIONES DE PERSONALIZACIÓN DINÁMICAS (EJ: FORMAS PEANA) */}
                {(() => {
                  try {
                    const options = product.customOptions ? JSON.parse(product.customOptions) : [];
                    if (!Array.isArray(options) || options.length === 0) return null;
                    
                    return (
                      <div className="flex flex-col gap-4 flex-shrink-0 mt-1 mb-1">
                        {options.map((opt: any, idx: number) => (
                          <div key={idx} className="space-y-1.5 px-0.5">
                            <div className="flex items-center gap-2">
                              <Palette className="h-3 w-3 text-orange-500" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 italic leading-none">{opt.title}</span>
                              {opt.required && <Badge variant="outline" className="text-[6px] h-3 px-1 border-orange-200 text-orange-500 uppercase font-black tracking-tighter bg-orange-50">ELEGIR</Badge>}
                            </div>
                            <Select 
                              onValueChange={(val) => {
                                setSelectedCustomOptions(prev => ({ ...prev, [opt.title]: val }));
                                console.log(`[OPT] ${opt.title} selected:`, val);
                              }}
                            >
                              <SelectTrigger className="w-full h-11 sm:h-12 rounded-xl border border-slate-100 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 shadow-sm hover:border-orange-200 transition-colors">
                                <SelectValue placeholder={`SELECCIONAR ${opt.title}...`} />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border border-slate-100 shadow-2xl p-1 bg-white">
                                {opt.values.map((v: string) => (
                                  <SelectItem key={v} value={v} className="text-[10px] font-black uppercase rounded-lg py-2.5 focus:bg-orange-600 focus:text-white transition-colors cursor-pointer capitalize">
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    );
                  } catch (e) { return null; }
                })()}

                {/* OPCIONES DE PERSONALIZACIÓN (TEXTO / FOTOS) */}
                <div className="flex flex-col gap-4 mt-2 bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-[#4A7C59]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Personaliza con tu foto</span>
                      </div>
                      {uploadedUrl && (
                        <button onClick={() => setUploadedUrl(null)} className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Quitar
                        </button>
                      )}
                    </div>
                    
                    {!uploadedUrl ? (
                      <div className="relative">
                        <input 
                          type="file" 
                          id={`photo-${product.id}`}
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                        <label 
                          htmlFor={`photo-${product.id}`}
                          className={cn(
                            "flex flex-col items-center justify-center w-full py-10 border-2 border-dashed rounded-[2rem] transition-all cursor-pointer",
                            isUploading ? "bg-slate-50 border-slate-200" : "bg-[#4A7C59]/5 border-[#4A7C59]/20 hover:bg-[#4A7C59]/10 hover:border-[#4A7C59]/40"
                          )}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-8 w-8 text-[#4A7C59] animate-spin mb-2" />
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Subiendo...</span>
                            </>
                          ) : (
                            <>
                              <div className="h-14 w-14 rounded-[1.2rem] bg-[#4A7C59]/10 flex items-center justify-center mb-3">
                                <Upload className="h-6 w-6 text-[#4A7C59]" />
                              </div>
                              <span className="text-[10px] font-black uppercase text-[#4A7C59] tracking-widest">Añadir Imagen</span>
                              <p className="text-[8px] font-bold text-slate-400 mt-1">Sube el momento para tu {product.name}</p>
                            </>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border-2 border-[#4A7C59]/20 bg-white flex items-center justify-center shadow-inner">
                        <img src={uploadedUrl} alt="Vista previa" className="h-full w-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Check className="h-10 w-10 text-white drop-shadow-lg" strokeWidth={4} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] ml-1 flex items-center gap-2">
                      <Sparkles className="h-3 w-3" /> Observaciones o Nombres
                    </Label>
                    <Input 
                      value={personalizationNote}
                      onChange={(e) => setPersonalizationNote(e.target.value)}
                      placeholder="Ej: Para el abuelo, Fechas, Nombres..."
                      className="h-12 rounded-xl bg-white border-slate-100 focus-visible:ring-[#4A7C59]/20 text-[11px] font-medium shadow-sm"
                    />
                  </div>
                </div>



                {tiers && tiers.length > 0 && (
                  <div className="flex-shrink-0">
                    <AnimatePresence mode="wait">
                      {nextTier ? (
                        <motion.div 
                          key="next" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-blue-50 border border-blue-100 p-2.5 sm:p-3 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-all"
                          onClick={() => setQuantity(nextTier.minQty)}
                        >
                          <div className="h-7 w-7 min-w-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                            <TrendingDown className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest leading-none block truncate">PRÓXIMO DESCUENTO</span>
                            <p className="text-[9px] font-bold text-slate-600 mt-0.5 truncate">Añade <span className="text-blue-600 font-black">{nextTier.minQty - quantity} más</span> y baja a <span className="text-blue-600 font-black">{formatPrice(nextTier.price)}</span>/ud</p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-blue-300" />
                        </motion.div>
                      ) : currentTier ? (
                         <motion.div key="max" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center gap-3 italic">
                           <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm"><Sparkles className="h-3.5 w-3.5 text-white" /></div>
                           <p className="text-[9px] font-bold text-emerald-700 leading-tight">DESCUENTO MÁXIMO ACTIVADO</p>
                         </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                )}

                {/* Opción especial para packs (Añadir fotos del grupo) */}
                {product.isPack && (
                  <div className="mt-4 px-1 mb-4">
                    <Button 
                      variant="outline"
                      className="w-full h-14 rounded-2xl border-2 border-[#4A7C59]/20 text-[#4A7C59] font-black uppercase text-[10px] sm:text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-[#4A7C59] hover:text-white transition-all shadow-sm group"
                    >
                      <div className="h-8 w-8 rounded-xl bg-[#4A7C59]/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-left">Añadir Fotos del Grupo</span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-white transition-colors" />
                    </Button>
                  </div>
                )}
            </div>

            <div className="mt-auto p-4 sm:p-6 bg-white border-t border-slate-100 flex flex-col gap-3 z-20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                     <button onClick={() => setQuantity(Math.max(minQty, quantity - stepQty))} className="h-8 w-8 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center hover:bg-white text-slate-400 font-black active:scale-90">-</button>
                      <Input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setQuantity(val);
                          else if (e.target.value === '') setQuantity(0);
                        }}
                        onBlur={() => {
                          if (quantity < minQty) setQuantity(minQty);
                        }}
                        className="w-10 h-8 sm:h-11 text-center font-black text-sm text-slate-900 border-none bg-transparent p-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                     <button onClick={() => setQuantity(quantity + stepQty)} className="h-8 w-8 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center hover:bg-white text-slate-400 font-black active:scale-90">+</button>
                  </div>
                  <div className="flex flex-col items-end leading-none">
                     <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Subtotal Final</span>
                     <div className="flex flex-col items-end">
                       {hasDiscount && <span className="text-[9px] sm:text-[11px] font-bold text-slate-400/50 line-through decoration-red-400/30">{formatPrice(originalPrice)}</span>}
                       <span className={`text-lg sm:text-3xl font-black tracking-tighter tabular-nums ${hasDiscount ? 'text-red-500' : 'text-slate-900'}`}>{formatPrice(displayPrice)}</span>
                     </div>
                  </div>
                </div>
                <Button 
                 onClick={(e) => { e.stopPropagation(); onAdd(); }} disabled={added}
                 className={`h-11 sm:h-16 w-full rounded-xl sm:rounded-2xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 border-none shadow-lg ${added ? 'bg-emerald-500' : 'bg-slate-950 hover:bg-black text-white'}`}
                >
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em]">{added ? 'PRODUCTO AÑADIDO' : 'CONFIRMAR Y AÑADIR'}</span>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${added ? 'bg-white text-emerald-500' : 'bg-white/20 text-white'}`}>{added ? <Check className="h-3 w-3" strokeWidth={4} /> : <Plus className="h-3 w-3" strokeWidth={3} />}</div>
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
