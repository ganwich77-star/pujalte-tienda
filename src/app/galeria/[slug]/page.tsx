'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  MessageSquare, 
  Lock, 
  Download, 
  ChevronLeft, 
  Check,
  ShoppingBag,
  Info,
  X,
  Eye,
  Send,
  Image as ImageIcon,
  Search,
  LayoutGrid,
  List,
  MessageCircle,
  AlertCircle,
  Trash2,
  ChevronRight,
  Plus,
  Volume2,
  VolumeX
} from 'lucide-react'
import { db, COLLECTIONS } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function GalleryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const slug = params.slug as string
  
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, string>>({})
  
  // Estados para la funcionalidad de tienda vinculada
  const [products, setProducts] = useState<any[]>([])
  const [globalConfig, setGlobalConfig] = useState<any>(null)
  const [isShopModalOpen, setIsShopModalOpen] = useState(false)
  const [photoToBuy, setPhotoToBuy] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomOptions, setSelectedCustomOptions] = useState<Record<string, string>>({})
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [photoNotes, setPhotoNotes] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSummary, setShowSummary] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [heroIndex, setHeroIndex] = useState(0)
  const { addItem, removeItem, updateQuantity, items: cartItems } = useCartStore()
  const [zoomedProduct, setZoomedProduct] = useState<any | null>(null)
  
  // Estados para Música de Fondo
  const [isPlaying, setIsPlaying] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)

  const photos = client?.gallerySettings?.photos || []
  const displayedPhotos = (showOnlyFavorites 
    ? photos.filter((p: any) => favorites.has(p.id)) 
    : photos) || []
  
  // Cargar productos de la tienda y configuración global al iniciar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewerIndex === null || !displayedPhotos || displayedPhotos.length === 0) return;
      if (e.key === 'ArrowRight') setViewerIndex(prev => prev! < (displayedPhotos?.length || 0) - 1 ? prev! + 1 : 0);
      if (e.key === 'ArrowLeft') setViewerIndex(prev => prev! > 0 ? prev! - 1 : (displayedPhotos?.length || 0) - 1);
      if (e.key === 'f' || e.key === 'F') toggleFavorite(displayedPhotos[viewerIndex].id);
      if (e.key === 'Escape') setViewerIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerIndex, displayedPhotos]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, configRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/config')
        ])
        
        if (!productsRes.ok) throw new Error('Error cargando productos');
        if (!configRes.ok) throw new Error('Error cargando configuración');
        
        const productsData = await productsRes.json()
        const configData = await configRes.json()
        
        console.log("Productos cargados:", productsData.length)
        setProducts(Array.isArray(productsData) ? productsData : [])
        setGlobalConfig(configData)
      } catch (e) {
        console.error("Error loading combined data:", e)
        setProducts([])
      }
    }
    fetchData()
  }, [])
  
  // Cargar datos del cliente
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const docRef = doc(db, COLLECTIONS.CLIENTS, slug.toUpperCase())
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setClient(data)
          // Cargar favoritos y comentarios si existen en su última sesión o en DB
          if (data.selections) {
            setFavorites(new Set(data.selections.favorites || []))
            setComments(data.selections.comments || {})
          }
        }
      } catch (e) {
        console.error("Error loading gallery:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchClient()
  }, [slug])

  // Bloqueo de seguridad (Click derecho)
  useEffect(() => {
    if (client?.gallerySettings?.safetyLockEnabled) {
      const handleContextMenu = (e: MouseEvent) => e.preventDefault()
      document.addEventListener('contextmenu', handleContextMenu)
      return () => document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [client])

  // Intervalo para el slide de portada
  useEffect(() => {
    if (!photos || photos.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % Math.min(photos.length || 1, 10));
    }, 5000);
    return () => clearInterval(interval);
  }, [photos]);
  
  // Gestión de música de fondo mejorada
  useEffect(() => {
    const audio = audioRef.current;
    if (client?.gallerySettings?.bgMusic?.url && audio) {
        // Configuraciones iniciales
        audio.volume = 0.6;
        audio.loop = true;
        
        // Función para intentar reproducir
        const playMusic = async () => {
            if (audio && isPlaying) {
                try {
                    await audio.play();
                    setUserInteracted(true);
                    // Si logramos reproducir, quitamos los escuchadores para no repetir carga
                    removeInteractionListeners();
                } catch (err) {
                    // El navegador bloqueó el autoplay, esperamos interacción
                    console.log("Esperando interacción del usuario para sonido...");
                }
            }
        };

        const removeInteractionListeners = () => {
            window.removeEventListener('click', playMusic);
            window.removeEventListener('touchstart', playMusic);
            window.removeEventListener('scroll', playMusic);
            window.removeEventListener('keydown', playMusic);
        };

        // Si cambia la URL, cargamos el nuevo audio
        if (audio.src !== client.gallerySettings.bgMusic.url) {
            audio.src = client.gallerySettings.bgMusic.url;
            audio.load();
        }

        // Intentar sonar de inmediato (fallará si no hay interacción previa)
        playMusic();

        // Escuchar interacciones para desbloquear audio
        window.addEventListener('click', playMusic, { once: true });
        window.addEventListener('touchstart', playMusic, { once: true });
        window.addEventListener('scroll', playMusic, { once: true });
        window.addEventListener('keydown', playMusic, { once: true });

        return () => {
            removeInteractionListeners();
        };
    }
  }, [client, isPlaying]);

  const toggleMusic = () => {
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
          } else {
              audioRef.current.play();
          }
          setIsPlaying(!isPlaying);
          setUserInteracted(true);
      }
  };

  const coverPhoto = photos.find((p: any) => p.isCover) || photos[0]
  
  const toggleFavorite = (id: string) => {
    const newFavs = new Set(favorites)
    if (newFavs.has(id)) newFavs.delete(id)
    else newFavs.add(id)
    setFavorites(newFavs)
    toast({ 
      title: newFavs.has(id) ? 'Añadida a favoritos' : 'Eliminada de favoritos',
      duration: 1500
    })
  }

  const handleSaveSelection = async () => {
    if (favorites.size === 0) {
      toast({ title: "Selección vacía", description: "Debes marcar alguna foto como favorita primero.", variant: "destructive" })
      return
    }

    try {
      // 1. Guardar en Firestore
      const docRef = doc(db, COLLECTIONS.CLIENTS, slug.toUpperCase())
      
      const filenames = Array.from(favorites)
        .map(id => {
          const f = photos.find((p: any) => p.id === id)?.fileName || '';
          return f.replace(/\.[^/.]+$/, ""); // Quitar extensión
        })
        .sort((a: any, b: any) => a.localeCompare(b))

      const photoWithNotesArr = Object.entries(photoNotes)
        .filter(([id, note]) => favorites.has(id) && note.trim())
        .map(([id, note]) => {
          const f = photos.find((p: any) => p.id === id)?.fileName || 'Foto';
          return `- ${f.replace(/\.[^/.]+$/, "")}: ${note}`;
        });

      const extraItems = (cartItems?.length || 0) > 0 
        ? cartItems.map(i => `- ${i.name} (x${i.quantity}) ${i.variantName ? `[${i.variantName}]` : ''}`)
        : ['Ninguno'];

      const finalSummary = `MODO: SELECCIÓN DE GALERÍA\n----------------------------------\nFOTOS SELECCIONADAS (${filenames.length}):\n${filenames.join(', ')}\n\nCOMENTARIOS:\n${photoWithNotesArr.length > 0 ? photoWithNotesArr.join('\n') : 'Sin comentarios'}\n\nARTÍCULOS DE TIENDA:\n${extraItems.join('\n')}`;

      await updateDoc(docRef, {
        'gallerySettings.lastSelection': Array.from(favorites),
        'gallerySettings.photoNotes': photoNotes,
        'gallerySettings.lastUpdate': serverTimestamp(),
      })

      // 2. Enviar correo a través de la API
      await fetch('/api/clients/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.name,
          slug: slug,
          summary: finalSummary
        })
      })
      
      setSummaryText(finalSummary);
      setShowSummary(true);

      toast({ 
        title: "✅ ¡Selección enviada!", 
        description: "Jose ha recibido tu lista correctamente.",
      })
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo enviar la selección", variant: "destructive" })
    }
  }

  const handleOpenShop = (photo: any, productToSelect?: any) => {
    setPhotoToBuy(photo)
    setSearchTerm('')
    setSelectedCustomOptions({})
    
    if (productToSelect) {
      setSelectedProduct(productToSelect)
      setSelectedVariant(null)
    } else {
      setSelectedProduct(null)
      setSelectedVariant(null)
    }
    
    setIsShopModalOpen(true)
  }

  const IsInCart = (productId: string, variantId?: string) => {
    if (!photoToBuy) return false
    return cartItems.some(item => 
      item.productId === productId && 
      (variantId ? item.variantId === variantId : !item.variantId) &&
      item.image === photoToBuy.url
    )
  }

  const getItemsForPhoto = (photoUrl: string) => {
    return (cartItems || []).filter(item => item.image === photoUrl)
  }

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    const safeProducts = Array.isArray(products) ? products : []
    
    // Filtro inicial por estado (MySQL devuelve 0/1 para booleanos)
    const activeProducts = safeProducts.filter(p => {
      const isActive = p?.active === true || p?.active === 1 || p?.active === "1";
      const isVisible = p?.showPrice === true || p?.showPrice === 1 || p?.showPrice === "1";
      return isActive && isVisible;
    });

    if (!term) return activeProducts

    return activeProducts.filter(p => {
      if (!p) return false;
      // Búsqueda en nombre de producto
      const matchesMainName = (p.name || "").toLowerCase().includes(term)
      
      // Búsqueda en nombres de variantes (opciones/tamaños)
      const matchesVariants = Array.isArray(p.variants) && p.variants.some((v: any) => 
        (v?.name || "").toLowerCase().includes(term)
      )

      return matchesMainName || matchesVariants
    })
  }, [products, searchTerm])

  const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!text) return null;
    if (!highlight.trim()) return <>{text}</>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) 
            ? <span key={i} className="bg-orange-100 text-orange-600 rounded-[2px] px-[2px]">{part}</span> 
            : part
        )}
      </>
    );
  }

  const handleAddToOrder = (product: any, variant?: any) => {
    if (!photoToBuy) return;

    // Verificar si hay opciones personalizadas requeridas sin seleccionar
    let customOptions: any[] = [];
    try {
      const rawOptions = product?.customOptions;
      if (rawOptions && typeof rawOptions === 'string') {
        customOptions = JSON.parse(rawOptions) || [];
      }
    } catch (e) { customOptions = []; }

    const missingRequired = Array.isArray(customOptions) ? customOptions.filter(opt => 
      opt.required && (!selectedCustomOptions[opt.title] || selectedCustomOptions[opt.title] === '')
    ) : [];

    if (missingRequired.length > 0) {
      toast({
        title: "Selección incompleta",
        description: `Por favor, elige una opción para: ${missingRequired.map(o => o.title).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    const finalPrice = variant ? variant.price : product.price;

    // Construir nota con opciones personalizadas
    let customOptsString = Object.entries(selectedCustomOptions)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
    
    const finalNotes = `FOTO: ${photoToBuy.url} | Ref: ${photoToBuy.fileName || 'Galería'}${customOptsString ? ` | ${customOptsString}` : ''}`;

    // COMPORTAMIENTO TOGGLE: Si ya está para esta foto, lo quitamos
    const existing = cartItems.find(item => 
      item.productId === product.id && 
      (variant ? item.variantId === variant.id : !item.variantId) &&
      item.image === photoToBuy.url
    );

    if (existing) {
      removeItem(product.id, variant?.id, existing.notes);
      toast({
        title: "Producto eliminado",
        description: `${product.name} quitado de esta foto.`,
      });
    } else {
      addItem({
        id: product.id,
        name: product.name,
        basePrice: product.price,
        price: finalPrice,
        quantity: 1,
        image: photoToBuy.url,
        notes: finalNotes,
        productId: product.id,
        variantId: variant?.id,
        variantName: variant?.name,
        variantPrice: variant?.price,
        tierPricing: product.tierPricing,
        variantBehavior: product.variantBehavior,
        salePrice: product.salePrice
      });

      toast({
        title: " ¡Añadido al carrito!",
        description: `${product.name} ${variant ? `(${variant.name}) ` : ''}con tu foto.`,
      });
    }
    
    setIsShopModalOpen(false)
    setSelectedProduct(null)
    setSelectedVariant(null)
    setSelectedCustomOptions({})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A7C59]"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-12 w-12 text-slate-300 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Galería no encontrada</h1>
        <p className="text-slate-500 mt-2">El enlace parece no ser correcto o la galería ha expirado.</p>
        <Button onClick={() => window.location.href = '/'} className="mt-6 bg-[#4A7C59] rounded-full px-8">Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white selection:bg-[#4A7C59]/10">
      {/* MODO VISTA PREVIA INDICATOR */}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-[110] bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center shadow-lg">
          ESTÁS EN MODO VISTA PREVIA • ASÍ ES COMO VERÁ EL CLIENTE SU GALERÍA
        </div>
      )}

      {/* HERO / PORTADA */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden bg-slate-900">
          <AnimatePresence mode="wait">
            <motion.img 
              key={heroIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              src={photos[heroIndex]?.url || coverPhoto?.url} 
              alt="Slide" 
              className="w-full h-full object-cover opacity-60"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 text-center px-6">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] animate-pulse" />
              <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Galería Privada</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-none">
              {client.gallerySettings?.galleryTitle || client.name}
            </h1>
            <p className="text-white/80 font-medium text-lg tracking-tight max-w-lg mx-auto whitespace-pre-line">
              {client.gallerySettings?.welcomeMessage || 'Bienvenido a tu selección de fotos. Elige tus favoritas y deja que la magia continúe.'}
            </p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/50" />
          <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Desliza para ver</span>
        </div>
      </section>

      {/* INFO BAR - PACK DETAILS */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fotos Incluidas</span>
              <span className="text-xl font-black text-slate-900 leading-none">
                {favorites.size} / <span className="text-[#4A7C59]">{Number(client.gallerySettings?.includedPhotos) === 0 ? 'ILIMITADAS' : (client.gallerySettings?.includedPhotos || 0)}</span>
              </span>
            </div>
            {Number(client.gallerySettings?.includedPhotos) > 0 && favorites.size > (Number(client.gallerySettings?.includedPhotos) || 0) && (
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Extras acumuladas</span>
                <span className="text-lg font-black text-orange-500 leading-none">
                  +{Math.max(0, favorites.size - (Number(client.gallerySettings?.includedPhotos) || 0)) * (Number(client.gallerySettings?.extraPrice) || 0)}€
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 p-1 rounded-full mr-2">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    viewMode === 'grid' ? "bg-white shadow-sm text-[#4A7C59]" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    viewMode === 'list' ? "bg-white shadow-sm text-[#4A7C59]" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
             </div>

             {showOnlyFavorites ? (
               <>
                <Button 
                  onClick={() => setShowOnlyFavorites(false)}
                  variant="destructive"
                  className="rounded-full px-8 h-12 font-black uppercase text-[11px] tracking-widest flex gap-2 shadow-lg shadow-red-500/20"
                >
                  <X className="h-4 w-4" /> Cancelar Selección
                </Button>

                <Button 
                  onClick={handleSaveSelection}
                  className="bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-full px-8 h-12 font-black uppercase text-[11px] tracking-widest shadow-lg shadow-[#4A7C59]/20 flex gap-2"
                >
                  <Send className="h-4 w-4" /> Enviar Selección
                </Button>
               </>
             ) : (
                <Button 
                  onClick={() => {
                    if (favorites.size === 0) {
                      toast({ title: "Sin favoritos", description: "Selecciona alguna foto primero.", variant: "destructive" })
                      return
                    }
                    setShowOnlyFavorites(true)
                    window.scrollTo({ top: 400, behavior: 'smooth' })
                  }}
                  className="bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-full px-8 h-12 font-black uppercase text-[11px] tracking-widest shadow-lg shadow-[#4A7C59]/20 flex gap-2"
                >
                  <Check className="h-4 w-4" /> Confirmar Selección
                </Button>
             )}
          </div>
        </div>
      </div>

      {/* GRID DE FOTOS */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {showOnlyFavorites && (
          <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4">
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Tus fotos seleccionadas</h2>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Estás viendo {!favorites.size ? 'todas las fotos' : `solo tus ${favorites.size} favoritas`}</p>
          </div>
        )}
        {viewMode === 'grid' ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {displayedPhotos.map((photo: any, idx: number) => {
              const photoCartItems = getItemsForPhoto(photo.url)
              const hasComment = !!photoNotes[photo.id]

              return (
                <motion.div
                  layout
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative group overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all"
                  onClick={() => setViewerIndex(photos.findIndex((p:any) => p.id === photo.id))}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.name}
                    className="w-full h-auto rounded-2xl transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Badges de estado en Grid */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                    {favorites.has(photo.id) && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-white text-orange-500 shadow-lg flex items-center justify-center">
                        <Heart className="h-4 w-4 fill-current" />
                      </motion.div>
                    )}
                    {hasComment && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-white text-blue-500 shadow-lg flex items-center justify-center">
                        <MessageCircle className="h-4 w-4" />
                      </motion.div>
                    )}
                    {(photoCartItems?.length || 0) > 0 && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="min-w-7 h-7 px-2 rounded-full bg-[#4A7C59] text-white shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenShop(photo);
                        }}
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span className="text-[10px] font-black">{(photoCartItems?.length || 0)}</span>
                      </motion.div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="bg-black/40 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-white/10">
                      {photo.fileName?.replace(/\.[^/.]+$/, "")}
                    </p>
                  </div>

                  {/* Overlay de la foto */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all",
                            favorites.has(photo.id) ? "bg-[#4A7C59] text-white" : "bg-white/20 text-white hover:bg-white/40"
                          )}
                        >
                          <Heart className={cn("h-4.5 w-4.5", favorites.has(photo.id) && "fill-current")} />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleOpenShop(photo); 
                          }}
                          className={cn(
                            "w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 backdrop-blur-md text-white flex items-center justify-center transition-all",
                          )}
                        >
                          <ShoppingBag className="h-4.5 w-4.5" />
                        </button>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-all">
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Watermark con Logo de Marca */}
                  {(client.gallerySettings?.watermarkEnabled !== false) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none">
                      { (globalConfig?.logoUrl || globalConfig?.logo) ? (
                        <img 
                          src={globalConfig.logoUrl || globalConfig.logo} 
                          alt="Watermark" 
                          className="w-[60%] h-auto object-contain drop-shadow-2xl transition-opacity duration-500" 
                          style={{ opacity: (globalConfig.logoOpacity ?? 20) / 100 }}
                        />
                      ) : (
                        <p className="text-white/30 font-black text-xl uppercase tracking-[0.4em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-center px-4">
                          {client?.gallerySettings?.watermarkText || 'PUJALTE'}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          /* MODO LISTA */
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Miniatura</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Archivo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Favorito</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentario / Nota</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos Extras</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedPhotos.map((photo: any) => {
                    const photoCartItems = getItemsForPhoto(photo.url)
                    return (
                      <tr key={photo.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm border-2 border-white cursor-pointer relative" onClick={() => setViewerIndex(photos.findIndex((p:any) => p.id === photo.id))}>
                            <img src={photo.url} className="w-full h-full object-contain" />
                             {/* Watermark miniatura */}
                             {(client.gallerySettings?.watermarkEnabled !== false) && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <span className="text-white text-[6px] font-black -rotate-45">PUJALTE</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-700 tracking-tight">{photo.fileName?.replace(/\.[^/.]+$/, "")}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ref: {photo.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleFavorite(photo.id)}
                            className={cn(
                              "p-3 rounded-full transition-all scale-110",
                              favorites.has(photo.id) ? "text-orange-500 bg-white shadow-md border-orange-50" : "text-slate-200 hover:text-slate-400"
                            )}
                          >
                            <Heart className={cn("h-5 w-5", favorites.has(photo.id) && "fill-current")} />
                          </button>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="relative">
                            <input 
                              type="text"
                              placeholder="Sin comentarios..."
                              value={photoNotes[photo.id] || ''}
                              onChange={(e) => setPhotoNotes(prev => ({...prev, [photo.id]: e.target.value}))}
                              className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 shadow-inner text-xs font-medium focus:ring-1 focus:ring-[#4A7C59] transition-all placeholder:text-slate-300"
                            />
                            {photoNotes[photo.id] && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#4A7C59]" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(photoCartItems?.length || 0) > 0 ? (
                              photoCartItems.map((item, i) => (
                                <Badge key={i} className="bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/20 hover:bg-[#4A7C59]/20 transition-all font-black text-[9px] uppercase py-1 shadow-sm">
                                  {item.name} {item.variantName ? `(${item.variantName})` : ''}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Nada en cesta</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleOpenShop(photo)}
                            className="bg-orange-50 hover:bg-orange-500 text-orange-500 hover:text-white h-10 w-10 rounded-xl transition-all flex items-center justify-center border border-orange-100"
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER DE GALERÍA */}
      <footer className="bg-slate-50 py-20 px-6 text-center border-t border-slate-100">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-8">
            <ImageIcon className="h-8 w-8 text-[#4A7C59]" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">¿Has terminado tu selección?</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Una vez envíes tu selección, tu fotógrafo favorito recibirá una notificación y comenzará con el proceso de edición final y preparación de tus productos. ¡Estamos deseando que los tengas en tus manos!
          </p>
          <Button 
             onClick={handleSaveSelection}
             className="bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-full px-12 h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-[#4A7C59]/30"
          >
            Confirmar y Enviar Selección
          </Button>
        </div>
      </footer>

      {/* LIGHTBOX / ZOOM MODAL */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black flex flex-col"
          >
            {/* Header Lightbox */}
            <div className="flex items-center justify-between p-6 bg-black/50 backdrop-blur-md text-white absolute top-0 left-0 right-0 z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{selectedPhoto.fileName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => handleOpenShop(selectedPhoto)}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2 font-black uppercase text-[10px] tracking-widest h-10 px-6"
                >
                  <ShoppingBag className="h-4 w-4" /> Comprar
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => toggleFavorite(selectedPhoto.id)}
                  className={cn(
                    "rounded-full gap-2 font-black uppercase text-[10px] tracking-widest h-10",
                    favorites.has(selectedPhoto.id) ? "bg-[#4A7C59] text-white" : "text-white hover:bg-white/10"
                  )}
                >
                  <Heart className={cn("h-4 w-4", favorites.has(selectedPhoto.id) && "fill-current")} />
                  {favorites.has(selectedPhoto.id) ? 'En favoritos' : 'Favorita'}
                </Button>
                <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors ml-4">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Photo View */}
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
               {/* Watermark mejorada en zoom (Logo o Texto) */}
               {(client.gallerySettings?.watermarkEnabled !== false) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none">
                  {globalConfig?.logoUrl ? (
                    <img 
                      src={globalConfig.logoUrl} 
                      alt="Watermark Zoom" 
                      className="w-[80%] sm:w-[60%] h-auto object-contain drop-shadow-2xl" 
                      style={{ opacity: (globalConfig.logoOpacity ?? 15) / 100 }}
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <p className="text-white/10 font-black text-6xl sm:text-9xl uppercase tracking-[0.5em] drop-shadow-xl text-center px-4">
                        {client.gallerySettings?.watermarkText || 'PUJALTE FOTOGRAFÍA'}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <motion.img 
                layoutId={`photo-${selectedPhoto.id}`}
                src={selectedPhoto.url} 
                className="max-w-full max-h-[85vh] object-contain rounded-sm select-none"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              />
            </div>

            {/* Footer Lightbox - Comment System */}
            <div className="p-6 bg-black/80 backdrop-blur-2xl border-t border-white/10">
              <div className="max-w-2xl mx-auto flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 bg-white/5 rounded-2xl px-6 py-4 border border-white/10">
                  <MessageSquare className="h-5 w-5 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Escribe una nota para Jose sobre esta foto..."
                    className="bg-transparent border-none focus:ring-0 text-white text-sm w-full font-medium"
                    value={comments[selectedPhoto.id] || ''}
                    onChange={(e) => {
                      setComments({ ...comments, [selectedPhoto.id]: e.target.value })
                    }}
                  />
                </div>
                <Button 
                   onClick={() => setSelectedPhoto(null)} 
                   className="bg-white text-black hover:bg-slate-100 rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE SELECCIÓN DE PRODUCTO */}
      <Dialog open={isShopModalOpen} onOpenChange={setIsShopModalOpen}>
        <DialogContent className="sm:max-w-[660px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[100] bg-white">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Personaliza tu Fotografía</DialogTitle>
          </DialogHeader>
          
          <div className="p-8 pt-0">
            <div className="flex gap-6 mb-8 p-6 bg-slate-50/50 rounded-[28px] border border-slate-100 backdrop-blur-sm">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl shrink-0 border-4 border-white rotate-1 hover:rotate-0 transition-transform duration-500">
                <img src={photoToBuy?.url} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[11px] font-black text-[#4A7C59] uppercase tracking-[0.2em] mb-1">Imagen Seleccionada</p>
                <p className="text-slate-500 text-[10px] font-bold truncate max-w-[220px] italic">{photoToBuy?.fileName}</p>
                {selectedProduct && (
                   <button 
                    onClick={() => { setSelectedProduct(null); setSelectedVariant(null); }}
                    className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-3 flex items-center gap-2 hover:translate-x-1 transition-transform"
                   >
                    <ChevronLeft className="h-4 w-4" /> Ver catálogo completo
                   </button>
                )}
              </div>
            </div>
            
            {/* PRODUCTOS YA SELECCIONADOS PARA ESTA FOTO */}
            {(() => {
              const photoCartItems = getItemsForPhoto(photoToBuy?.url || '');
              if ((photoCartItems?.length || 0) === 0) return null;

              return (
                <div className="mb-8 px-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-3 w-3" /> Artículos vinculados a esta foto
                  </h3>
                  <div className="space-y-2">
                    {photoCartItems.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-orange-50/50 rounded-[1.5rem] border border-orange-100/50 shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                            {item.name} {item.variantName ? `(${item.variantName})` : ''}
                          </span>
                          <span className="text-[10px] font-bold text-orange-600/60 uppercase tracking-widest mt-0.5">
                            {item.price}€ / unidad
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-white rounded-full border border-orange-100 shadow-sm overflow-hidden h-9">
                            <button 
                              type="button"
                              onClick={() => {
                                updateQuantity(item.id, item.quantity - 1, item.variantId, item.notes);
                                if (item.quantity === 1) toast({ title: "Cesta vacía para esta foto", duration: 1500 });
                              }}
                              className="w-9 h-full flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors"
                            >
                               <span className="text-xl leading-none">−</span>
                            </button>
                            <span className="w-8 text-center text-[11px] font-black text-slate-900">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId, item.notes)}
                              className="w-9 h-full flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors"
                            >
                               <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              removeItem(item.id, item.variantId, item.notes);
                              toast({ title: "Artículo quitado de esta foto", duration: 1500 });
                            }}
                            className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm shadow-orange-500/5"
                          >
                             <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="wait">
                {photoToBuy && client.gallerySettings?.shopRequiresFavorite && !favorites.has(photoToBuy.id) ? (
                  <motion.div 
                    key="no-favorite-message"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-10 px-6 text-center space-y-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200"
                  >
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-orange-500 scale-110 rotate-3">
                      <Heart className="h-10 w-10 fill-current" />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">
                        ¡Esta foto es espectacular!
                      </h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                        Para poder comprar artículos con esta imagen, primero debes <span className="text-[#4A7C59] font-black italic underline">seleccionarla como favorita</span>.
                      </p>
                      
                      {client.gallerySettings?.includedPhotos && client.gallerySettings.includedPhotos > 0 && (
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] bg-orange-100/50 py-2.5 px-6 rounded-full inline-block border border-orange-200 shadow-sm">
                          ✨ Sumará a tus {client.gallerySettings.includedPhotos} fotos incluidas ✨
                        </p>
                      )}
                    </div>

                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photoToBuy.id);
                        toast({ title: "¡Foto seleccionada!", description: "Catálogo de artículos desbloqueado." });
                      }}
                      className="bg-slate-900 hover:bg-black text-white rounded-full h-14 px-10 font-black uppercase text-[11px] tracking-widest shadow-2xl flex gap-2 active:scale-95 transition-all"
                    >
                      <Heart className="h-4 w-4 fill-current" /> Seleccionar para comprar
                    </Button>
                  </motion.div>
                ) : !selectedProduct ? (
                  <motion.div 
                    key="product-list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="relative mb-6 px-1">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar producto (ej: Lienzo, Madera...)" 
                        className="pl-12 h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-[#4A7C59] font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {filteredProducts.map((product) => (
                        <button 
                          key={product.id}
                          onClick={() => {
                            if ((product.variants && (product.variants?.length || 0) > 0) || product.customOptions) {
                              setSelectedProduct(product)
                            } else {
                              handleAddToOrder(product)
                            }
                          }}
                          className="group w-full p-4 rounded-2xl border border-slate-100 hover:border-[#4A7C59] hover:bg-[#4A7C59]/5 transition-all flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div 
                              className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 group-hover:bg-[#4A7C59]/10 transition-colors cursor-zoom-in relative shrink-0 border border-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (product.image) setZoomedProduct(product);
                              }}
                            >
                              {product.image ? (
                                <>
                                  <img src={product.image} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                    <Search className="h-4 w-4 text-white" />
                                  </div>
                                </>
                              ) : (
                                <ShoppingBag className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1">
                            <div>
                              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                                <HighlightText text={product.name} highlight={searchTerm} />
                              </p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {(Array.isArray(product.variants) && product.variants.length > 0) ? `Desde ${Math.min(...product.variants.filter((v:any) => typeof v.price === 'number').map((v:any) => v.price))}€` : `${product.price}€`}
                              </p>
                              {searchTerm && product.variants?.some((v: any) => v.name.toLowerCase().includes(searchTerm.toLowerCase())) && (
                                <p className="text-[9px] font-bold text-[#4A7C59] uppercase mt-1 flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Incluye: <HighlightText text={product.variants.find((v: any) => v.name.toLowerCase().includes(searchTerm.toLowerCase())).name} highlight={searchTerm} />
                                </p>
                              )}
                            </div>
                            </div>
                          </div>
                          <div className="h-8 w-8 rounded-full border-2 border-slate-100 group-hover:border-[#4A7C59] group-hover:bg-[#4A7C59] flex items-center justify-center transition-all">
                            {(product.variants?.length > 0 || product.customOptions) ? (
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-white" />
                            ) : (
                              <Plus className="h-4 w-4 text-slate-300 group-hover:text-white" />
                            )}
                          </div>
                        </button>
                      ))}
                      
                      {filteredProducts.length === 0 && (
                        <div className="py-12 text-center">
                          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No se han encontrado productos</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="variant-list"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="px-2 flex items-center justify-between mb-4">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Personaliza tu producto:</h3>
                       <button 
                        onClick={() => { setSelectedProduct(null); setSelectedVariant(null); }}
                        className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1 hover:text-orange-600 transition-colors"
                       >
                        <ChevronLeft className="h-3 w-3" /> Volver
                       </button>
                    </div>

                    {/* RENDERIZAR OPCIONES PERSONALIZADAS (FORMAS, ETC) */}
                    <div className="space-y-4 px-2 mb-6">
                      {(() => {
                        let customOptions: any[] = [];
                        try {
                          const rawOptions = selectedProduct?.customOptions;
                          if (rawOptions && typeof rawOptions === 'string') {
                            customOptions = JSON.parse(rawOptions) || [];
                          }
                        } catch (e) { 
                          console.error("Error parsing options:", e);
                          customOptions = []; 
                        }

                        if (!Array.isArray(customOptions) || customOptions.length === 0) return null;

                        return customOptions.map((opt, idx) => (
                          <div key={idx} className="space-y-2">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              {opt.title}
                              {opt.required && <span className="text-orange-500">*</span>}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {Array.isArray(opt.values) && opt.values.map((val: string) => (
                                <button
                                  key={val}
                                  onClick={() => setSelectedCustomOptions(prev => ({...prev, [opt.title]: val}))}
                                  className={cn(
                                    "px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight transition-all",
                                    selectedCustomOptions[opt.title] === val
                                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                      : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                                  )}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    <div className="px-2 mb-2">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                         {(selectedProduct?.variants?.length || 0) > 0 ? 'Selecciona el tamaño / opción:' : 'Finalizar selección:'}
                       </h3>
                    </div>
                    {(selectedProduct?.variants?.length || 0) > 0 ? (
                      <div className="grid grid-cols-1 gap-2 px-2">
                        {selectedProduct?.variants?.map((variant: any) => (
                          <button 
                            key={variant.id}
                            onClick={() => handleAddToOrder(selectedProduct, variant)}
                            className={cn(
                              "group w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between text-left shadow-sm hover:shadow-md",
                              IsInCart(selectedProduct?.id, variant.id) 
                                ? "bg-slate-50 border-slate-200 opacity-80" 
                                : "border-slate-50 hover:border-[#4A7C59] hover:bg-white"
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-sm uppercase tracking-tight">
                                <HighlightText text={variant.name} highlight={searchTerm} />
                                {selectedProduct?.id && variant.id && IsInCart(selectedProduct.id, variant.id) && (
                                  <Badge variant="outline" className="ml-2 bg-white text-[8px] font-black uppercase text-[#4A7C59] border-[#4A7C59]">En carrito</Badge>
                                )}
                              </span>
                              <span className="text-xs font-bold text-[#4A7C59] mt-1">{variant.price}€</span>
                            </div>
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                              IsInCart(selectedProduct.id, variant.id)
                                ? "bg-[#4A7C59] text-white"
                                : "bg-slate-50 group-hover:bg-[#4A7C59] group-hover:text-white"
                            )}>
                               {IsInCart(selectedProduct.id, variant.id) ? (
                                 <Check className="h-5 w-5" />
                               ) : (
                                 <Plus className="h-5 w-5 text-slate-300 group-hover:text-white" />
                               )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-2 pb-4">
                        <Button 
                          onClick={() => handleAddToOrder(selectedProduct)}
                          className="w-full bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-2xl h-14 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-[#4A7C59]/10 flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                          <ShoppingBag className="h-4 w-4" /> Añadir al Carrito — {selectedProduct.salePrice || selectedProduct.price}€
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Selecciona una opción para añadir al carrito</p>
            </div>
          </div>

          {/* ZOOM AVANZADO CON NAVEGACIÓN Y BÚSQUEDA */}
          <AnimatePresence>
            {zoomedProduct && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setZoomedProduct(null); }}
                className="absolute inset-0 z-[500] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 rounded-[32px] overflow-hidden"
              >
                {/* TOOLBAR SUPERIOR DEL ZOOM */}
                <div className="absolute top-8 inset-x-8 z-[510] flex gap-4">
                  <div className="relative flex-1 group" onClick={(e) => e.stopPropagation()}>
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 transition-colors" />
                    <Input 
                      placeholder="Busca otros productos..." 
                      className="bg-white/10 hover:bg-white/15 border-none text-white h-16 rounded-[24px] pl-14 focus-visible:ring-white/20 text-lg font-medium transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setZoomedProduct(null)}
                    className="w-16 h-16 bg-white/10 hover:bg-white/20 text-white rounded-[24px] flex items-center justify-center transition-all border border-white/10"
                  >
                    <X className="h-8 w-8" />
                  </button>
                </div>

                <div className="relative w-full flex items-center justify-center group/nav">
                  {/* Flecha Izquierda */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = filteredProducts.findIndex(p => p.id === zoomedProduct.id);
                      const idx = currentIndex > 0 ? currentIndex - 1 : filteredProducts.length - 1;
                      setZoomedProduct(filteredProducts[idx]);
                    }}
                    className="absolute left-0 z-[520] p-6 bg-white/5 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover/nav:opacity-100"
                  >
                    <ChevronLeft className="h-10 w-10" />
                  </button>

                  <motion.div 
                    key={zoomedProduct.id}
                    initial={{ scale: 0.8, opacity: 0, x: 50 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    exit={{ scale: 0.8, opacity: 0, x: -50 }}
                    className="relative max-w-full flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img 
                      src={zoomedProduct.image} 
                      className="max-w-[85%] max-h-[50vh] rounded-[32px] shadow-2xl border-4 border-white/10 object-contain" 
                      alt={zoomedProduct.name}
                    />
                    
                    <div className="mt-10 flex flex-col items-center gap-4 text-center">
                      <div>
                        <h4 className="text-white text-2xl font-black uppercase tracking-tight italic">{zoomedProduct.name}</h4>
                        <p className="text-[#4A7C59] text-[10px] font-black uppercase tracking-[0.3em] mt-2 bg-white/5 px-4 py-1 rounded-full">
                          Desde {zoomedProduct.price ?? zoomedProduct.variants?.[0]?.price}€
                        </p>
                      </div>

                      <Button 
                        onClick={() => {
                          if ((Array.isArray(zoomedProduct.variants) && zoomedProduct.variants.length > 0) || zoomedProduct.customOptions) {
                            setSelectedProduct(zoomedProduct);
                          } else {
                            handleAddToOrder(zoomedProduct);
                          }
                          setZoomedProduct(null);
                        }}
                        className="bg-white hover:bg-slate-100 text-black rounded-full h-16 px-12 font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl transition-all"
                      >
                        <Plus className="h-5 w-5" /> 
                        { (Array.isArray(zoomedProduct.variants) && zoomedProduct.variants.length > 0) || zoomedProduct.customOptions ? 'Configurar y comprar' : 'Añadir a la cesta' }
                      </Button>
                    </div>
                  </motion.div>

                  {/* Flecha Derecha */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = filteredProducts.findIndex(p => p.id === zoomedProduct.id);
                      const idx = currentIndex < filteredProducts.length - 1 ? currentIndex + 1 : 0;
                      setZoomedProduct(filteredProducts[idx]);
                    }}
                    className="absolute right-0 z-[520] p-6 bg-white/5 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover/nav:opacity-100"
                  >
                    <ChevronRight className="h-10 w-10" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* VISOR DE FOTOS FULL SCREEN CON NAVEGACIÓN */}
      <AnimatePresence>
        {viewerIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black"
          >
            {/* Cabecera Visor (OVERLAY) */}
            <div className="absolute top-0 inset-x-0 z-30 p-4 sm:p-6 flex items-center justify-between text-white bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewerIndex(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                <div className="hidden md:flex flex-col">
                  <p className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white leading-none">
                    {displayedPhotos[viewerIndex].fileName?.replace(/\.[^/.]+$/, "")}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">
                    Imagen {viewerIndex + 1} de {displayedPhotos.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => handleOpenShop(displayedPhotos[viewerIndex])}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-11 px-8 font-black uppercase text-[11px] tracking-widest flex gap-2 shadow-lg shadow-orange-500/20"
                >
                  <ShoppingBag className="h-4 w-4" /> Comprar
                </Button>
                <Button 
                  onClick={() => toggleFavorite(displayedPhotos[viewerIndex].id)}
                  variant="outline"
                  className={cn(
                    "rounded-full h-11 px-8 font-black uppercase text-[11px] tracking-widest border-2 transition-all flex gap-2",
                    favorites.has(displayedPhotos[viewerIndex].id)
                      ? "bg-white text-orange-500 border-white shadow-lg"
                      : "bg-transparent text-white border-white/20 hover:bg-white/10"
                  )}
                >
                  <Heart className={cn("h-4 w-4", favorites.has(displayedPhotos[viewerIndex].id) && "fill-current")} /> 
                  {favorites.has(displayedPhotos[viewerIndex].id) ? 'Favorita' : 'Marcar Favorita'}
                </Button>
                <button 
                  onClick={() => setViewerIndex(null)}
                  className="ml-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Cuerpo / Imagen (MAXIMIZADO) */}
            <div className="flex-1 relative w-full h-full flex items-center justify-center p-0 overflow-hidden">
              <button 
                onClick={() => setViewerIndex(prev => prev! > 0 ? prev! - 1 : displayedPhotos.length - 1)}
                className="absolute left-6 z-10 p-4 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all backdrop-blur-sm"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Marca de Agua en Visor */}
                {(client.gallerySettings?.watermarkEnabled !== false) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none">
                    { (globalConfig?.logoUrl || globalConfig?.logo) ? (
                      <img 
                        src={globalConfig.logoUrl || globalConfig.logo} 
                        alt="Watermark Visor" 
                        className="w-[40%] h-auto object-contain drop-shadow-2xl opacity-10" 
                        style={{ opacity: (globalConfig.logoOpacity ?? 20) / 100 }}
                      />
                    ) : (
                      <p className="text-white/10 font-black text-6xl sm:text-9xl uppercase tracking-[0.5em] drop-shadow-xl text-center px-4">
                        {client?.gallerySettings?.watermarkText || 'PUJALTE'}
                      </p>
                    )}
                  </div>
                )}
                <motion.img 
                  key={displayedPhotos[viewerIndex].id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={displayedPhotos[viewerIndex].url}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <button 
                onClick={() => setViewerIndex(prev => prev! < displayedPhotos.length - 1 ? prev! + 1 : 0)}
                className="absolute right-6 z-10 p-4 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all backdrop-blur-sm"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </div>

            {/* Pie / Notas como overlay */}
            <div className="absolute bottom-0 inset-x-0 z-30 p-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center gap-4">
               <div className="w-full max-w-xl relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Escribe una nota para Jose sobre esta foto..."
                    value={photoNotes[displayedPhotos[viewerIndex].id] || ''}
                    onChange={(e) => setPhotoNotes(prev => ({...prev, [displayedPhotos[viewerIndex].id]: e.target.value}))}
                    className="w-full bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-full py-4 pl-12 pr-6 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder:text-white/60 shadow-2xl"
                  />
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Usa las flechas de tu teclado para navegar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE RESUMEN PARA COPIAR */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-2xl rounded-[32px] p-8 overflow-hidden border-none shadow-2xl z-[100]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Resumen para Jose</h2>
              <p className="text-slate-500 text-sm">Este es el resumen listo para enviar. Puedes copiarlo y pegarlo.</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
               <textarea 
                readOnly
                className="w-full h-64 bg-transparent border-none text-[10px] font-mono leading-relaxed focus:outline-none resize-none"
                value={summaryText}
               />
            </div>
            
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(summaryText);
                toast({ title: "¡Copiado!", description: "Listo para pegar en WhatsApp o Email." });
              }}
              className="w-full bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-full h-14 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-[#4A7C59]/10"
            >
              Copiar al portapapeles
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reproductor de Audio */}
      {client?.gallerySettings?.bgMusic?.url && (
          <>
            <audio 
              ref={audioRef}
              src={client.gallerySettings.bgMusic.url}
              loop
              autoPlay
            />
            <button
                onClick={toggleMusic}
                className="fixed top-6 right-6 z-[100] w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-2xl border border-slate-100 flex items-center justify-center text-slate-800 hover:scale-110 active:scale-95 transition-all group"
                title={isPlaying ? "Silenciar" : "Escuchar música"}
            >
                {isPlaying ? (
                    <div className="relative flex items-center justify-center">
                        <Volume2 className="h-5 w-5 text-blue-500" />
                        <span className="absolute inset-[-4px] rounded-full border border-blue-500 animate-ping opacity-20" />
                    </div>
                ) : (
                    <VolumeX className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                )}
            </button>
          </>
      )}
    </div>
  )
}

