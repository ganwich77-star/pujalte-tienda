'use client'

import { useRef, useEffect } from 'react'
import { Category } from '@/types'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LayoutGrid, Camera, Image, Gift, Palette, Shirt, Bookmark, Box, ChevronLeft, ChevronRight } from 'lucide-react'

interface CategoryBarProps {
  categories: Category[]
  selectedCategoryId: string | null
  onCategorySelect: (id: string | null) => void
}

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes('foto') || n.includes('impresion')) return <Camera className="h-4 w-4" />
  if (n.includes('cuadro') || n.includes('lienzo')) return <Image className="h-4 w-4" />
  if (n.includes('regalo') || n.includes('detalle')) return <Gift className="h-4 w-4" />
  if (n.includes('album') || n.includes('libro')) return <Bookmark className="h-4 w-4" />
  if (n.includes('ropa') || n.includes('textil')) return <Shirt className="h-4 w-4" />
  if (n.includes('madera')) return <Palette className="h-4 w-4" />
  return <Box className="h-4 w-4" />
}

export function CategoryBar({ categories, selectedCategoryId, onCategorySelect }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollInterval = useRef<NodeJS.Timeout | null>(null)

  const startScrolling = (direction: 'left' | 'right') => {
    if (scrollInterval.current) return
    scrollInterval.current = setInterval(() => {
      if (scrollRef.current) {
        const scrollAmount = direction === 'left' ? -10 : 10
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'auto' })
      }
    }, 16) // ~60fps
  }

  const stopScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current)
      scrollInterval.current = null
    }
  }

  useEffect(() => {
    return () => stopScrolling()
  }, [])

  return (
    <div className="sticky top-[65px] z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/40 py-4 mb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="relative group/bar flex items-center">
          
          {/* AUTO-SCROLL ZONES */}
          <div 
            onMouseEnter={() => startScrolling('left')} 
            onMouseLeave={stopScrolling}
            className="absolute left-0 top-0 bottom-0 w-16 z-30 cursor-pointer flex items-center justify-start pl-1 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-gradient-to-r from-background to-transparent pointer-events-auto"
          >
            <ChevronLeft className="h-5 w-5 text-primary animate-pulse" />
          </div>

          <div 
            onMouseEnter={() => startScrolling('right')} 
            onMouseLeave={stopScrolling}
            className="absolute right-0 top-0 bottom-0 w-16 z-30 cursor-pointer flex items-center justify-end pr-1 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-gradient-to-l from-background to-transparent pointer-events-auto"
          >
            <ChevronRight className="h-5 w-5 text-primary animate-pulse" />
          </div>
          
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto no-scrollbar gap-2 pb-1 scroll-smooth px-8"
          >
            <button
              onClick={() => onCategorySelect(null)}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
                selectedCategoryId === null 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Todos
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
                  selectedCategoryId === cat.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {getCategoryIcon(cat.name)}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
