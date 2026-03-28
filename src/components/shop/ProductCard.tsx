'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ShoppingCart, Plus, Info, Sparkles, Tag, TrendingDown, Settings2, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductVariant, StoreConfig } from '@/types'
import { fixPath } from '@/lib/utils'
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
  const [added, setAdded] = useState(false)
  const [open, setOpen] = useState(false)
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
    handleAddToCart(product, selectedVariant || undefined, quantity)
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      setOpen(false)
      setQuantity(minQty)
    }, 1500)
  }

  const sortedTiers = tiers.length > 0 ? [...tiers].sort((a, b) => a.minQty - b.minQty) : [];
  const nextTier = sortedTiers.find((t: any) => t.minQty > quantity);
  const currentTier = tiers.length > 0 ? [...tiers].sort((a, b) => b.minQty - a.minQty).find((t: any) => quantity >= t.minQty) : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ y: -5 }} className="group cursor-pointer flex flex-col gap-2">
          <div className="relative aspect-square w-full bg-slate-100 rounded-[2rem] overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 border border-slate-100 italic">
            {config.showImages && product.image ? (
              <img src={fixPath(product.image)} alt={product.name} loading="lazy" className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                 <Plus className="h-10 w-10 opacity-20" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
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
      <DialogContent className="w-[95vw] max-h-[95vh] sm:max-w-[550px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[2.5rem] sm:rounded-[3rem] focus:outline-none flex flex-col transition-all">
        <div className="relative flex-1 flex flex-col overflow-hidden">
            <div className="relative aspect-square w-full overflow-hidden bg-slate-50 min-h-[250px] sm:min-h-0">
              <img src={fixPath(product.image || '')} alt={product.name} className="w-full h-full object-contain p-2 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-5 right-5">
                 <DialogTitle className="text-xl sm:text-2xl font-black text-white leading-none tracking-tight uppercase italic underline decoration-blue-500 decoration-3 underline-offset-4">
                    {product.name}
                 </DialogTitle>
              </div>
            </div>

            <div className="p-4 sm:p-7 flex-1 flex flex-col gap-3 sm:gap-6 overflow-hidden">
               {product.description && (
                 <div className="bg-slate-50 p-3 sm:p-5 rounded-[1.2rem] sm:rounded-[2rem] border border-slate-100 flex-shrink-0">
                    <p className="text-[9px] sm:text-[11px] leading-tight text-slate-500 font-bold uppercase text-center italic tracking-tight">
                       {product.description}
                    </p>
                 </div>
               )}

               {product.hasVariants && product.variants.length > 0 && (
                 <div className="flex-shrink-0">
                   <div className="flex items-center gap-2 px-1 mb-1">
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
                     <SelectTrigger className="w-full h-11 sm:h-14 rounded-xl sm:rounded-2xl border-none bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-5 shadow-lg">
                       <SelectValue placeholder="ELIGE UNA OPCIÓN..." />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-none shadow-2xl p-1 bg-slate-900 text-white min-w-[280px]">
                       <SelectItem value="base" className="text-[10px] font-black uppercase rounded-lg py-3 focus:bg-white/10">
                         <div className="flex items-center justify-between w-full"><span>ESTÁNDAR</span><span className="text-white/40 ml-4">{formatPrice(activeBasePrice)}</span></div>
                       </SelectItem>
                       {product.variants.filter(v => v.name).map(variant => (
                         <SelectItem key={variant.id} value={variant.id} className="text-[10px] font-black uppercase rounded-lg py-3 focus:bg-white/10">
                           <div className="flex items-center justify-between w-full gap-8"><span>{variant.name}</span><span className="text-white/40">{formatPrice(product.variantBehavior === 'replace' ? Number(variant.price) : activeBasePrice + Number(variant.price))}</span></div>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               )}

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
