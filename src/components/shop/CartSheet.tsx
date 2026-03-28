'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  Package, 
  Trash2, 
  Minus, 
  Plus, 
  MessageCircle, 
  CreditCard, 
  Loader2, 
  CheckCircle2, 
  Banknote, 
  Smartphone,
  User, 
  Phone as PhoneIcon, 
  Mail as MailIcon, 
  MapPin, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  CreditCard as CardIcon,
  ShieldCheck,
  PackageCheck,
  Upload,
  Image as ImageIcon,
  Fingerprint,
  LogIn,
  Search,
  Users,
  AlertTriangle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db, COLLECTIONS } from '@/lib/firebase'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCartStore } from '@/store/cart'
import { StoreConfig } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface CartSheetProps {
  config: StoreConfig
  formatPrice: (price: number) => string
  onClose: () => void
}

export function CartSheet({ config, formatPrice, onClose }: CartSheetProps) {
  const { items, removeItem, updateQuantity, updateItem, clearCart, getTotal, getItemCount } = useCartStore()
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'payment' | 'success'>('cart')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)

  const handleFileUpload = async (itemId: string, variantId: string | undefined, notes: string | undefined, file: File) => {
    const itemKey = `${itemId}-${variantId || 'default'}-${notes || 'no-notes'}`
    setUploadingItem(itemKey)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (data.success) {
        updateItem(itemId, variantId, notes, { 
          fileUrl: data.url, 
          fileName: file.name 
        })
        toast({
          title: "¡Foto subida!",
          description: "La imagen se ha adjuntado correctamente al producto.",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast({
        title: "Error al subir",
        description: "No se pudo subir la imagen. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setUploadingItem(null)
    }
  }

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bizum' | 'card'>('card')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [trackingCode, setTrackingCode] = useState<string | null>(null)
  
  // Persistence state
  const [isReturning, setIsReturning] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [dniLogin, setDniLogin] = useState('')
  const [showDniInput, setShowDniInput] = useState(false)
  const [cashEnabled, setCashEnabled] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showReturnsModal, setShowReturnsModal] = useState(false)

  // Escuchar cambios en el cliente para activar el pago en efectivo en tiempo real
  useEffect(() => {
    const dni = formData['dni']?.trim().toUpperCase();
    if (!dni || dni.length < 8) return;

    const unsub = onSnapshot(doc(db, COLLECTIONS.CLIENTS, dni), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.cashEnabled !== cashEnabled) {
          setCashEnabled(!!data.cashEnabled);
        }
      }
    });

    return () => unsub();
  }, [formData['dni'], cashEnabled]);
  const checkCashEnabled = async (dni: string) => {
    try {
      const res = await fetch(`/api/clients/check-cash?dni=${dni.toUpperCase().trim()}`)
      if (res.ok) {
        const data = await res.json()
        setCashEnabled(data.cashEnabled)
      }
    } catch (e) { console.error(e) }
  }

  // Buscar cliente por DNI: si existe, salta al pago directo
  const handleDniLogin = async () => {
    if (!dniLogin.trim()) return

    // Limpieza profunda: mayúsculas, sin espacios al inicio ni entre caracteres
    const dni = dniLogin.toUpperCase().replace(/\s/g, '').trim()
    const clientRef = doc(db, COLLECTIONS.CLIENTS, dni)
    const clientSnap = await getDoc(clientRef)

    if (clientSnap.exists()) {
      const clientData = clientSnap.data()
      setFormData(clientData as Record<string, string>)
      setIsReturning(true)
      setIsAuthModalOpen(false)
      setCheckoutStep('payment') // Cliente registrado → salta el formulario, va directo al pago
      checkCashEnabled(dni)
      toast({
        title: `¡Es un placer verte de nuevo, ${clientData.name.split(' ')[0]}! 👋`,
        description: "Hemos recuperado tus datos para que tu compra sea más rápida.",
      })
    } else {
      toast({
        title: "DNI no registrado",
        description: "No hemos encontrado este DNI. Pulsa en 'Soy nuevo cliente' para registrarte en un segundo.",
        variant: "default"
      })
      setShowDniInput(false)
    }
  }

  // Guardar datos automáticamente SÓLO si se ha iniciado sesión por DNI 
  // (para que esté disponible la próxima vez que ponga su DNI, pero no al recargar sin DNI)
  useEffect(() => {
    const dni = formData.dni?.toUpperCase().trim()
    if (dni && Object.keys(formData).length > 2) { // Más de DNI y algo más
      localStorage.setItem(`pujalte_customer_${dni}`, JSON.stringify(formData))
    }
  }, [formData])

  // Capturar tracking de la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tracking');
      if (t) setTrackingCode(t);
    }
  }, []);

  const handleFieldChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  useState(() => {
    if (config.enableCard) setPaymentMethod('card')
    else if (config.enableBizum) setPaymentMethod('bizum')
    else if (config.enableCash) setPaymentMethod('cash')
  })

  const generateWhatsAppMessage = (orderId: string) => {
    const itemsList = items.map(item => 
      `• ${item.name}${item.variantName ? ` (${item.variantName})` : ''}${item.notes ? `\n   _Observaciones: ${item.notes}_` : ''}${item.fileUrl ? `\n   _Foto: ${item.fileUrl}_` : ''} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
    ).join('\n')
    
    const methodNames = { cash: 'Efectivo', bizum: 'Bizum', card: 'Tarjeta' }
    const paymentMethodText = methodNames[paymentMethod as keyof typeof methodNames]

    const message = `🛒 *NUEVO PEDIDO #${orderId.slice(-8).toUpperCase()}*

👤 *Cliente:* ${formData['name'] || 'N/A'}
📱 *Teléfono:* ${formData['phone'] || 'N/A'}
📧 *Email:* ${formData['email'] || 'No proporcionado'}
📍 *Dirección:* ${formData['address'] || 'No proporcionada'}

📦 *Productos:*
${itemsList}

💰 *Total:* ${formatPrice(getTotal())}

📝 *Notas:* ${formData['notes'] || 'Sin notas'}

_Pago: ${paymentMethodText}_`

    return encodeURIComponent(message)
  }

  const handleWhatsAppOrder = async () => {
    const requiredFields = (config.formFields || []).filter(f => f.required && f.active)
    const missingFields = requiredFields.filter(f => !formData[f.id])

    if (missingFields.length > 0) {
      toast({ 
        title: 'Campos requeridos', 
        description: `Por favor completa: ${missingFields.map(f => f.label).join(', ')}`, 
        variant: 'destructive' 
      })
      return
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData['name'],
          customerPhone: formData['phone'],
          customerEmail: formData['email'],
          address: formData['address'],
          notes: formData['notes'],
          customFields: formData,
          items: items.map(item => ({
            productId: item.productId || item.id,
            productName: item.name,
            variantId: item.variantId,
            variantName: item.variantName,
            note: item.notes,
            fileUrl: item.fileUrl,
            fileName: item.fileName,
            quantity: item.quantity,
            price: item.price
          })),
          paymentMethod, paymentStatus: 'pending'
        })
      })

      if (!res.ok) throw new Error('Error al crear pedido')
      const order = await res.json()
      setTrackingCode(order.trackingNumber || null)

      clearCart()
      setCheckoutStep('success')
      toast({ title: '¡Pedido enviado!', description: 'Te contactaremos por WhatsApp para confirmar' })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudo procesar el pedido', variant: 'destructive' })
    }
  }

  const handleCardPayment = async () => {
    const requiredFields = (config.formFields || []).filter(f => f.required && f.active)
    const missingFields = requiredFields.filter(f => !formData[f.id])

    if (missingFields.length > 0) {
      toast({ 
        title: 'Campos requeridos', 
        description: `Por favor completa: ${missingFields.map(f => f.label).join(', ')}`, 
        variant: 'destructive' 
      })
      return
    }

    setProcessingPayment(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData['name'], 
          customerPhone: formData['phone'], 
          customerEmail: formData['email'], 
          address: formData['address'], 
          notes: formData['notes'],
          customFields: formData,
          items: items.map(item => ({
            productId: item.productId || item.id,
            productName: item.name,
            variantId: item.variantId,
            variantName: item.variantName,
            note: item.notes,
            fileUrl: item.fileUrl,
            fileName: item.fileName,
            quantity: item.quantity,
            price: item.price
          })),
          paymentMethod,
          gateway: 'paycomet'
        })
      })

      if (!res.ok) throw new Error('Error al iniciar el pago')
      const data = await res.json()

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      if (data.paymentData) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentData.url;

        Object.entries(data.paymentData.params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Error en el pago', description: 'No se pudo conectar con la pasarela de pago', variant: 'destructive' })
      setProcessingPayment(false)
    }
  }

  const resetCheckout = () => {
    setCheckoutStep('cart')
    setFormData({})
    setPaymentMethod('card')
    setAcceptTerms(false)
    onClose()
  }

  const steps = [
    { id: 'cart', label: 'Carrito', icon: ShoppingCart },
    { id: 'checkout', label: 'Envío', icon: MapPin },
    { id: 'payment', label: 'Pago', icon: CreditCard },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === (checkoutStep === 'success' ? 'payment' : checkoutStep))

  const fixPath = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('data:')) return path
    // Asegurar que la ruta empiece por /
    return path.startsWith('/') ? path : `/${path}`
  }


  // FUNCIÓN PARA CONTINUAR DESPUÉS DE RELLENAR DATOS
  const handleNextStep = async () => {
    try {
      const res = await fetch('/api/clients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: formData.dni,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          marketing: formData.marketing
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.isNewRegistration) {
          toast({
            title: "¡Bienvenido!",
            description: "Te hemos enviado un email de bienvenida. Completa tu pedido ahora.",
          })
        }
      }
    } catch (e) {
      console.error("Error registrando cliente preliminarmente:", e)
    } finally {
      setCheckoutStep('payment')
    }
  }

  return (
    <>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden border-l-0 bg-[#FCFDFE]">
      {/* Progress Header - Now more vibrant */}
      {checkoutStep !== 'success' && (
        <div className="bg-white border-b px-4 sm:px-8 py-4 sm:py-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between relative max-w-sm mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
            <motion.div 
              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#4A7C59] to-[#6BA37D] -translate-y-1/2 z-0 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: "anticipate" }}
            />
            {steps.map((step, idx) => {
              const isActive = idx <= currentStepIndex
              const isCurrent = idx === currentStepIndex
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <motion.div 
                    animate={{ 
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isActive ? '#4A7C59' : '#FFFFFF',
                      borderColor: isActive ? '#4A7C59' : '#E2E8F0',
                      color: isActive ? '#FFFFFF' : '#94A3B8'
                    }}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 shadow-sm transition-all duration-500`}
                  >
                    <step.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                  </motion.div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${isActive ? 'text-[#4A7C59]' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {checkoutStep === 'cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="absolute inset-0 flex flex-col p-4 sm:p-8"
            >
              <div className="mb-6 sm:mb-8 flex justify-between items-end px-2">
                <div>
                  <button 
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-[#4A7C59] hover:text-[#3D6649] transition-all mb-4 group/back"
                  >
                    <ChevronLeft className="h-4 w-4 transform group-hover/back:-translate-x-1 transition-transform" />
                    Volver a la Tienda
                  </button>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                    Tu Carrito
                  </h2>
                  <Badge variant="outline" className="text-[#4A7C59] border-[#4A7C59]/20 bg-[#4A7C59]/5 font-bold px-3 py-0.5 rounded-full">
                    {items.length === 0 ? 'Vacío' : `${getItemCount()} producto${getItemCount() !== 1 ? 's' : ''}`}
                  </Badge>
                </div>
                {items.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if (window.confirm("Cada foto es una historia que merece ser contada. ¿Dejamos que estos momentos brillen o los borramos por ahora?")) {
                        clearCart();
                      }
                    }}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest px-3 rounded-full"
                  >
                    Vaciarlos
                  </Button>
                )}
              </div>

              {items.length > 0 ? (
                <>
                  <div className="flex-1 overflow-y-auto pr-3 space-y-5 custom-scrollbar pb-4">
                    {items.map((item) => {
                      const itemKey = `${item.id}-${item.variantId || 'default'}-${item.notes || 'no-notes'}`
                      const domId = `file-${itemKey.replace(/[^a-zA-Z0-9-]/g, '_')}`
                      return (
                        <motion.div 
                          layout
                          key={itemKey} 
                          className="flex gap-3 sm:gap-5 p-3 sm:p-5 rounded-3xl sm:rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:border-[#4A7C59]/10 transition-all group relative overflow-hidden"
                        >
                          <div className="absolute top-[-15%] right-[-15%] w-32 h-32 bg-[#4A7C59]/[0.02] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150 z-0" />
                          
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-50 shadow-inner">
                            {config.showImages && item.image ? (
                              <img src={fixPath(item.image)} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <Package className="w-full h-full p-6 text-slate-300" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-1 relative z-10">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-extrabold text-sm sm:text-base text-slate-800 truncate pr-2">{item.name}</h4>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0" 
                                  onClick={() => removeItem(item.id, item.variantId, item.notes)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {item.variantName && (
                                <span className="inline-block text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md mb-2 uppercase tracking-wider">
                                  {item.variantName}
                                </span>
                              )}
                              
                              {item.notes ? (
                                <div className="space-y-1.5">
                                  <div className="text-[11px] font-medium text-[#4A7C59] flex items-center gap-2 bg-[#4A7C59]/[0.08] p-2.5 px-3 rounded-2xl border border-[#4A7C59]/10 mt-1 shadow-sm group/note relative">
                                    <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 opacity-70" /> 
                                    <span className="leading-tight flex-1">&quot;{item.notes}&quot;</span>
                                    <button 
                                      className="h-6 w-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#4A7C59] hover:bg-white hover:scale-110 transition-all"
                                      onClick={() => {
                                        const newNote = prompt('Editar nota:', item.notes)
                                        if (newNote !== null) updateItem(item.id, item.variantId, item.notes, { notes: newNote })
                                      }}
                                    >
                                      <Plus className="h-3 w-3 rotate-45" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  className="px-3 py-1.5 rounded-xl border-2 border-dashed border-slate-200 text-[10px] font-bold text-slate-400 hover:border-[#4A7C59] hover:text-[#4A7C59] hover:bg-[#4A7C59]/5 transition-all flex items-center gap-2 mt-1"
                                  onClick={() => {
                                    const note = prompt('Indica personalización (nombre, curso, etc) o notas para este producto:')
                                    if (note) updateItem(item.id, item.variantId, item.notes, { notes: note })
                                  }}
                                >
                                  <Plus className="h-3 w-3" /> AÑADIR PERSONALIZACIÓN
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</span>
                                <p className="text-base sm:text-lg font-black text-[#4A7C59]">{formatPrice(item.price)}</p>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-50 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-100 shadow-inner">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-white shadow-sm hover:shadow-md" 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId, item.notes)}
                                >
                                  <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                                <span className="w-5 sm:w-6 text-center text-xs sm:text-sm font-black text-slate-700">{item.quantity}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-white shadow-sm hover:shadow-md" 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId, item.notes)}
                                >
                                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-dashed border-slate-100">
                              {item.fileUrl ? (
                                <div className="flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-100/50">
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                      <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">Foto adjunta</span>
                                      <span className="text-[11px] font-medium text-emerald-600 truncate">{item.fileName}</span>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[10px] font-bold text-emerald-700 hover:bg-white hover:text-emerald-800"
                                    onClick={() => document.getElementById(domId)?.click()}
                                  >
                                    CAMBIAR
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <ImageIcon className="h-3.5 w-3.5" /> ¿Usar una foto específica?
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={uploadingItem === itemKey}
                                    className="h-8 rounded-xl border-slate-200 text-[10px] font-bold bg-white text-slate-600 hover:bg-[#4A7C59] hover:text-white hover:border-[#4A7C59] transition-all px-4 shadow-sm"
                                    onClick={() => document.getElementById(domId)?.click()}
                                  >
                                    {uploadingItem === itemKey ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    ) : (
                                      <Upload className="h-3 w-3 mr-2" />
                                    )}
                                    {uploadingItem === itemKey ? 'SUBIENDO...' : 'SUBIR FOTO'}
                                  </Button>
                                </div>
                              )}
                                <input
                                  id={domId}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileUpload(item.id, item.variantId, item.notes, file)
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Aviso sobre resolución más pequeño y discreto */}
                  <div className="mt-4 p-3 rounded-2xl bg-amber-50/20 border border-amber-100/30 flex gap-2 items-center opacity-60">
                    <AlertTriangle className="h-3 w-3 text-amber-600/50 shrink-0" />
                    <p className="text-[10px] font-medium text-amber-800/50 leading-tight">
                      La calidad final depende de la resolución de tu archivo original.
                    </p>
                  </div>
                  
                  <div className="pt-8 border-t border-slate-100 mt-auto bg-white/80 backdrop-blur-md -mx-8 px-8 pb-4">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Total del pedido</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">{formatPrice(getTotal())}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Garantía de Satisfacción</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full h-16 rounded-3xl text-lg font-black uppercase tracking-[0.1em] shadow-2xl shadow-[#4A7C59]/30 bg-[#4A7C59] hover:bg-[#3D6649] hover:scale-[1.02] active:scale-95 transition-all duration-300" 
                      onClick={() => setIsAuthModalOpen(true)}
                    >
                      Continuar Pedido <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-slate-50 to-white shadow-2xl shadow-slate-200/50 flex items-center justify-center relative">
                    <div className="absolute inset-4 rounded-[2rem] border-2 border-dashed border-slate-200" />
                    <ShoppingCart className="h-16 w-16 text-slate-200" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-black text-slate-800 tracking-tight">Tu carrito está esperando...</p>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">Agrega tus productos favoritos para comenzar a crear recuerdos inolvidables.</p>
                  </div>
                  <Button variant="outline" className="rounded-2xl h-14 px-10 border-2 font-bold text-[#4A7C59] border-[#4A7C59]/10 hover:bg-[#4A7C59] hover:text-white transition-all shadow-xl shadow-slate-100" onClick={onClose}>
                    EXPLORAR TIENDA
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {checkoutStep === 'checkout' && (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute inset-0 flex flex-col p-4 sm:p-8"
            >
              <div className="mb-6 sm:mb-8">
                <button 
                  onClick={() => setCheckoutStep('cart')}
                  className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-[#4A7C59] hover:text-[#3D6649] transition-all mb-4 group/back"
                >
                  <ChevronLeft className="h-4 w-4 transform group-hover/back:-translate-x-1 transition-transform" />
                  Volver al Carrito
                </button>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                  Tus Datos
                </h2>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-8 rounded-full bg-[#4A7C59]" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Paso 2 de 3</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-3 space-y-6 custom-scrollbar pb-6">
                <div className="grid grid-cols-1 gap-5">
                  <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 group">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 group-focus-within:text-[#4A7C59] transition-colors">DNI / NIE</Label>
                        <div className="relative">
                          <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
                          <Input 
                            value={formData.dni || ''} 
                            onChange={(e) => handleFieldChange('dni', e.target.value)}
                            placeholder="12345678X"
                            className="h-14 pl-12 rounded-2xl bg-white border-transparent focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 focus-visible:border-[#4A7C59] text-sm font-bold transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 group-focus-within:text-[#4A7C59] transition-colors">Nombre Completo</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
                          <Input 
                            value={formData.name || ''} 
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Tu nombre aquí"
                            className="h-14 pl-12 rounded-2xl bg-white border-transparent focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 focus-visible:border-[#4A7C59] text-sm font-bold transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 group">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 group-focus-within:text-[#4A7C59] transition-colors">Email de Contacto</Label>
                        <div className="relative">
                          <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
                          <Input 
                            value={formData.email || ''} 
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            placeholder="hola@ejemplo.com"
                            className="h-14 pl-12 rounded-2xl bg-white border-transparent focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 focus-visible:border-[#4A7C59] text-sm font-bold transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 group-focus-within:text-[#4A7C59] transition-colors">Teléfono Móvil</Label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
                          <Input 
                            value={formData.phone || ''} 
                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                            placeholder="600 000 000"
                            className="h-14 pl-12 rounded-2xl bg-white border-transparent focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 focus-visible:border-[#4A7C59] text-sm font-bold transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {config.formFields?.find(f => f.id === 'address')?.active && (
                      <div className="space-y-2 group">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 group-focus-within:text-[#4A7C59] transition-colors">Dirección de Entrega</Label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
                          <Input 
                            value={formData.address || ''} 
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                            placeholder="Calle, Ciudad, CP"
                            className="h-14 pl-12 rounded-2xl bg-white border-transparent focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 focus-visible:border-[#4A7C59] text-sm font-bold transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 px-2">
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100/50 group/check">
                      <div className="flex items-start gap-3" onClick={() => setAcceptTerms(!acceptTerms)}>
                        <Checkbox 
                          id="terms" 
                          checked={acceptTerms} 
                          onCheckedChange={(v) => setAcceptTerms(!!v)}
                          className="mt-0.5 border-2 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59] shrink-0"
                        />
                        <Label htmlFor="terms" className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight cursor-pointer group-hover/check:text-slate-700 transition-colors">
                          Acepto que mis datos sean tratados según la <button type="button" onClick={(e) => { e.stopPropagation(); setShowPrivacyModal(true); }} className="text-[#4A7C59] font-black underline hover:text-[#3D6649]">política de privacidad</button> <br />y las <button type="button" onClick={(e) => { e.stopPropagation(); setShowReturnsModal(true); }} className="text-[#4A7C59] font-black underline hover:text-[#3D6649]">condiciones de devolución</button>.
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100/50 group/check cursor-pointer" onClick={() => handleFieldChange('marketing', (formData.marketing === 'true' ? 'false' : 'true'))}>
                      <Checkbox 
                        id="marketing" 
                        checked={formData.marketing === 'true'} 
                        onCheckedChange={(v) => handleFieldChange('marketing', v ? 'true' : 'false')}
                        className="mt-0.5 border-2 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                      />
                      <Label htmlFor="marketing" className="text-xs font-medium text-slate-500 cursor-pointer group-hover/check:text-slate-700 transition-colors leading-tight">
                        Me gustaría recibir novedades y ofertas exclusivas de <br />Pujalte Creative Studio.
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-auto grid grid-cols-5 gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCheckoutStep('cart')} 
                  className="rounded-3xl h-16 col-span-1 p-0 hover:bg-slate-50 text-slate-300 hover:text-slate-600 transition-all border-2 border-transparent"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button 
                  className={`rounded-[2rem] h-16 font-black text-base uppercase tracking-[0.1em] col-span-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-500 text-white ${(() => {
                    const email = formData['email']?.trim() || "";
                    const name = formData['name']?.trim() || "";
                    const dni = formData['dni']?.trim() || "";
                    const phone = formData['phone']?.trim() || "";
                    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                    const isDniValid = dni.length >= 8;
                    const isPhoneValid = phone.replace(/\D/g, '').length >= 9;
                    const isValid = name.length >= 3 && isEmailValid && isDniValid && isPhoneValid && acceptTerms;
                    return !isValid ? 'opacity-30 pointer-events-none' : 'bg-[#4A7C59] hover:bg-[#3D6649] shadow-[#4A7C59]/30';
                  })()}`}
                  onClick={handleNextStep}
                >
                  SIGUIENTE <ChevronRight className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </motion.div>
          )}

          {checkoutStep === 'payment' && (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute inset-0 flex flex-col p-8 overflow-hidden"
            >
              <div className="mb-8">
                <button 
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-[#4A7C59] hover:text-[#3D6649] transition-all mb-4 group/back"
                >
                  <ChevronLeft className="h-4 w-4 transform group-hover/back:-translate-x-1 transition-transform" />
                  Volver a la Tienda
                </button>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                  Finalizar Compra
                </h2>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-8 rounded-full bg-[#4A7C59]" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Último Paso</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-3 space-y-6 custom-scrollbar pb-6">
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'bizum' | 'card')} className="space-y-4">
                  {config.enableCard && (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-center p-5 rounded-3xl border-2 cursor-pointer transition-all duration-500 group ${paymentMethod === 'card' ? 'border-[#4A7C59] bg-[#4A7C59]/[0.03]' : 'border-slate-50 bg-white shadow-sm hover:border-slate-100'}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <RadioGroupItem value="card" id="card" className="sr-only" />
                      <div className="flex items-center gap-5 w-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${paymentMethod === 'card' ? 'bg-[#4A7C59] text-white shadow-[#4A7C59]/30 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500'}`}>
                          <CreditCard className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-black text-sm uppercase tracking-wider mb-0.5 ${paymentMethod === 'card' ? 'text-[#4A7C59]' : 'text-slate-800'}`}>Tarjeta Bancaria</p>
                          <p className="text-xs font-bold text-slate-400">Pasarela segura 256 bits</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${paymentMethod === 'card' ? 'border-[#4A7C59] bg-white' : 'border-slate-100 bg-slate-50'}`}>
                          {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-[#4A7C59]" />}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {config.enableBizum && (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-center p-5 rounded-3xl border-2 cursor-pointer transition-all duration-500 group ${paymentMethod === 'bizum' ? 'border-[#00AACB] bg-[#00AACB]/[0.03]' : 'border-slate-50 bg-white shadow-sm hover:border-slate-100'}`}
                      onClick={() => setPaymentMethod('bizum')}
                    >
                      <RadioGroupItem value="bizum" id="bizum" className="sr-only" />
                      <div className="flex items-center gap-5 w-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${paymentMethod === 'bizum' ? 'bg-[#00AACB] text-white shadow-[#00AACB]/30 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500'}`}>
                          <Smartphone className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-black text-sm uppercase tracking-wider mb-0.5 ${paymentMethod === 'bizum' ? 'text-[#00AACB]' : 'text-slate-800'}`}>Bizum</p>
                          <p className="text-xs font-bold text-slate-400">Rápido y desde tu móvil</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${paymentMethod === 'bizum' ? 'border-[#00AACB] bg-white' : 'border-slate-100 bg-slate-50'}`}>
                          {paymentMethod === 'bizum' && <div className="w-2 h-2 rounded-full bg-[#00AACB]" />}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {config.enableCash && cashEnabled && (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-center p-5 rounded-3xl border-2 cursor-pointer transition-all duration-500 group ${paymentMethod === 'cash' ? 'border-[#C87941] bg-[#C87941]/[0.03]' : 'border-slate-50 bg-white shadow-sm hover:border-slate-100'}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <RadioGroupItem value="cash" id="cash" className="sr-only" />
                      <div className="flex items-center gap-5 w-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${paymentMethod === 'cash' ? 'bg-[#C87941] text-white shadow-[#C87941]/30 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500'}`}>
                          <Banknote className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-black text-sm uppercase tracking-wider mb-0.5 ${paymentMethod === 'cash' ? 'text-[#C87941]' : 'text-slate-800'}`}>Recogida Local</p>
                          <p className="text-xs font-bold text-slate-400">Paga al recoger tu pedido</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${paymentMethod === 'cash' ? 'border-[#C87941] bg-white' : 'border-slate-100 bg-slate-50'}`}>
                          {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-[#C87941]" />}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </RadioGroup>

                <div className="mt-8">
                  <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden group">
                    {/* Ajuste: Se reduce el desplazamiento negativo y se mejora el z-index para evitar glitches */}
                    <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-[#4A7C59]/[0.03] rounded-full pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:bg-[#4A7C59]/[0.05] z-0" />
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="h-2 w-2 rounded-full bg-[#4A7C59] animate-pulse" />
                      <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Resumen Final</h4>
                    </div>
                    
                    <div className="space-y-4 max-h-[180px] overflow-y-auto pr-3 custom-scrollbar mb-6">
                      {items.map(item => (
                        <div key={`${item.id}-${item.variantId}-${item.notes}`} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-baseline gap-4">
                            <span className="text-sm font-extrabold text-slate-700 leading-tight">
                              {item.name} {item.variantName && <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{item.variantName}</span>}
                              <span className="text-[11px] text-[#4A7C59] font-black ml-2 tabular-nums">x{item.quantity}</span>
                            </span>
                            <span className="text-sm font-black text-slate-900 tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                          {item.notes && (
                            <div className="flex items-start gap-2 py-2 px-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                              <MessageCircle className="h-3 w-3 text-[#4A7C59] mt-0.5 flex-shrink-0" />
                              <span className="text-[10px] font-bold text-slate-500 italic leading-tight">&quot;{item.notes}&quot;</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="h-px w-full bg-slate-100 mb-6" />
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center bg-[#4A7C59]/[0.02] -mx-8 px-8 py-5 mt-2 border-y border-slate-50">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4A7C59] mb-1">Monto a Pagar</span>
                          <span className="text-4xl font-black tracking-tighter text-slate-900">{formatPrice(getTotal())}</span>
                        </div>
                        <div className="flex flex-col items-center opacity-40">
                          <ShieldCheck className="h-8 w-8 text-[#4A7C59] mb-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-auto relative">
                <Button 
                  variant="ghost" 
                  onClick={() => setCheckoutStep('checkout')} 
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-3xl h-16 w-14 p-0 hover:bg-slate-50 text-slate-300 hover:text-slate-600 transition-all border-2 border-transparent z-10"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button 
                  className={`w-full h-16 font-black text-base uppercase tracking-[0.1em] rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-500 text-white ${paymentMethod === 'cash' ? 'bg-slate-900 hover:bg-black shadow-slate-400/20' : paymentMethod === 'bizum' ? 'bg-[#00AACB] hover:bg-[#008BA5] shadow-[#00AACB]/30' : 'bg-[#4A7C59] hover:bg-[#3D6649] shadow-[#4A7C59]/30'}`} 
                  onClick={paymentMethod === 'cash' ? handleWhatsAppOrder : handleCardPayment} 
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> PROCESANDO...</>
                  ) : paymentMethod === 'cash' ? (
                    <><MessageCircle className="mr-3 h-6 w-6" /> REALIZAR PEDIDO</>
                  ) : (
                    <><CreditCard className="mr-3 h-6 w-6" /> PAGAR AHORA</>
                  )}
                </Button>

                {/* Pie de marca en el checkout */}
                <div className="pt-6 flex flex-col items-center gap-1.5 opacity-30">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#4A7C59]">
                    LA TECNOLOGÍA AL SERVICIO DE LOS RECUERDOS
                  </p>
                  <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-900">
                    powered by pujalte creative studio
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {checkoutStep === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white relative overflow-hidden">
          {/* Fondo de partículas sutiles */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: [0, 1, 0], y: -200, x: Math.sin(i) * 50 }}
                transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
                className="absolute h-2 w-2 rounded-full bg-[#4A7C59]"
                style={{ left: `${15 + i * 15}%`, top: '80%' }}
              />
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 relative z-10 pt-8"
          >
            <img 
              src={config.logo ? (config.logo.startsWith('/') ? `/pujaltefotografia${config.logo}` : `/${config.logo}`) : "/logo_ia.png"} 
              alt="Logo" 
              className="h-24 w-auto mx-auto mb-4 drop-shadow-lg" 
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-1.5 border-t border-slate-900/10 pt-3 px-8"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">
                LA TECNOLOGÍA AL SERVICIO DE LOS RECUERDOS
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 opacity-60">
                POWERED BY PUJALTE CREATIVE STUDIO
              </p>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#4A7C59] to-[#3D6649] flex items-center justify-center mb-6 shadow-[0_15px_30px_-10px_rgba(74,124,89,0.4)] border-4 border-white relative z-10"
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-[2rem] bg-white"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 relative z-10"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">¡ENHORABUENA!</h2>
              <div className="h-1 w-12 bg-[#4A7C59] mx-auto rounded-full" />
            </div>

            <div className="space-y-4">
              <p className="text-lg font-bold text-slate-800 leading-tight">
                Gracias por confiar en <span className="text-[#4A7C59]">Pujalte Creative Studio</span>.<br/>
                Tu pedido se ha registrado con éxito.
              </p>

              {trackingCode && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Seguimiento</p>
                  <p className="text-xl font-black tracking-widest text-[#4A7C59]">{trackingCode}</p>
                </div>
              )}
              
              <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto italic">
                {paymentMethod === 'card' 
                  ? 'Pago recibido. Contactaremos contigo en breve.' 
                  : 'Te escribiremos por WhatsApp para confirmar los detalles.'}
              </p>
            </div>

            <div className="pt-4">
              <Button 
                onClick={resetCheckout} 
                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white shadow-xl transition-all duration-300"
              >
                VOLVER A LA TIENDA
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      </SheetContent>

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
            <p>Sus datos se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales.</p>
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
            <p className="font-bold text-slate-900">⚠️ MUY IMPORTANTE:</p>
            <p>De acuerdo con el Art. 103 de la Ley 3/2014 de Consumidores, el derecho de desistimiento **no será aplicable** a productos confeccionados conforme a las especificaciones del consumidor o claramente personalizados.</p>
            <p>Por tanto, al tratarse de impresiones fotográficas personalizadas con sus propios archivos, **no se admiten devoluciones** una vez realizado el pedido, salvo en los siguientes casos:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Defecto de fabricación:</strong> Si el soporte físico (marco, lienzo, metacrilato) presenta daños estructurales.</li>
              <li><strong>Error de Pujalte:</strong> Si el producto enviado no coincide con el solicitado en el pedido.</li>
            </ul>
            <p><strong>Detección de Daños en Envío:</strong> Si el paquete llega golpeado, debe indicarlo en el albarán del transportista y notificarnos en un plazo máximo de **24 horas** enviando fotos a apps@pujaltefotografia.es.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReturnsModal(false)} className="bg-[#4A7C59] rounded-2xl">Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[40px] p-0 border-none bg-white overflow-hidden shadow-2xl">
          <div className="p-8 pt-10">
            <div className="mb-8 text-center">
              <div className="h-20 w-20 rounded-[28px] bg-gradient-to-br from-[#4A7C59] to-[#3D664A] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#4A7C59]/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <Users className="h-10 w-10 text-white" />
              </div>
              <DialogTitle className="text-3xl font-black text-slate-900 leading-tight mb-2 text-center">
                ¡Bienvenido a Fotodetalles!
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm font-medium leading-relaxed max-w-[320px] mx-auto text-center">
                Para tu comodidad, el registro solo será necesario la primera vez que compres con nosotros.
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
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Introduce tu DNI/NIE</Label>
                    <div className="relative">
                      <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
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
              Si tienes algún problema para acceder, no dudes en <span className="text-[#4A7C59] font-bold">ponerte en contacto</span> con nosotros por WhatsApp.
            </p>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-[#4A7C59]/0 via-[#4A7C59]/30 to-[#4A7C59]/0" />
        </DialogContent>
      </Dialog>
    </>
  )
}
