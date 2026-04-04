'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
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
  CheckSquare,
  Image as ImageIcon,
  Search,
  LayoutGrid,
  LayoutList,
  MessageCircle,
  AlertCircle,
  Trash2,
  ChevronRight,
  Plus,
  Volume2,
  VolumeX,
  Maximize2,
  EyeOff,
  ChevronsDown,
  Minus,
  Sparkles,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  DownloadCloud,
  Gift
} from 'lucide-react'
import { db, COLLECTIONS } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp, query, collection, where, getDocs, addDoc } from 'firebase/firestore'
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
import { CartSheet } from '@/components/shop/CartSheet'
import Image from 'next/image'


export default function GalleryPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const slug = params.slug as string
  
  const [isCartBumping, setIsCartBumping] = useState(false)
  const [lastCartCount, setLastCartCount] = useState(0)
  const [heartBurst, setHeartBurst] = useState<string | null>(null) // ID de la foto que acaba de recibir un corazón
  
  const { setSlug, addItem, removeItem, updateQuantity, updateItem, items: cartItems, getItemCount, getTotal } = useCartStore()

  // Efecto para animar el carrito cuando cambia el conteo
  useEffect(() => {
    const currentCount = getItemCount()
    if (currentCount > lastCartCount) {
      setIsCartBumping(true)
      setTimeout(() => setIsCartBumping(false), 300)
    }
    setLastCartCount(currentCount)
  }, [cartItems])

  const [client, setClient] = useState<any>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewerNotification, setViewerNotification] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [digitalFilesCount, setDigitalFilesCount] = useState(0)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
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
  const [viewerPhotos, setViewerPhotos] = useState<any[]>([])
  const [photoNotes, setPhotoNotes] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSummary, setShowSummary] = useState(false)
  const [zoomedProduct, setZoomedProduct] = useState<any | null>(null)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [summaryText, setSummaryText] = useState("")
  const [showTextSummary, setShowTextSummary] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const [shakePhotoId, setShakePhotoId] = useState<string | null>(null)
  const [showAddedConfirmation, setShowAddedConfirmation] = useState(false)
  const [addedItemName, setAddedItemName] = useState("")

  // Estados para Oferta Pack Completo Digital
  const [showFullPackPopup, setShowFullPackPopup] = useState(false)
  const [showGiftPopup, setShowGiftPopup] = useState(false)
  const [showFommoMessage, setShowFommoMessage] = useState(false)
  const [fullPackDismissed, setFullPackDismissed] = useState(false)
  const [hasSeenFullPackPopup, setHasSeenFullPackPopup] = useState(false)
  const [hasSeenGiftPopup, setHasSeenGiftPopup] = useState(false)

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 1000], [0, 300])
  
  // Vincular el carrito al slug actual
  useEffect(() => {
    if (slug) {
      setSlug(slug);
    }
  }, [slug]);

  // Estados para Descarte de Fotos
  const [rejectedPhotos, setRejectedPhotos] = useState<Set<string>>(new Set())
  const [showRejected, setShowRejected] = useState(false)
  const [photoToReject, setPhotoToReject] = useState<any>(null)
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  
  // Estados para Música de Fondo
  const [isPlaying, setIsPlaying] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Lógica de cálculo de extras digitales
  const includedCount = client?.gallerySettings?.includedPhotosCount || 0
  const isSelectionLimited = includedCount > 0
  const digitalExtrasCount = isSelectionLimited ? Math.max(0, favorites.size - includedCount) : 0
  const digitalExtrasPrice = client?.gallerySettings?.photoExtraPrice || 0
  const digitalExtrasTotal = digitalExtrasCount * digitalExtrasPrice

  const remainingPhotosCount = Math.max(0, (client?.gallerySettings?.photos?.length || 0) - includedCount)

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);



  const photos = client?.gallerySettings?.photos || []
  const digitalSettings = client?.gallerySettings?.digitalFiles || {};
  const includedPhotosCount = client?.gallerySettings?.includedPhotos ?? digitalSettings.packIncluded ?? 0;
  const displayedPhotos = useMemo(() => {
    let filtered = photos;
    if (showRejected) {
      // Solo mostramos las descartadas para recuperar
      filtered = photos.filter((p: any) => rejectedPhotos.has(p.id));
    } else {
      // Filtramos las descartadas de la vista normal
      filtered = photos.filter((p: any) => !rejectedPhotos.has(p.id));
      if (showOnlyFavorites) {
        filtered = filtered.filter((p: any) => favorites.has(p.id));
      }
      
    }
    return filtered || [];
  }, [photos, rejectedPhotos, showRejected, showOnlyFavorites, favorites]);

  // Sincronizar las fotos del visor cuando se abre
  useEffect(() => {
    if (viewerIndex !== null && viewerPhotos.length === 0) {
      setViewerPhotos(displayedPhotos);
    } else if (viewerIndex === null && viewerPhotos.length > 0) {
      setViewerPhotos([]);
    }
  }, [viewerIndex, displayedPhotos, viewerPhotos.length]);

  const galleryMode = client?.gallerySettings?.digitalFiles?.mode || 'dual';
  const isVisitMode = galleryMode === 'solo-fotos';
  const isArchiveMode = galleryMode === 'archivos';
  const isSelectionMode = galleryMode === 'dual';
  
  // Lógica de descarga basada en el límite (0 = todas)
  const canDownloadAll = Number(includedPhotosCount) === 0;
  const canDownloadPhoto = (photoId: string) => canDownloadAll || favorites.has(photoId);
  
  // En modo archivos mostramos las herramientas de selección SOLO si existe un límite
  const showSelectionToolsInArchive = isArchiveMode && !canDownloadAll;
  
  const isSoloFotos = isVisitMode || (isArchiveMode && canDownloadAll); // Si no hay que elegir, ocultamos la barra de selección global
  
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
        let clientData: any = null;

        // 1. Intentamos buscar por ID directo (DNI) - Retrocompatibilidad
        const docRef = doc(db, COLLECTIONS.CLIENTS, slug.toUpperCase())
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          clientData = docSnap.data();
          setClientId(docSnap.id);
        } else {
          // 2. Si no existe como ID, buscamos por el campo 'slug'
          const q = query(collection(db, COLLECTIONS.CLIENTS), where("slug", "==", slug.toLowerCase()))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            clientData = querySnapshot.docs[0].data();
            setClientId(querySnapshot.docs[0].id);
          }
        }

        if (clientData) {
          setClient(clientData);
          // Cargar favoritos y comentarios si existen
          if (clientData.selections) {
            setFavorites(new Set(clientData.selections.favorites || []));
            setPhotoNotes(clientData.selections.comments || {});
          }
          // Recuperar descartadas
          if (clientData.gallerySettings?.rejectedPhotos) {
            setRejectedPhotos(new Set(clientData.gallerySettings.rejectedPhotos));
          }
        } else {
          setError('La galería no existe o ha expirado.');
        }
      } catch (err) {
        console.error('Error fetching client:', err)
        setError('Error al cargar la galería.')
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
  
  // Estado global de interacción para el audio
  const [hasInteracted, setHasInteracted] = useState(false);

  // 1. Capturamos la interacción del usuario desde el segundo CERO
  useEffect(() => {
    const handleGlobalInteraction = () => {
      setHasInteracted(true);
      // Una vez capturado, quitamos los listeners para ahorrar recursos
      window.removeEventListener('click', handleGlobalInteraction);
      window.removeEventListener('touchstart', handleGlobalInteraction);
      window.removeEventListener('scroll', handleGlobalInteraction);
      window.removeEventListener('keydown', handleGlobalInteraction);
    };

    window.addEventListener('click', handleGlobalInteraction);
    window.addEventListener('touchstart', handleGlobalInteraction);
    window.addEventListener('scroll', handleGlobalInteraction);
    window.addEventListener('keydown', handleGlobalInteraction);

    return () => {
      window.removeEventListener('click', handleGlobalInteraction);
      window.removeEventListener('touchstart', handleGlobalInteraction);
      window.removeEventListener('scroll', handleGlobalInteraction);
      window.removeEventListener('keydown', handleGlobalInteraction);
    };
  }, []);

  // 2. Gestión de música de fondo Pro - Sincronizada con interacción y visibilidad
  useEffect(() => {
    const audio = audioRef.current;
    if (client?.gallerySettings?.bgMusic?.url && audio) {
        audio.volume = 0.5;
        audio.loop = true;

        if (audio.src !== client.gallerySettings.bgMusic.url) {
            audio.src = client.gallerySettings.bgMusic.url;
            audio.load();
        }

        // Si ya interactuó o cuando interactúe, intentamos reproducir
        if ((hasInteracted || isPreview) && isPlaying) {
          audio.play().then(() => {
            setUserInteracted(true);
          }).catch(e => console.log("Error al reproducir audio:", e));
        }
    }

    // GESTIÓN DE VISIBILIDAD: Parar música si salimos de la pestaña
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        // Pausamos pero mantenemos el estado isPlaying para saber que debe sonar al volver
        audio.pause();
      } else {
        // Reanudamos solo si el usuario tenía la música activa
        if (isPlaying && (hasInteracted || isPreview)) {
          audio.play().catch(e => console.log("Error reanudando audio:", e));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [client, hasInteracted, isPlaying, isPreview]);

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
    const alreadyFavorite = favorites.has(id);
    const newFavs = new Set(favorites)
    if (alreadyFavorite) {
      newFavs.delete(id)
    } else {
      newFavs.add(id)
      setHeartBurst(id)
      setTimeout(() => setHeartBurst(null), 1000)
    }
    setFavorites(newFavs)

    // LÓGICA DE REGALO POR FIDELIDAD 🎁💎
    // Si elige el 81% o más (ej: 13 de 16), ¡le regalamos el resto!
    if (!alreadyFavorite && !hasSeenGiftPopup && photos.length > 5) { // Solo si hay fotos suficientes
      const threshold = Math.max(1, Math.floor(photos.length * 0.81));
      if (newFavs.size >= threshold) {
        setShowGiftPopup(true);
        setHasSeenGiftPopup(true);
      }
    }

    // Notificación rápida e integrada
    setViewerNotification(alreadyFavorite ? "Eliminada de favoritos" : "Añadida a favoritos");
    setTimeout(() => setViewerNotification(null), 1200);
  }

  const handleAcceptGift = () => {
    // 1. Seleccionar TODAS las fotos de la galería automáticamente
    const allIds = photos.map((p: any) => p.id);
    setFavorites(new Set(allIds));
    
    // 2. Añadir el Regalo al carrito con valor 0€
    const giftProduct = {
      id: 'gift-full-gallery',
      name: 'REGALO: GALERÍA COMPLETA DIGITAL',
      price: 0,
      basePrice: 0, // Añadido para corregir el error de tipado
      image: photos[0]?.url || '',
      type: 'digital',
      quantity: 1,
      options: { 'Promoción': 'Fidelidad 100% Descuento' }
    };
    
    // Usamos el addItem del store del carrito
    addItem(giftProduct);
    
    // 3. Cerrar popup y avisar
    setShowGiftPopup(false);
    setShowOnlyFavorites(false); // Mostramos todas para que vea el éxito
    
    toast({ 
      title: "🎁 ¡GALERÍA COMPLETADA!", 
      description: "Hemos añadido todas las fotos y el pack completo a tu cesta gratis.", 
      variant: "default" 
    });
  }
  
  const handleRejectAction = async (photo: any) => {
    const isAlreadyRejected = rejectedPhotos.has(photo.id);

    if (showRejected || isAlreadyRejected) {
      // Si estamos en modo explorador de rechazadas o la foto ya está marcada como rechazada, RESTAURAMOS directamente
      const newRejected = new Set(rejectedPhotos);
      newRejected.delete(photo.id);
      setRejectedPhotos(newRejected);
      
      // Si era la última foto del modo "solo rechazadas", volvemos a la galería normal
      if (showRejected && newRejected.size === 0) {
        setShowRejected(false);
      }
      
      try {
        const docRef = doc(db, COLLECTIONS.CLIENTS, clientId || slug.toUpperCase());
        await updateDoc(docRef, {
          'gallerySettings.rejectedPhotos': Array.from(newRejected)
        });
        setViewerNotification("¡FOTO RECUPERADA!");
        setTimeout(() => setViewerNotification(null), 1500);
      } catch (e) { 
        console.error("Error al restaurar:", e);
        toast({ title: "Error al actualizar", description: "No se pudo guardar el cambio en el servidor.", variant: "destructive" });
      }
      return;
    }

    // Modo normal: Preparar para descartar (Aquí sí pedimos confirmación)
    setPhotoToReject(photo);
    setIsRejectConfirmOpen(true);
  }

  const confirmReject = async () => {
    if (!photoToReject) return;
    
    const photoId = photoToReject.id;
    setShakePhotoId(photoId); // Activar sacudida
    
    // Esperar a que termine la animación antes de ocultarla
    setTimeout(async () => {
      const newRejected = new Set(rejectedPhotos);
      newRejected.add(photoId);
      setRejectedPhotos(newRejected);
      
      // Si era favorita, la quitamos
      if (favorites.has(photoId)) {
        const newFavs = new Set(favorites);
        newFavs.delete(photoId);
        setFavorites(newFavs);
      }
      
      try {
        const docRef = doc(db, COLLECTIONS.CLIENTS, clientId || slug.toUpperCase());
        await updateDoc(docRef, {
          'gallerySettings.rejectedPhotos': Array.from(newRejected),
          'gallerySettings.lastSelection': Array.from(favorites)
        });
        setViewerNotification("¡FOTO DESCARTADA!");
        setTimeout(() => setViewerNotification(null), 1500);
      } catch (e) { 
        console.error("Error al descartar:", e);
        toast({ title: "Error al guardar", description: "No se pudo sincronizar el descarte.", variant: "destructive" });
      }
      
      setShakePhotoId(null);
      setIsRejectConfirmOpen(false);
      setPhotoToReject(null);
    }, 600);
  }

  const handleGoToCheckout = () => {
    if (digitalExtrasCount > 0) {
      // Eliminar extras previos del carrito para no duplicar
      const previousExtra = cartItems.find(item => item.id === 'digital-extra');
      if (previousExtra) {
          removeItem('digital-extra', undefined, undefined);
      }

      // Añadir el bloque de fotos extra como un producto al carrito
      addItem({
        id: 'digital-extra',
        name: `Archivos Digitales Extra (${digitalExtrasCount} u.)`,
        price: digitalExtrasPrice,
        basePrice: digitalExtrasPrice, // Propiedad requerida por CartItem
        quantity: digitalExtrasCount,
        image: Array.from(favorites)[0] ? displayedPhotos.find(p => p.id === Array.from(favorites)[0])?.url : undefined,
        isDigital: true,
        notes: `Selección de la galería: ${slug}`
      });
      
      toast({ title: "¡Extras añadidos!", description: "Se han añadido las fotos adicionales al carrito." });
    }
    
    setIsCartOpen(true);
  };

  const handleDeclineOffer = () => {
    setShowFullPackPopup(false);
    setShowFommoMessage(true);
    setTimeout(() => {
      setShowFommoMessage(false);
      handleSaveSelection(true); 
    }, 6000);
  };

  const handleAcceptFullPack = () => {
    // Pepe: Añadimos el pack completo como un producto especial al carrito
    const fullPackPrice = Number(client?.gallerySettings?.digitalFiles?.fullPackPrice) || 0;
    
    addItem({
      id: 'digital-full-pack',
      name: `Galería Completa (${photos.length} fotos)`,
      price: fullPackPrice,
      basePrice: fullPackPrice,
      quantity: 1,
      image: photos[0]?.url,
      isDigital: true,
      notes: `Compra de galería completa para: ${slug}`
    });

    toast({ 
      title: "🎁 ¡Pack Completo añadido!", 
      description: "Ya tienes todas tus fotos en la cesta. Puedes seguir añadiendo álbumes o marcos." 
    });

    setShowFullPackPopup(false);
    // Pepe: Ya no llamamos a handleSaveSelection aquí para que el cliente pueda seguir comprando complementos.
  };

  const handleDownloadArchive = async () => {
    if (favorites.size === 0) {
      toast({ title: "Selección vacía", description: "Debes marcar alguna foto como favorita primero.", variant: "destructive" })
      return
    }
    window.open(`/api/download-all?slug=${slug}${!canDownloadAll ? '&favoritesOnly=true' : ''}`, '_blank');
  }

  const handleSaveSelection = async (ignoreOffers = false) => {
    // Activamos el filtro de favoritas para el repaso final
    setShowOnlyFavorites(true);
    if (favorites.size === 0) {
      toast({ title: "Selección vacía", description: "Debes marcar alguna foto como favorita primero.", variant: "destructive" })
      return
    }

    // ESTRATEGIA TRIPLE DE MARKETING (3 TIPOS DE CLIENTE)
    if (!ignoreOffers) {
      // 1. EL "JUSTO" (Exactamente las incluidas): Empujoncito final
      if (favorites.size === Number(includedPhotosCount) && 
          client?.gallerySettings?.digitalFiles?.fullPackPrice > 0 && 
          Number(includedPhotosCount) > 0) {
        setShowFullPackPopup(true)
        return
      }

      // 2. EL "FIEL / FAN" (75% de la galería total): Premio por su lealtad
      const totalGalleryCount = photos.length
      if (favorites.size >= totalGalleryCount * 0.75 && 
          !hasSeenGiftPopup && 
          favorites.size < totalGalleryCount) {
        setShowGiftPopup(true) // Pepe: He creado este estado para avisarles del regalo
        setHasSeenGiftPopup(true)
        return
      }
    }

    try {
      const docRef = doc(db, COLLECTIONS.CLIENTS, clientId || slug.toUpperCase())
      
      const favoritesList = Array.from(favorites).map(id => {
        const p = photos.find((photo: any) => photo.id === id);
        return p?.fileName?.replace(/\.[^/.]+$/, "") || "Sin nombre";
      }).sort((a: any, b: any) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      const photoWithNotesArr = Object.entries(photoNotes)
        .filter(([id, note]) => favorites.has(id) && note.trim())
        .map(([id, note]) => {
          const f = photos.find((p: any) => p.id === id)?.fileName || 'Foto';
          return `📝 ${f.replace(/\.[^/.]+$/, "")}: ${note}`;
        });

      const extraItems = (cartItems?.length || 0) > 0 
        ? cartItems.map(i => `• ${i.name} ${i.quantity > 1 ? `(x${i.quantity})` : ''} ${i.variantName ? `[${i.variantName}]` : ''}`)
        : ['Sin artículos adicionales'];

      const finalSummary = `📸 SELECCIÓN DE GALERÍA: ${client?.name || 'Cliente'}\n` +
        `----------------------------------------\n` +
        `✅ Total seleccionadas: ${favoritesList.length}\n\n` +
        `🎞️ FOTOS SELECCIONADAS:\n${favoritesList.join(', ')}\n\n` +
        `💬 COMENTARIOS:\n${photoWithNotesArr.length > 0 ? photoWithNotesArr.join('\n') : 'Sin comentarios'}\n\n` +
        `🛒 ARTÍCULOS DE TIENDA:\n${extraItems.join('\n')}`;

      await updateDoc(docRef, {
        'gallerySettings.lastSelection': Array.from(favorites),
        'gallerySettings.photoNotes': photoNotes,
        'gallerySettings.selectionItems': cartItems, // Guardamos los artículos de tienda seleccionados
        'gallerySettings.lastUpdate': serverTimestamp(),
        'gallerySettings.selectionConfirmed': true,
        'gallerySettings.status': 'EDITAR'
      })

      // 2. Enviar correo a través de la API
      await fetch('/api/clients/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client?.name || 'Cliente',
          slug: slug,
          summary: finalSummary
        })
      })

      // --- PEPE: CREACIÓN DE PEDIDO OFICIAL (MySQL via API) ---
      if (cartItems && cartItems.length > 0) {
        try {
          await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: slug.toUpperCase(),
              total: cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
              status: 'pending',
              paymentMethod: 'cash', // O el método que prefieras por defecto
              notes: `Confirmación desde galería ${slug}.`,
              customer: {
                firstName: client?.name || 'Cliente',
                lastName: '',
                email: client?.email || '',
                phone: client?.phone || '',
                address: client?.address || 'Recogida en estudio'
              },
              items: cartItems.map(item => ({
                id: item.id,
                productName: item.name,
                variantName: item.variantName || null,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes || null,
                fileUrl: item.fileUrl || item.image || null,
                fileName: item.fileName || null,
                image: item.image || item.fileUrl || null
              }))
            })
          });
        } catch (error) {
          console.error("Error al crear el pedido oficial:", error);
        }
      }
      // -------------------------------------------------------
      
      setSummaryText(finalSummary);
      setShowSummary(true);

      toast({ 
        title: "✅ ¡Selección enviada!", 
        description: "Su selección ha sido recibida correctamente por nuestro equipo.",
      })
    } catch (e) {
      console.error("Error al guardar selección:", e)
      toast({ title: "Error", description: "No se pudo enviar la selección. Por favor, contacta con nosotros.", variant: "destructive" })
    }
  }

  const selectAllPhotos = () => {
    const allIds = photos.map((p: any) => p.id);
    setFavorites(new Set(allIds));
    toast({ title: "¡Seleccionadas!", description: "Has seleccionado todas las fotos de la galería.", variant: "default" });
    setShowOnlyFavorites(true); 
  }

  const clearSelection = () => {
    setShowClearConfirm(true);
  }

  const handleConfirmClear = () => {
    setFavorites(new Set());
    setShowClearConfirm(false);
    toast({ title: "Selección limpia", description: "Se han quitado todas las fotos de tus favoritas.", variant: "default" });
  }

  const cancelSelection = () => {
    setShowCancelConfirm(true);
  }

  const handleConfirmCancel = () => {
    // 1. Clear selection locally
    setFavorites(new Set());
    setShowOnlyFavorites(false);
    setShowCancelConfirm(false);
    
    toast({ title: "Selección reiniciada", description: "Hemos limpiado tu selección para que puedas empezar de cero.", variant: "default" });
  }

  const sendWhatsAppSelection = () => {
    const phone = globalConfig?.whatsappConfig?.phone || "34650494728"; 
    const galleryName = client?.name || "Galería Privada";
    
    let message = `✨ *¡NUEVA SELECCIÓN DE FAVORITOS!* ✨\n\n`;
    message += `Hola *Pujalte Fotografía*, he terminado mi selección en la galería:\n\n`;
    message += `🖼️ *GALERÍA:* ${galleryName.toUpperCase()}\n`;
    message += `👤 *CLIENTE:* ${client?.name}\n\n`;
    message += `📦 *RESUMEN DE SELECCIÓN:*\n`;
    message += `---------------------------------\n`;
    const cleanSummary = summaryText.includes('LISTA PARA COPIAR:') ? summaryText.split('LISTA PARA COPIAR:')[0] : summaryText;
    message += cleanSummary; 
    message += `\n---------------------------------\n`;
    message += `🔗 _Enviado desde mi Galería de Cliente_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${encodedMessage}`, '_blank');
  }

  const handleOpenShop = (photo: any, productToSelect?: any) => {
    setPhotoToBuy(photo)
    setSearchTerm('')
    setSelectedCustomOptions({})
    setZoomedProduct(null) 
    
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
    let activeProducts = (Array.isArray(products) ? products : []).filter(p => {
      const isActive = p?.active === true || p?.active === 1 || p?.active === "1";
      const isVisible = p?.showPrice === true || p?.showPrice === 1 || p?.showPrice === "1";
      return isActive && isVisible;
    });

    // Archivo Digital Base - Usando constantes globales
    if (digitalSettings?.enabled) {
      const isExtra = digitalFilesCount >= includedPhotosCount;
      
      // PRIORIDAD: Precio Individual de la Foto > Precio Extra Global > 0
      let currentPrice = photoToBuy?.price;
      if (currentPrice === null || currentPrice === undefined) {
          currentPrice = isExtra ? (digitalSettings.extraPrice || digitalSettings.price || 15) : 0;
      }

      const digitalProduct = {
        id: 'digital-file',
        name: 'Archivo Digital (Máxima Calidad)',
        price: currentPrice,
        image: 'https://cdn-icons-png.flaticon.com/512/8242/8242984.png',
        description: 'Fotografía en formato digital a máxima resolución, sin marcas de agua y editada.',
        isDigital: true,
        category: 'Digital',
        active: true,
        showPrice: true
      };

      if (!term || digitalProduct.name.toLowerCase().includes(term)) {
        activeProducts = [digitalProduct, ...activeProducts];
      }

      // OFERTA PACK COMPLETO
      if (digitalSettings.fullPackPrice > 0) {
        const fullPackProduct = {
          id: 'digital-full-pack',
          name: '¡OFERTA! GALERÍA DIGITAL COMPLETA',
          price: digitalSettings.fullPackPrice,
          image: 'https://cdn-icons-png.flaticon.com/512/8242/8242984.png',
          description: 'Recibe TODAS las fotografías de la galería en máxima resolución a un precio especial de lote.',
          active: true,
          showPrice: true,
          isDigital: true
        };
        if (!term || fullPackProduct.name.toLowerCase().includes(term)) {
          activeProducts = [fullPackProduct, ...activeProducts];
        }
      }
    }

    if (!term) return activeProducts

    return activeProducts.filter(p => {
      if (!p) return false;
      const matchesMainName = (p.name || "").toLowerCase().includes(term)
      const matchesVariants = Array.isArray(p.variants) && p.variants.some((v: any) => 
        (v?.name || "").toLowerCase().includes(term)
      )
      return matchesMainName || matchesVariants
    })
  }, [products, searchTerm, digitalSettings, includedPhotosCount, digitalFilesCount, photoToBuy])

  // Sincronizar contador de archivos digitales y sus precios
  useEffect(() => {
    const digitals = cartItems.filter(item => item.productId === 'digital-file-product');
    setDigitalFilesCount(digitals.length);

    const digitalSettings = client?.gallerySettings?.digitalFiles;
    if (digitalSettings?.enabled) {
      const included = digitalSettings.packIncluded || 0;
      const extraPrice = digitalSettings.extraPrice || digitalSettings.price || 15;
      const fullPrice = digitalSettings.fullPackPrice || 0;

      // Filtrar los que no tienen precio individual para aplicar la lógica base
      const standardDigitals = digitals.filter(item => !item.hasIndividualPrice);

      // Recalcular precios de cada item digital ESTÁNDAR en el carrito
      standardDigitals.forEach((item, index) => {
        let correctPrice = index < included ? 0 : extraPrice;
        
        if (fullPrice > 0) {
          const extraCount = Math.max(0, index + 1 - included);
          if (extraCount * extraPrice > fullPrice) {
            const paidPreviously = Math.max(0, index - included) * extraPrice;
            if (paidPreviously >= fullPrice) {
              correctPrice = 0;
            } else {
              correctPrice = Math.max(0, fullPrice - paidPreviously);
            }
          }
        }

        if (item.price !== correctPrice) {
          updateItem(item.id, item.variantId, item.notes, { price: correctPrice, basePrice: correctPrice });
        }
      });
    }
  }, [cartItems, client?.gallerySettings?.digitalFiles]);

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

    const finalPrice = variant?.price ?? (product.price || 0);

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
      const individualPrice = photoToBuy?.price;
      const isDigital = product.id === 'digital-file-product';

      addItem({
        id: product.id,
        name: product.name,
        basePrice: isDigital ? (individualPrice ?? product.price) : product.price,
        price: finalPrice,
        quantity: 1,
        image: photoToBuy.url,
        fileName: (photoToBuy.fileName || '').replace(/\.(jpg|jpeg|png|webp|gif|mp4|mov|heic|heif)$/i, ''),
        fileUrl: photoToBuy.url,
        productId: product.id,
        variantId: variant?.id,
        variantName: variant?.name,
        variantPrice: variant?.price,
        notes: isDigital && individualPrice !== undefined && individualPrice !== null 
          ? `[PRECIO INDIVIDUAL] ${finalNotes}` 
          : finalNotes,
        variantBehavior: product.variantBehavior,
        isDigital: product.isDigital,
        hasIndividualPrice: isDigital && (individualPrice !== null && individualPrice !== undefined)
      });

      // Notificación elegante en la parte inferior
      setViewerNotification(`¡${product.name} añadido!`);
      setTimeout(() => setViewerNotification(null), 1500);

      setAddedItemName(product.name);
      setShowAddedConfirmation(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A7C59]"></div>
      </div>
    )
  }

  if (!client || error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-12 w-12 text-slate-300 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
          {error || 'Galería no encontrada'}
        </h1>
        <p className="text-slate-500 mt-2">El enlace parece no ser correcto o la galería ha expirado.</p>
        <Button onClick={() => window.location.href = '/'} className="mt-6 bg-[#4A7C59] rounded-full px-8">Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white selection:bg-[#4A7C59]/10">
      {/* MODO VISTA PREVIA INDICATOR */}
      {isPreview && (
        <div className="fixed bottom-0 left-0 right-0 z-[110] bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center shadow-lg pointer-events-none">
          ESTÁS EN MODO VISTA PREVIA • ASÍ ES COMO VERÁ EL CLIENTE SU GALERÍA
        </div>
      )}

      {/* HERO / PORTADA */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden bg-slate-900">
            <motion.div 
              style={{ y: heroY }}
              key={heroIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={photos[heroIndex]?.url || coverPhoto?.url} 
                alt="Slide" 
                fill
                priority
                className="object-cover opacity-60"
                sizes="100vw"
              />
            </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 text-center px-6">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2 sm:space-y-4"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] animate-pulse" />
              <span className="text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Galería Privada</span>
            </div>
            <h1 className="text-[32px] sm:text-7xl font-black text-white uppercase tracking-tighter leading-none">
              {client.gallerySettings?.galleryTitle || client.name}
            </h1>
            {client.gallerySettings?.gallerySubtitle && (
              <p className="text-white/60 font-black text-[10px] sm:text-sm uppercase tracking-[0.2em] max-w-lg mx-auto whitespace-pre-wrap">
                {client.gallerySettings.gallerySubtitle}
              </p>
            )}
            <p className="text-white/80 font-medium text-[2.4vw] sm:text-base tracking-tighter sm:tracking-tight w-full sm:max-w-4xl mx-auto whitespace-nowrap">
              Bienvenido a tu selección de fotos. Elige tus favoritas y deja que la magia continúe.
            </p>
          </motion.div>
        </div>

        {/* Botón de Música Flotante en el Slider */}
        <button 
          onClick={toggleMusic}
          className="absolute top-10 right-10 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 group"
          title={isPlaying ? "Silenciar" : "Escuchar música"}
        >
          {isPlaying ? (
            <div className="relative flex items-center justify-center">
              <Volume2 className="h-5 w-5" />
              <span className="absolute inset-[-6px] rounded-full border border-white animate-ping opacity-30" />
            </div>
          ) : (
            <VolumeX className="h-5 w-5 opacity-40 group-hover:opacity-100" />
          )}
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Desliza para ver</span>
        </div>
      </section>

      {/* INFO BAR - PACK DETAILS */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 py-1.5 sm:py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-1.5 sm:px-6 flex flex-row flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            {isSelectionMode ? (
              <>
                {/* Contador Total Eliminado */}
                
                {/* BOTONES IZQUIERDA: CORAZÓN Y OJO */}
                <div className="flex items-center gap-1.5 sm:gap-2 pr-4 border-r border-slate-100 mr-2">
                   {/* Favoritas */}
                   <button 
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={cn(
                      "flex items-center gap-2 px-3 sm:px-4 h-9 sm:h-10 rounded-full border text-[9px] font-black uppercase transition-all shadow-sm active:scale-95 shrink-0",
                      showOnlyFavorites 
                        ? "bg-red-500 border-red-500 text-white shadow-red-200 shadow-lg" 
                        : (favorites.size > 0 
                          ? "bg-rose-50 border-rose-100 text-red-500" 
                          : "bg-white border-slate-100 text-slate-300")
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5", favorites.size > 0 && "fill-current")} />
                    <span className={cn(
                      "font-black",
                      showOnlyFavorites 
                        ? "text-white opacity-80" 
                        : (favorites.size > 0 ? "text-red-600" : "text-slate-300")
                    )}>{favorites.size}</span>
                  </button>

                  {/* BOTONES MAESTROS DE ACCIÓN (Funto al corazón) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2">
                    <button 
                        onClick={selectAllPhotos}
                        className="h-9 sm:h-10 px-3 sm:px-4 rounded-full bg-[#4A7C59] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#4A7C59]/20 hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase tracking-widest border border-[#4A7C59]"
                    >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Las quiero todas</span>
                        <span className="sm:inline sm:hidden">Todas</span>
                    </button>
                    
                    {favorites.size > 0 && (
                        <button 
                            onClick={cancelSelection}
                            className="h-9 sm:h-10 px-3 sm:px-4 rounded-full bg-white text-red-500 border border-red-100 flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all text-[9px] font-black uppercase tracking-widest"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest px-1">Limpiar selección</span>
                        </button>
                    )}
                  </div>

                  {/* Descartadas */}
                  {(rejectedPhotos.size > 0 || showRejected) && (
                    <button
                      onClick={() => setShowRejected(!showRejected)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 h-9 sm:h-10 rounded-full transition-all font-black text-[9px] uppercase border shrink-0 active:scale-95 shadow-sm",
                        showRejected 
                          ? "bg-orange-500 border-orange-500 text-white shadow-orange-100 shadow-lg" 
                          : (rejectedPhotos.size > 0 
                            ? "bg-orange-50 border-orange-100 text-orange-500" 
                            : "bg-white border-slate-100 text-slate-300 hover:text-orange-500")
                      )}
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      <span className={cn(
                        "font-black",
                        showRejected 
                          ? "text-white opacity-80" 
                          : (rejectedPhotos.size > 0 ? "text-orange-600" : "text-slate-300")
                      )}>{rejectedPhotos.size}</span>
                    </button>
                  )}
                </div>

                {Number(includedPhotosCount) > 0 && favorites.size > Number(includedPhotosCount) && (
                  <div className="flex flex-col border-l border-slate-100 pl-2 sm:pl-6">
                    <span className="text-[7px] sm:text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none">Extras</span>
                    <span className="text-xs font-black text-orange-500 leading-none mt-0.5">
                      +{Math.max(0, favorites.size - Number(includedPhotosCount)) * (Number(client.gallerySettings?.extraPrice || digitalSettings.extraPrice) || 0)}€
                    </span>
                  </div>
                )}
              </>
            ) : isArchiveMode ? (
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Fotos listas</span>
                <span className="text-sm font-black text-[#4A7C59] leading-none mt-0.5">
                  {photos.length} archivos para descarga
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Modo</span>
                <span className="text-sm font-black text-slate-900 leading-none mt-0.5 italic">
                  Solo Visualización
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-3 shrink-0">
             <div className="flex bg-slate-100/60 p-1.5 rounded-full border border-slate-200/40 shadow-inner shrink-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-7 sm:px-4 py-3 sm:py-2.5 rounded-full transition-all duration-300 flex items-center justify-center active:scale-90",
                    viewMode === 'grid' 
                      ? "bg-white text-[#4A7C59] shadow-[0_4px_20px_rgba(0,0,0,0.1)] scale-105" 
                      : "text-slate-300 hover:text-slate-500"
                  )}
                >
                  <LayoutGrid className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-7 sm:px-4 py-3 sm:py-2.5 rounded-full transition-all duration-300 flex items-center justify-center active:scale-90",
                    viewMode === 'list' 
                      ? "bg-white text-[#4A7C59] shadow-[0_4px_20px_rgba(0,0,0,0.1)] scale-105" 
                      : "text-slate-300 hover:text-slate-500"
                  )}
                >
                  <LayoutList className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
             </div>

               {/* Botón de Descartadas movido a la izquierda */}

              {isArchiveMode && (
                <a 
                  href={`/api/download-all?slug=${slug}${!canDownloadAll ? '&favoritesOnly=true' : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 h-8 sm:h-9 rounded-lg bg-[#4A7C59] text-white font-black uppercase text-[8px] sm:text-[9px] tracking-tighter shadow-sm hover:translate-y-[-1px] transition-all shrink-0 ml-4"
                >
                  <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>{canDownloadAll ? 'Descargar todo' : `Descargar ${favorites.size} fotos`}</span>
                </a>
              )}

                  {/* Botón de Favoritas movido a la izquierda */}

                  {isSelectionMode && (
                    <button 
                      onClick={() => setIsCartOpen(true)}
                      className="bg-slate-900 text-white rounded-2xl h-12 sm:h-14 px-6 sm:px-8 font-black uppercase text-[10px] sm:text-[11px] tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:bg-black transition-all flex items-center justify-center gap-3 shrink-0 active:scale-95 border-b-4 border-black/30 ml-6 sm:ml-10"
                    >
                      <div className="relative">
                        <ShoppingBag className="h-5 w-5 text-white" />
                        {getItemCount() > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[9px] h-3.5 min-w-[0.875rem] px-0.5 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                            {getItemCount()}
                          </span>
                        )}
                      </div>
                      <span>Ver Cesta</span>
                    </button>
                  )}
           </div>
        </div>
      </div>

      {/* GRID DE FOTOS */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* CABECERA: MODO FAVORITAS */}
        {showOnlyFavorites && (
          <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4">
             <h2 className="text-3xl font-black text-slate-910 uppercase tracking-tighter italic">Tus fotos seleccionadas</h2>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">Repasa tu colección antes de finalizar</p>
          </div>
        )}
        
        {/* CABECERA: ESTADO DE SELECCIÓN Y PROGRESO (DISEÑO PREMIUM) */}
        {photos.length > 0 && !showRejected && !isSoloFotos && (
          <div className="mb-16 max-w-xl mx-auto px-4">
            <div className="flex items-end justify-between mb-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#4A7C59] tracking-[0.3em] uppercase opacity-60">Tu selección actual</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{favorites.size}</span>
                  <span className="text-slate-200 text-xl font-medium tracking-tighter">/ {photos.length} fotos</span>
                </div>
                
                {/* BOTÓN PERSISTENTE OFERTA (Escenario 3: Cliente que gasta el +30% de extras) */}
                {fullPackDismissed && 
                 client?.gallerySettings?.digitalFiles?.fullPackPrice > 0 && 
                 favorites.size >= (Number(includedPhotosCount) * 1.3) && 
                 favorites.size < photos.length && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFullPackPopup(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-[#4A7C59] to-[#5a9c6e] text-white px-3 py-1.5 rounded-full shadow-lg shadow-[#4A7C59]/20 mt-2 border border-white/20 w-fit group"
                  >
                    <Sparkles className="h-3 w-3 animate-shine group-hover:rotate-12 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Comprar Galería Completa
                    </span>
                  </motion.button>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-3 text-right">
                <div className="inline-flex items-center gap-2 bg-white border border-slate-100 px-4 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all">
                  <Maximize2 className="h-3 w-3 text-[#4A7C59] animate-pulse" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Haz click para ampliar</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ImageIcon className="h-2.5 w-2.5" />
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{isSoloFotos ? 'Boda' : 'Formato original'}</span>
                </div>
              </div>
            </div>
            
            <div className="relative w-full h-[4px] bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-[#4A7C59] shadow-[0_0_20px_rgba(74,124,89,0.4)]"
                initial={{ width: 0 }}
                animate={{ width: `${(favorites.size / photos.length) * 100}%` }}
                transition={{ type: "spring", bounce: 0, duration: 2.5 }}
              />
            </div>

            {/* BOTÓN DE SALTO AL FINAL */}
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => document.getElementById('final-selection')?.scrollIntoView({ behavior: 'smooth' })}
                className="group flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#4A7C59] transition-colors">
                  Ya he terminado mi selección
                </span>
                <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-[#4A7C59] group-hover:text-white transition-all">
                  <ArrowDown className="h-4 w-4 animate-bounce" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* FILTROS FLOTANTES (MODO ISLA APPLE) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center gap-1.5 bg-white/80 backdrop-blur-3xl p-1.5 rounded-full border border-white/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <button 
            onClick={() => { setShowOnlyFavorites(false); setShowRejected(false); }}
            className={cn(
              "px-5 sm:px-8 py-3 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5",
              !showOnlyFavorites && !showRejected 
                ? "bg-slate-900 text-white shadow-xl scale-105" 
                : "text-slate-400 hover:text-slate-600 hover:bg-black/5"
            )}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Galería</span>
          </button>
          
          <button 
            onClick={() => { setShowOnlyFavorites(true); setShowRejected(false); }}
            className={cn(
              "px-5 sm:px-8 py-3 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5",
              showOnlyFavorites && !showRejected
                ? "bg-white text-red-500 shadow-xl border border-red-50 scale-105" 
                : "text-slate-400 hover:text-slate-600 hover:bg-black/5"
            )}
          >
            <Heart className={cn("h-4 w-4", showOnlyFavorites ? "fill-current" : "")} />
            <span>Favoritas</span>
          </button>
          
          <button 
            onClick={() => { setShowOnlyFavorites(false); setShowRejected(true); }}
            className={cn(
              "px-5 sm:px-8 py-3 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5",
              showRejected
                ? "bg-white text-orange-500 shadow-xl border border-orange-50 scale-105" 
                : "text-slate-400 hover:text-slate-600 hover:bg-black/5"
            )}
          >
            <EyeOff className="h-4 w-4" />
            <span>Descartadas</span>
          </button>
        </div>

        {showOnlyFavorites && displayedPhotos.length === 0 && (
          <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-400 mx-auto mb-6 shadow-sm border border-orange-100">
              <Heart className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Aún no tienes favoritas</h3>
            <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs mx-auto">
              Haz clic en el corazón de tus fotos preferidas para que aparezcan aquí.
            </p>
            <Button 
               onClick={() => setShowOnlyFavorites(false)}
               variant="outline"
               className="mt-8 rounded-full h-11 px-8 font-black uppercase text-[10px] tracking-widest border-slate-200"
            >
              Ver todas las fotos
            </Button>
          </div>
        )}

        {showRejected && (
          <div className="mb-8 flex justify-center animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-orange-500 text-white rounded-full px-5 py-2 flex items-center gap-3 shadow-xl shadow-orange-200 border-2 border-white">
              <EyeOff className="h-4 w-4" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Recuperando fotos descartadas</span>
              <div className="w-[1px] h-3 bg-white/30" />
              <button 
                onClick={() => setShowRejected(false)}
                className="bg-white text-orange-500 px-4 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-1.5 active:scale-95 ml-1"
              >
                Volver a Galería 
                <ChevronRight className="h-3 w-3 stroke-[3]" />
              </button>
            </div>
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
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    x: shakePhotoId === photo.id ? [0, -15, 15, -15, 15, 0] : 0
                  }}
                  transition={{
                    x: { duration: 0.5, ease: "easeInOut" }
                  }}
                  viewport={{ once: true }}
                  className={cn(
                    "relative group overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all break-inside-avoid mb-6",
                    shakePhotoId === photo.id && "z-50 ring-4 ring-red-500/20"
                  )}
                  onClick={() => setViewerIndex(displayedPhotos.findIndex((p:any) => p.id === photo.id))}
                >
                  <div className="relative overflow-hidden bg-slate-100 group-hover:shadow-2xl transition-all duration-700">
                    {/* Heart Burst Animation */}
                    <AnimatePresence>
                      {heartBurst === photo.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5, y: 0 }}
                          animate={{ opacity: 1, scale: 1.8, y: -40 }}
                          exit={{ opacity: 0, scale: 2.2, y: -60 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                          <Heart className="text-red-500 fill-current h-12 w-12 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Foto Limpia */}
                    <Image 
                      src={photo.url} 
                      alt={photo.name || 'Foto'} 
                      width={800}
                      height={1200}
                      className={cn(
                        "w-full h-auto transition-all duration-1000 group-hover:scale-105 select-none",
                        showRejected ? "grayscale contrast-[1.1] opacity-90" : (rejectedPhotos.has(photo.id) ? "grayscale opacity-50" : "opacity-100")
                      )}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Watermark Protection */}
                    {client?.gallerySettings?.watermarkEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none">
                        {(globalConfig?.logoUrl || globalConfig?.logo) ? (
                          <div 
                            className="relative w-[70%] h-[70%] transition-all duration-500 opacity-25 group-hover:opacity-40" 
                          >
                            <img 
                              src={globalConfig?.logoUrl || globalConfig?.logo} 
                              alt="Watermark" 
                              className="w-full h-full object-contain filter drop-shadow-2xl" 
                            />
                          </div>
                        ) : (
                          <div className="rotate-[-30deg] flex flex-col items-center">
                            <p className="text-white/10 font-black text-3xl uppercase tracking-[0.5em] drop-shadow-2xl text-center px-4">
                              {client?.gallerySettings?.watermarkText || 'PUJALTE'}
                            </p>
                            <p className="text-white/10 font-bold text-[8px] uppercase tracking-[1em] mt-2">
                              PROHIBIDA SU CAPTURA
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Badges de estado en Grid */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
                    {favorites.has(photo.id) && (
                      <motion.button 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(photo.id);
                        }}
                        className="w-8 h-8 rounded-full bg-white text-orange-500 shadow-lg flex items-center justify-center hover:bg-orange-50 transition-colors z-30"
                        title="Quitar de favoritas"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </motion.button>
                    )}
                    {hasComment && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-white text-blue-500 shadow-lg flex items-center justify-center">
                        <MessageCircle className="h-4 w-4" />
                      </motion.div>
                    )}
                    {(photoCartItems?.length || 0) > 0 && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ 
                          scale: isCartBumping ? [1, 1.4, 1] : 1,
                          rotate: isCartBumping ? [0, -10, 10, 0] : 0
                        }} 
                        transition={{ duration: 0.4 }}
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


                    {/* Capa de interacción - Gradiente sutil en vez de oscurecerlo todo */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex gap-2">
                            {/* Favoritos (Solo en modo Selección o Descarga con límite) */}
                            {(isSelectionMode || showSelectionToolsInArchive) && !showRejected && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
                                title={favorites.has(photo.id) ? "Quitar de favoritas" : "Marcar como favorita"}
                                className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-xl",
                                  favorites.has(photo.id) ? "bg-[#4A7C59] text-white border-[#4A7C59]" : "bg-white/40 text-white hover:bg-white/60"
                                )}
                              >
                                <Heart className={cn("h-4 w-4", favorites.has(photo.id) && "fill-current")} />
                              </button>
                            )}

                            {/* Botón de descarga (Solo en modo Descarga si está permitida) */}
                            {isArchiveMode && canDownloadPhoto(photo.id) && (
                              <a 
                                href={photo.url} 
                                download={photo.fileName || `foto-${photo.id}.jpg`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-white text-[#4A7C59] backdrop-blur-md transition-all border border-white/20 shadow-xl hover:scale-110 active:scale-95"
                                title="Descargar esta foto"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                            
                            {/* Ocultar / Recuperar */}
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleRejectAction(photo);
                              }}
                              title={showRejected ? "Recuperar para la galería" : "Ocultar / Descartar foto"}
                              className={cn(
                                "rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20 h-9 shadow-xl",
                                showRejected 
                                  ? "bg-[#4A7C59] text-white border-[#4A7C59] px-4 gap-2" 
                                  : "w-9 h-9 bg-red-500/80 text-white hover:bg-red-600 border-red-500/50"
                              )}
                            >
                              {showRejected ? (
                                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Recuperar</span>
                              ) : <EyeOff className="h-4 w-4" />}
                            </button>

                            {/* Comprar / Elegir Producto (Solo si NO es solo-fotos) */}
                            {!showRejected && !isSoloFotos && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenShop(photo); }}
                                title="Elegir producto / Comprar"
                                className="w-11 h-11 rounded-full bg-[#4A7C59] hover:bg-[#3D6649] backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/10 shadow-xl"
                              >
                                <ShoppingBag className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 mb-2 px-1">
                      <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight text-center truncate">
                        {photo.fileName?.replace(/\.[^/.]+$/, "")}
                      </p>
                    </div>
                  </motion.div>
              );
            })}
          </div>
        ) : (
          /* MODO LISTA */
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Ocultamos el scroll lateral y forzamos un ancho completo */}
            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed md:table-auto">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-2 md:px-6 py-3 md:py-4 w-[65px] md:w-auto">Foto</th>
                    <th className="px-2 md:px-6 py-3 md:py-4">Archivo / Comentario</th>
                    <th className="px-2 md:px-6 py-3 md:py-4 w-[40px] md:w-auto text-center">Fav</th>
                    <th className="px-2 md:px-6 py-3 md:py-4 w-[85px] md:w-auto text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedPhotos.map((photo: any) => {
                    return (
                      <tr key={photo.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* MINIATURA COMPACTA */}
                        <td className="px-2 md:px-6 py-3 md:py-4">
                          <div 
                            className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden shadow-sm border-2 border-white cursor-pointer relative shrink-0" 
                            onClick={() => setViewerIndex(displayedPhotos.findIndex((p:any) => p.id === photo.id))}
                          >
                            <Image 
                              src={photo.url} 
                              alt={photo.name || 'Foto'} 
                              fill
                              priority
                              className={cn(
                                "object-contain select-none transition-all duration-500",
                                showRejected && "grayscale contrast-[1.2] opacity-90"
                              )} 
                              sizes="100vw"
                            />
                             {/* Watermark sutil */}
                             {(client.gallerySettings?.watermarkEnabled !== false) && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                                <span className="text-white text-[4px] md:text-[6px] font-black -rotate-45">P</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* NOMBRE + COMENTARIO INTEGRADOS */}
                        <td className="px-2 md:px-6 py-3 md:py-4">
                          <div className="flex flex-col gap-1.5 md:gap-2">
                             <div className="flex items-center gap-2">
                               <p className="text-[11px] md:text-sm font-black text-slate-700 tracking-tight truncate max-w-[80px] md:max-w-none">
                                 {photo.fileName?.replace(/\.[^/.]+$/, "") || 'Foto'}
                               </p>
                               <span className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase shrink-0">Ref: {photo.id.slice(0, 4)}</span>
                             </div>
                             
                             <div className="relative">
                               <input 
                                 type="text"
                                 placeholder="Añadir comentario..."
                                 value={photoNotes[photo.id] || ''}
                                 onChange={(e) => setPhotoNotes(prev => ({...prev, [photo.id]: e.target.value}))}
                                 className="w-full bg-slate-50/60 border-none rounded-lg py-1 px-2 text-[9px] md:text-[11px] font-medium focus:ring-1 focus:ring-[#4A7C59] transition-all placeholder:text-slate-300 shadow-inner"
                               />
                             </div>
                          </div>
                        </td>

                        {/* DESCARGA (Solo en modo Archivos y si está permitida) */}
                        {isArchiveMode && canDownloadPhoto(photo.id) && (
                        <td className="px-1 md:px-6 py-3 md:py-4 text-center">
                          <a 
                            href={photo.url} 
                            download={photo.fileName || `foto-${photo.id}.jpg`}
                            className="inline-flex p-2 rounded-full text-[#4A7C59] bg-slate-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                          >
                            <Download className="h-4 w-4 md:h-5 md:w-5" />
                          </a>
                        </td>
                        )}

                        {/* FAVORITO */}
                        {(isSelectionMode || showSelectionToolsInArchive) && (
                        <td className="px-1 md:px-6 py-3 md:py-4 text-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
                            className={cn(
                              "p-2 rounded-full transition-all",
                              favorites.has(photo.id) ? "text-orange-500 bg-orange-50 shadow-sm" : "text-slate-200"
                            )}
                          >
                            <Heart className={cn("h-4 w-4 md:h-5 md:w-5", favorites.has(photo.id) && "fill-current")} />
                          </button>
                        </td>
                        )}

                        {/* ACCIONES COMPACTAS */}
                        {isSelectionMode && (
                        <td className="px-2 md:px-6 py-3 md:py-4 text-right">
                          <div className="flex justify-end gap-1.5 md:gap-2">
                            <button 
                              onClick={() => handleOpenShop(photo)}
                              className="bg-orange-50 hover:bg-orange-500 text-orange-500 hover:text-white h-8 w-8 md:h-10 md:w-10 rounded-lg transition-all flex items-center justify-center border border-orange-100"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleRejectAction(photo)}
                              className={cn(
                                "h-8 md:h-10 rounded-lg transition-all flex items-center justify-center border",
                                showRejected 
                                  ? "bg-[#4A7C59] text-white border-[#4A7C59] px-2 text-[8px] font-black uppercase" 
                                  : "w-8 h-8 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border-red-100"
                              )}
                            >
                              {showRejected ? (
                                  "Recuperar"
                              ) : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        )}
                        
                        {/* ACCIONES MODO ARCHIVO / VISITA (Solo ocultar/recuperar) */}
                        {isSoloFotos && (
                          <td className="px-2 md:px-6 py-3 md:py-4 text-right">
                             <button 
                              onClick={() => handleRejectAction(photo)}
                              className={cn(
                                "h-8 md:h-10 rounded-lg transition-all flex items-center justify-center border",
                                showRejected 
                                  ? "bg-[#4A7C59] text-white border-[#4A7C59] px-2 text-[8px] font-black uppercase" 
                                  : "w-8 h-8 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border-red-100"
                              )}
                            >
                              {showRejected ? (
                                  "Recuperar"
                              ) : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER DE GALERÍA (Solo si NO es solo-fotos) */}
      {!isSoloFotos && (
      <footer id="final-selection" className="bg-slate-50 pt-16 pb-44 px-6 text-center border-t border-slate-100">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex flex-col items-center">
             <div className="w-24 h-24 bg-white rounded-[1.8rem] shadow-sm border border-slate-200 flex items-center justify-center mb-4 p-5 overflow-hidden">
                {globalConfig?.logoUrl ? (
                   <img 
                    src={globalConfig.logoUrl} 
                    alt="Logo Empresa" 
                    className="w-full h-full object-contain grayscale brightness-0 opacity-100" 
                  />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-[#4A7C59] stroke-[2.5px]" />
                )}
             </div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic whitespace-nowrap">
               Más que fotografía, tus mejores recuerdos
             </p>
          </div>

          {/* OFERTA FIN DE PÁGINA (Escenario 3: Cliente que gasta el +30% de extras) */}
          {client?.gallerySettings?.digitalFiles?.fullPackPrice > 0 && 
           favorites.size >= (Number(includedPhotosCount) * 1.3) && 
           favorites.size < photos.length && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#4A7C59] to-[#3D6649] rounded-[2.5rem] p-8 mb-12 text-white shadow-2xl shadow-[#4A7C59]/20 relative overflow-hidden group text-left"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <ShoppingBag className="h-40 w-40 rotate-12" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left space-y-2">
                     <span className="inline-flex bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Oferta Especial</span>
                     <h3 className="text-3xl font-black italic tracking-tighter leading-none">¡LLÉVATELO TODO!</h3>
                     <p className="text-white/70 text-sm font-medium max-w-sm">Descarga todas las fotos de tu galería sin marcas de agua y a máxima calidad por un único precio.</p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                     <div className="flex flex-col items-center leading-none">
                        <span className="text-white/50 text-[10px] font-black line-through mb-1 uppercase tracking-widest">
                          {photos.length * (client.gallerySettings.digitalFiles.price || 15)}€
                        </span>
                        <span className="text-5xl font-black italic tracking-tighter">{client.gallerySettings.digitalFiles.fullPackPrice}€</span>
                     </div>
                     <Button 
                        onClick={() => handleOpenShop(photos[0], filteredProducts.find(p => p.id === 'digital-full-pack'))}
                        className="bg-white text-[#4A7C59] hover:bg-slate-50 rounded-full px-8 h-12 font-black uppercase text-[11px] tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                     >
                        Comprar Galería Completa
                     </Button>
                  </div>
               </div>
            </motion.div>
          )}

          {/* BOTÓN DESCARGA SELECCIÓN (Si habilitado por admin) */}
          {client?.gallerySettings?.selectionDownloadEnabled && favorites.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white border-2 border-dashed border-purple-200 rounded-[2.5rem] p-8 mb-12 group hover:border-purple-400 transition-all"
            >
               <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm mb-2 group-hover:rotate-6 transition-transform">
                     <DownloadCloud className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Tu descarga está lista</h3>
                     <p className="text-slate-400 text-sm font-medium">Puedes bajar tus <span className="text-[#4A7C59] font-black">{favorites.size} fotos seleccionadas</span> ahora mismo.</p>
                  </div>
                  <Button 
                     onClick={handleDownloadArchive}
                     className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-10 h-14 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-purple-200 transition-all hover:scale-105 active:scale-95 gap-3"
                  >
                     <DownloadCloud className="h-5 w-5" />
                     Descargar mi selección
                  </Button>
               </div>
            </motion.div>
          )}

          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto">
            Al enviar tu selección, <strong>tu fotógrafo recibirá una notificación</strong> para comenzar con la edición final. <strong>Te avisaremos cuando todo esté listo para recoger</strong>. ¡Ya falta muy poco!
          </p>
          <div className="pt-4">
            <Button 
               onClick={() => handleSaveSelection()}
               className="bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-full px-10 h-12 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#4A7C59]/30"
            >
              Enviar Selección
            </Button>
          </div>

          {/* BOTÓN DISCRETO VOLVER ARRIBA */}
          <div className="pt-12 pb-10 flex justify-center">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group flex flex-col items-center gap-2 text-slate-400 hover:text-[#4A7C59] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center mb-1 group-hover:bg-white group-hover:border-[#4A7C59] group-hover:shadow-md transition-all">
                <ArrowUp className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Volver al inicio</span>
            </button>
          </div>
        </div>
      </footer>
      )}

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
            <div className="flex items-center justify-between p-6 sm:p-10 bg-gradient-to-b from-black/80 to-transparent text-white absolute top-0 left-0 right-0 z-50 transition-all">
              <div className="flex items-center gap-6 sm:gap-10">
                <button 
                  onClick={() => setSelectedPhoto(null)} 
                  className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-110 active:scale-95"
                >
                  <X className="h-6 w-6 stroke-[3]" />
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">
                    Archivo actual {isSelectionLimited && (displayedPhotos.findIndex(p => p.id === selectedPhoto.id) + 1 > includedCount) && <span className="text-orange-500 ml-2">| EXTRA</span>}
                  </span>
                  <span className="text-sm sm:text-3xl font-black uppercase tracking-tighter truncate max-w-[180px] sm:max-w-none drop-shadow-lg">
                    {selectedPhoto.fileName.replace(/\.[^/.]+$/, "")}
                  </span>
                </div>
              </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {digitalExtrasCount > 0 && isSelectionMode && (
                    <Button 
                      onClick={() => handleGoToCheckout()}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl animate-pulse"
                    >
                      Pagar Extras ({digitalExtrasTotal}€)
                    </Button>
                  )}
                  {isSelectionMode && (
                    <>
                    {/* COMPRAR ESTA FOTO */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenShop(selectedPhoto); }}
                      className="relative w-11 h-11 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all active:scale-95 shrink-0"
                      title="Añadir a la cesta"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      {(() => {
                        const photoCartItems = getItemsForPhoto(selectedPhoto.url);
                        return photoCartItems.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#4A7C59] text-white text-[9px] h-5 w-5 rounded-full flex items-center justify-center font-black border-2 border-black shadow-lg">
                            {photoCartItems.length}
                          </span>
                        );
                      })()}
                    </button>

                    <div className="w-[1px] h-6 bg-white/10 mx-0.5 hidden sm:block" />

                    {/* MARCAR FAVORITA */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedPhoto.id); }}
                      className={cn(
                        "w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-95 shrink-0 border-2",
                        favorites.has(selectedPhoto.id) 
                          ? "bg-white text-orange-500 border-white shadow-md" 
                          : "bg-black/20 text-white border-white/20 hover:bg-white/10"
                      )}
                      title="Marcar como favorita"
                    >
                      <Heart className={cn("h-5 w-5", favorites.has(selectedPhoto.id) && "fill-current")} />
                    </button>

                    {/* CESTA GLOBAL */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsCartOpen(true); }}
                      className="relative w-11 h-11 flex items-center justify-center bg-black/20 text-white border-2 border-white/20 hover:bg-white/10 rounded-full transition-all active:scale-95 shrink-0"
                      title="Ver toda mi cesta"
                    >
                      <ShoppingBag className="h-5 w-5 text-[#4A7C59]" />
                      {getItemCount() > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#4A7C59] text-white text-[9px] h-5 w-5 rounded-full flex items-center justify-center font-black border-2 border-black shadow-lg">
                          {getItemCount()}
                        </span>
                      )}
                    </button>
                    </>
                  )}

                  {isArchiveMode && canDownloadPhoto(selectedPhoto.id) && (
                    <a 
                      href={selectedPhoto.url} 
                      download={selectedPhoto.fileName || `foto-${selectedPhoto.id}.jpg`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 h-12 flex items-center justify-center bg-white text-[#4A7C59] rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 shrink-0"
                      title="Descargar esta foto"
                    >
                      <Download className="h-6 w-6" />
                    </a>
                  )}

                  {/* SONIDO */}
                  {client?.gallerySettings?.bgMusic?.url && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMusic(); }}
                      className="w-11 h-11 flex items-center justify-center bg-black/20 text-white border-2 border-white/20 hover:bg-white/10 rounded-full transition-all active:scale-95 shrink-0"
                      title={isPlaying ? "Silenciar" : "Escuchar música"}
                    >
                      {isPlaying ? (
                        <div className="relative">
                          <Volume2 className="h-5 w-5 text-blue-400" />
                          <span className="absolute inset-[-2px] rounded-full border border-blue-400 animate-ping opacity-30" />
                        </div>
                      ) : <VolumeX className="h-5 w-5 text-white/40" />}
                    </button>
                  )}
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
                    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                      {globalConfig?.logoUrl ? (
                         <img 
                           src={globalConfig.logoUrl} 
                           alt="Watermark" 
                           className="max-w-[80%] max-h-[80%] object-contain"
                           style={{ opacity: (globalConfig.logoOpacity ?? 20) / 100 }}
                         />
                      ) : (
                        <p className="text-white font-black text-6xl sm:text-9xl uppercase tracking-[0.5em] drop-shadow-xl text-center px-4" style={{ opacity: (globalConfig.logoOpacity ?? 20) / 100 }}>
                          {client.gallerySettings?.watermarkText || globalConfig?.storeName || 'PUJALTE FOTOGRAFÍA'}
                        </p>
                      )}
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
                    placeholder="Escribe una nota sobre esta foto..."
                    className="bg-transparent border-none focus:ring-0 text-white text-sm w-full font-medium"
                    value={photoNotes[selectedPhoto.id] || ''}
                    onChange={(e) => {
                      setPhotoNotes({ ...photoNotes, [selectedPhoto.id]: e.target.value })
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

      <Dialog open={isShopModalOpen} onOpenChange={(open) => {
        setIsShopModalOpen(open);
        if (!open) {
          setShowAddedConfirmation(false);
          setSelectedProduct(null);
          setSelectedVariant(null);
          setSelectedCustomOptions({});
        }
      }}>
        <DialogContent className="sm:max-w-[660px] rounded-[32px] p-0 overflow-y-auto max-h-[90vh] border-none shadow-2xl z-[100] bg-white scrollbar-hide">
          <AnimatePresence mode="wait">
            {showAddedConfirmation ? (
              <motion.div 
                key="added-confirmation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-8"
              >
                <div className="w-24 h-24 bg-[#4A7C59]/10 rounded-3xl flex items-center justify-center text-[#4A7C59] rotate-3 animate-in zoom-in duration-500">
                  <Check className="h-12 w-12 stroke-[3px]" />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">¡A la cesta!</h2>
                  <p className="text-slate-500 font-medium italic text-lg leading-snug">
                    Has añadido <span className="text-slate-900 font-black underline decoration-[#4A7C59] decoration-4 underline-offset-4">{addedItemName}</span> correctamente.
                  </p>
                </div>

                <div className="flex flex-col w-full gap-3 pt-6">
                  <Button 
                    onClick={() => {
                      setShowAddedConfirmation(false);
                      setIsShopModalOpen(false);
                      setSelectedProduct(null);
                      setSelectedVariant(null);
                      setSelectedCustomOptions({});
                    }}
                    variant="outline"
                    className="h-16 rounded-2xl border-2 border-slate-100 font-black uppercase text-[12px] tracking-widest hover:bg-slate-50 transition-all hover:border-slate-200"
                  >
                    Seguir comprando
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsShopModalOpen(false);
                      setTimeout(() => setIsCartOpen(true), 200);
                    }}
                    className="h-16 rounded-2xl bg-slate-900 text-white font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3"
                  >
                    <ShoppingBag className="h-5 w-5" /> Ver cesta y pagar
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="shop-catalog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DialogHeader className="p-8 pb-4">
                  <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Personaliza tu Fotografía</DialogTitle>
                </DialogHeader>
                
                <div className="p-8 pt-0">
                  <div className="flex gap-6 mb-8 p-6 bg-slate-50/50 rounded-[28px] border border-slate-100 backdrop-blur-sm">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl shrink-0 border-4 border-white rotate-1 hover:rotate-0 transition-transform duration-500 relative">
                      {photoToBuy?.url && (
                        <Image 
                          src={photoToBuy.url} 
                          alt="Product context" 
                          fill
                          className="object-cover" 
                          sizes="96px"
                        />
                      )}
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
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all"
                            >
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.name} {item.variantName ? `(${item.variantName})` : ''}</span>
                                <span className="text-[10px] font-bold text-[#4A7C59]">{item.price}€ / UNIDAD</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center bg-slate-50 rounded-full px-2 py-1">
                                  <button onClick={() => updateQuantity(item.productId || item.id, Math.max(0, item.quantity - 1), item.variantId, item.notes)} className="p-1 hover:text-orange-500 transition-colors"><Minus className="h-3 w-3" /></button>
                                  <span className="w-8 text-center text-[10px] font-black">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.productId || item.id, item.quantity + 1, item.variantId, item.notes)} className="p-1 hover:text-[#4A7C59] transition-colors"><Plus className="h-3 w-3" /></button>
                                </div>
                                <button 
                                  onClick={() => {
                                    removeItem(item.productId || item.id, item.variantId, item.notes);
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

                  <div className="max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar pb-32">
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
                          <motion.div 
                            animate={{ y: [0, 5, 0], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="flex flex-col items-center gap-1 mb-6 text-[#4A7C59] pointer-events-none"
                          >
                            <ChevronsDown className="h-5 w-5" />
                          </motion.div>

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
                                      <div className="relative aspect-square w-full">
                                          <img 
                                            src={product.image} 
                                            alt={product.name} 
                                            className="absolute inset-0 w-full h-full object-cover"
                                          />
                                      </div>
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
                                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center gap-2">
                                      {hasSeenGiftPopup && product.isDigital && product.name.includes("GALERÍA") ? (
                                        <span className="text-orange-600">¡TU GALERÍA COMPLETA!</span>
                                      ) : (
                                        <HighlightText text={product.name} highlight={searchTerm} />
                                      )}
                                      {product.isDigital && <Badge className={`${hasSeenGiftPopup && product.name.includes("GALERÍA") ? "bg-orange-500" : "bg-blue-600"} hover:opacity-90 text-[8px] h-4 uppercase border-none`}>Alta Calidad</Badge>}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      {hasSeenGiftPopup && product.isDigital && product.name.includes("GALERÍA") ? (
                                        <span className="text-orange-500 font-black animate-pulse flex items-center gap-1.5 uppercase italic">
                                          <Gift className="h-3.5 w-3.5" /> ¡REGALADO! (0€)
                                        </span>
                                      ) : (
                                        <>
                                          {/* LÓGICA DE PRECIOS DINÁMICOS DESDE EL PANEL DE CONTROL */}
                                          {product.name.includes("GALERÍA") && client.gallerySettings?.fullGalleryPrice ? (
                                            `${client.gallerySettings.fullGalleryPrice}€`
                                          ) : (product.name.includes("ARCHIVO") || product.name.includes("MÁXIMA CALIDAD")) && client.gallerySettings?.archivePrice ? (
                                            `${client.gallerySettings.archivePrice}€`
                                          ) : (
                                            <>
                                              {(Array.isArray(product.variants) && product.variants.length > 0) ? `Desde ${Math.min(...product.variants.filter((v:any) => typeof v.price === 'number').map((v:any) => v.price))}€` : `${product.price}€`}
                                            </>
                                          )}

                                          {/* Solo mostramos "Incluido" si NO es Máxima Calidad y el precio es realmente 0 */}
                                          {product.isDigital && product.price === 0 && !product.name.includes("MÁXIMA CALIDAD") && !product.name.includes("ARCHIVO") && (
                                            <span className="ml-2 text-blue-600 font-black italic">¡INCLUIDO EN PACK!</span>
                                          )}
                                        </>
                                      )}
                                    </p>
                                    {product.description && (
                                      <p className="text-[9px] text-slate-500 font-medium italic leading-tight mt-1 opacity-80">
                                        {product.description}
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
                            <div className="px-2">
                              <Button 
                                onClick={() => handleAddToOrder(selectedProduct)}
                                className="w-full h-14 rounded-2xl bg-[#4A7C59] hover:bg-[#3d694b] text-white font-black uppercase tracking-widest"
                              >
                                Añadir al carrito - {selectedProduct?.price}€
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Selecciona una opción para añadir al carrito</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTÓN FLOTANTE DE CESTA DENTRO DEL MODAL */}
          {getItemCount() > 0 && (
             <div className="absolute bottom-6 inset-x-8 z-[60]">
                <Button 
                  onClick={() => {
                    setIsShopModalOpen(false);
                    setTimeout(() => setIsCartOpen(true), 240);
                  }}
                  className="w-full h-16 rounded-[24px] bg-slate-900 border-4 border-white text-white font-black uppercase text-[12px] tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-black transition-all flex items-center justify-between px-8 animate-in fade-in slide-in-from-bottom-6 duration-500 hover:scale-[1.02] active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <ShoppingBag className="h-5 w-5 text-[#4A7C59]" />
                      <span className="absolute -top-2.5 -right-2.5 bg-white text-slate-900 text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                        {getItemCount()}
                      </span>
                    </div>
                    <span>Ver mi cesta y pagar</span>
                  </div>
                  <div className="bg-[#4A7C59] px-5 py-2.5 rounded-[14px] font-black text-white text-[13px] shadow-sm">
                    {getTotal().toFixed(2)}€
                  </div>
                </Button>
             </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ZOOM AVANZADO CON NAVEGACIÓN Y BÚSQUEDA */}
      <AnimatePresence>
        {zoomedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setZoomedProduct(null); }}
            className="fixed inset-0 z-[500] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6"
          >
            {/* TOOLBAR SUPERIOR DEL ZOOM */}
            <div className="absolute top-8 inset-x-8 z-[510] flex gap-4 max-w-4xl mx-auto w-full">
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
                <div className="relative h-[60vh] aspect-square rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/10">
                  <img 
                    src={zoomedProduct.image || ''} 
                    alt={zoomedProduct.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="mt-8 text-center space-y-4">
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">{zoomedProduct.name}</h3>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-white/60 text-lg font-medium leading-relaxed">
                      Desde {zoomedProduct.price ?? zoomedProduct.variants?.[0]?.price}€
                    </p>
                    <Badge className="bg-[#4A7C59] text-white border-none uppercase text-[10px] font-black tracking-widest px-3 py-1">Top Ventas</Badge>
                  </div>
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

            <div className="absolute bottom-12 inset-x-8 flex flex-col items-center gap-6">
              <Button 
                onClick={() => {
                  if (((zoomedProduct as any).variants?.length || 0) > 0 || (zoomedProduct as any).customOptions) {
                    setSelectedProduct(zoomedProduct);
                    setZoomedProduct(null);
                  } else {
                    handleAddToOrder(zoomedProduct);
                    setZoomedProduct(null);
                  }
                }}
                className="bg-white hover:bg-slate-100 text-black h-20 px-16 rounded-[28px] font-black uppercase text-sm tracking-widest shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 flex items-center gap-3"
              >
                <Plus className="h-5 w-5" />
                { ((zoomedProduct as any).variants?.length || 0) > 0 ? 'Configurar y comprar' : 'Añadir al carrito' }
              </Button>
              
              <div className="flex items-center gap-2">
                {filteredProducts.map((p) => (
                  <div 
                    key={p.id} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      p.id === zoomedProduct.id ? "w-8 bg-[#4A7C59]" : "w-1.5 bg-white/20"
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VISOR DE FOTOS FULL SCREEN CON NAVEGACIÓN */}
      <AnimatePresence>
        {viewerIndex !== null && viewerPhotos[viewerIndex] && (
          (() => {
            const currentPhoto = viewerPhotos[viewerIndex];
            const isExtra = isSelectionLimited && (viewerIndex + 1 > includedCount);
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black"
              >

                {/* TOP BAR: Info, Altavoz y Cerrar */}
                <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-50 pointer-events-none">
                  <div className="flex items-center gap-4 pointer-events-auto bg-slate-900 p-2 px-4 rounded-2xl border border-white/10 shadow-2xl">
                    <button 
                      onClick={() => setViewerIndex(null)}
                      className="w-10 h-10 flex items-center justify-center bg-slate-800 text-white border border-white/5 hover:bg-white hover:text-black rounded-full transition-all group shadow-inner"
                    >
                      <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex flex-col">
                      <h3 className="text-white font-black text-sm uppercase tracking-tighter italic leading-none mb-1">
                        {currentPhoto.name || currentPhoto.id}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-none">
                          Imagen {viewerIndex! + 1} de {viewerPhotos.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pointer-events-auto">
                    {/* Botón Añadir Artículos (Cyan Sólido) - COMPLEMENTOS */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setPhotoToBuy(currentPhoto);
                        setIsShopModalOpen(true);
                      }}
                      className="bg-cyan-600 text-white border border-cyan-400/20 rounded-full h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-500/10 hover:bg-cyan-500 hover:scale-105 transition-all flex items-center gap-2 group active:scale-95"
                    >
                      <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                      <span className="hidden sm:inline">COMPLEMENTOS</span>
                      <span className="sm:hidden">Tienda</span>
                    </button>

                    {/* Botón Ver Resumen (Cesta Sólido) */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsCartOpen(true); }}
                      className="h-11 px-6 flex items-center gap-2 bg-[#4A7C59] text-white border border-[#4A7C59]/20 hover:bg-[#3D6649] hover:scale-105 rounded-full transition-all shadow-xl shadow-green-900/20 relative group active:scale-95"
                    >
                      <ShoppingBag className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="font-black uppercase text-[10px] tracking-widest">Mi Cesta</span>
                      {favorites.size > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg animate-pulse">
                          {favorites.size}
                        </span>
                      )}
                    </button>

                    {client?.gallerySettings?.bgMusic?.url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMusic(); }}
                        className="w-11 h-11 flex items-center justify-center bg-slate-900 text-white border border-white/10 hover:bg-black rounded-full transition-all shadow-2xl"
                      >
                        {isPlaying ? <Volume2 className="h-4 w-4 text-cyan-400 animate-pulse" /> : <VolumeX className="h-4 w-4 text-white/30" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 relative w-full h-full flex items-center justify-center p-0 overflow-hidden">
                  <button 
                    onClick={() => setViewerIndex(prev => prev! > 0 ? prev! - 1 : viewerPhotos.length - 1)}
                    className="absolute left-6 z-30 p-4 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all backdrop-blur-sm active:scale-90"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  
                  <div className="relative w-full h-full flex items-center justify-center">
                    <AnimatePresence>
                      {heartBurst === currentPhoto.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5, y: 0 }}
                          animate={{ opacity: 1, scale: 2.5, y: -100 }}
                          exit={{ opacity: 0, scale: 3, y: -150 }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                          <Heart className="text-red-500 fill-current h-24 w-24 drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {(client?.gallerySettings?.watermarkEnabled !== false) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none">
                        {(globalConfig?.logoUrl || globalConfig?.logo) ? (
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
                      key={`${currentPhoto.id}-${rejectedPhotos.has(currentPhoto.id)}`}
                      initial={{ opacity: 0.5, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: rejectedPhotos.has(currentPhoto.id) ? 0.95 : 1,
                        filter: rejectedPhotos.has(currentPhoto.id) ? "grayscale(100%) brightness(0.6)" : "grayscale(0%) brightness(1)"
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20 
                      }}
                      src={currentPhoto.url}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setViewerIndex(prev => prev! < viewerPhotos.length - 1 ? prev! + 1 : 0)}
                    className="absolute right-6 z-30 p-4 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all backdrop-blur-sm active:scale-90"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </div>

                {/* CONSOLA DE CONTROL INFERIOR */}
                <div className="absolute bottom-0 inset-x-0 z-50 p-6 sm:p-10 flex flex-col items-center gap-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                  
                  {/* Fila de Micro-notificación y Notas */}
                  <div className="w-full max-w-4xl flex flex-col items-center gap-3">
                    <AnimatePresence mode="wait">
                      {viewerNotification && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-white/95 backdrop-blur-md px-6 py-2 rounded-xl shadow-2xl mb-1 border border-white"
                        >
                           <span className={cn(
                            "text-[11px] font-black uppercase tracking-[0.1em] flex items-center gap-3",
                            viewerNotification.includes("DESCARTADA") || viewerNotification.includes("Eliminada") ? "text-orange-600" : "text-cyan-600"
                          )}>
                            {viewerNotification.includes("Añadida") || viewerNotification.includes("RECUPERADA") ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            {viewerNotification}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* CUADRO DE NOTA CON OVERLAY DE CIERRE */}
                    <AnimatePresence>
                      {showNoteInput && (
                        <>
                          {/* Overlay invisible para detectar clic fuera */}
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNoteInput(false)}
                            className="fixed inset-0 z-[60] cursor-pointer"
                          />
                          
                          {/* El input en sí */}
                          <motion.div 
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="w-full max-w-2xl relative group z-[70] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <input 
                              type="text"
                              autoFocus
                              placeholder="Escribe una nota sobre esta foto..."
                              value={photoNotes[currentPhoto.id] || ''}
                              onChange={(e) => {
                                setPhotoNotes(prev => ({...prev, [currentPhoto.id]: e.target.value}));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setShowNoteInput(false);
                              }}
                              className="w-full bg-black/80 backdrop-blur-3xl border border-white/20 rounded-[24px] py-5 pl-14 pr-8 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/40 transition-all placeholder:text-white/20 shadow-2xl"
                            />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* BARRA DE FUNCIONES PRINCIPAL - COMPACTA PARA ORDENADOR */}
                  <div className="w-full max-w-5xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-2 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative gap-4 mb-2 pointer-events-auto overflow-visible">
                    
                    {/* 1. LADO IZQUIERDO: ACCIONES RÁPIDAS (33%) */}
                    <div className="flex-1 flex items-center gap-3 pl-2">
                       <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(currentPhoto.id); }}
                        className={cn(
                          "w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center transition-all border shadow-lg group active:scale-95 relative",
                          favorites.has(currentPhoto.id)
                            ? "bg-red-500 border-red-400 text-white shadow-red-500/20" 
                            : "bg-white/5 border-white/10 text-white hover:bg-white/20"
                        )}
                      >
                        <Heart className={cn("h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110", favorites.has(currentPhoto.id) && "fill-current")} />
                        {favorites.size > 0 && (
                          <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-red-500 shadow-xl">
                            {favorites.size}
                          </span>
                        )}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-[100]">
                          {favorites.has(currentPhoto.id) ? "Quitar Favorita" : "Marcar Favorita"}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-white" />
                        </div>
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowNoteInput(!showNoteInput); }}
                        className={cn(
                          "w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center transition-all border shadow-lg group active:scale-95 relative",
                          showNoteInput || photoNotes[currentPhoto.id]
                            ? "bg-blue-500 border-blue-400 text-white shadow-blue-500/20" 
                            : "bg-white/5 border-white/10 text-white hover:bg-white/20"
                        )}
                      >
                        <MessageSquare className={cn("h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110", photoNotes[currentPhoto.id] && "fill-current text-white")} />
                        {photoNotes[currentPhoto.id] && (
                          <span className="absolute -top-1 -right-1 bg-white w-4 h-4 rounded-full border-2 border-blue-500 animate-pulse shadow-lg" />
                        )}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-[100]">
                          {photoNotes[currentPhoto.id] ? "Editar Nota" : "Escribir Nota"}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-white" />
                        </div>
                      </button>
                    </div>

                    {/* 2. CENTRO: ACCIÓN DE DESCARTAR (33%) */}
                    <div className="flex-1 flex items-center justify-center">
                      {rejectedPhotos.has(currentPhoto.id) ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRejectAction(currentPhoto); }}
                          className="flex items-center gap-2 px-6 sm:px-10 h-12 sm:h-15 rounded-full transition-all font-black text-[10px] sm:text-[11px] uppercase tracking-widest bg-cyan-600/90 border border-cyan-400 text-white shadow-xl hover:bg-cyan-600 hover:scale-[1.02] active:scale-95 shrink-0 relative group"
                        >
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Recuperar</span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-[100]">
                            Devolver a la galería
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-white" />
                          </div>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRejectAction(currentPhoto); }}
                          className="flex items-center gap-2 px-6 sm:px-10 h-12 sm:h-15 rounded-full transition-all font-black text-[10px] sm:text-[11px] uppercase tracking-widest bg-orange-600 border border-orange-500 text-white shadow-xl hover:bg-orange-500 hover:scale-[1.02] active:scale-95 shrink-0 relative group"
                        >
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Descartar</span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-[100]">
                            Ocultar esta foto
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-white" />
                          </div>
                        </button>
                      )}
                    </div>

                    {/* 3. LADO DERECHO: FILTROS DE SECCIÓN (33%) */}
                    <div className="flex-1 flex items-center justify-end pr-2 overflow-visible">
                      <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-inner overflow-visible">
                        <button 
                          onClick={() => { setShowOnlyFavorites(false); setShowRejected(false); }}
                          className={cn(
                            "px-3 sm:px-6 h-10 sm:h-12 rounded-full text-[8.5px] sm:text-[10px] font-black uppercase tracking-widest transition-all relative group",
                            !showOnlyFavorites && !showRejected ? "bg-white text-slate-900 shadow-xl" : "text-white/40 hover:text-white"
                          )}
                        >
                           <span className="hidden sm:inline">GALERÍA</span>
                           <ImageIcon className="h-4 w-4 sm:hidden" />
                           {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-[100]">
                              Ver Todo
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-white" />
                            </div>
                        </button>
                        <button 
                          onClick={() => { setShowOnlyFavorites(true); setShowRejected(false); }}
                          className={cn(
                            "w-10 sm:w-14 h-10 sm:h-12 rounded-full flex items-center justify-center transition-all relative group",
                            showOnlyFavorites ? "bg-white/10 text-white border border-white/10" : "text-white/30 hover:text-white/60"
                          )}
                        >
                          <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", showOnlyFavorites && "fill-current text-red-500")} />
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-[100]">
                            Ver Favoritas
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-white" />
                          </div>
                        </button>
                        <button 
                          onClick={() => { setShowOnlyFavorites(false); setShowRejected(true); }}
                          className={cn(
                            "w-10 sm:w-14 h-10 sm:h-12 rounded-full flex items-center justify-center transition-all relative group",
                            showRejected ? "bg-white/10 text-white border border-white/10" : "text-white/30 hover:text-white/60"
                          )}
                        >
                          <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-[100]">
                            Ver Descartadas
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-white" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mt-1 flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-white/10" />
                    {isMobile ? 'Desliza para navegar' : 'NAVEGACIÓN POR FLECHAS'}
                    <span className="w-8 h-[1px] bg-white/10" />
                  </p>
                </div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      {/* MODAL DE RESUMEN PARA COPIAR */}
      <Dialog open={showSummary} onOpenChange={(val) => { setShowSummary(val); if(!val) setShowTextSummary(false); }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl z-[100] bg-white">
          <AnimatePresence mode="wait">
            {!showTextSummary ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center justify-center p-10 text-center gap-6"
              >
                <div className="w-24 h-24 bg-[#4A7C59]/10 rounded-full flex items-center justify-center mb-2">
                   <div className="w-16 h-16 bg-[#4A7C59] rounded-full flex items-center justify-center shadow-lg shadow-[#4A7C59]/20">
                      <Check className="h-8 w-8 text-white" strokeWidth={3} />
                   </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">¡Selección Enviada!</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
                    Tu selección ha sido recibida correctamente. ¿Quieres agilizar el proceso?
                  </p>
                </div>

                <div className="flex flex-col w-full gap-3 mt-4">
                  <Button 
                    onClick={sendWhatsAppSelection}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full h-14 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-[#25D366]/20 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Enviar por WhatsApp
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowTextSummary(true)}
                    className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-full h-14 font-black uppercase text-[11px] tracking-widest"
                  >
                    Ver Vista Previa
                  </Button>

                  <Button 
                    variant="ghost"
                    onClick={() => setShowSummary(false)}
                    className="w-full text-slate-400 hover:text-slate-600 h-10 font-bold uppercase text-[9px] tracking-widest"
                  >
                    Cerrar y Salir
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6 p-10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowTextSummary(false)}
                    className="rounded-full h-8 w-8 hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vista Previa</h3>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <textarea 
                    readOnly
                    className="w-full h-64 bg-transparent border-none text-[10px] font-mono leading-relaxed focus:outline-none resize-none scrollbar-hide"
                    value={summaryText}
                  />
                </div>
                
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(summaryText);
                    toast({ title: "¡Copiado!", description: "Listo para pegar en WhatsApp o Email." });
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full h-14 font-black uppercase text-[11px] tracking-widest shadow-xl"
                >
                  Copiar Texto
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Reproductor de Audio */}
      {client?.gallerySettings?.bgMusic?.url && (
            <audio 
              ref={audioRef}
              src={client.gallerySettings.bgMusic.url}
              loop
              autoPlay
            />
      )}
      {/* DIALOGO DE CONFIRMACIÓN DE DESCARTE */}
      <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-center relative">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Trash2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">¿Ocultar esta foto?</DialogTitle>
            <p className="text-slate-400 text-sm mt-2">La foto dejará de verse en la galería principal para que puedas centrarte en tus favoritas.</p>
          </div>
          <div className="p-8 bg-white text-center">
            <p className="text-slate-500 text-sm mb-8 font-medium">
              No te preocupes, <span className="font-bold text-slate-900 underline decoration-[#4A7C59] decoration-2">está a salvo</span>. Podrás verla y recuperarla en cualquier momento desde el botón de "Descartadas".
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsRejectConfirmOpen(false)}
                className="rounded-full h-12 font-black uppercase text-[10px] tracking-widest border-slate-200"
              >
                Mantener
              </Button>
              <Button 
                onClick={confirmReject}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <CartSheet 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        clientId={clientId || slug} 
        galleryTitle={client?.name}
      />

      {/* Global Notification at the bottom */}
      <AnimatePresence>
        {viewerNotification && viewerIndex === null && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[150] bg-white/95 backdrop-blur-xl px-6 py-4 rounded-full shadow-2xl border-2 border-slate-100 flex items-center gap-3 w-[calc(100%-2.5rem)] max-w-[340px] justify-center"
          >
             <div className="h-2 w-2 rounded-full bg-[#4A7C59] animate-pulse shrink-0" />
             <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">
               {viewerNotification}
             </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP OFERTA PACK COMPLETO (Marketing a los 30s) */}
      <AnimatePresence>
        {showFullPackPopup && !fullPackDismissed && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] overflow-hidden shadow-2xl max-w-lg w-full relative"
            >
              {/* Botón Cerrar */}
              <button 
                onClick={() => {
                  setShowFullPackPopup(false)
                  setFullPackDismissed(true)
                }}
                className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all border border-slate-200/50"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="bg-gradient-to-br from-[#4A7C59] to-[#3D6649] p-10 text-white relative overflow-hidden text-left">
                {/* Decoración Fondo */}
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <ShoppingBag className="h-48 w-48 rotate-12" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <span className="inline-flex bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">OFERTA ESPECIAL</span>
                    <h3 className="text-4xl font-black italic tracking-tighter leading-none">
                      {includedCount > 0 ? "¡COMPLETA TU GALERÍA!" : "¡LLÉVATELO TODO!"}
                    </h3>
                    <p className="text-white/70 text-sm font-medium leading-relaxed max-w-[280px]">
                      {includedCount > 0 
                        ? `Ya tienes ${includedCount} fotos incluidas. Completa tu colección con las ${remainingPhotosCount} restantes en **formato digital**.`
                        : "¿Te gustan todas? Llévate la sesión completa en **formato digital** a máxima calidad por un precio único."
                      }
                    </p>
                    <div className="flex items-center gap-2 text-white/40 border-t border-white/10 pt-4 mt-2">
                       <ShoppingBag className="h-3 w-3" />
                       <p className="text-[10px] font-bold uppercase tracking-tight leading-tight">
                         ¿Quieres copias en papel? Pídelas en la tienda.
                       </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-white/40 text-sm font-black line-through mb-2 uppercase tracking-widest leading-none">
                        {photos.length * (client?.gallerySettings?.digitalFiles?.price || 15)}€
                      </span>
                      <div className="flex items-center justify-center">
                        <span className="text-3xl font-black italic mt-1 mr-1 text-white/60">+</span>
                        <span className="text-7xl font-black italic tracking-tighter leading-none text-white drop-shadow-2xl">
                          {client?.gallerySettings?.digitalFiles?.fullPackPrice}€
                        </span>
                      </div>
                      {includedCount > 0 && (
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-4 bg-white/5 border border-white/5 px-4 py-1 rounded-full">
                          Fotos Adicionales
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-5 w-full items-center">
                      <Button 
                        onClick={handleAcceptFullPack}
                        className="bg-white text-[#4A7C59] hover:bg-slate-50 rounded-full px-12 h-16 font-black uppercase text-[12px] tracking-widest shadow-[0_20px_50px_-12px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 w-full max-w-[340px]"
                      >
                        {includedCount > 0 ? "¡Sí, SUMARLAS A MI CESTA!" : "¡SÍ, ME LAS LLEVO TODAS!"}
                      </Button>

                      <Button 
                        variant="ghost" 
                        onClick={handleDeclineOffer}
                        className="bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-full px-10 h-11 font-black uppercase text-[8px] tracking-[0.15em] shadow-xl transition-all hover:scale-105 active:scale-95 leading-tight backdrop-blur-md border border-white/5 w-full max-w-[280px]"
                      >
                        No son importantes para mi,<br/>deseo perder estos recuerdos para siempre
                      </Button>
                    </div>

                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.3em] text-center">
                      * Disponible por tiempo limitado en tu galería privada
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VENTANA EMERGENTE DE NOSTALGIA (FOMO) */}
      <AnimatePresence>
        {showFommoMessage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="bg-white border-b-4 border-[#4A7C59] rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative pointer-events-auto"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <Trash2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                   <h4 className="text-xl font-black text-slate-800 tracking-tighter italic">¿CUIDADO CON ESTO...?</h4>
                   <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
                     Como profesional, para mantener el espacio del servidor al día, **el fotógrafo borrará permanentemente todos tus recuerdos** en cuanto te entregue tu selección definitiva.
                   </p>
                   <p className="text-[#4A7C59] text-sm font-black italic mt-4">
                     Una verdadera pena que se pierdan para siempre... ¿estás totalmente seguro?
                   </p>
                </div>
                <Button 
                  onClick={() => { setShowFommoMessage(false); setShowFullPackPopup(true); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full px-6 h-10 font-bold uppercase text-[9px] tracking-widest transition-all mt-2"
                >
                  Esperar, me lo estoy pensando
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

          {/* POPUP REGALO (75% DE LA GALERÍA) */}
          <AnimatePresence>
            {showGiftPopup && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md text-left">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[3rem] overflow-hidden shadow-2xl max-w-lg w-full relative"
                >
                  <div className="bg-gradient-to-br from-[#4A7C59] to-[#3D6649] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Gift className="h-48 w-48 rotate-12" />
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                      <div className="space-y-2">
                        <span className="inline-flex bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">PREMIO A TU SELECCIÓN</span>
                        <h3 className="text-4xl font-black italic tracking-tighter leading-none">¡REGALO EXCLUSIVO!</h3>
                        <p className="text-white/80 text-sm font-medium leading-relaxed max-w-[320px]">
                          Vemos que te ha encantado casi toda la sesión ({favorites.size} fotos). ¡Queremos tener un detalle contigo!
                        </p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                        <p className="text-lg font-black italic leading-tight">
                          Al enviar esta selección, te habilitaremos la descarga de la <span className="text-yellow-300 underline underline-offset-4 font-black">GALERÍA COMPLETA</span> sin coste adicional.
                        </p>
                      </div>

                      <div className="flex flex-col gap-4">
                        <Button 
                          onClick={handleAcceptGift}
                          className="bg-white text-[#4A7C59] hover:bg-slate-50 rounded-full px-8 h-14 font-black uppercase text-[11px] tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                          Aceptar Regalo y Enviar
                        </Button>
                      </div>

                      <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                        * El fotógrafo validará tu selección y habilitará la descarga completa en breve.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MODAL PARA LIMPIAR SELECCIÓN */}
          <AnimatePresence>
            {showClearConfirm && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                      <Trash2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
                        ¿Limpiar todo?
                      </h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        Se quitarán todas las fotos de tus favoritas. Esta acción no se puede deshacer.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      <Button 
                        onClick={handleConfirmClear}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-14 font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                        SÍ, LIMPIAR SELECCIÓN
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => setShowClearConfirm(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold uppercase text-[10px] tracking-widest"
                      >
                        No, quiero dejarlas
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MODAL PARA CANCELAR Y EMPEZAR DE CERO */}
          <AnimatePresence>
            {showCancelConfirm && (
              <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center border-b-[6px] border-slate-200"
                >
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                      <Plus className="h-12 w-12 rotate-45" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">
                        ¿REINICIAR?
                      </h3>
                      <p className="text-slate-500 text-[15px] font-semibold leading-relaxed px-4">
                        ¿Quieres borrar tu selección actual y elegir tus fotos de nuevo desde cero? 
                      </p>
                    </div>
                    <div className="flex flex-col gap-4 w-full mt-4">
                      <Button 
                        onClick={handleConfirmCancel}
                        className="bg-slate-900 hover:bg-black text-white rounded-full h-16 font-black uppercase text-[12px] tracking-widest shadow-xl active:scale-95 transition-all w-full"
                      >
                        SÍ, EMPEZAR DE NUEVO
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => setShowCancelConfirm(false)}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full h-12 font-bold uppercase text-[10px] tracking-widest transition-all"
                      >
                        VOLVER A MIS FOTOS
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )
    }

