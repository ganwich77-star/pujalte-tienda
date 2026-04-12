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
  UserCircle,
  X,
  CreditCard,
  CheckCircle2,
  Mail,
  Phone
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
  qrMode?: boolean
}

export function ShopHeader({
  config, isAdmin, setIsAdmin, searchQuery, 
  setSearchQuery, cartCount, formatPrice,
  isCartOpen, setIsCartOpen, onBackToWeb,
  onOpenSizeGuide, qrMode = false
}: ShopHeaderProps) {
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isError, setIsError] = useState(false)
  
  // LOGIN GLOBAL STATE (vía useUserStore)
  const { isLoggedIn, user, login, logout, isLoginModalOpen, setIsLoginModalOpen } = useUserStore()
  const [loginDni, setLoginDni] = useState('')
  const [loginName, setLoginName] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [hasClosedThisSession, setHasClosedThisSession] = useState(false)
  
  // REGISTRO Y VISTA DUAL
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Si no está logueado, NO estamos en modo QR y NO ha cerrado el aviso en ESTA sesión, lo mostramos
    if (!isLoggedIn && !hasClosedThisSession && !qrMode) {
      // Pequeño delay para que no aparezca de golpe al cargar
      const timer = setTimeout(() => {
        setIsFirstVisit(true)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setIsFirstVisit(false)
    }
  }, [isLoggedIn, hasClosedThisSession, qrMode])
  
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginDni || !loginName || !registerEmail) {
      setLoginError("RELLENA NOMBRE, DNI Y EMAIL")
      return
    }

    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const response = await fetch('/api/clients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: loginDni.trim().toUpperCase(),
          name: loginName.trim().toUpperCase(),
          email: registerEmail.trim().toLowerCase(),
          phone: registerPhone.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        // LOGIN AUTOMÁTICO
        login({
          dni: loginDni.trim().toUpperCase(),
          name: loginName.trim().toUpperCase(),
          email: registerEmail.trim().toLowerCase(),
          phone: registerPhone.trim()
        })
        setIsLoginModalOpen(false)
        toast({
          title: "¡REGISTRO COMPLETADO!",
          description: "Ya puedes realizar tus pedidos.",
        })
      } else {
        setLoginError(data.error || "ERROR AL REGISTRAR")
      }
    } catch (e) {
      console.error('Error on register:', e)
      setLoginError("ERROR DE CONEXIÓN")
    } finally {
      setIsLoggingIn(false)
    }
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginDni || !loginName || isLoggingIn) return

    setIsLoggingIn(true)
    setLoginError(null)
    const normalizedDni = loginDni.trim().toUpperCase()
    const normalizedName = loginName.trim().toUpperCase()
    
    try {
      // Pasamos tanto el DNI como el NOMBRE a la API para verificar ambos
      const res = await fetch(`/api/clients/check-cash?dni=${encodeURIComponent(normalizedDni)}&name=${encodeURIComponent(normalizedName)}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Login Result:', data) // DEPURALOG: Ver respuesta del servidor
        
        if (data.exists) {
          if (data.errorType === 'NAME_MISMATCH') {
            setLoginError("EL NOMBRE NO COINCIDE CON EL REGISTRADO")
          } else {
            login({
              email: data.dni,
              name: data.fullName || loginName.trim(),
              dni: data.dni,
              cashEnabled: !!data.cashEnabled
            })
            setIsLoginModalOpen(false)
            setLoginDni('')
            setLoginName('')
            
            toast({
              title: "ACCESO CORRECTO",
              description: `BIENVENID@ ${data.fullName || loginName}`,
              className: "bg-white border-primary shadow-xl",
              duration: 3000,
            })
          }
        } else {
          setLoginError("DNI NO ENCONTRADO EN LA BASE DE DATOS")
        }
      } else {
        throw new Error('Error en la verificación')
      }
    } catch (e) { 
      console.error('Error in login flow:', e)
      setLoginError("ERROR DE CONEXIÓN CON EL SERVIDOR")
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm px-4">
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
              <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </Sheet>
          ) : (
            <Button variant="outline" onClick={() => setIsAdmin(false)} className="rounded-full h-10 px-4 gap-2 border-[#4A7C59]/20 hover:bg-[#4A7C59]/5 text-[#4A7C59] font-bold border-2 hidden sm:flex">
              <Store className="h-4 w-4" /> Ver Tienda
            </Button>
          )}

          {mounted && (
            <div className="flex items-center">
              {!isLoggedIn ? (
                <div className="relative">
                  <Popover open={isFirstVisit} onOpenChange={setIsFirstVisit}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size={isFirstVisit ? "default" : "icon"}
                        className={cn(
                          "h-10 rounded-full transition-all duration-500 relative flex items-center gap-2",
                          isFirstVisit 
                            ? "bg-[#4A7C59] text-white hover:bg-[#3D6649] px-4 shadow-lg shadow-[#4A7C59]/30 animate-pulse ring-4 ring-[#4A7C59]/20" 
                            : "w-10 hover:bg-slate-100 text-slate-600"
                        )}
                        onClick={() => {
                          setIsLoginModalOpen(true)
                          setIsFirstVisit(false)
                        }}
                      >
                        <User className={cn("h-5 w-5", isFirstVisit ? "animate-bounce" : "")} />
                        {isFirstVisit && <span className="text-[10px] font-black uppercase tracking-widest translate-y-[0.5px]">IDENTIFÍCATE</span>}
                        
                        {!isFirstVisit && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A7C59] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4A7C59]"></span>
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-4 rounded-[1.5rem] shadow-2xl border-none bg-[#4A7C59] text-white mt-4 z-[200] animate-in fade-in zoom-in duration-500 origin-top" align="end">
                      <div className="relative space-y-3 flex flex-col items-center text-center">
                        <div className="absolute -top-11 right-3 w-6 h-6 bg-[#4A7C59] rotate-45 transform origin-bottom-left" />
                        
                        <div className="flex flex-col items-center gap-2">
                          <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-md">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] leading-none">¡Empieza por aquí!</h4>
                        </div>
                        
                        <p className="text-[10px] font-medium leading-relaxed opacity-90 px-0.5">
                          Identifícate con tu **DNI y Nombre** para poder realizar pedidos y disfrutar de una experiencia personalizada.
                        </p>
                        <Button 
                          variant="secondary" 
                          className="w-full bg-white text-[#4A7C59] hover:bg-slate-50 font-black text-[9px] uppercase tracking-[0.15em] h-10 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/5"
                          onClick={() => {
                            setIsFirstVisit(false)
                            setHasClosedThisSession(true)
                            setIsLoginModalOpen(true)
                          }}
                        >
                          ENTENDIDO
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
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

    </header>
    
    {/* LOGIN MODAL (USANDO DIALOG PARA EVITAR BLOQUEO DE FOCO) */}
    <Dialog 
      open={isLoginModalOpen} 
      onOpenChange={(open) => {
        setIsLoginModalOpen(open)
        if (!open) {
          setHasClosedThisSession(true)
          setIsFirstVisit(false)
        }
      }}
    >
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[360px]">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 0 }}
          animate={loginError ? { 
            scale: 1, 
            opacity: 1, 
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.4 }
          } : { 
            scale: 1, 
            opacity: 1, 
            x: 0 
          }}
          className="bg-white w-full rounded-[2rem] shadow-2xl relative overflow-hidden p-6"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[#4A7C59]" />
          
          <div className="space-y-3 text-center mb-6 mt-2">
            <div className="h-12 w-12 bg-[#4A7C59]/5 rounded-2xl flex items-center justify-center mx-auto mb-1 ring-4 ring-white shadow-sm">
              <User className="h-6 w-6 text-[#4A7C59]" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight uppercase text-center">
              {authView === 'login' ? 'IDENTIFICARSE' : 'COMENZAR AQUÍ'}
            </DialogTitle>
            <p className="text-[11px] text-slate-500 font-bold px-2 uppercase tracking-tight leading-relaxed">
              {authView === 'login' ? 'ACCESO CON DNI / NIE' : 'REGÍSTRATE EN UN PASO'}
            </p>
          </div>

          <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="space-y-3">
            <div className="relative group">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4A7C59]" />
              <Input
                placeholder="TU NOMBRE COMPLETO..."
                required
                value={loginName}
                onChange={(e) => setLoginName(e.target.value.toUpperCase().trimStart())}
                onBlur={(e) => setLoginName(e.target.value.trim())}
                className="h-11 rounded-xl pl-10 bg-slate-50 border-0 font-black text-xs focus-visible:ring-1 focus-visible:ring-[#4A7C59]/20 uppercase"
              />
            </div>
            <div className="relative group">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4A7C59]" />
              <Input
                placeholder="TU DNI O NIE..."
                required
                value={loginDni}
                onChange={(e) => {
                  setLoginDni(e.target.value.toUpperCase().trim())
                  setLoginError(null)
                }}
                className={cn(
                  "h-11 rounded-xl pl-10 bg-slate-50 border-0 font-black text-xs focus-visible:ring-1 uppercase",
                  loginError ? "ring-2 ring-red-500/50 bg-red-50" : "focus-visible:ring-[#4A7C59]/20"
                )}
              />
            </div>

            <AnimatePresence>
              {authView === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="space-y-3 overflow-hidden"
                >
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4A7C59]" />
                    <Input
                      type="email"
                      placeholder="TU EMAIL..."
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value.toLowerCase())}
                      className="h-11 rounded-xl pl-10 bg-slate-50 border-0 font-black text-xs focus-visible:ring-1 focus-visible:ring-[#4A7C59]/20 uppercase"
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4A7C59]" />
                    <Input
                      placeholder="TU TELÉFONO..."
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      className="h-11 rounded-xl pl-10 bg-slate-50 border-0 font-black text-xs focus-visible:ring-1 focus-visible:ring-[#4A7C59]/20 uppercase"
                    />
                  </div>
                </motion.div>
              )}

              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-[9px] text-red-600 font-black uppercase tracking-widest bg-red-50 py-2 px-3 rounded-lg border border-red-100 italic">
                    {loginError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="pt-4 space-y-3 text-center">
              <Button 
                type="submit"
                disabled={!loginDni || !loginName || (authView === 'register' && !registerEmail) || isLoggingIn}
                className="w-full h-11 rounded-xl bg-[#4A7C59] hover:bg-[#3D6649] text-white font-black tracking-widest uppercase shadow-lg shadow-[#4A7C59]/20 text-xs"
              >
                {isLoggingIn ? 'PROCESANDO...' : (authView === 'login' ? 'ACCEDER' : 'COMPLETAR REGISTRO')}
              </Button>

              <div className="pt-2">
                <p className="text-[9px] text-[#4A7C59] font-black uppercase tracking-[0.2em] italic mb-4 opacity-70">
                  La tecnología al servicio de los recuerdos.
                </p>
                
                <div className="h-[1px] w-full bg-slate-100 mb-6" />

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                        setAuthView(authView === 'login' ? 'register' : 'login')
                        setLoginError(null)
                    }}
                    className="text-[10px] font-black text-[#4A7C59] uppercase tracking-widest hover:underline block w-full text-center active:scale-95 transition-all outline-none"
                  >
                    {authView === 'login' ? '¿Aún no tienes cuenta? Regístrate aquí' : 'Ya tengo cuenta, quiero entrar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                        setIsLoginModalOpen(false)
                        setHasClosedThisSession(true)
                        setIsFirstVisit(false)
                    }}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-[#4A7C59] block w-full text-center transition-colors outline-none"
                  >
                    Solo quiero echar un vistazo
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>

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
    </>
  )
}
