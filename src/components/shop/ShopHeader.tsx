'use client'

import { Search, ShoppingBag, LayoutDashboard, Store, Ruler } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { CartSheet } from './CartSheet'
import { SizeGuide } from './SizeGuide'
import { StoreConfig } from '@/types'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"


interface ShopHeaderProps {
  config: StoreConfig
  isAdmin: boolean
  setIsAdmin: (admin: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  cartCount: number
  formatPrice: (price: number) => string
  onOpenSizeGuide: () => void
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  onBackToWeb: () => void
}

export function ShopHeader({
  config, isAdmin, setIsAdmin, searchQuery, 
  setSearchQuery, cartCount, formatPrice,
  isCartOpen, setIsCartOpen, onBackToWeb,
  onOpenSizeGuide
}: ShopHeaderProps) {
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isError, setIsError] = useState(false)
  
  const fixPath = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('data:')) return path
    const basePath = '/'
    let cleanPath = path
    if (cleanPath.startsWith(basePath)) cleanPath = cleanPath.slice(basePath.length)
    if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`
    return `${basePath}${cleanPath}`
  }

  const handleAdminCheck = () => {
    if (adminPassword === 'admin123') {
      setIsAdmin(true)
      setIsAdminDialogOpen(false)
      setAdminPassword('')
      setIsError(false)
    } else {
      setIsError(true)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm px-4">
      <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsAdmin(false)}>
            <img src={fixPath(config.logo || "/logo_ia.png")} alt="Logo" className="h-10 w-auto" />
          </div>
          <button 
            onClick={onBackToWeb}
            className="text-xs text-muted-foreground hover:text-primary transition-colors hidden lg:block border-l pl-4 font-medium"
          >
            Volver a la Web
          </button>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              type="search" 
              placeholder="¿Qué estás buscando?..." 
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* GUÍA DE MEDIDAS - BOTÓN GIGANTE */}
          {!isAdmin && (
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 border-2 border-[#4A7C59]/20 hover:border-[#4A7C59] hover:bg-[#4A7C59]/5 text-[#4A7C59] font-black tracking-tighter transition-all h-10 px-4 rounded-xl shadow-sm"
              onClick={() => onOpenSizeGuide()}
            >
              <Ruler className="h-4 w-4" />
              GUÍA DE MEDIDAS
            </Button>
          )}

          <Button
            variant={isAdmin ? "default" : "ghost"}
            size="icon"
            className={`rounded-full shadow-sm transition-all duration-500 ${isAdmin ? 'bg-[#4A7C59] text-white hover:bg-[#4A7C59]/90 rotate-0' : 'hover:bg-slate-100'}`}
            onClick={() => isAdmin ? setIsAdmin(false) : setIsAdminDialogOpen(true)}
          >
            {isAdmin ? <LayoutDashboard className="h-5 w-5 animate-pulse" /> : <LayoutDashboard className="h-5 w-5" />}
          </Button>

          {!isAdmin ? (
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <motion.div
                  key={cartCount}
                  initial={cartCount > 0 ? { scale: 1.2 } : {}}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Button variant="outline" size="icon" className="relative rounded-full border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                    <ShoppingBag className="h-5 w-5" />
                    <AnimatePresence>
                      {cartCount > 0 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-2 -right-2"
                        >
                          <Badge className="h-5 min-w-[20px] px-1.5 flex items-center justify-center font-black text-white bg-red-600 hover:bg-red-600 border-none shadow-lg shadow-red-500/30">
                            {cartCount}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </SheetTrigger>
              <CartSheet config={config} formatPrice={formatPrice} onClose={() => setIsCartOpen(false)} />
            </Sheet>
          ) : (
            <Button variant="outline" onClick={() => setIsAdmin(false)} className="rounded-full gap-2 border-[#4A7C59]/20 hover:bg-[#4A7C59]/5 text-[#4A7C59] font-bold border-2">
              <Store className="h-4 w-4" /> Ver Tienda
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isAdminDialogOpen} onOpenChange={(open) => {
        setIsAdminDialogOpen(open)
        if (!open) {
          setAdminPassword('')
          setIsError(false)
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl">
          <DialogHeader className="space-y-4">
            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Modo Administrador</DialogTitle>
            <DialogDescription className="text-center">
              Introduce la contraseña de gestión para acceder al panel de control de la tienda.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Contraseña de acceso"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value)
                  setIsError(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminCheck()
                }}
                className={`h-12 rounded-xl text-center text-lg tracking-widest bg-muted/30 border-0 focus-visible:ring-2 ${isError ? 'ring-2 ring-red-500' : ''}`}
              />
              {isError && (
                <p className="text-xs text-red-500 text-center font-bold animate-pulse">
                  Contraseña incorrecta. Inténtalo de nuevo.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button 
              type="button" 
              onClick={handleAdminCheck}
              className="w-full h-12 rounded-xl font-bold tracking-widest uppercase shadow-lg shadow-primary/20"
            >
              Acceder al Panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>

  )
}
