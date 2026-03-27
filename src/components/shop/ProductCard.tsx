'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ShoppingCart, Plus, Info, Sparkles, Tag, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductVariant, StoreConfig } from '@/types'
import { fixPath } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
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

  // Parse Tier Pricing
  const tiers = typeof product.tierPricing === 'string' 
    ? JSON.parse(product.tierPricing) 
    : (Array.isArray(product.tierPricing) ? product.tierPricing : []);

  // Calculate Unit Price based on Tiers
  const getUnitPrice = (qty: number) => {
    let price = product.salePrice ? Number(product.salePrice) : Number(product.price);
    if (tiers && tiers.length > 0) {
      // Find the highest tier that is <= qty
      const applicableTier = [...tiers]
        .sort((a, b) => b.qty - a.qty)
        .find(t => qty >= t.qty);
      if (applicableTier) price = applicableTier.price;
    }
    return price;
  }

  const activeBasePrice = getUnitPrice(quantity)
  
  const displayPrice = (selectedVariant 
    ? (product.variantBehavior === 'replace' ? Number(selectedVariant.price) : activeBasePrice + Number(selectedVariant.price)) 
    : activeBasePrice) * quantity

  const hasDiscount = !!product.salePrice || (tiers && tiers.length > 0 && activeBasePrice < (product.salePrice ? Number(product.salePrice) : Number(product.price)))
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div 
          whileHover={{ y: -5 }}
          className="group cursor-pointer flex flex-col gap-2"
        >
          {/* FOTO 1:1 */}
          <div className="relative aspect-square w-full bg-slate-100 rounded-[2rem] overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 border border-slate-100 italic">
            {config.showImages && product.image ? (
              <img 
                src={fixPath(product.image)} 
                alt={product.name} 
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                 <Plus className="h-10 w-10 opacity-20" />
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {product.isNew && (
                <div className="bg-amber-400 text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-amber-400/20 uppercase tracking-widest animate-in fade-in zoom-in duration-500">
                  <Sparkles className="h-3 w-3" />
                  <span>Nuevo</span>
                </div>
              )}
              {product.salePrice && (
                <div className="bg-purple-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-purple-600/20 uppercase tracking-widest animate-in fade-in zoom-in duration-700">
                  <Tag className="h-3 w-3" />
                  <span>Oferta</span>
                </div>
              )}
            </div>

            {/* Indicador de "Más Info" */}
            <div className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
               <Info className="h-4 w-4 text-slate-800" />
            </div>
          </div>

          {/* Nombre Corto y Precio */}
          <div className="px-2 text-center mt-1">
             <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-800 leading-tight truncate px-1">
               {product.name}
             </h3>
             <div className="mt-0.5 flex flex-col items-center">
                {product.showPrice !== false ? (
                  <>
                    {hasDiscount && (
                      <span className="text-[9px] font-bold text-slate-400 line-through decoration-red-400/50 -mb-0.5 opacity-60">
                        {formatPrice(originalBasePrice)}
                      </span>
                    )}
                    <span className="text-[14px] sm:text-[15px] font-black text-slate-900 tracking-tight">
                      {formatPrice(activeBasePrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Ver más
                  </span>
                )}
             </div>
          </div>
        </motion.div>
      </DialogTrigger>

      {/* VENTANA DE MÁS INFO (MODAL) */}
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] rounded-[2rem] sm:rounded-[3rem] max-h-[90vh] sm:max-h-none overflow-y-auto">
        <div className="relative">
           {/* Imagen en el Modal */}
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-50 relative">
              <img 
                src={fixPath(product.image || '')} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                 <DialogTitle className="text-2xl font-black text-white leading-none tracking-tight">
                    {product.name}
                 </DialogTitle>
              </div>
           </div>

           <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
              {/* Descripción */}
              {product.description && (
                <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-100 relative">
                   <p className="text-[12px] leading-relaxed text-slate-600 font-bold uppercase text-center opacity-80">
                      {product.description}
                   </p>
                </div>
              )}

              {/* Tramos de Precios (Novedad) */}
              {tiers && tiers.length > 0 && (
                <div className="space-y-3">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 px-1 italic">Tramos de Descuento</p>
                   <div className="flex flex-wrap gap-2">
                      {tiers.map((t: any, i: number) => (
                        <div key={i} className={`px-4 py-2.5 rounded-2xl border flex flex-col items-center gap-0.5 transition-all ${quantity >= t.qty ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-100 text-slate-400'}`}>
                           <span className="text-[10px] font-black tracking-tighter italic">+{t.qty} uds.</span>
                           <span className="text-[13px] font-black italic">{formatPrice(t.price)}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Variantes */}
              {product.hasVariants && product.variants.length > 0 && (
                <div className="space-y-3">
                  {/* El selector de variantes */}
                  <Select
                    value={selectedVariant?.id || 'base'}
                    onValueChange={(v) => {
                      if (v === 'base') {
                        setSelectedVariant(null)
                      } else {
                        const variant = product.variants.find(vr => vr.id === v)
                        setSelectedVariant(variant || null)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-14 rounded-3xl border-none bg-slate-900 text-white hover:bg-black transition-all text-[14px] font-bold px-6 shadow-xl">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-none shadow-2xl p-2 bg-slate-900 text-white">
                      {/* Opción Base */}
                      <SelectItem value="base" className="text-[13px] font-bold rounded-2xl py-3.5 cursor-pointer focus:bg-white/10 focus:text-emerald-400">
                        <div className="flex items-center justify-between w-full min-w-[200px]">
                           <span className="mr-8">{product.name}</span>
                        </div>
                      </SelectItem>

                      {/* Variantes - Solo mostrar las que tienen nombre */}
                      {product.variants
                        .filter(v => v.name && v.name.trim() !== '')
                        .sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map(variant => {
                          const finalVariantPrice = product.variantBehavior === 'replace' 
                            ? Number(variant.price) 
                            : activeBasePrice + Number(variant.price);
                            
                          return (
                            <SelectItem key={variant.id} value={variant.id} className="text-[13px] font-bold rounded-2xl py-3.5 cursor-pointer focus:bg-white/10 focus:text-emerald-400">
                              <div className="flex items-center justify-between w-full min-w-[200px] gap-8">
                                 <span>{variant.name}</span>
                                 {product.showPrice !== false && (
                                   <span className="text-emerald-400 tabular-nums">{formatPrice(finalVariantPrice)}</span>
                                 )}
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Footer con Cantidad, Precio y Botón */}
              <div className="flex flex-col gap-6 pt-4 w-full">
                  <div className="flex items-center justify-between bg-slate-50 p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-2 sm:gap-4 bg-white rounded-2xl p-0.5 sm:p-1 shadow-sm border border-slate-100">
                       <button 
                         onClick={() => setQuantity(Math.max(minQty, quantity - stepQty))}
                         className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-black transition-all font-black text-xl"
                       >
                         -
                       </button>
                       <span className="w-10 text-center font-black tabular-nums text-sm text-slate-900 italic">
                         {quantity}
                       </span>
                       <button 
                         onClick={() => setQuantity(quantity + stepQty)}
                         className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-black transition-all font-black text-xl"
                       >
                         +
                       </button>
                    </div>
                      <div className="flex flex-col items-end">
                         {product.showPrice !== false ? (
                           <>
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] mb-0.5 pr-1">Subtotal</span>
                             <div className="flex flex-col items-end">
                               {hasDiscount && (
                                 <span className="text-[10px] font-bold text-slate-400 line-through decoration-red-400/50 -mb-1 opacity-60">
                                   {formatPrice(originalPrice)}
                                 </span>
                               )}
                               <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none tabular-nums">
                                 {formatPrice(displayPrice)}
                               </span>
                             </div>
                           </>
                         ) : (
                           <div className="flex flex-col items-end justify-center py-2 h-full">
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Elegir Opciones</span>
                           </div>
                         )}
                      </div>
                 </div>
                 
                 <Button 
                  onClick={(e) => { e.stopPropagation(); onAdd(); }}
                  disabled={added}
                  className={`h-16 px-10 rounded-[2rem] transition-all duration-300 active:scale-95 flex items-center gap-4 border-none shadow-2xl ${
                    added 
                     ? 'bg-emerald-500 hover:bg-emerald-500' 
                     : 'bg-black hover:bg-slate-800 text-white'
                  }`}
                 >
                   <span className="text-[12px] font-black uppercase tracking-[0.2em]">
                      {added ? '¡Hecho!' : 'Añadir'}
                   </span>
                   <div className={`h-8 w-8 rounded-full flex items-center justify-center ${added ? 'bg-white text-emerald-500' : 'bg-white/20 text-white'}`}>
                      {added ? <Check className="h-5 w-5" strokeWidth={4} /> : <ShoppingCart className="h-4 w-4" strokeWidth={3} />}
                   </div>
                 </Button>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
