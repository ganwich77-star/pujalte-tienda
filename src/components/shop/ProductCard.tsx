'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Package, ChevronDown, ChevronUp } from 'lucide-react'
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

  const displayPrice = selectedVariant 
    ? (product.variantBehavior === 'replace' ? Number(selectedVariant.price) : Number(product.price) + Number(selectedVariant.price)) 
    : Number(product.price)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="w-full"
    >
      <Card className={`overflow-hidden transition-all duration-300 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-100/50 shadow-sm hover:shadow-md ${expanded ? 'ring-2 ring-primary/10' : ''}`}>
        {/* CABECERA: IMAGEN Y NOMBRE (SIEMPRE VISIBLE) */}
        <div 
          className="p-3 cursor-pointer group"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-4">
            {/* Miniatura de imagen */}
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-slate-50 shrink-0 ring-1 ring-slate-100 group-hover:ring-primary/30 transition-all">
              {config.showImages && product.image ? (
                <img 
                  src={fixPath(product.image)} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-slate-200" />
                </div>
              )}
            </div>

            {/* Texto y Categoría */}
            <div className="flex-grow min-w-0">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1 block">
                  {product.category?.name || 'Producto'}
               </span>
               <h3 className="text-[14px] font-bold text-slate-900 leading-tight truncate">
                 {product.name}
               </h3>
            </div>

            {/* Toggle Icon */}
            <div className={`p-2 rounded-full transition-all ${expanded ? 'bg-primary/10 text-primary rotate-180' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'}`}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* CONTENIDO DESPLEGABLE */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-2 flex flex-col gap-5 border-t border-slate-50">
                {/* Descripción */}
                {product.description && (
                  <p className="text-[11px] leading-relaxed text-slate-500 italic px-1">
                    {product.description}
                  </p>
                )}

                {/* Variantes */}
                {product.hasVariants && product.variants.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {product.variantType || 'Opciones'}
                      </Label>
                      {product.variantBehavior === 'replace' && (
                        <Badge variant="outline" className="text-[8px] border-slate-200 text-slate-400 px-2 py-0 font-medium">Precio por selección</Badge>
                      )}
                    </div>
                    <Select
                      value={selectedVariant?.id || ''}
                      onValueChange={(v) => {
                        const variant = product.variants.find(vr => vr.id === v)
                        setSelectedVariant(variant || null)
                      }}
                    >
                      <SelectTrigger className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all text-[12px] font-semibold tracking-tight px-4 shadow-sm">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-slate-100 shadow-2xl">
                        {product.variants.sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(variant => (
                          <SelectItem key={variant.id} value={variant.id} className="text-[11px] font-semibold rounded-xl py-3 cursor-pointer">
                            <div className="flex items-center justify-between w-full gap-8">
                               <span>{variant.name}</span>
                               <span className="text-primary font-bold">
                                 {Number(variant.price) > 0 
                                   ? (product.variantBehavior === 'replace' ? formatPrice(Number(variant.price)) : `+${formatPrice(Number(variant.price))}`) 
                                   : (product.variantBehavior === 'replace' ? formatPrice(Number(product.price)) : '')}
                               </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Precio y Acción */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">
                        {formatPrice(displayPrice)}
                      </span>
                   </div>
                   
                   <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product, selectedVariant || undefined);
                    }}
                    className="h-12 px-6 rounded-2xl bg-black hover:bg-primary text-white shadow-lg shadow-black/5 transition-all active:scale-95 flex items-center gap-2 border-none group/btn"
                   >
                     <span className="text-[11px] font-extrabold uppercase tracking-widest">Añadir</span>
                     <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:rotate-90 transition-transform duration-300">
                        <Plus className="h-4 w-4" strokeWidth={3} />
                     </div>
                   </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
