'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ShoppingCart, Plus, Info, Sparkles, Tag, TrendingDown, Settings2, ArrowRight, Star, Image as ImageIcon, X, Palette, Loader2, Camera, Upload, Trash2, ChevronRight, Users, ImagePlus, Briefcase, ChevronLeft, ChevronDown } from 'lucide-react'
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
import { db, COLLECTIONS } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useUserStore } from '@/store/user'
import { toast } from '@/hooks/use-toast'

interface ProductCardProps {
  product: Product
  config: StoreConfig
  formatPrice: (price: number) => string
  handleAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void
}

export function ProductCard({ product, config, formatPrice, handleAddToCart }: ProductCardProps) {
  const { user, isLoggedIn, setIsLoginModalOpen } = useUserStore()
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

  // Estados para la galería
  const [showGallerySelector, setShowGallerySelector] = useState(false)
  const [userPhotos, setUserPhotos] = useState<any[]>([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('TODAS')
  
  // Estado para la previsualización premium
  const [showPreview, setShowPreview] = useState(false)

  const categories = useMemo(() => {
    const cats = new Set<string>(['TODAS'])
    userPhotos.forEach(p => {
      if (p.category) cats.add(p.category.toUpperCase())
    })
    return Array.from(cats)
  }, [userPhotos])

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'TODAS') return userPhotos
    return userPhotos.filter(p => p.category?.toUpperCase() === activeCategory)
  }, [userPhotos, activeCategory])

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
    if (!isLoggedIn) {
      setIsLoginModalOpen(true)
      return
    }

    let finalNote = personalizationNote

    Object.entries(selectedCustomOptions).forEach(([key, val]) => {
      finalNote = finalNote ? `${finalNote} | ${key}: ${val}` : `${key}: ${val}`;
    });

    if (selectedVariant) {
      finalNote = finalNote ? `${selectedVariant.name} | ${finalNote}` : selectedVariant.name
    }
    if (uploadedUrl) {
      finalNote = finalNote ? `${finalNote} | FOTO: ${uploadedUrl}` : `FOTO: ${uploadedUrl}`
    }

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
      toast({ title: "Error", description: "No se pudo subir la foto.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }


  const fetchUserGalleries = async () => {
    if (!isLoggedIn || !user?.dni) {
      setIsLoginModalOpen(true)
      return
    }

    setIsLoadingPhotos(true)
    setShowGallerySelector(true)

    try {
      const docRef = doc(db, COLLECTIONS.CLIENTS, user.dni.toUpperCase().trim())
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        const photos = data?.gallerySettings?.photos || []
        setUserPhotos(photos)
        if (photos.length === 0) {
          toast({ title: "Sin fotos", description: "Tu galería todavía no tiene fotos publicadas." })
        }
      } else {
        toast({ title: "Galería no encontrada", description: "No hemos localizado ningún reportaje con tu DNI.", variant: "destructive" })
        setShowGallerySelector(false)
      }
    } catch (err) {
      console.error("Error loading galleries:", err)
      toast({ title: "Error", description: "No se pudieron cargar tus fotos.", variant: "destructive" })
    } finally {
      setIsLoadingPhotos(false)
    }
  }

  const WatermarkOverlay = ({ opacity = 0.2 }: { opacity?: number }) => {
    const finalOpacity = (config.logoOpacity ?? opacity * 100) / 100;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none">
         {config.logoUrl ? (
           <img 
             src={config.logoUrl} 
             alt="Watermark" 
             className="max-w-[70%] max-h-[70%] object-contain -rotate-12"
             style={{ opacity: finalOpacity }}
           />
         ) : (
           <p 
             className="text-white font-black text-2xl sm:text-4xl uppercase tracking-[0.4em] drop-shadow-2xl text-center px-4 -rotate-12"
             style={{ opacity: finalOpacity }}
           >
             {config.storeName || 'PUJALTE FOTOGRAFÍA'}
           </p>
         )}
      </div>
    )
  }

  const sortedTiers = tiers.length > 0 ? [...tiers].sort((a, b) => a.minQty - b.minQty) : [];
  const nextTier = sortedTiers.find((t: any) => t.minQty > quantity);
  const currentTier = tiers.length > 0 ? [...tiers].sort((a, b) => b.minQty - a.minQty).find((t: any) => quantity >= t.minQty) : undefined;

    const [showScrollHint, setShowScrollHint] = useState(true)
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (e.currentTarget.scrollTop > 20) {
        setShowScrollHint(false)
      } else {
        setShowScrollHint(true)
      }
    }

    return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setShowGallerySelector(false); setShowScrollHint(true); } }}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ y: -8 }} className="group cursor-pointer flex flex-col gap-3">
          <div className="relative aspect-square w-full bg-white rounded-[2.5rem] overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] group-hover:shadow-[0_25px_50px_-12px_rgba(74,124,89,0.2)] transition-all duration-700 border border-white/50">
            {config.showImages && product.image ? (
              <img 
                src={fixPath(product.image || undefined)} 
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
              {!!product.isFeatured && (
                <div className="bg-slate-900 text-white text-[7px] sm:text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-slate-900/20 uppercase tracking-widest">
                  <Star className="h-2 w-2 sm:h-3 sm:w-3 fill-white" />
                  <span>Destacado</span>
                </div>
              )}
              {!!product.isNew && (
                <div className="bg-amber-400 text-white text-[7px] sm:text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-amber-400/20 uppercase tracking-widest">
                  <Sparkles className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span>Novedad</span>
                </div>
              )}
              {!!(product.salePrice || (tiers && tiers.length > 0)) && (
                <div className="bg-emerald-500 text-white text-[7px] sm:text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20 uppercase tracking-widest">
                  <Tag className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span>Oferta</span>
                </div>
              )}
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

      <DialogContent showCloseButton={false} className={cn("w-[95vw] max-h-[82dvh] sm:max-h-[90dvh] sm:max-w-[550px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[2.5rem] sm:rounded-[3rem] focus:outline-none flex flex-col transition-all", showPreview && "bg-transparent shadow-none")}>
        <div className={cn("relative flex-1 flex flex-col overflow-hidden transition-all duration-300", showPreview ? "opacity-0 pointer-events-none scale-95" : "opacity-100")}>
            {/* Indicador de scroll flotante sutil */}
            <AnimatePresence>
              {showScrollHint && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col items-center gap-1"
                >
                   <div className="flex flex-col items-center">
                     <motion.div
                       animate={{ y: [0, 8, 0], opacity: [0.3, 1, 0.3] }}
                       transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                     >
                        <ChevronDown className="h-5 w-5 text-[#4A7C59]" />
                     </motion.div>
                     <motion.div
                       animate={{ y: [0, 8, 0], opacity: [0.1, 0.6, 0.1] }}
                       transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                       className="-mt-3"
                     >
                        <ChevronDown className="h-5 w-5 text-[#4A7C59]" />
                     </motion.div>
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4A7C59]/60">Deslizar</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* HEADER CON TÍTULO ELEGANTE AL TOP */}
            <div className="h-14 sm:h-16 flex items-center justify-center bg-white border-b border-slate-50 relative shrink-0">
                <DialogTitle className="text-xl sm:text-2xl font-light text-slate-800 tracking-tight" style={{ fontFamily: 'serif' }}>
                    {product.name}
                </DialogTitle>
                <button 
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
            </div>

            <div 
              onScroll={handleScroll}
              className="p-0 flex-1 flex flex-col overflow-y-auto custom-scrollbar relative"
            >
                {/* IMAGEN DEL PRODUCTO - COMPLETA Y SIN RECORTAR */}
                <div className="relative w-full bg-white overflow-hidden border-b border-slate-50/50 flex-shrink-0 min-h-[250px] sm:min-h-[350px] flex items-center justify-center p-6 sm:p-8">
                  <img src={fixPath(product.image || '')} alt={product.name} className="max-w-full max-h-[300px] sm:max-h-[400px] object-contain transition-all duration-700 hover:scale-105" />
                  <div className="absolute top-4 left-4 flex flex-col gap-1 z-10 pointer-events-none opacity-50">
                    {!!product.isFeatured && <Badge className="bg-slate-900 border-none text-[7px] uppercase font-black px-2 py-0.5">Destacado</Badge>}
                    {!!product.isNew && <Badge className="bg-amber-400 border-none text-[7px] uppercase font-black px-2 py-0.5">Novedad</Badge>}
                  </div>
                </div>

                <div className="p-4 sm:p-7 pb-32 sm:pb-44 flex flex-col gap-4 sm:gap-6">
                {product.description && (
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[2rem] border border-slate-100 flex-shrink-0">
                    <p className="text-[9px] sm:text-[10px] leading-tight text-slate-500 font-bold uppercase text-center italic tracking-tight whitespace-pre-line">
                       {product.description}
                    </p>
                  </div>
                )}

               {!!product.hasVariants && !!product.variants.length && (
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

                {/* OPCIONES DE PERSONALIZACIÓN DINÁMICAS */}
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

                {/* SECCIÓN DE FOTOS - COMPACTADA */}
                <div className="flex flex-col gap-3 mt-1 bg-[#4A7C59]/[0.03] p-4 sm:p-5 rounded-[2rem] border border-[#4A7C59]/10 shadow-[inner_0_2px_4px_rgba(0,0,0,0.02)]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-md bg-[#4A7C59]/10 flex items-center justify-center">
                           <Camera className="h-3 w-3 text-[#4A7C59]" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4A7C59]/80">Tu Foto</span>
                      </div>
                      {uploadedUrl && (
                        <button onClick={() => setUploadedUrl(null)} className="text-[8px] font-black text-red-500/60 uppercase flex items-center gap-1 hover:text-red-500 transition-colors">
                          <Trash2 className="h-2.5 w-2.5" /> Borrar
                        </button>
                      )}
                    </div>
                    
                    {!uploadedUrl ? (
                      <div className="space-y-2">
                         {/* Botonera de selección de origen ultra-compacta */}
                         <div className="flex gap-2">
                           <button 
                             type="button"
                             onClick={() => document.getElementById(`photo-${product.id}`)?.click()}
                             className="flex flex-1 items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-[#4A7C59]/30 hover:bg-[#4A7C59]/[0.02] transition-all group shadow-sm active:scale-95"
                           >
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#4A7C59]/10 group-hover:text-[#4A7C59] transition-colors shrink-0">
                                 <Upload className="h-4 w-4" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-tight text-slate-500 group-hover:text-slate-700">Subir Archivo</span>
                           </button>

                           <button 
                             type="button"
                             onClick={fetchUserGalleries}
                             className="flex flex-1 items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-[#4A7C59]/30 hover:bg-[#4A7C59]/[0.02] transition-all group shadow-sm active:scale-95"
                           >
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#4A7C59]/10 group-hover:text-[#4A7C59] transition-colors shrink-0">
                                 <Briefcase className="h-4 w-4" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-tight text-slate-500 group-hover:text-slate-700">Mis Galerías</span>
                           </button>
                         </div>

                         <input 
                           type="file" 
                           id={`photo-${product.id}`}
                           className="hidden" 
                           accept="image/*"
                           onChange={handleFileUpload}
                           disabled={isUploading}
                         />

                         {isUploading && (
                           <div className="flex items-center justify-center gap-2 py-4">
                              <Loader2 className="h-4 w-4 text-[#4A7C59] animate-spin" />
                              <span className="text-[9px] font-black uppercase text-[#4A7C59] animate-pulse">Subiendo...</span>
                           </div>
                         )}
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="relative aspect-video w-full rounded-[1.5rem] overflow-hidden border-2 border-[#4A7C59]/20 bg-white flex items-center justify-center shadow-inner group-hover:brightness-95 transition-all">
                          <img src={uploadedUrl} alt="Vista previa" className="h-full w-full object-contain p-2" />
                          <WatermarkOverlay opacity={0.15} />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Check className="h-10 w-10 text-white" strokeWidth={4} />
                          </div>
                        </div>
                        <Button 
                          type="button"
                          variant="secondary"
                          onClick={() => setShowPreview(true)}
                          className="absolute -bottom-2 right-4 h-8 px-4 rounded-full bg-white shadow-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 hover:bg-[#4A7C59] hover:text-white transition-all z-10"
                        >
                          Ampliar Foto
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* MINI SELECTOR DE GALERÍA INCRUSTADO */}
                  <AnimatePresence>
                    {showGallerySelector && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm mt-2 relative z-[60]"
                      >
                         <div className="p-3 border-b border-slate-50 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-[#4A7C59]">Mis Reportajes</span>
                            <button type="button" onClick={() => setShowGallerySelector(false)} className="h-5 w-5 rounded-full text-slate-300 hover:text-slate-900 transition-colors">
                               <X className="h-3 w-3" />
                            </button>
                         </div>

                         {/* Filtro de Categorías */}
                         {!isLoadingPhotos && categories.length > 2 && (
                           <div className="flex gap-1.5 p-2 bg-slate-50/50 overflow-x-auto no-scrollbar border-b border-slate-50">
                             {categories.map(cat => (
                               <button
                                 key={cat}
                                 type="button"
                                 onClick={() => setActiveCategory(cat)}
                                 className={cn(
                                   "whitespace-nowrap px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all",
                                   activeCategory === cat 
                                     ? "bg-[#4A7C59] text-white shadow-sm" 
                                     : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100"
                                 )}
                               >
                                 {cat}
                               </button>
                             ))}
                           </div>
                         )}

                         <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {isLoadingPhotos ? (
                              <div className="py-10 flex flex-col items-center justify-center gap-2">
                                 <Loader2 className="h-6 w-6 text-[#4A7C59] animate-spin" />
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Consultando tus fotos...</p>
                              </div>
                            ) : filteredPhotos.length > 0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                 {filteredPhotos.map((photo, i) => (
                                   <motion.button
                                     key={i}
                                     type="button"
                                     whileTap={{ scale: 0.95 }}
                                     onClick={() => {
                                       setUploadedUrl(photo.url);
                                       setShowGallerySelector(false);
                                       setShowPreview(true);
                                     }}
                                     className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#4A7C59] transition-all bg-slate-50 active:scale-95"
                                   >
                                      <img src={photo.url} className="w-full h-full object-cover" alt="Tu foto" />
                                      <WatermarkOverlay opacity={0.1} />
                                   </motion.button>
                                 ))}
                              </div>
                            ) : (
                              <div className="py-6 text-center">
                                 <p className="text-[9px] font-bold text-slate-400">¡Vaya! No hay fotos en esta categoría.</p>
                              </div>
                            )}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2 mt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] ml-1 flex items-center gap-2">
                      <Sparkles className="h-3 w-3" /> Observaciones o Nombres
                    </Label>
                    <Input 
                      value={personalizationNote}
                      onChange={(e) => setPersonalizationNote(e.target.value)}
                      placeholder="Ej: Para el abuelo, Fechas, Nombres..."
                      className="h-12 rounded-xl bg-white border-none shadow-sm focus-visible:ring-[#4A7C59]/10 text-[11px] font-medium"
                    />
                  </div>
                </div>

                {tiers && tiers.length > 0 && (
                  <div className="flex-shrink-0">
                    <AnimatePresence mode="wait">
                      {nextTier ? (
                        <motion.div 
                          key="next" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
                          onClick={() => setQuantity(nextTier.minQty)}
                        >
                          <div className="h-7 w-7 min-w-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                            <TrendingDown className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest leading-none block">PRÓXIMO DESCUENTO</span>
                            <p className="text-[9px] font-bold text-slate-600 mt-0.5 truncate text-left">Añade <span className="text-blue-600 font-black">{nextTier.minQty - quantity} más</span> y baja a <span className="text-blue-600 font-black">{formatPrice(nextTier.price)}</span>/ud</p>
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
              </div>
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

        {/* MODAL DE PREVISUALIZACIÓN PREMIUM (DISEÑO DEL USER) */}
        <AnimatePresence>
          {showPreview && uploadedUrl && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-10 bg-slate-950/80 backdrop-blur-xl"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 30 }}
                  className="bg-white w-full max-w-[500px] h-full max-h-[85vh] rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative flex flex-col"
                >
                  {/* Zona de Imagen - Estilo Galería */}
                  <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img 
                      src={uploadedUrl || undefined} 
                      alt="Vista Previa Premium" 
                      className="w-full h-full object-contain p-4"
                    />
                    <WatermarkOverlay opacity={0.25} />

                    {/* Botón Cerrar (X) - Posicionado para no ser cortado */}
                    <button 
                      onClick={() => setShowPreview(false)}
                      className="absolute top-6 right-6 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10 shadow-xl z-50"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    {/* Badge de Vista Previa */}
                    <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full pointer-events-none">
                       <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/80">Vista Previa</span>
                    </div>
                  </div>

                  {/* Acciones - Espaciado generoso para evitar cortes */}
                  <div className="p-6 sm:p-10 bg-white flex flex-col gap-3.5 border-t border-slate-50 pb-10 sm:pb-12">
                     <button 
                        onClick={() => {
                          setShowPreview(false);
                          setUploadedUrl(null);
                          setShowGallerySelector(true);
                        }}
                        className="w-full h-14 rounded-2xl border-2 border-dashed border-[#4A7C59]/30 text-[#4A7C59] font-black uppercase text-[10px] sm:text-[11px] tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-[#4A7C59]/5 transition-all active:scale-[0.98]"
                     >
                       <ImagePlus className="h-4 w-4" />
                       CAMBIAR FOTOGRAFÍA
                     </button>

                     <button 
                        onClick={() => setShowPreview(false)}
                        className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] sm:text-[11px] tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20"
                     >
                       <Check className="h-4 w-4" />
                       CONFIRMAR Y CERRAR
                     </button>
                     
                     <div className="flex justify-center mt-2 group">
                        <span className="text-[10px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.25em] text-center px-4 transition-colors group-hover:text-[#4A7C59]">
                          Más que fotografía, tus mejores recuerdos
                        </span>
                     </div>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
