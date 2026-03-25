'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ShoppingCart, Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductVariant, StoreConfig } from '@/types'
import { fixPath } from '@/lib/utils'
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
  handleAddToCart: (product: Product, variant?: ProductVariant) => void
}

export function ProductCard({ product, config, formatPrice, handleAddToCart }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.hasVariants && product.variants.length > 0 ? product.variants[0] : null
  )
  const [added, setAdded] = useState(false)
  const [open, setOpen] = useState(false)

  const displayPrice = selectedVariant 
    ? (product.variantBehavior === 'replace' ? Number(selectedVariant.price) : Number(product.price) + Number(selectedVariant.price)) 
    : Number(product.price)

  const onAdd = () => {
    handleAddToCart(product, selectedVariant || undefined)
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      setOpen(false)
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
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                 <Plus className="h-10 w-10 opacity-20" />
              </div>
            )}
            
            {/* Indicador de "Más Info" */}
            <div className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
               <Info className="h-4 w-4 text-slate-800" />
            </div>

            {/* Badge de Precio */}
            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-xl border border-white/10">
               {formatPrice(displayPrice)}
            </div>
          </div>

          {/* Nombre Corto */}
          <div className="px-1 text-center">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7C59]/60 block mb-0.5">
                {product.category?.name || 'Estudio'}
             </span>
             <h3 className="text-[13px] font-bold text-slate-800 leading-tight truncate px-1">
               {product.name}
             </h3>
          </div>
        </motion.div>
      </DialogTrigger>

      {/* VENTANA DE MÁS INFO (MODAL) */}
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] rounded-[3rem]">
        <div className="relative">
           {/* Imagen en el Modal */}
           <div className="aspect-[4/3] w-full overflow-hidden bg-slate-50 relative">
              <img 
                src={fixPath(product.image)} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 block mb-1">Detalles del artículo</span>
                 <DialogTitle className="text-2xl font-black text-white leading-none tracking-tight">
                    {product.name}
                 </DialogTitle>
              </div>
           </div>

           <div className="p-8 space-y-8">
              {/* Descripción */}
              {product.description && (
                <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-100 relative">
                   <p className="text-[13px] leading-relaxed text-slate-600 font-medium italic">
                     &ldquo;{product.description}&rdquo;
                   </p>
                </div>
              )}

              {/* Variantes */}
              {product.hasVariants && product.variants.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] pl-1">
                    {product.variantType || 'Elige una opción'}
                  </Label>
                  <Select
                    value={selectedVariant?.id || ''}
                    onValueChange={(v) => {
                      const variant = product.variants.find(vr => vr.id === v)
                      setSelectedVariant(variant || null)
                    }}
                  >
                    <SelectTrigger className="w-full h-14 rounded-3xl border-none bg-slate-900 text-white hover:bg-black transition-all text-[14px] font-bold px-6 shadow-xl">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-none shadow-2xl p-2 bg-slate-900 text-white">
                      {product.variants.sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(variant => (
                        <SelectItem key={variant.id} value={variant.id} className="text-[13px] font-bold rounded-2xl py-3.5 cursor-pointer focus:bg-white/10 focus:text-emerald-400">
                          <div className="flex items-center justify-between w-full min-w-[200px]">
                             <span className="mr-8">{variant.name}</span>
                             <span className="font-black tabular-nums">
                               {Number(variant.price) > 0 
                                 ? (product.variantBehavior === 'replace' ? formatPrice(Number(variant.price)) : `+${formatPrice(Number(variant.price))}`) 
                                 : (product.variantBehavior === 'replace' ? formatPrice(Number(product.price)) : 'Base')}
                             </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Footer con Precio y Botón */}
              <div className="flex items-center justify-between gap-4 pt-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] mb-1 pl-1">Total Pack</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                      {formatPrice(displayPrice)}
                    </span>
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
