'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/store/user'
import { 
  Search, 
  ShoppingBag, 
  LayoutDashboard, 
  Store, 
  Ruler, 
  ChevronLeft,
  User,
  LogOut,
  Mail,
  UserCircle,
  X,
  CreditCard,
  CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CartSheet } from './CartSheet'
import { StoreConfig } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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
  
  // LOGIN CUSTOM STATE (DNI/NIE)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginDni, setLoginDni] = useState('')
  const [loginName, setLoginName] = useState('')
  
  const { isLoggedIn, user, login, logout } = useUserStore()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginDni || !loginName) return

    const normalizedDni = loginDni.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // Obtener información adicional del cliente si existe (como el pago en efectivo)
    let cashEnabled = false
    try {
      const res = await fetch(`/api/clients/check-cash?dni=${normalizedDni}`)
      if (res.ok) {
        const data = await res.json()
        cashEnabled = !!data.cashEnabled
      }
    } catch (e) { 
      console.error('Error fetching cash status:', e) 
    }

    login(normalizedDni, loginName, cashEnabled)
    setIsLoginModalOpen(false)
    setLoginDni('')
    setLoginName('')
    
    toast({
      title: "¡Bienvenido/a!",
      description: `Hola ${loginName}, te has identificado correctamente.`,
    })
  }

  return (
    <header className="sticky top-0 z-[100] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm px-4">
      <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto">
        {/* LOGO & WEB BUTTON */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsAdmin(false)}>
            <img src={fixPath(config.logo || "/logo_ia.png")} alt="Logo" className="h-8 sm:h-10 w-auto" />
          </div>

          <Button 
            variant="ghost"
            onClick={onBackToWeb}
            className="h-9 sm:h-10 px-2 sm:px-3 text-[10px] sm:text-xs text-[#4A7C59] hover:text-[#4A7C59] hover:bg-[#4A7C59]/5 font-black uppercase tracking-tighter border-l border-slate-100 rounded-none rounded-r-xl gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-60" />
            <span>WEB</span>
          </Button>
        </div>

        {/* SEARCH */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#4A7C59] transition-colors" />
            <Input 
              type="search" 
              placeholder="¿Qué estás buscando?..." 
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 transition-all h-9 sm:h-10 text-[11px] sm:text-xs" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!isAdmin && (
            <Button
              variant="outline"
              className="flex items-center gap-2 border-2 border-[#4A7C59]/20 hover:border-[#4A7C59] hover:bg-[#4A7C59]/5 text-[#4A7C59] font-black tracking-tighter transition-all h-9 sm:h-10 px-2 sm:px-4 rounded-xl shadow-sm whitespace-nowrap"
              onClick={() => onOpenSizeGuide()}
            >
              <Ruler className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">GUÍA DE MEDIDAS</span>
              <span className="xs:hidden">GUÍA</span>
            </Button>
          )}

          <Button
            variant={isAdmin ? "default" : "ghost"}
            size="icon"
            className={`rounded-full h-10 w-10 shadow-sm transition-all duration-500 ${isAdmin ? 'bg-[#4A7C59] text-white hover:bg-[#4A7C59]/90' : 'hover:bg-slate-100 text-slate-600'}`}
            onClick={() => isAdmin ? setIsAdmin(false) : setIsAdminDialogOpen(true)}
          >
            <LayoutDashboard className="h-5 w-5" />
          </Button>

          {!isAdmin ? (
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <div className="relative cursor-pointer">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-primary/20 hover:border-primary transition-all duration-300 bg-white">
                    <ShoppingBag className="h-5 w-5 text-slate-600" />
                    <AnimatePresence mode="wait">
                      {cartCount > 0 && (
                        <motion.div
                          key="cart-badge"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Badge className="h-5 min-w-[20px] px-1.5 flex items-center justify-center font-black text-[10px] text-white bg-red-600 border-none shadow-lg">
                            {cartCount}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </SheetTrigger>
              <CartSheet config={config} formatPrice={formatPrice} onClose={() => setIsCartOpen(false)} />
            </Sheet>
          ) : (
            <Button variant="outline" onClick={() => setIsAdmin(false)} className="rounded-full h-10 px-4 gap-2 border-[#4A7C59]/20 hover:bg-[#4A7C59]/5 text-[#4A7C59] font-bold border-2 hidden sm:flex">
              <Store className="h-4 w-4" /> Ver Tienda
            </Button>
          )}

          {mounted && (
            <div className="flex items-center">
              {!isLoggedIn ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full hover:bg-slate-100 text-slate-600 transition-all duration-300"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  <User className="h-5 w-5" />
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#4A7C59]/5 border border-[#4A7C59]/10 rounded-full pl-2.5 pr-1 h-9 shadow-sm">
                   <div className="flex flex-col items-end -space-y-0.5">
                      <span className="text-[10px] font-black text-[#4A7C59] uppercase transition-all tracking-tight opacity-70">HOLA</span>
                      <span className="text-[11px] font-black text-slate-900 truncate max-w-[65px] sm:max-w-[100px] uppercase tracking-tighter">
                        {user?.name?.split(' ')[0]}
                      </span>
                   </div>
                   <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-[#4A7C59] text-white hover:bg-[#3D6649] transition-all duration-300 ring-2 ring-white"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4 rounded-2xl shadow-2xl border-white/20 bg-white/95 backdrop-blur-xl mt-2 z-[200]" align="end">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#4A7C59]/10 flex items-center justify-center text-[#4A7C59]">
                              <UserCircle className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-black text-slate-900 leading-tight truncate uppercase">
                                {user?.name || 'Usuario'}
                              </span>
                              <span className="text-[10px] text-slate-500 leading-tight truncate">
                                DNI: {user?.email}
                              </span>
                            </div>
                          </div>
                          <Separator className="bg-slate-100" />
                          <Button 
                            variant="ghost" 
                            onClick={logout}
                            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-2 h-9 text-xs font-bold gap-2"
                          >
                            <LogOut className="h-4 w-4" />
                            CERRAR SESIÓN
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LOGIN MODAL (CENTRADO TOTAL EN VENTANA DEL NAVEGADOR) */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 min-h-[100dvh]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 0 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 0 }}
              className="bg-white w-full max-w-[360px] rounded-[2rem] shadow-2xl relative overflow-hidden p-6 z-[1000000]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#4A7C59]" />
              
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-3 text-center mb-6 mt-2">
                <div className="h-12 w-12 bg-[#4A7C59]/5 rounded-2xl flex items-center justify-center mx-auto mb-1 ring-4 ring-white shadow-sm">
                  <User className="h-6 w-6 text-[#4A7C59]" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">IDENTIFICARSE</h2>
                <p className="text-[11px] text-slate-500 font-bold px-2 uppercase tracking-tight leading-relaxed">
                  ACCESO CON DNI / NIE
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative group">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4A7C59]" />
                  <Input
                    placeholder="TU NOMBRE COMPLETO..."
                    required
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value.toUpperCase())}
                    className="h-11 rounded-xl pl-10 bg-slate-50 border-0 font-black text-xs focus-visible:ring-1 focus-visible:ring-[#4A7C59]/20 uppercase"
                  />
                </div>
                <div className="relative group">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4A7C59]" />
                  <Input
                    placeholder="TU DNI O NIE..."
                    required
                    value={loginDni}
                    onChange={(e) => setLoginDni(e.target.value)}
                    className="h-11 rounded-xl pl-10 bg-slate-50 border-0 font-black text-xs focus-visible:ring-1 focus-visible:ring-[#4A7C59]/20 uppercase"
                  />
                </div>
                
                <div className="pt-4 space-y-3 text-center">
                  <Button 
                    type="submit"
                    disabled={!loginDni || !loginName}
                    className="w-full h-11 rounded-xl bg-[#4A7C59] hover:bg-[#3D6649] text-white font-black tracking-widest uppercase shadow-lg shadow-[#4A7C59]/20 text-xs"
                  >
                    ACCEDER
                  </Button>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    SESIÓN PERSISTENTE
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ADMIN DIALOG - PREMIUM DESIGN */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="h-16 w-16 bg-[#4A7C59]/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <LayoutDashboard className="h-8 w-8 text-[#4A7C59]" />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-gray-900 tracking-tight uppercase">Modo Administrador</DialogTitle>
            <div className="text-center text-gray-500 font-medium leading-relaxed text-sm">
              Introduce la contraseña de gestión para acceder al panel de control de la tienda.
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-6">
            <div className="relative group">
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
                className={cn(
                  "h-14 rounded-2xl bg-slate-50 border-0 font-bold text-center text-lg tracking-widest focus-visible:ring-2 transition-all",
                  isError ? "focus-visible:ring-red-500 bg-red-50" : "focus-visible:ring-[#4A7C59]/20"
                )}
                autoFocus
              />
              {isError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-red-500 font-black uppercase tracking-widest text-center mt-2"
                >
                  Contraseña incorrecta
                </motion.p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button 
              onClick={handleAdminCheck}
              className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all w-full"
            >
              Entrar al Panel
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setIsAdminDialogOpen(false)}
              className="h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 transition-all w-full"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </header>
  )
}
