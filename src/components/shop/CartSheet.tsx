import React, { useState, useEffect } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  History, 
  MessageCircle,
  AlertCircle,
  Loader2,
  Users,
  Fingerprint,
  Info,
  Store
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useUserStore } from '@/store/user'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { useConfig } from '@/hooks/use-config'
import { toast } from 'sonner'

export function CartSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore()
  const { isLoggedIn, user: loggedUser } = useUserStore()
  const { config } = useConfig()
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'payment' | 'success'>('cart')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bizum' | 'cash'>('card')
  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    dni: ''
  })
  
  const [processingPayment, setProcessingPayment] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showReturnsModal, setShowReturnsModal] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showDniInput, setShowDniInput] = useState(false)
  const [dniLogin, setDniLogin] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCheckoutStep('cart')
    }
  }, [isOpen])

  const handleNextStep = () => {
    if (checkoutStep === 'cart') {
      if (isLoggedIn && loggedUser) {
        // Rellenar datos automáticamente desde el perfil logueado
        setShippingData({
          firstName: loggedUser.name?.split(' ')[0] || '',
          lastName: loggedUser.name?.split(' ').slice(1).join(' ') || '',
          email: loggedUser.email || '',
          phone: loggedUser.phone || '',
          address: loggedUser.address || '',
          city: '', // Estos campos podrías guardarlos también en el store si quieres 100% autocompletado
          zipCode: '',
          dni: loggedUser.dni || ''
        })
        setCheckoutStep('payment') // SALTO DIRECTO AL PAGO
      } else {
        setIsAuthModalOpen(true)
      }
    } else if (checkoutStep === 'checkout') {
      if (!shippingData.firstName || !shippingData.lastName || !shippingData.email || !shippingData.address || !shippingData.dni) {
        toast.error("Por favor, rellena todos los campos obligatorios")
        return
      }
      setCheckoutStep('payment')
    }
  }

  const handleDniLogin = async () => {
    if (!dniLogin) {
      toast.error("Por favor, introduce tu DNI/NIE")
      return
    }
    
    try {
      const response = await fetch(`/api/customers/${dniLogin}`)
      if (response.ok) {
        const customer = await response.json()
        setShippingData({
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          zipCode: customer.zipCode || '',
          dni: customer.dni || dniLogin
        })
        toast.success(`¡Bienvenido de nuevo, ${customer.firstName}!`)
        setIsAuthModalOpen(false)
        setCheckoutStep('checkout')
      } else {
        toast.error("No hemos encontrado ningún cliente con ese DNI")
      }
    } catch (error) {
      toast.error("Error al buscar el cliente")
    }
  }

  const handleCardPayment = async () => {
    setProcessingPayment(true)
    // Simular delay de pasarela
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })),
        customer: shippingData,
        total: getTotal(),
        paymentMethod: paymentMethod,
        status: 'PAID'
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const order = await response.json()
        setTrackingCode(order.trackingCode)
        setCheckoutStep('success')
        clearCart()
      } else {
        toast.error("Error al procesar el pedido")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCashOrder = async () => {
    setProcessingPayment(true)
    
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          note: item.notes // Aseguramos que se envía como 'note' para que la API lo reciba bien
        })),
        customer: shippingData,
        total: getTotal(),
        paymentMethod: 'CASH',
        status: 'PENDING'
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const order = await response.json()
        setTrackingCode(order.trackingNumber || order.trackingCode) // Soportamos ambos nombres de campo
        setCheckoutStep('success')
        clearCart()
        toast.success("Pedido confirmado. Revisa tu email.")
      } else {
        toast.error("Error al procesar el pedido")
      }
    } catch (error) {
      toast.error("Error al crear el pedido")
    } finally {
      setProcessingPayment(false)
    }
  }

  const resetCheckout = () => {
    setCheckoutStep('cart')
    onClose()
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-[540px] p-0 flex flex-col border-none shadow-2xl bg-[#F8FAFC]">
          {/* Título oculto para accesibilidad (Radix UI) */}
          <SheetHeader className="sr-only">
            <SheetTitle>Carrito de Compras - Pujalte Creative Studio</SheetTitle>
          </SheetHeader>
          
          {/* Header persistente */}
          <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#4A7C59]/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-[#4A7C59]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Tu Pedido</h2>
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${checkoutStep === 'success' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {checkoutStep === 'cart' ? 'Revisión de Carrito' : 
                     checkoutStep === 'checkout' ? 'Datos de Envío' : 
                     checkoutStep === 'payment' ? 'Método de Pago' : '¡Completado!'}
                  </span>
                </div>
              </div>
            </div>
            
          </div>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {checkoutStep === 'cart' && (
                <motion.div 
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar"
                >
                  {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                        <ShoppingBag className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Tu carrito está vacío</h3>
                      <p className="text-slate-500 text-sm max-w-[240px] font-medium leading-relaxed">Cada foto es una historia por imprimir. ¿Añadimos alguna?</p>
                      <Button onClick={onClose} className="mt-8 bg-slate-900 rounded-xl px-8 h-12 font-black uppercase tracking-widest">Ver productos</Button>
                    </div>
                  ) : (
                    <>
                      <button onClick={onClose} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 hover:text-[#4A7C59] transition-colors group">
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Seguir Comprando
                      </button>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="group bg-white rounded-3xl p-4 border border-slate-100 hover:border-[#4A7C59]/20 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="flex gap-5">
                              <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-50 shrink-0 relative">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <ShoppingBag className="h-8 w-8 text-slate-200" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 py-1">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-black text-slate-900 truncate pr-4 text-base leading-tight uppercase tracking-tight">{item.name}</h4>
                                  <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                <p className="text-lg font-black text-[#4A7C59] mb-3">{formatCurrency(item.price)}</p>
                                <div className="flex items-center gap-4 bg-slate-50 w-fit p-1 rounded-xl border border-slate-100/50">
                                  <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 transition-all"><Minus className="h-3 w-3" /></button>
                                  <span className="text-sm font-black text-slate-900 w-4 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 transition-all"><Plus className="h-3 w-3" /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex flex-col gap-6 mb-8">
                          <div className="flex justify-between items-end">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">Total Pedido</span>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(getTotal())}</span>
                          </div>
                        </div>
                        <Button onClick={handleNextStep} className="w-full h-16 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-[2rem] font-black text-base uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(74,124,89,0.3)] transition-all duration-500">Continuar <ChevronRight className="ml-2 h-5 w-5" /></Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {checkoutStep === 'checkout' && (
                <motion.div 
                  key="checkout"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar"
                >
                  <button onClick={() => setCheckoutStep('cart')} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#4A7C59] mb-8 hover:opacity-70 transition-opacity"><ChevronLeft className="h-4 w-4" /> Volver al Carrito</button>
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight uppercase italic">Tus Datos</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                        <Input value={shippingData.firstName} onChange={(e) => setShippingData({...shippingData, firstName: e.target.value})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="Tu nombre" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellidos</Label>
                        <Input value={shippingData.lastName} onChange={(e) => setShippingData({...shippingData, lastName: e.target.value})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="Apellidos" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">DNI/NIE</Label>
                      <Input value={shippingData.dni} onChange={(e) => setShippingData({...shippingData, dni: e.target.value})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="12345678X" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                      <Input value={shippingData.email} onChange={(e) => setShippingData({...shippingData, email: e.target.value})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="nombre@ejemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dirección Completa</Label>
                      <Input value={shippingData.address} onChange={(e) => setShippingData({...shippingData, address: e.target.value})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="Calle, número, piso..." />
                    </div>
                    
                    <div className="pt-8 border-t border-slate-100 space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Info className="h-5 w-5 text-[#4A7C59] shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-[11px] font-medium text-slate-500 leading-relaxed">Al continuar, aceptas nuestra <button onClick={() => setShowPrivacyModal(true)} className="text-[#4A7C59] font-black underline">política de privacidad</button> y las <button onClick={() => setShowReturnsModal(true)} className="text-[#4A7C59] font-black underline">condiciones de devolución</button>.</p>
                        </div>
                      </div>
                      <Button onClick={handleNextStep} className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-base uppercase tracking-widest shadow-xl transition-all duration-500">Elegir Pago <ChevronRight className="ml-2 h-5 w-5" /></Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {checkoutStep === 'payment' && (
                <motion.div 
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar"
                >
                  <button onClick={() => setCheckoutStep('cart')} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#4A7C59] mb-8 hover:opacity-70 transition-opacity"><ChevronLeft className="h-4 w-4" /> Volver</button>
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight uppercase italic">Finalizar Pago</h3>

                  <div className="space-y-4 flex-1">
                    <button onClick={() => setPaymentMethod('card')} className={`w-full p-5 rounded-3xl border-2 transition-all duration-300 flex items-center justify-between group ${paymentMethod === 'card' ? 'border-[#4A7C59] bg-[#4A7C59]/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'bg-[#4A7C59] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}><CreditCard className="h-6 w-6" /></div>
                        <div className="text-left">
                          <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Tarjeta de Crédito</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pago seguro instantáneo</p>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'card' ? 'border-[#4A7C59] bg-[#4A7C59]' : 'border-slate-200 bg-white'}`}>{paymentMethod === 'card' && <div className="h-2 w-2 rounded-full bg-white" />}</div>
                    </button>

                    <button onClick={() => setPaymentMethod('bizum')} className={`w-full p-5 rounded-3xl border-2 transition-all duration-300 flex items-center justify-between group ${paymentMethod === 'bizum' ? 'border-[#00AACB] bg-[#00AACB]/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === 'bizum' ? 'bg-[#00AACB] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}><div className="font-black text-xs italic">BIZUM</div></div>
                        <div className="text-left">
                          <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Bizum</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rápido y cómodo</p>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'bizum' ? 'border-[#00AACB] bg-[#00AACB]' : 'border-slate-200 bg-white'}`}>{paymentMethod === 'bizum' && <div className="h-2 w-2 rounded-full bg-white" />}</div>
                    </button>

                    <button onClick={() => setPaymentMethod('cash')} className={`w-full p-5 rounded-3xl border-2 transition-all duration-300 flex items-center justify-between group ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === 'cash' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}><Store className="h-6 w-6" /></div>
                        <div className="text-left">
                          <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Solo Efectivo</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recoger en tienda</p>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-500' : 'border-slate-200 bg-white'}`}>{paymentMethod === 'cash' && <div className="h-2 w-2 rounded-full bg-white" />}</div>
                    </button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-end mb-8">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">Total a Pagar</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(getTotal())}</span>
                    </div>
                    <div className="flex justify-center">
                    <Button 
                      onClick={paymentMethod === 'cash' ? handleCashOrder : handleCardPayment}
                      disabled={processingPayment}
                      className={`w-full h-16 rounded-[2rem] font-black text-base uppercase tracking-widest shadow-xl transition-all duration-500 text-white ${paymentMethod === 'card' ? 'bg-[#4A7C59] hover:bg-[#3D6649]' : paymentMethod === 'bizum' ? 'bg-[#00AACB] hover:bg-[#008BA5]' : 'bg-orange-500 hover:bg-orange-600'}`}
                    >
                      {processingPayment ? (
                        <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> PROCESANDO...</>
                      ) : (
                        <>{paymentMethod === 'cash' ? <Store className="mr-3 h-6 w-6" /> : <CreditCard className="mr-3 h-6 w-6" />} PAGAR AHORA</>
                      )}
                    </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {checkoutStep === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-24 h-24 rounded-[2.5rem] bg-[#4A7C59] flex items-center justify-center mb-8 shadow-2xl shadow-[#4A7C59]/30 border-4 border-white animate-bounce-subtle">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase italic italic italic">¡Pedido Realizado!</h3>
                  <div className="h-1 w-12 bg-[#4A7C59] mx-auto rounded-full mb-6" />
                  <p className="text-slate-500 font-bold mb-8 leading-relaxed">Gracias por confiar en Pujalte Creative Studio.<br/>Tu número de seguimiento es:</p>
                  <div className="bg-slate-900 text-white px-8 py-5 rounded-3xl font-black text-2xl tracking-[0.3em] mb-12 shadow-inner border border-white/10 uppercase">{trackingCode}</div>
                  <Button onClick={resetCheckout} className="h-14 px-10 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all">Seguir Comprando</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>

      {/* MODALES LEGALES */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Política de Privacidad (LOPD)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed max-h-[400px] overflow-y-auto pr-2">
            <p><strong>Responsable:</strong> Pepe Pujalte Fotografía.</p>
            <p><strong>Finalidad:</strong> Gestionar la relación comercial, el procesamiento de pedidos y el envío de comunicaciones si han sido autorizadas.</p>
            <p><strong>Legitimación:</strong> Ejecución de un contrato y consentimiento del interesado.</p>
            <p><strong>Derechos:</strong> Podrá ejercer sus derechos de acceso, rectificación, limitación y suprimir los datos en apps@pujaltefotografia.es así como el derecho a presentar una reclamación ante una autoridad de control.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPrivacyModal(false)} className="bg-[#4A7C59] rounded-2xl">Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReturnsModal} onOpenChange={setShowReturnsModal}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Condiciones de Devolución</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed max-h-[400px] overflow-y-auto pr-2">
            <p className="font-bold text-slate-900">⚠️ IMPORTANTE:</p>
            <p>De acuerdo con la ley, el derecho de desistimiento no se aplica a productos personalizados.</p>
            <p>Por tanto, al tratarse de impresiones fotográficas personalizadas, no se admiten devoluciones salvo defecto de fabricación o error en el envío.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReturnsModal(false)} className="bg-[#4A7C59] rounded-2xl">Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[40px] p-0 border-none bg-white overflow-hidden shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Acceso al Pedido</DialogTitle>
          </DialogHeader>
          <div className="p-8 pt-10">
            <div className="mb-8 text-center text-center">
              <div className="h-20 w-20 rounded-[28px] bg-gradient-to-br from-[#4A7C59] to-[#3D664A] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#4A7C59]/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <Users className="h-10 w-10 text-white" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-tight mb-2">¡Bienvenido!</p>
              <DialogDescription className="text-slate-500 text-sm font-medium leading-relaxed max-w-[320px] mx-auto">
                ¿Has comprado antes con nosotros?
              </DialogDescription>
            </div>

            <div className="space-y-4">
              {!showDniInput ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsAuthModalOpen(false)
                      setCheckoutStep('checkout')
                    }}
                    className="w-full h-16 rounded-[24px] border-2 border-orange-100 hover:border-orange-500 hover:bg-orange-50 text-lg font-black uppercase text-orange-600 transition-all flex items-center justify-center px-8"
                  >
                    <span>Soy nuevo cliente</span>
                  </Button>

                  <Button 
                    onClick={() => setShowDniInput(true)}
                    className="w-full h-16 rounded-[24px] bg-[#4A7C59] hover:bg-[#3D664A] text-white text-lg font-black uppercase transition-all flex items-center justify-center px-8 shadow-lg shadow-[#4A7C59]/20"
                  >
                    <span>Ya he comprado antes</span>
                  </Button>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="relative group">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">DNI/NIE</Label>
                    <div className="relative">
                      <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#4A7C59]" />
                      <Input 
                        autoFocus
                        value={dniLogin}
                        onChange={(e) => setDniLogin(e.target.value)}
                        placeholder="12345678X"
                        className="pl-14 h-16 rounded-[24px] bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 focus-visible:border-[#4A7C59] text-lg font-bold transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleDniLogin()}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleDniLogin}
                    className="w-full h-16 rounded-[24px] bg-[#4A7C59] hover:bg-[#3D664A] text-white text-lg font-black uppercase transition-all shadow-[0_15px_30px_-10px_rgba(74,124,89,0.3)]"
                  >
                    Acceder
                  </Button>
                  <button 
                    onClick={() => setShowDniInput(false)}
                    className="w-full text-center text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Volver atrás
                  </button>
                </motion.div>
              )}
            </div>
            
            <p className="mt-8 text-[11px] text-center text-slate-400 font-medium leading-relaxed px-4">
              Si tienes problemas, contacta con nosotros por WhatsApp.
            </p>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-[#4A7C59]/0 via-[#4A7C59]/30 to-[#4A7C59]/0" />
        </DialogContent>
      </Dialog>
    </>
  )
}
