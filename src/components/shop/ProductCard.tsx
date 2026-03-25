'use client'
import { motion } from 'framer-motion'

import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductVariant, StoreConfig } from '@/types'

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

  const displayPrice = selectedVariant ? (Number(product.price) + Number(selectedVariant.price)) : product.price
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock

  // Helper para arreglar rutas con el basePath de Hostinger
  const fixPath = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('data:')) return path
    let cleanPath = path.replace('/pujaltefotografia', '')
    if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`
    return `/pujaltefotografia${cleanPath}`
  }

  const [showFullDescription, setShowFullDescription] = useState(false)

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/20">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {config.showImages && product.image ? (
            <img 
              src={fixPath(product.image)} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {product.category && (
            <Badge variant="secondary" className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm border-none shadow-sm">{product.category.name}</Badge>
          )}
          {product.hasVariants && (
            <Badge variant="outline" className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm border-primary/20 text-primary font-bold">
              {product.variantType || 'Opciones'}
            </Badge>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold tracking-tight">{product.name}</CardTitle>
          <CardDescription 
            onClick={() => setShowFullDescription(!showFullDescription)}
            className={`${showFullDescription ? '' : 'line-clamp-2'} text-xs italic cursor-pointer hover:text-primary transition-colors`}
            title="Click para leer más"
          >
            {product.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          {product.hasVariants && product.variants.length > 0 && (
            <div className="mb-4">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 block">
                {product.variantType || 'Seleccionar'}:
              </Label>
              <Select
                value={selectedVariant?.id || ''}
                onValueChange={(v) => {
                  const variant = product.variants.find(vr => vr.id === v)
                  setSelectedVariant(variant || null)
                }}
              >
                <SelectTrigger className="w-full h-9 rounded-lg bg-muted/40 border-none text-xs font-semibold">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                  {product.variants.map(variant => (
                    <SelectItem key={variant.id} value={variant.id} className="text-xs font-medium rounded-lg">
                      {variant.name} — {formatPrice(Number(product.price) + Number(variant.price))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-2xl font-black text-primary tracking-tighter">{formatPrice(displayPrice)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            className="w-full h-11 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all font-bold uppercase tracking-widest text-[11px] gap-2" 
            onClick={() => handleAddToCart(product, selectedVariant || undefined)}
          >
            <Plus className="h-4 w-4" /> Añadir al carrito
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
