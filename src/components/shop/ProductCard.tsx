'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Package, ChevronDown, Check, Info, ShoppingCart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductVariant, StoreConfig } from '@/types'
import { fixPath } from '@/lib/utils'

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

  const [expanded, setExpanded] = useState(false)
  const [added, setAdded] = useState(false)

  const displayPrice = selectedVariant 
    ? (product.variantBehavior === 'replace' ? Number(selectedVariant.price) : Number(product.price) + Number(selectedVariant.price)) 
    : Number(product.price)

  const onAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleAddToCart(product, selectedVariant || undefined)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      layout
      className="w-full px-2 lg:px-0"
    >
      <div 
        className={`group relative bg-white/95 backdrop-blur-md rounded-[2rem] border transition-all duration-500 overflow-hidden ${
          expanded 
            ? 'shadow-2xl border-slate-200 ring-4 ring-black/5 -translate-y-1' 
            : 'border-slate-100/80 shadow-sm hover:shadow-xl hover:border-slate-200 hover:-translate-y-0.5'
        }`}
      >
        {/* PARTE SUPERIOR (SIEMPRE VISIBLE) */}
        <div 
          className="p-4 cursor-pointer flex items-center md:gap-5 gap-3"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Imagen de Producto tipo Avatar de Lujo */}
          <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] overflow-hidden bg-slate-50 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
            {config.showImages && product.image ? (
              <img 
                src={fixPath(product.image)} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <Package className="h-8 w-8 text-black" />
              </div>
            )}
            
            {/* Badge de Precio Rápido si no está expandido */}
            {!expanded && (
               <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg border border-white/10">
                  {formatPrice(displayPrice)}
               </div>
            )}
          </div>

          {/* Info Principal */}
          <div className="flex-grow min-w-0 pr-4">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">
                   {product.category?.name || 'ESTUDIO'}
                </span>
                {product.hasVariants && !expanded && (
                   <span className="w-1 h-1 rounded-full bg-slate-300" />
                )}
                {product.hasVariants && !expanded && (
                   <span className="text-[9px] font-bold text-slate-400 capitalize">
                      {product.variants.length} opciones
                   </span>
                )}
             </div>
             <h3 className="text-[15px] font-black text-slate-900 leading-[1.3] truncate tracking-tight">
               {product.name}
             </h3>
          </div>

          {/* Botón de expansión / Icono */}
          <div className="flex items-center gap-1">
             <div className={`p-2 rounded-2xl transition-all duration-500 ${expanded ? 'bg-black text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-black'}`}>
               <ChevronDown className="h-4 w-4" />
             </div>
          </div>
        </div>

        {/* CONTENIDO DESPLEGABLE (ZONA DE DETALLE) */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="px-6 pb-6 pt-2 flex flex-col gap-6 border-t border-slate-50">
                {/* Descripción y Detalles */}
                {product.description && (
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-3 opacity-[0.03] text-black">
                        <Info className="h-10 w-10 rotate-12" />
                     </div>
                     <p className="text-[12px] leading-relaxed text-slate-600 font-medium relative z-10 italic">
                       &ldquo;{product.description}&rdquo;
                     </p>
                  </div>
                )}

                {/* Filtro de Selección (Variantes) */}
                {product.hasVariants && product.variants.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {product.variantType || 'Elegir medida / opción'}
                      </Label>
                    </div>
                    <Select
                      value={selectedVariant?.id || ''}
                      onValueChange={(v) => {
                        const variant = product.variants.find(vr => vr.id === v)
                        setSelectedVariant(variant || null)
                      }}
                    >
                      <SelectTrigger className="w-full h-12 rounded-2xl border-none bg-slate-900 text-white hover:bg-black transition-all text-[13px] font-bold tracking-tight px-5 shadow-xl">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-slate-900 text-white">
                        {product.variants.sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(variant => (
                          <SelectItem key={variant.id} value={variant.id} className="text-[12px] font-bold rounded-xl py-3 cursor-pointer focus:bg-white/10 focus:text-white">
                            <div className="flex items-center justify-between w-full">
                               <span className="mr-8">{variant.name}</span>
                               <span className="text-emerald-400 font-black tabular-nums">
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

                {/* ZONA DE PRECIO Y CARRITO (FOOTER) */}
                <div className="flex items-center justify-between gap-4 pt-6 mt-2 border-t border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] mb-0.5 pl-1">Precio Final</span>
                      <div className="flex items-end gap-1">
                         <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                           {formatPrice(displayPrice)}
                         </span>
                         <span className="text-[10px] font-bold text-slate-400 mb-1">IVA incl.</span>
                      </div>
                   </div>
                   
                   <Button 
                    onClick={onAdd}
                    disabled={added}
                    className={`h-14 px-8 rounded-2xl transition-all duration-300 transform active:scale-95 flex items-center gap-3 border-none group/btn shadow-2xl ${
                      added 
                       ? 'bg-emerald-500 hover:bg-emerald-500 scale-[0.98]' 
                       : 'bg-black hover:bg-slate-800 text-white'
                    }`}
                   >
                     <span className="text-[11px] font-black uppercase tracking-[0.2em] px-1">
                        {added ? '¡Añadido!' : 'Añadir al pack'}
                     </span>
                     <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${added ? 'bg-white text-emerald-500 rotate-0' : 'bg-white/20 text-white group-hover/btn:rotate-12'}`}>
                        {added ? <Check className="h-4 w-4" strokeWidth={4} /> : <ShoppingCart className="h-4 w-4" strokeWidth={3} />}
                     </div>
                   </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
