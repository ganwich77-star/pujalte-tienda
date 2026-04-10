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
  Store,
  Camera,
  Type,
  Palette,
  Eye,
  Upload,
  X,
  LayoutGrid
} from 'lucide-react'
import { useCartStore, CartItem } from '@/store/cart'
import { useUserStore } from '@/store/user'
import { formatCurrency, fixPath } from '@/lib/utils'
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

export function CartSheet({ isOpen, onClose, clientId, galleryTitle }: { isOpen: boolean, onClose: () => void, clientId?: string | null, galleryTitle?: string }) {
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount, updateItem } = useCartStore()
  const { isLoggedIn, user: loggedUser, login } = useUserStore()
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
  const [lastOrderDetails, setLastOrderDetails] = useState<{ items: any[], total: number, customer: typeof shippingData, method: string } | null>(null)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showReturnsModal, setShowReturnsModal] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showDniInput, setShowDniInput] = useState(false)
  const [dniLogin, setDniLogin] = useState('')

  const [zoomedItem, setZoomedItem] = useState<{ id: string, variantId?: string, notes?: string, photoUrl: string } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleReplacePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !zoomedItem) return;

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        const oldNotes = zoomedItem.notes || '';
        const noteParts = oldNotes.split(' | ').filter(Boolean);
        const newNotesParts = noteParts.map(p => {
           if(p.startsWith('FOTO:')) return `FOTO: ${data.url}`;
           return p;
        });
        
        let newNotes = newNotesParts.join(' | ');
        if (!newNotesParts.some(p => p.startsWith('FOTO:'))) {
          newNotes = newNotes ? `${newNotes} | FOTO: ${data.url}` : `FOTO: ${data.url}`;
        }

        updateItem(zoomedItem.id, zoomedItem.variantId, zoomedItem.notes, { notes: newNotes });
        setZoomedItem(null); 
        toast.success("Foto actualizada correctamente");
      }
    } catch (err) {
      console.error("Error al subir nueva foto", err);
      toast.error("Hubo un error al cambiar la foto");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      setCheckoutStep('cart')
    }
  }, [isOpen])

  const handleNextStep = async () => {
    if (checkoutStep === 'cart') {
      // Prioridad 1: Sesión ya activa en el Store
      if (isLoggedIn && loggedUser) {
        setProcessingPayment(true);
        try {
          // Intentamos refrescar datos pero si falla, seguimos con los del store
          const targetDni = (loggedUser.dni || '').toUpperCase();
          const response = await fetch(`/api/customers/${targetDni}`);
          
          if (response.ok) {
            const customer = await response.json();
            setShippingData({
              firstName: customer.firstName || loggedUser.name?.split(' ')[0] || '',
              lastName: customer.lastName || loggedUser.name?.split(' ').slice(1).join(' ') || '',
              email: customer.email || loggedUser.email || '',
              phone: customer.phone || loggedUser.phone || '',
              address: customer.address || loggedUser.address || '',
              city: customer.city || '',
              zipCode: customer.zipCode || '',
              dni: targetDni
            });
          } else {
             // Si el fetch falla pero está logueado, rellenamos lo que podamos del store
             setShippingData(prev => ({
               ...prev,
               firstName: loggedUser.name?.split(' ')[0] || prev.firstName,
               lastName: loggedUser.name?.split(' ').slice(1).join(' ') || prev.lastName,
               email: loggedUser.email || prev.email,
               phone: loggedUser.phone || prev.phone,
               address: loggedUser.address || prev.address,
               dni: targetDni
             }));
          }
          setCheckoutStep('payment');
        } catch (error) {
          console.error("Error recuperando datos del cliente:", error);
          setCheckoutStep('payment'); // No detenemos la venta por un error de red si ya está logueado
        } finally {
          setProcessingPayment(false);
        }
        return;
      }

      // Prioridad 2: Galería identificada (clientId)
      if (clientId) {
        setProcessingPayment(true);
        try {
          const response = await fetch(`/api/customers/${clientId.toUpperCase()}`);
          if (response.ok) {
            const customer = await response.json();
            setShippingData({
              firstName: customer.firstName || '',
              lastName: customer.lastName || '',
              email: customer.email || '',
              phone: customer.phone || '',
              address: customer.address || '',
              city: customer.city || '',
              zipCode: customer.zipCode || '',
              dni: customer.dni || clientId.toUpperCase()
            });
            
            // Si tenemos el nombre del cliente, podemos ir a pago. 
            // Si el nombre es genérico o está vacío, pedimos datos.
            if (customer.firstName && !customer.name.startsWith('Galería:')) {
              setCheckoutStep('payment');
            } else {
              setCheckoutStep('checkout');
            }
          } else {
            // Si es galería pero no está en la DB, le pedimos datos manuales
            setShippingData(prev => ({ ...prev, dni: clientId.toUpperCase() }));
            setCheckoutStep('checkout'); // Cambiado de 'payment' a 'checkout' para pedir nombre
          }
        } catch (error) {
          setCheckoutStep('checkout'); // Ante error, pedimos datos
        } finally {
          setProcessingPayment(false);
        }
        return;
      }

      // Prioridad 3: Usuario anónimo -> Mostrar modal
      setIsAuthModalOpen(true);
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
        
        // PERSISTIMOS EN EL STORE GLOBAL PARA QUE NO VUELVA A PREGUNTAR
        login({
          name: `${customer.firstName} ${customer.lastName}`,
          dni: customer.dni || dniLogin,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        })

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
    if (items.length === 0 || processingPayment) return;
    
    setProcessingPayment(true)
    
    try {
      const orderData = {
        customerName: `${shippingData.firstName} ${shippingData.lastName}`,
        customerPhone: shippingData.phone || "",
        customerEmail: shippingData.email,
        address: shippingData.address,
        notes: "",
        items: items.map(item => ({
          productId: item.productId || item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          variantId: item.variantId,
          variantName: item.variantName,
          notes: item.notes,
          fileName: item.fileName,
          fileUrl: item.fileUrl
        })),
        paymentMethod: paymentMethod, // 'card' o 'bizum'
        customFields: {
          dni: shippingData.dni
        },
        clientId: clientId,
        galleryTitle: galleryTitle
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()
      
      if (result.success && result.paymentUrl) {
        // Redirigir a Paycomet (Banco Sabadell)
        window.location.href = result.paymentUrl
      } else {
        throw new Error(result.error || 'Error al procesar el pago')
      }
    } catch (error: any) {
      console.error('Error en proceso de pago:', error)
      toast.error(error.message || "Error al conectar con la pasarela de pagos")
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCashOrder = async () => {
    setProcessingPayment(true)
    
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId || item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          variantId: item.variantId,
          variantName: item.variantName,
          notes: item.notes,
          fileName: item.fileName,
          fileUrl: item.fileUrl
        })),
        customer: shippingData,
        total: getTotal(),
        paymentMethod: 'CASH',
        status: 'PENDING',
        clientId: clientId, // Enviamos el slug o id de la galería
        galleryTitle: galleryTitle
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const order = await response.json()
        const code = order.trackingCode || order.trackingNumber || "CONFIRMADO";
        setTrackingCode(code)
        
        // Guardamos los detalles BLINDADOS ANTES de borrar el carrito para el mensaje de WhatsApp
        setLastOrderDetails({
          items: [...items],
          total: getTotal(),
          customer: { ...shippingData },
          method: paymentMethod === 'cash' ? 'EFECTIVO / TRANSFERENCIA' : 'PAGADO ONLINE'
        })
        
        // Timeout minúsculo para asegurar que el estado se procesa bien
        setTimeout(() => {
          setCheckoutStep('success')
          clearCart()
          toast.success("¡Pedido realizado con éxito!")
        }, 100)
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || "Error al procesar el pedido")
      }
    } catch (error) {
      toast.error("Error al crear el pedido")
    } finally {
      setProcessingPayment(false)
    }
  }

  const sendWhatsAppOrder = () => {
    const phone = config?.whatsappConfig?.phone || "34650494728"; 
    const galleryName = galleryTitle || clientId || "Galería Privada";
    
    // Usamos los detalles blindados
    const orderItems = lastOrderDetails?.items || items;
    const orderTotal = lastOrderDetails?.total || getTotal();
    const customer = lastOrderDetails?.customer || shippingData;
    const method = lastOrderDetails?.method || (paymentMethod === 'cash' ? 'EFECTIVO / TRANSFERENCIA' : 'PAGADO ONLINE');

    let message = `✅ *¡NUEVA COMPRA DE GALERÍA!* ✅\n\n`;
    message += `Hola Pepe, he completado mi pedido desde mi área de cliente. Aquí tienes los detalles:\n\n`;
    message += `📍 *GALERÍA:* ${galleryName.toUpperCase()}\n`;
    
    // Fallback de nombre si no viene en 'customer'
    const fullName = (customer.firstName || customer.lastName) 
      ? `${customer.firstName} ${customer.lastName}`.trim() 
      : (isLoggedIn ? loggedUser?.name : 'Cliente Registrado');

    message += `👤 *CLIENTE:* ${fullName}\n`;
    message += `✉️ *EMAIL:* ${customer.email || (isLoggedIn ? loggedUser?.email : '')}\n`;
    message += `📞 *TEL:* ${customer.phone || (isLoggedIn ? loggedUser?.phone : '')}\n\n`;
    message += `📦 *DETALLE DEL PEDIDO:*\n`;
    message += `---------------------------------\n`;

    orderItems.forEach((item, index) => {
      message += `${index + 1}. *${item.name}* (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}\n`;
      if (item.variantName) message += `   ▫️ _Opción: ${item.variantName}_\n`;
      if (item.notes) {
        // Limpiamos las notas para que no incluyan la URL de la foto si es muy larga
        const noteParts = item.notes.split(' | ').filter(p => !p.startsWith('FOTO:'));
        if (noteParts.length > 0) message += `   📝 _Notas: ${noteParts.join(', ')}_\n`;
      }
      message += `\n`;
    });

    message += `---------------------------------\n`;
    message += `💵 *TOTAL A PAGAR: ${formatCurrency(orderTotal)}*\n`;
    message += `📌 *MÉTODO:* ${method}\n\n`;
    
    if (customer.address) {
      message += `📍 *ENVÍO:* ${customer.address}\n\n`;
    }

    message += `💬 "Quedo a la espera de que prepares mi pedido. ¡Muchas gracias!"\n\n`;
    message += `✨ _Enviado desde Pujalte Creative Studio_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${encodedMessage}`, '_blank');
  }

  const resetCheckout = () => {
    setCheckoutStep('cart')
    onClose()
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-[540px] p-0 flex flex-col border-none shadow-2xl bg-[#F8FAFC] z-[200]">
          <SheetHeader className="sr-only">
            <SheetTitle>Carrito de Compras - Pujalte Creative Studio</SheetTitle>
          </SheetHeader>
          
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

          <div className="flex-1 overflow-hidden relative flex flex-col">
            <AnimatePresence mode="wait">
              {checkoutStep === 'cart' && (
                <motion.div 
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                        <ShoppingBag className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Tu carrito está vacío</h3>
                      <p className="text-slate-500 text-sm max-w-[240px] font-medium leading-relaxed">Cada foto es una historia por imprimir. ¿Añadimos alguna?</p>
                      <Button onClick={onClose} className="mt-8 bg-slate-900 rounded-xl px-8 h-12 font-black uppercase tracking-widest">Ver productos</Button>
                    </div>
                  ) : (
                    <>
                      {/* ZONA DE PRODUCTOS CON SCROLL INDEPENDIENTE */}
                      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-4 custom-scrollbar touch-pan-y overscroll-contain">
                        <button onClick={onClose} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 hover:text-[#4A7C59] transition-colors group bg-transparent border-none p-0 outline-none shadow-none">
                          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Seguir Comprando
                        </button>
                        
                        <div className="space-y-4 pb-4">
                          {items.map((item) => {
                            const noteParts = item.notes?.split(' | ') || [];
                            const photoPart = noteParts.find(p => p.startsWith('FOTO:'));
                            // Usar item.fileUrl si existe, si no, intentar parsear de la nota
                            const allUrls = item.fileUrl ? item.fileUrl.split(', ') : (photoPart ? [photoPart.split('FOTO: ')[1]] : []);
                            const photoUrl = allUrls[0];
                            const variantPart = item.variantName || noteParts.find(p => !p.startsWith('FOTO:') && !p.includes(':'));
                            const otherObservations = noteParts.filter(p => p !== photoPart && p !== variantPart && p !== item.variantName);

                            return (
                              <div key={`${item.id}-${item.variantId}-${item.notes}`} className="group bg-white rounded-3xl p-4 border border-slate-100 hover:border-[#4A7C59]/20 transition-all duration-300 shadow-sm hover:shadow-md">
                                <div className="flex gap-4 sm:gap-5">
                                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-50 shrink-0 relative">
                                    {item.image ? (
                                      <>
                                        <img src={fixPath(item.image as string)} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        {allUrls.length > 1 && (
                                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                            <Camera className="h-2 w-2" /> {allUrls.length}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <ShoppingBag className="h-8 w-8 text-slate-200" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 py-0.5 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-900 truncate pr-2 text-sm sm:text-base leading-tight uppercase tracking-tight">{item.name}</h4>
                                        
                                        <p className="text-base sm:text-lg font-black text-[#4A7C59] leading-none mt-1">{formatCurrency(item.price)}</p>

                                        <div className="mt-2.5 space-y-1.5">
                                          {variantPart && (
                                            <div className="flex items-center gap-2">
                                              <Badge variant="secondary" className="bg-[#4A7C59]/5 text-[#4A7C59] text-[7px] sm:text-[8px] font-black uppercase px-2 py-0 border-none rounded-md flex items-center gap-1">
                                                <Palette className="h-2.5 w-2.5" /> {variantPart}
                                              </Badge>
                                            </div>
                                          )}

                                          {otherObservations.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {otherObservations.map((obs, idx) => (
                                                <Badge key={idx} variant="outline" className="text-[7px] font-bold uppercase border-slate-100 text-slate-400 rounded-md">
                                                  {obs}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}

                                          {allUrls.length > 0 && (
                                            <div className="space-y-2">
                                              <Badge variant="secondary" className="bg-orange-50 text-orange-600 text-[7px] sm:text-[8px] font-black uppercase px-2 py-0 border-none rounded-md flex items-center gap-1 text-[7px] w-fit">
                                                <Camera className="h-2.5 w-2.5" /> {allUrls.length > 1 ? `${allUrls.length} Fotos Seleccionadas` : 'Foto Personalizada'}
                                              </Badge>
                                              <div className="flex flex-wrap gap-1.5">
                                                {allUrls.map((url, idx) => (
                                                  <button 
                                                    key={idx}
                                                    onClick={() => setZoomedItem({ id: item.id, variantId: item.variantId, notes: item.notes, photoUrl: url })}
                                                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg overflow-hidden border-2 border-orange-100 shadow-sm relative group/img cursor-zoom-in block"
                                                  >
                                                    <img src={url} className="h-full w-full object-cover" alt={`Foto ${idx + 1}`} />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                      <Eye className="h-3 w-3 text-white" />
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <button onClick={() => removeItem(item.id, item.variantId, item.notes)} className="text-slate-200 hover:text-red-500 transition-colors p-1 shrink-0"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                    
                                    <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Cantidad</span>
                                      <div className="flex items-center gap-3 bg-slate-50 p-0.5 rounded-lg border border-slate-100/50">
                                        <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variantId, item.notes || '')} className="h-6 w-6 rounded-md bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 transition-all font-black text-xs">-</button>
                                        <span className="text-xs font-black text-slate-900 w-3 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId, item.notes || '')} className="h-6 w-6 rounded-md bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 transition-all font-black text-xs">+</button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* PIE FIJO CON TOTAL Y BOTÓN */}
                      <div className="bg-white border-t border-slate-100 p-6 sm:p-8 pt-6 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] shrink-0">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">Total Pedido</span>
                            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(getTotal())}</span>
                        </div>
                        <Button onClick={handleNextStep} className="w-full h-14 sm:h-16 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-sm sm:text-base uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(74,124,89,0.3)] transition-all duration-500">Continuar <ChevronRight className="ml-2 h-5 w-5" /></Button>
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
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar touch-pan-y overscroll-contain">
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
                        <Input value={shippingData.dni} onChange={(e) => setShippingData({...shippingData, dni: e.target.value.toUpperCase().trim()})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="12345678X" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                          <Input value={shippingData.email} onChange={(e) => setShippingData({...shippingData, email: e.target.value})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="nombre@ejemplo.com" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono</Label>
                          <Input value={shippingData.phone} onChange={(e) => setShippingData({...shippingData, phone: e.target.value})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="Ej: 600 000 000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dirección Completa</Label>
                        <Input value={shippingData.address} onChange={(e) => setShippingData({...shippingData, address: e.target.value})} className="h-12 rounded-xl bg-white border-slate-100 font-bold" placeholder="Calle, número, piso..." />
                      </div>
                      
                      <div className="pt-6">
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <Info className="h-5 w-5 text-[#4A7C59] shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">Al continuar, aceptas nuestra <button onClick={() => setShowPrivacyModal(true)} className="text-[#4A7C59] font-black underline">política de privacidad</button> y las <button onClick={() => setShowReturnsModal(true)} className="text-[#4A7C59] font-black underline">condiciones de devolución</button>.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 p-6 sm:p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                    <Button onClick={handleNextStep} className="w-full h-14 sm:h-16 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-sm sm:text-base uppercase tracking-widest shadow-xl transition-all duration-500">Elegir Pago <ChevronRight className="ml-2 h-5 w-5" /></Button>
                  </div>
                </motion.div>
              )}

              {checkoutStep === 'payment' && (
                <motion.div 
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar touch-pan-y overscroll-contain">
                    <button onClick={() => setCheckoutStep('checkout')} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#4A7C59] mb-8 hover:opacity-70 transition-opacity"><ChevronLeft className="h-4 w-4" /> Volver</button>
                    <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight uppercase italic">Finalizar Pago</h3>

                    <div className="space-y-4">
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
                  </div>

                  <div className="shrink-0 p-6 sm:p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-end mb-6">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">Total a Pagar</span>
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(getTotal())}</span>
                    </div>
                    <Button 
                      onClick={paymentMethod === 'cash' ? handleCashOrder : handleCardPayment}
                      disabled={processingPayment}
                      className={`w-full h-14 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] font-black text-sm sm:text-base uppercase tracking-widest shadow-xl transition-all duration-500 text-white ${paymentMethod === 'card' ? 'bg-[#4A7C59] hover:bg-[#3D6649]' : paymentMethod === 'bizum' ? 'bg-[#00AACB] hover:bg-[#008BA5]' : 'bg-orange-500 hover:bg-orange-600'}`}
                    >
                      {processingPayment ? (
                        <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> PROCESANDO...</>
                      ) : (
                        <>{paymentMethod === 'cash' ? <Store className="mr-3 h-5 w-5" /> : <CreditCard className="mr-3 h-5 w-5" />} PAGAR AHORA</>
                      )}
                    </Button>
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
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase italic">¡Pedido Realizado!</h3>
                  <div className="h-1 w-12 bg-[#4A7C59] mx-auto rounded-full mb-6" />
                  <p className="text-slate-500 font-bold mb-8 leading-relaxed">Gracias por confiar en Pujalte Creative Studio.<br/>Tu número de seguimiento es:</p>
                  <div className="bg-slate-900 text-white px-8 py-5 rounded-3xl font-black text-2xl tracking-[0.3em] mb-12 shadow-inner border border-white/10 uppercase">{trackingCode}</div>
                  
                  <div className="flex flex-col w-full gap-3">
                    <Button 
                      onClick={sendWhatsAppOrder}
                      className="h-16 w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
                    >
                      <MessageCircle className="h-6 w-6 fill-current" />
                      Enviar por WhatsApp
                    </Button>
                    
                    <Button onClick={resetCheckout} variant="ghost" className="h-14 w-full text-slate-400 font-black uppercase tracking-widest transition-all">Seguir Comprando</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>

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
        <DialogContent className="sm:max-w-[450px] rounded-[40px] p-0 border-none bg-white overflow-hidden shadow-2xl z-[300]">
          <DialogHeader className="sr-only">
            <DialogTitle>Acceso al Pedido</DialogTitle>
          </DialogHeader>
          <div className="p-8 pt-10">
            <div className="mb-8 text-center">
              <div className="h-20 w-20 rounded-[28px] bg-gradient-to-br from-[#4A7C59] to-[#3D664A] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#4A7C59]/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <Users className="h-10 w-10 text-white" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-tight mb-2 italic">¡Hola!</p>
              <DialogDescription className="text-slate-500 text-sm font-medium leading-relaxed max-w-[320px] mx-auto">
                Identifícate para completar tu pedido
              </DialogDescription>
            </div>

            <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tu Nombre Completo</Label>
                    <div className="relative">
                      <Users className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input 
                        value={shippingData.firstName}
                        onChange={(e) => setShippingData({...shippingData, firstName: e.target.value, lastName: ''})}
                        placeholder="NOMBRE Y APELLIDOS..."
                        className="pl-14 h-16 rounded-[24px] bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 focus-visible:border-[#4A7C59] text-sm font-bold transition-all uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tu DNI o NIE</Label>
                    <div className="relative">
                      <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input 
                        value={dniLogin || shippingData.dni}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setDniLogin(val);
                          setShippingData(prev => ({ ...prev, dni: val }));
                        }}
                        placeholder="12345678X"
                        className="pl-14 h-16 rounded-[24px] bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 focus-visible:border-[#4A7C59] text-lg font-black transition-all"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={async () => {
                      if (!shippingData.firstName || (!dniLogin && !shippingData.dni)) {
                        toast.error("Por favor, rellena tu nombre y DNI");
                        return;
                      }

                      const targetDni = (dniLogin || shippingData.dni).toUpperCase();
                      let customerExisted = false;

                      try {
                        const res = await fetch(`/api/customers/${targetDni}`);
                        if (res.ok) {
                          const customer = await res.json();
                          setShippingData({
                            firstName: customer.firstName || '',
                            lastName: customer.lastName || '',
                            email: customer.email || '',
                            phone: customer.phone || '',
                            address: customer.address || '',
                            city: customer.city || '',
                            zipCode: customer.zipCode || '',
                            dni: customer.dni || targetDni
                          });
                          customerExisted = true;
                          toast.success(`¡Hola de nuevo, ${customer.firstName}!`);
                        } else {
                          // Si es nuevo, aseguramos que el DNI y nombre que ha puesto se queden grabados
                          setShippingData(prev => ({
                            ...prev,
                            firstName: shippingData.firstName,
                            dni: targetDni
                          }));
                        }
                      } catch (e) {
                         console.error("Error al buscar cliente:", e);
                      }
                      
                      // PERSISTIMOS EN EL STORE GLOBAL PARA QUE NO VUELVA A PREGUNTAR
                      login({
                        name: customerExisted ? `${shippingData.firstName} ${shippingData.lastName}` : shippingData.firstName,
                        dni: targetDni,
                        email: shippingData.email,
                        phone: shippingData.phone,
                        address: shippingData.address
                      });

                      setIsAuthModalOpen(false);
                      // DIRECTO AL PAGO SIEMPRE, SIN PANTALLAS INTERMEDIAS
                      setCheckoutStep('payment');
                    }}
                    className="w-full h-16 rounded-[24px] bg-[#4A7C59] hover:bg-[#3D664A] text-white text-lg font-black uppercase transition-all shadow-[0_15px_30px_-10px_rgba(74,124,89,0.3)] mt-2"
                  >
                    Acceder ahora
                  </Button>
                </motion.div>
            </div>
            
            <p className="mt-8 text-[10px] text-center text-slate-400 font-medium leading-relaxed px-4">
              La tecnología al servicio de tus recuerdos.
            </p>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-[#4A7C59]/0 via-[#4A7C59]/30 to-[#4A7C59]/0" />
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!zoomedItem} onOpenChange={(open) => !open && setZoomedItem(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-3xl border-none shadow-2xl">
          {zoomedItem && (
             <div className="relative">
               <img src={zoomedItem.photoUrl} className="w-full h-auto max-h-[70vh] object-contain bg-slate-100" alt="Previsualización" />

               <div className="p-8 bg-white flex flex-col gap-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Opciones de personalización</h4>
                 
                 <input type="file" id={`cart-img-upload`} className="hidden" accept="image/*" onChange={handleReplacePhoto} disabled={isUploadingPhoto} />
                 <label htmlFor="cart-img-upload" className="cursor-pointer border-2 border-dashed border-[#4A7C59]/30 hover:border-[#4A7C59] bg-[#4A7C59]/5 flex h-14 items-center justify-center gap-3 rounded-2xl text-[#4A7C59] font-black uppercase text-[10px] tracking-[0.1em] transition-all hover:scale-[1.02] active:scale-95 shadow-sm">
                   {isUploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4"/> Subir desde dispositivo</>}
                 </label>

                 <Button 
                   onClick={() => {
                     setZoomedItem(null);
                     onClose();
                     toast.success("Elige una nueva foto de tu galería principal");
                   }}
                   variant="outline"
                   className="h-14 rounded-2xl font-black uppercase tracking-[0.1em] text-[#4A7C59] border-[#4A7C59]/20 hover:bg-[#4A7C59]/5 flex items-center justify-center gap-3 border-2 transition-all hover:scale-[1.02] active:scale-95 text-[10px]"
                 >
                   <Camera className="h-4 w-4" /> Elegir de esta Galería
                 </Button>

                 <Button 
                   onClick={() => {
                     setZoomedItem(null);
                     onClose();
                     window.location.href = '/'; 
                   }}
                   variant="outline"
                   className="h-14 rounded-2xl font-black uppercase tracking-[0.1em] text-slate-600 border-slate-100 hover:bg-slate-50 flex items-center justify-center gap-3 border-2 transition-all hover:scale-[1.02] active:scale-95 text-[10px]"
                 >
                   <LayoutGrid className="h-4 w-4" /> Ver todas mis sesiones
                 </Button>

                 <div className="h-px bg-slate-50 my-2" />

                 <Button onClick={() => setZoomedItem(null)} variant="ghost" className="h-12 rounded-2xl font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all text-[9px]">Cerrar previsualización</Button>
               </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
