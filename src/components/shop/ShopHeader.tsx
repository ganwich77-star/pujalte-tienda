'use client'

import { Search, ShoppingBag, LayoutDashboard, Store, Ruler, Menu, X, Globe, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  
  const fixPath = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('data:')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  const handleAdminCheck = () => {
    const validPassword = config.adminPassword || 'admin123';
    if (adminPassword === validPassword) {
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
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Menú Móvil */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                  <Menu className="h-6 w-6 text-slate-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] flex flex-col p-8 rounded-r-[2.5rem] border-none shadow-2xl bg-white">
                <SheetHeader className="mb-8 flex items-center justify-between">
                  <SheetTitle className="text-left font-black text-2xl tracking-tighter">
                    Menú
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => { onBackToWeb(); setIsMobileMenuOpen(false); }}
                    className="justify-between h-14 rounded-2xl px-6 text-slate-600 hover:text-primary hover:bg-primary/5 font-bold group"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                      VOLVER A LA WEB
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={() => { onOpenSizeGuide(); setIsMobileMenuOpen(false); }}
                    className="justify-between h-14 rounded-2xl px-6 text-slate-600 hover:text-[#4A7C59] hover:bg-[#4A7C59]/5 font-bold group"
                  >
                    <div className="flex items-center gap-3">
                      <Ruler className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity text-[#4A7C59]" />
                      GUÍA DE MEDIDAS
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </Button>

                  <Separator className="my-4 opacity-10" />

                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Ayuda y Contacto</p>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                      ¿Tienes dudas con tu pedido? contacta por WhatsApp desde el botón flotante.
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-50">
                   <div className="flex items-center gap-3 grayscale opacity-30 px-2">
                     <img src={fixPath(config.logo || "/logo_ia.png")} alt="Logo" className="h-6 w-auto" />
                     <span className="text-[10px] font-black tracking-widest uppercase">Premium Store</span>
                   </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsAdmin(false)}>
            <img src={fixPath(config.logo || "/logo_ia.png")} alt="Logo" className="h-8 sm:h-10 w-auto" />
          </div>

          <button 
            onClick={onBackToWeb}
            className="text-xs text-muted-foreground hover:text-primary transition-colors hidden lg:block border-l pl-4 font-medium"
          >
            Volver a la Web
          </button>
        </div>

        {/* Buscador de escritorio */}
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

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Buscador móvil - Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden rounded-full h-10 w-10 text-slate-600"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* GUÍA DE MEDIDAS - ESCRITORIO */}
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
            className={`rounded-full h-10 w-10 shadow-sm transition-all duration-500 ${isAdmin ? 'bg-[#4A7C59] text-white hover:bg-[#4A7C59]/90 rotate-0' : 'hover:bg-slate-100 text-slate-600'}`}
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
                  <Button variant="outline" size="icon" className="relative h-10 w-10 rounded-full border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-white">
                    <ShoppingBag className="h-5 w-5 text-slate-600" />
                    <AnimatePresence>
                      {cartCount > 0 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Badge className="h-5 min-w-[20px] px-1.5 flex items-center justify-center font-black text-[10px] text-white bg-red-600 hover:bg-red-600 border-none shadow-lg shadow-red-500/30">
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
            <Button variant="outline" onClick={() => setIsAdmin(false)} className="rounded-full h-10 px-4 gap-2 border-[#4A7C59]/20 hover:bg-[#4A7C59]/5 text-[#4A7C59] font-bold border-2 hidden sm:flex">
              <Store className="h-4 w-4" /> Ver Tienda
            </Button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda móvil expansible */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden sm:hidden border-t bg-white"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  autoFocus
                  type="search" 
                  placeholder="¿Qué estás buscando?..." 
                  className="pl-10 h-10 bg-slate-50 border-0 rounded-xl focus-visible:ring-1 transition-all" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


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
