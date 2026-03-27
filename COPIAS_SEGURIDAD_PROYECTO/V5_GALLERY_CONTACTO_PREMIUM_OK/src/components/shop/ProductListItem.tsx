'use client'

import { useState } from 'react'
import { Plus, Package, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductVariant, StoreConfig } from '@/types'
import { motion } from 'framer-motion'

interface ProductListItemProps {
  product: Product
  config: StoreConfig
  formatPrice: (price: number) => string
  handleAddToCart: (product: Product, variant?: ProductVariant) => void
}

export function ProductListItem({ product, config, formatPrice, handleAddToCart }: ProductListItemProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.hasVariants && product.variants.length > 0 ? product.variants[0] : null
  )

  const displayPrice = selectedVariant ? (Number(product.price) + Number(selectedVariant.price)) : product.price
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock
  const [showFullDescription, setShowFullDescription] = useState(false)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl border border-border/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md hover:border-primary/20 transition-all duration-300"
    >
      {/* INFO PRINCIPAL */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-bold text-foreground leading-tight">{product.name}</h3>
          {product.category && (
            <Badge variant="secondary" className="bg-muted/50 text-[10px] uppercase tracking-wider font-bold h-5">
              {product.category.name}
            </Badge>
          )}
        </div>
        <p 
          onClick={() => setShowFullDescription(!showFullDescription)}
          className={`text-sm text-muted-foreground ${showFullDescription ? '' : 'line-clamp-1'} italic cursor-pointer hover:text-primary transition-colors`}
        >
          {product.description}
        </p>
      </div>

      {/* SELECTOR DE VARIANTES (SI TIENE) */}
      {product.hasVariants && product.variants.length > 0 && (
        <div className="w-full sm:w-48 shrink-0">
          <Select
            value={selectedVariant?.id || ''}
            onValueChange={(v) => {
              const variant = product.variants.find(vr => vr.id === v)
              setSelectedVariant(variant || null)
            }}
          >
            <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-none focus:ring-1 focus:ring-primary/20 text-xs font-bold uppercase tracking-tight">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-xl">
              {product.variants.map(variant => (
                <SelectItem key={variant.id} value={variant.id} className="text-xs uppercase font-medium rounded-lg">
                  {variant.name}{Number(variant.price) > 0 ? ` (+${formatPrice(Number(variant.price))})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* PRECIO Y ACCION */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
        <div className="text-right">
          <p className="text-xl font-black text-primary tracking-tight">{formatPrice(displayPrice)}</p>
        </div>

        <Button 
          onClick={() => handleAddToCart(product, selectedVariant || undefined)}
          className="h-11 px-6 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95 gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="font-bold uppercase tracking-widest text-[11px]">Añadir</span>
        </Button>
      </div>
    </motion.div>
  )
}
