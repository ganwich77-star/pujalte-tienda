'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Check,
  X,
  Users, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  UserCheck, 
  TrendingUp,
  MessageSquare,
  BadgeEuro,
  Edit2,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  UserPlus,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  Camera,
  Upload,
  Eye,
  Send,
  History,
  FileText,
  AlertCircle,
  Music,
  Loader2,
  Music2,
  Disc,
  Pause,
  Play,
  Download,
  Info,
  Star,
  FileImage,
  Copy,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CircleDollarSign,
  Package,
  Settings2,
  ChevronDown
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { db, storage, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query,
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from 'framer-motion'
import { Filter } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Order } from '@/types'
interface CustomersTabProps {
  orders: Order[]
  formatPrice: (price: number) => string
  customerIdToEdit?: string | null
  initialFilter?: string
}

const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-')     // Caracteres no alfanuméricos por guiones
    .replace(/^-+|-+$/g, '');        // Quitar guiones al inicio y final
};

const resizeImage = (file: File, maxSide: number = 1500): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSide) { height *= maxSide / width; width = maxSide; }
        } else {
          if (height > maxSide) { width *= maxSide / height; height = maxSide; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          else resolve(file);
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export function CustomersTab({ orders, formatPrice, customerIdToEdit, initialFilter = 'all' }: CustomersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState(initialFilter) // all, pending_action, empty, confirmed

  useEffect(() => {
    if (initialFilter) {
      setActionFilter(initialFilter)
    }
  }, [initialFilter])
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [firebaseClients, setFirebaseClients] = useState<Record<string, any>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false)
  const [isGalleryConfigOpen, setIsGalleryConfigOpen] = useState(true)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    cashEnabled: false,
    gallerySettings: {
      galleryTitle: '',
      gallerySubtitle: '',
      shopRequiresFavorite: false,
      safetyLockEnabled: true,
      watermarkEnabled: true,
      digitalFiles: {
        enabled: true,
        price: 15,
        extraPrintPrice: 5,
        packIncluded: 0,
        fullPackPrice: 0
      }
    },
    slug: ''
  })
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingMusic, setIsUploadingMusic] = useState(false)
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false)
  const [librarySongs, setLibrarySongs] = useState<any[]>([])
  const [musicSearch, setMusicSearch] = useState('')
  const [selectedMusicCategory, setSelectedMusicCategory] = useState('ALL')
  const [isMusicUploading, setIsMusicUploading] = useState(false)
  const [musicUploadProgress, setMusicUploadProgress] = useState(0)

  const handleQuickMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes('audio')) {
      toast({ title: 'Archivo no válido', description: 'Por favor, selecciona un fichero de música.', variant: 'destructive' })
      return
    }

    try {
      setIsMusicUploading(true)
      setMusicUploadProgress(0)

      const storageRef = ref(storage, `library/music/${Date.now()}_${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setMusicUploadProgress(progress)
        },
        (error) => {
          console.error('Error subiendo música:', error)
          setIsMusicUploading(false)
          toast({ title: 'Error en la subida', variant: 'destructive' })
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          
          const newSongDoc = await addDoc(collection(db, 'comuniones2026_music'), {
            name: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            url,
            createdAt: serverTimestamp(),
            size: file.size,
            category: 'ALL'
          })

          toast({ title: '¡Música añadida!', description: 'Ya está disponible en vuestra fonoteca.' })
          loadLibraryMusic() // Recargar la lista
          setIsMusicUploading(false)
        }
      )
    } catch (error) {
      console.error('Error:', error)
      setIsMusicUploading(false)
    }
  }
  const [customTags, setCustomTags] = useState<any[]>([])
  const [playingSong, setPlayingSong] = useState<string | null>(null)
  const [previewAudio] = useState(new Audio())
  const [uploadStatus, setUploadStatus] = useState({ current: 0, total: 0 })
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isCancelUploadRequested, setIsCancelUploadRequested] = useState(false)
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null)
  const router = useRouter()
  const initialEditProcessed = useRef(false)
  const uploadControllerRef = useRef<boolean>(false)

  // Cargar datos de clientes desde Firebase (tiene DNI, cashEnabled actualizados)
  useEffect(() => {
    const loadFirebaseClients = async () => {
      try {
        const q = query(collection(db, COLLECTIONS.CLIENTS), orderBy('updatedAt', 'desc'))
        const snap = await getDocs(q)
        const map: Record<string, any> = {}
        snap.forEach(d => { map[d.id] = d.data() })
        setFirebaseClients(map)
      } catch (e) { console.error('Error cargando clients de Firebase:', e) }
    }
    loadFirebaseClients()
  }, [])

  const reloadFirebase = async () => {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.CLIENTS))
      const map: Record<string, any> = {}
      snap.forEach(d => { map[d.id] = d.data() })
      setFirebaseClients(map)
    } catch (e) {
      console.error('Error recargando clientes:', e)
    }
  }

  const loadTags = async () => {
    try {
      const q = query(collection(db, 'music_categories'), orderBy('label', 'asc'))
      const snap = await getDocs(q)
      setCustomTags(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error('Error cargando etiquetas:', e) }
  }

  // Cargar datos al inicio
  useEffect(() => {
    loadTags()
  }, [])

  const loadLibraryMusic = async () => {
    try {
      const q = query(collection(db, 'comuniones2026_music'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setLibrarySongs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error('Error loading library:', e) }
  }

  // Cargar música cuando se abre el selector
  useEffect(() => {
    if (isMusicPickerOpen) {
      loadLibraryMusic()
    }
  }, [isMusicPickerOpen])

  // Limpiar audio al desmontar o cerrar picker
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause()
        previewAudio.src = ''
      }
    }
  }, [previewAudio])

  // Navegación por teclado para el zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!zoomedPhoto || !editingCustomer?.gallerySettings?.photos) return;
      const photos = editingCustomer.gallerySettings.photos;
      const currentIndex = photos.findIndex((p: any) => p.url === zoomedPhoto);
      
      if (e.key === 'ArrowLeft') {
        const nextIndex = (currentIndex - 1 + photos.length) % photos.length;
        setZoomedPhoto(photos[nextIndex].url);
      } else if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % photos.length;
        setZoomedPhoto(photos[nextIndex].url);
      } else if (e.key === 'Escape') {
        setZoomedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedPhoto, editingCustomer]);

  const togglePreview = (url: string, id: string) => {
    if (playingSong === id) {
      previewAudio.pause()
      setPlayingSong(null)
    } else {
      previewAudio.src = url
      previewAudio.play()
      setPlayingSong(id)
    }
  }

  const handleSelectFromLibrary = async (song: any) => {
    if (!editingCustomer) return
    const musicData = { url: song.url, name: song.name, libraryId: song.id }
    
    const prevVersion = { ...editingCustomer }
    setEditingCustomer({
      ...editingCustomer,
      gallerySettings: {
        ...editingCustomer.gallerySettings,
        bgMusic: musicData
      }
    })

    try {
      const clientKey = editingCustomer.id || (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientKey)
      await updateDoc(clientRef, {
        'gallerySettings.bgMusic': musicData,
        'updatedAt': new Date().toISOString()
      })
      toast({ title: 'Canción seleccionada', description: 'Banda sonora asignada desde la fonoteca.' })
    } catch (error) {
      console.error('Error persistiendo música:', error)
      setEditingCustomer(prevVersion)
      toast({ title: 'Error', description: 'No se pudo guardar la selección de música.', variant: 'destructive' })
    }

    setIsMusicPickerOpen(false)
    previewAudio.pause()
    setPlayingSong(null)
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name || (!newCustomer.email && !newCustomer.phone && !newCustomer.dni)) {
      toast({ title: 'Datos incompletos', description: 'Nombre y al menos un dato de contacto son necesarios.', variant: 'destructive' })
      return
    }
    setUpdating(true)
    try {
      const { doc: firestoreDoc, setDoc: firestoreSet, serverTimestamp, query, where, getDocs, collection } = await import('firebase/firestore')
      
      // GARANTIZAR SLUG ÚNICO
      let baseSlug = (newCustomer.slug || newCustomer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || 
                        (newCustomer.dni || newCustomer.email || newCustomer.phone).trim().toUpperCase();
      
      let finalSlug = baseSlug;
      let count = 1;
      let exists = true;
      while (exists) {
        const q = query(collection(db, COLLECTIONS.CLIENTS), where("slug", "==", finalSlug));
        const snap = await getDocs(q);
        if (snap.empty) {
          exists = false;
        } else {
          count++;
          finalSlug = `${baseSlug}-${count}`;
        }
      }

      const docId = (newCustomer.dni || newCustomer.email || newCustomer.phone).trim().toUpperCase().replace(/[^A-Z0-9]/g, '') + "_" + Math.random().toString(36).substring(2, 7)
      
      await firestoreSet(firestoreDoc(db, COLLECTIONS.CLIENTS, docId), {
        ...newCustomer,
        id: docId,
        slug: finalSlug,
        dni: newCustomer.dni.trim().toUpperCase(),
        email: newCustomer.email.toLowerCase().trim(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      })

      toast({ title: 'Cliente añadido', description: 'El nuevo cliente se ha registrado correctamente.' })
      
      /* 
      // Desactivado: El correo se envía manualmente desde la tabla de acciones
      try {
        await fetch('/api/admin/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dni: newCustomer.dni.trim().toUpperCase(),
            name: newCustomer.name,
            email: newCustomer.email.toLowerCase().trim(),
            phone: newCustomer.phone
          })
        })
      } catch (e) {
        console.error('Error enviando mail automático:', e)
      }
      */

      setIsAddingCustomer(false)
      setNewCustomer({ 
        name: '', 
        dni: '', 
        email: '', 
        phone: '', 
        cashEnabled: false, 
        gallerySettings: { 
          galleryTitle: '',
          gallerySubtitle: '',
          shopRequiresFavorite: false,
          safetyLockEnabled: true,
          watermarkEnabled: true,
          digitalFiles: {
            enabled: true,
            price: 15,
            extraPrintPrice: 5,
            packIncluded: 0,
            fullPackPrice: 0
          }
        },
        slug: ''
      })
      await reloadFirebase()
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo añadir el cliente.', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return
    try {
      // Eliminar de Firebase usando el ID guardado
      const key = deletingCustomer.id || deletingCustomer.dni || deletingCustomer.email || deletingCustomer.phone
      if (key) {
        const { doc: firestoreDoc, deleteDoc: firestoreDelete } = await import('firebase/firestore')
        await firestoreDelete(firestoreDoc(db, COLLECTIONS.CLIENTS, key))
        // También limpiar de la selección si estaba
        const nextSelected = new Set(selectedIds)
        nextSelected.delete(key)
        setSelectedIds(nextSelected)
      }
      toast({ title: 'Cliente eliminado', description: 'El cliente ha sido eliminado de la base de datos.' })
      await reloadFirebase()
      setDeletingCustomer(null)
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo eliminar el cliente.', variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`¿Seguro que quieres eliminar ${selectedIds.size} clientes?`)) return
    
    try {
      const { doc: firestoreDoc, deleteDoc: firestoreDelete } = await import('firebase/firestore')
      const deletePromises = Array.from(selectedIds).map(id => firestoreDelete(firestoreDoc(db, COLLECTIONS.CLIENTS, id)))
      await Promise.all(deletePromises)
      
      toast({ title: 'Clientes eliminados', description: `Se han borrado ${selectedIds.size} clientes.` })
      setSelectedIds(new Set())
      await reloadFirebase()
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron eliminar todos los clientes.', variant: 'destructive' })
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id || c.dni || c.email || c.phone)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const formatDate = (dateValue: any): Date => {
    if (!dateValue) return new Date()
    if (dateValue.seconds) return new Date(dateValue.seconds * 1000)
    const d = new Date(dateValue)
    return isNaN(d.getTime()) ? new Date() : d
  }

  const handleToggleCash = async (customer: any) => {
    try {
      setUpdating(true)
      const { doc: firestoreDoc, updateDoc: firestoreUpdate } = await import('firebase/firestore')
      const key = customer.id || (customer.dni || customer.email || customer.phone).trim().toUpperCase()
      
      await firestoreUpdate(firestoreDoc(db, COLLECTIONS.CLIENTS, key), {
        cashEnabled: !customer.cashEnabled,
        updatedAt: new Date()
      })

      toast({ 
        title: customer.cashEnabled ? 'Pago bloqueado' : 'Pago habilitado', 
        description: `El cliente ${customer.name} ahora ${customer.cashEnabled ? 'no puede' : 'puede'} pagar en efectivo.` 
      })
      await reloadFirebase()
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado del pago.', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  // LOGICA DE GALERIA
  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(e.target.files || [])
    if (filesArray.length === 0 || !editingCustomer) return

    const clientKey = editingCustomer.id || editingCustomer.originalId
    if (!clientKey) {
        toast({ title: 'Error', description: 'ID de cliente no encontrado.', variant: 'destructive' })
        return
    }
    setIsUploading(true)
    setIsCancelUploadRequested(false)
    uploadControllerRef.current = false
    setUploadStatus({ current: 0, total: filesArray.length })
    
    const addedPhotos: any[] = []
    
    try {
      for (let i = 0; i < filesArray.length; i++) {
        if (uploadControllerRef.current) {
          toast({ title: 'Subida cancelada', description: `Se han subido ${addedPhotos.length} fotos.` })
          break
        }

        let file = filesArray[i]
        if (file.type.startsWith('image/')) {
          file = await resizeImage(file, 1500)
        }

        const storageRef = ref(storage, `clients/${clientKey}/gallery/${file.name}`)
        
        await new Promise((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file)
          
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
            }, 
            (error) => reject(error), 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              const photoData = {
                id: Math.random().toString(36).substr(2, 9),
                url: downloadURL,
                name: file.name.split('.')[0],
                fileName: file.name,
                createdAt: new Date().toISOString(),
                isCover: (editingCustomer.gallerySettings?.photos?.length || 0) === 0 && i === 0 && addedPhotos.length === 0
              }
              addedPhotos.push(photoData)
              setUploadStatus(prev => ({ ...prev, current: i + 1 }))
              resolve(photoData)
            }
          )
        })
      }
      
      const newPhotos = [...(editingCustomer.gallerySettings?.photos || []), ...addedPhotos]
      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientKey)
      await updateDoc(clientRef, {
        gallerySettings: {
          ...editingCustomer.gallerySettings,
          photos: newPhotos,
          updatedAt: new Date().toISOString()
        }
      })

      setEditingCustomer({
        ...editingCustomer,
        gallerySettings: {
          ...editingCustomer.gallerySettings,
          photos: newPhotos
        }
      })
      
      if (!uploadControllerRef.current) {
        toast({ title: 'Subida finalizada', description: `${addedPhotos.length} fotos añadidas correctamente.` })
      }
    } catch (error) {
      console.error('Error subiendo fotos:', error)
      toast({ title: 'Error', description: 'No se pudieron subir algunas fotos.', variant: 'destructive' })
    } finally {
      setIsUploading(false)
      setUploadProgress({})
      uploadControllerRef.current = false
    }
  }

  const handleCancelUpload = () => {
    uploadControllerRef.current = true
    setIsCancelUploadRequested(true)
  }

  const togglePhotoSelection = (photoId: string) => {
    const next = new Set(selectedPhotos)
    if (next.has(photoId)) next.delete(photoId)
    else next.add(photoId)
    setSelectedPhotos(next)
  }

  const handleSelectAllPhotos = () => {
    if (!editingCustomer?.gallerySettings?.photos) return
    if (selectedPhotos.size === editingCustomer.gallerySettings.photos.length) {
      setSelectedPhotos(new Set())
    } else {
      setSelectedPhotos(new Set(editingCustomer.gallerySettings.photos.map((p: any) => p.id)))
    }
  }

  const handleDeletePhotoByUrl = async (url: string) => {
    if (!editingCustomer || !confirm('¿Seguro que quieres eliminar esta foto?')) return
    const photos = editingCustomer.gallerySettings.photos.filter((p: any) => p.url !== url)
    const clientKey = editingCustomer.id || (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
    
    try {
      await updateDoc(doc(db, COLLECTIONS.CLIENTS, clientKey), {
        'gallerySettings.photos': photos,
        'gallerySettings.updatedAt': new Date().toISOString()
      })
      setEditingCustomer({
        ...editingCustomer,
        gallerySettings: { ...editingCustomer.gallerySettings, photos }
      })
      setZoomedPhoto(null)
      toast({ title: 'Foto eliminada' })
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  const handleDeleteSelectedPhotos = async () => {
    if (!editingCustomer || selectedPhotos.size === 0) return
    if (!confirm(`¿Seguro que quieres eliminar ${selectedPhotos.size} fotos?`)) return

    const photos = editingCustomer.gallerySettings.photos.filter((p: any) => !selectedPhotos.has(p.id))
    const clientKey = editingCustomer.id || (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
    
    try {
      await updateDoc(doc(db, COLLECTIONS.CLIENTS, clientKey), {
        'gallerySettings.photos': photos,
        'gallerySettings.updatedAt': new Date().toISOString()
      })

      setEditingCustomer({
        ...editingCustomer,
        gallerySettings: { ...editingCustomer.gallerySettings, photos }
      })
      setSelectedPhotos(new Set())
      toast({ title: 'Fotos eliminadas', description: `Se han borrado ${selectedPhotos.size} fotos correctamente.` })
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron eliminar las fotos.', variant: 'destructive' })
    }
  }

  const handleSetCover = async (photoId: string) => {
    if (!editingCustomer) return
    const photos = editingCustomer.gallerySettings.photos.map((p: any) => ({
      ...p,
      isCover: p.id === photoId
    }))

    const clientKey = editingCustomer.id || (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
    await updateDoc(doc(db, COLLECTIONS.CLIENTS, clientKey), {
      'gallerySettings.photos': photos
    })

    setEditingCustomer({
      ...editingCustomer,
      gallerySettings: { ...editingCustomer.gallerySettings, photos }
    })
    toast({ title: 'Portada actualizada' })
  }

  const handleUploadMusic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingCustomer) return
    
    if (!file.type.startsWith('audio/')) {
        toast({ title: 'Archivo no válido', description: 'Por favor, sube un archivo de audio (MP3, WAV, etc.)', variant: 'destructive' })
        return
    }

    const clientKey = editingCustomer.id || (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
    setIsUploadingMusic(true)
    
    try {
      const storageRef = ref(storage, `clients/${clientKey}/music/${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)
      
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', null, (error) => reject(error), async () => {
          resolve(await getDownloadURL(uploadTask.snapshot.ref))
        })
      })

      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientKey)
      const musicData = { url: downloadURL, name: file.name }
      
      await updateDoc(clientRef, {
        'gallerySettings.bgMusic': musicData,
        'updatedAt': new Date().toISOString()
      })

      setEditingCustomer({
        ...editingCustomer,
        gallerySettings: {
          ...editingCustomer.gallerySettings,
          bgMusic: musicData
        }
      })
      
      toast({ title: 'Música añadida', description: 'La banda sonora ha sido cargada correctamente.' })
    } catch (error) {
      console.error('Error subiendo música:', error)
      toast({ title: 'Error', description: 'No se pudo subir el archivo de música.', variant: 'destructive' })
    } finally {
      setIsUploadingMusic(false)
    }
  }

  const handleDeleteMusic = async () => {
    if (!editingCustomer) return
    const clientKey = editingCustomer.id || (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
    
    try {
      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientKey)
      await updateDoc(clientRef, {
        'gallerySettings.bgMusic': null
      })

      setEditingCustomer({
        ...editingCustomer,
        gallerySettings: {
          ...editingCustomer.gallerySettings,
          bgMusic: null
        }
      })
      
      toast({ title: 'Música eliminada', description: 'La galería ya no tiene música de fondo.' })
    } catch (error) {
      console.error('Error eliminando música:', error)
      toast({ title: 'Error', description: 'No se pudo eliminar la música.', variant: 'destructive' })
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!editingCustomer) return
    const photos = editingCustomer.gallerySettings.photos.filter((p: any) => p.id !== photoId)
    
    const clientKey = editingCustomer.id || (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
    await updateDoc(doc(db, COLLECTIONS.CLIENTS, clientKey), {
      'gallerySettings.photos': photos
    })

    setEditingCustomer({
      ...editingCustomer,
      gallerySettings: { ...editingCustomer.gallerySettings, photos }
    })
  }

  const handleSendWelcomeEmail = async (customer: any) => {
    try {
      setUpdating(true)
      const res = await fetch('/api/admin/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: customer.dni,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        })
      })

      if (!res.ok) throw new Error()
      
      toast({ 
        title: 'Email enviado', 
        description: `Se ha enviado el correo de bienvenida a ${customer.name} correctamente.` 
      })
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo enviar el email.', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const customers = useMemo(() => {
    // 1. Iniciamos el mapa SOLO con los clientes que EXISTEN en Firebase
    // Esto garantiza que si borras un cliente de la base de datos, NO volverá a aparecer
    // aunque tenga pedidos antiguos en el historial.
    const customerMap = new Map<string, any>()
    
    Object.entries(firebaseClients).forEach(([id, fc]: [string, any]) => {
      const key = id // Usamos el ID real de Firestore como clave única
      
      customerMap.set(key, {
        id: key,
        name: fc.name || 'Sin nombre',
        email: fc.email || 'Sin email',
        phone: fc.phone || '',
        address: '',
        dni: fc.dni || '',
        orders: [],
        totalSpent: 0,
        lastOrderDate: fc.createdAt ? formatDate(fc.createdAt) : new Date(0),
        marketing: fc.marketing || false,
        cashEnabled: fc.cashEnabled || false,
        gallerySettings: fc.gallerySettings || {},
        slug: fc.slug || ''
      })
    })

    // 2. Vinculamos los pedidos SOLO a los clientes que SI están registrados
    orders.forEach(order => {
      const customFields = (order.customFields || {}) as Record<string, any>
      const dni = (customFields.dni || '').trim().toUpperCase()
      const email = (order.customerEmail?.toLowerCase() || '').trim()
      const phone = (order.customerPhone || '').trim()
      
      // Buscar coincidencia en nuestra lista de Firebase
      let matchKey: string | null = null;
      const orderSlug = (order.clientId || '').toLowerCase().trim();
      
      // 1. Prioridad por DNI (ID o campo dni)
      if (dni && customerMap.has(dni)) {
        matchKey = dni;
      } else {
        // 2. Si no es el ID directo, buscamos entre los valores (por si el ID es el email o teléfono)
        for (const [key, cust] of customerMap.entries()) {
          const custDni = (cust.dni || '').trim().toUpperCase();
          const custEmail = (cust.email || '').toLowerCase().trim();
          const custPhone = (cust.phone || '').trim();
          const custSlug = (cust.slug || '').toLowerCase().trim();

          // CRUCIAL: Añadimos coincidencia por SLUG para casos como el de Vero Martinez
          if (orderSlug && custSlug === orderSlug) { matchKey = key; break; }
          if (dni && custDni === dni) { matchKey = key; break; }
          if (email && custEmail === email) { matchKey = key; break; }
          if (phone && custPhone === phone) { matchKey = key; break; }
        }
      }

      if (matchKey) {
        const entry = customerMap.get(matchKey)!
        entry.orders.push(order)
        entry.totalSpent += order.total
        const orderDate = formatDate(order.createdAt)
        if (orderDate > entry.lastOrderDate) {
          entry.lastOrderDate = orderDate
          entry.address = order.address || entry.address
        }
        if (customFields.marketing === 'true' || customFields.marketing === true) {
          entry.marketing = true
        }
      }
    })

    // 3. Ordenamos: VIPs (más inversión) primero, luego los más recientes
    return Array.from(customerMap.values()).sort((a, b) => {
      if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent
      return b.lastOrderDate.getTime() - a.lastOrderDate.getTime()
    })
  }, [orders, firebaseClients])

  // Efecto para abrir el editor automáticamente si viene de Galerías
  useEffect(() => {
    if (customerIdToEdit && customers.length > 0 && !initialEditProcessed.current) {
      const customer = customers.find(c => 
        (c.dni || c.email || c.phone).trim().toUpperCase() === customerIdToEdit.trim().toUpperCase()
      )
      if (customer) {
        setEditingCustomer({
          ...customer,
          originalEmail: customer.email,
          originalPhone: customer.phone,
          originalDni: customer.dni
        })
        // Forzamos el cambio de tab a 'galeria' en el siguiente render del Dialog
        initialEditProcessed.current = true
      }
    }
  }, [customerIdToEdit, customers])

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.phone.includes(searchQuery) ||
                         c.dni.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    const isConfirmed = c.gallerySettings?.selectionConfirmed && c.gallerySettings?.lastSelection?.length > 0;
    const isEmpty = !c.gallerySettings?.photos || c.gallerySettings.photos.length === 0;

    if (actionFilter === 'pending_action') return isConfirmed || isEmpty;
    if (actionFilter === 'empty') return isEmpty;
    if (actionFilter === 'confirmed') return isConfirmed;
    
    return true;
  })

  const stats = useMemo(() => ({
    total: customers.length,
    repeat: customers.filter(c => c.orders.length > 1).length,
    marketing: customers.filter(c => c.marketing).length,
    avgSpent: customers.length > 0 
      ? customers.reduce((acc, c) => acc + c.totalSpent, 0) / customers.length 
      : 0
  }), [customers])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      {/* Header & Stats Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">Base de Clientes</h2>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-1 w-6 sm:h-1.5 sm:w-8 rounded-full bg-[#4A7C59]" />
            <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Gestión de Audiencia</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => setIsAddingCustomer(true)}
            className="h-10 sm:h-12 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-xl sm:rounded-2xl px-5 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#4A7C59]/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" /> <span className="inline">Añadir Cliente</span>
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-1 sm:flex-none">
            <div className="relative group flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
              <Input
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-white/5 dark:text-white shadow-inner focus-visible:bg-white dark:focus-visible:bg-slate-800 focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 transition-all font-medium text-sm"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-auto h-10 sm:h-12 px-4 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50 dark:bg-slate-900 font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all gap-2">
                <Filter className="h-4 w-4 text-[#4A7C59]" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest py-3">Todos los clientes</SelectItem>
                <SelectItem value="pending_action" className="text-[10px] font-bold uppercase tracking-widest py-3 text-orange-500">Acción Requerida</SelectItem>
                <SelectItem value="confirmed" className="text-[10px] font-bold uppercase tracking-widest py-3 text-emerald-500">Solo Confirmadas</SelectItem>
                <SelectItem value="empty" className="text-[10px] font-bold uppercase tracking-widest py-3 text-rose-500">Solo Sin Fotos</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                className="h-10 sm:h-12 rounded-xl sm:rounded-2xl px-4 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100 transition-all"
              >
                <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Borrar ({selectedIds.size})</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-0">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Recurrentes', value: stats.repeat, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Marketing', value: stats.marketing, icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Gasto Medio', value: formatPrice(stats.avgSpent), icon: TrendingUp, color: 'text-[#4A7C59]', bg: 'bg-[#4A7C59]/5' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4"
          >
            <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${item.bg} dark:bg-opacity-10 ${item.color}`}>
              <item.icon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
              <p className="text-sm sm:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Customers List View */}
      {/* Customers List View */}
      <div className="mx-4 sm:mx-0 bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        {/* VISTA MÓVIL (CARDS) */}
        <div className="block sm:hidden divide-y divide-slate-50">
          {filteredCustomers.map((customer) => (
            <div key={customer.id || `${customer.email}-${customer.phone}`} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4A7C59]/10 border border-[#4A7C59]/10 flex items-center justify-center text-[#4A7C59] font-black text-sm">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 leading-tight">{customer.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{customer.dni || 'SIN DNI'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {customer.cashEnabled && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[8px] px-2 py-0.5 rounded-full uppercase">EFECTIVO OK</Badge>
                  )}
                  {customer.gallerySettings?.selectionConfirmed && customer.gallerySettings?.lastSelection?.length > 0 && (
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] px-2 py-0.5 rounded-full uppercase animate-pulse">Confirmada</Badge>
                  )}
                  {(!customer.gallerySettings?.photos || customer.gallerySettings.photos.length === 0) && (
                    <Badge className="bg-red-500 text-white border-none font-black text-[8px] px-2 py-0.5 rounded-full uppercase animate-pulse">Sin Fotos</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400">Inversión Total</span>
                  <span className="font-black text-sm text-[#4A7C59] tracking-tighter">{formatPrice(customer.totalSpent)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400">Nº Pedidos</span>
                  <span className="font-black text-sm text-slate-700">{customer.orders.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-300" /> {customer.email}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <Phone className="h-3.5 w-3.5 text-slate-300" /> {customer.phone}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-11 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-100 dark:border-white/5 font-bold text-xs gap-2 shadow-sm transition-all"
                      onClick={() => {
                        const generatedSlug = customer.slug || (customer.gallerySettings?.galleryTitle ? customer.gallerySettings.galleryTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '');
                        setEditingCustomer({
                          ...customer,
                          slug: generatedSlug,
                          originalId: customer.id,
                          originalEmail: customer.email,
                          originalPhone: customer.phone,
                          originalDni: customer.dni
                        })
                      }}
                    >
                      <Edit2 className="h-4 w-4" /> Editar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Editar ficha del cliente</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-11 w-11 rounded-xl bg-[#4A7C59]/5 dark:bg-[#4A7C59]/10 text-[#4A7C59] border border-[#4A7C59]/10 shadow-sm"
                      onClick={() => {
                        const welcomeMsg = `🎨 ¡Bienvenido/a a Pujalte Creative Studio! 📸✨\n\nHola *${customer.name}*, es un placer saludarte. \n\nFiel a nuestro lema: "La tecnología al servicio de los recuerdos", hemos habilitado tu acceso a nuestra plataforma privada. 🚀\n\nDesde aquí podrás ver, gestionar y pedir tus fotos de forma sencilla:\n\n🔗 Acceso: https://pujalte-tienda.vercel.app/\n👤 Usuario: *${customer.name.toUpperCase()}*\n🔑 Contraseña: *${customer.dni}*\n\n(Te recomendamos copiar y pegar tus datos para acceder más rápido) ⚡️\n\nCualquier duda o consulta, ¡escríbenos por aquí mismo! \nEstamos para ayudarte. 👋😊`;
                        window.open(`https://api.whatsapp.com/send?phone=${customer.phone.replace(/\D/g, '')}&text=${encodeURIComponent(welcomeMsg)}`, '_blank');
                      }}
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Contactar por WhatsApp</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-11 w-11 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 border border-orange-100 dark:border-orange-500/20 shadow-sm"
                      onClick={() => handleSendWelcomeEmail(customer)}
                    >
                      <Mail className="h-4.5 w-4.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Enviar Email de Bienvenida</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-100 dark:border-rose-500/20 shadow-sm"
                      onClick={() => setDeletingCustomer(customer)}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Eliminar Cliente</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        {/* VISTA DESKTOP (TABLE) */}
        <div className="hidden sm:block w-full overflow-hidden">
          <table className="w-full text-left table-fixed border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-4 py-5 w-[40px] text-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-slate-300 text-[#4A7C59] focus:ring-[#4A7C59]"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredCustomers.length}
                    ref={input => {
                      if (input) input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredCustomers.length
                    }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 sm:px-5 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 w-[30%]">Cliente / DNI</th>
                <th className="px-4 sm:px-5 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 w-[16%]">Contacto</th>
                <th className="px-3 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[8%]">Peds.</th>
                <th className="px-4 sm:px-5 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 w-[15%]">Inversión</th>
                <th className="px-4 sm:px-5 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredCustomers.map((customer, idx) => (
                  <motion.tr
                    layout
                    key={customer.id || `${customer.email}-${customer.phone}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-[#4A7C59]/5 transition-colors"
                  >
                    <td className="px-4 py-5 text-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-slate-300 text-[#4A7C59] focus:ring-[#4A7C59]"
                        checked={selectedIds.has(customer.id || customer.dni || customer.email || customer.phone)}
                        onChange={() => toggleSelect(customer.id || customer.dni || customer.email || customer.phone)}
                      />
                    </td>
                    <td className="px-4 sm:px-5 py-4 sm:py-5 overflow-hidden">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#4A7C59] font-black text-xs">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0 transition-all group-hover:translate-x-1">
                          <p className="font-black text-sm sm:text-[15px] text-slate-900 tracking-tight leading-none uppercase truncate">{customer.name}</p>
                          <p className="text-[10px] sm:text-[12px] font-bold text-slate-400 uppercase tracking-tight truncate mt-1.5 opacity-70 flex items-center gap-2">
                            {customer.dni || 'SIN DNI'}
                            {customer.gallerySettings?.selectionConfirmed && customer.gallerySettings?.lastSelection?.length > 0 && (
                              <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] px-2 py-0.5 rounded-full uppercase scale-90 h-4 animate-pulse">Confirmada</Badge>
                            )}
                            {(!customer.gallerySettings?.photos || customer.gallerySettings.photos.length === 0) && (
                              <Badge className="bg-red-500 text-white border-none font-black text-[8px] px-2 py-0.5 rounded-full uppercase scale-90 h-4 animate-pulse">Sin Fotos</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-4 sm:py-5 overflow-hidden">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 truncate group-hover:text-slate-600 transition-colors">
                          <Mail className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 truncate group-hover:text-slate-600 transition-colors">
                          <Phone className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{customer.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {customer.orders.length > 0 ? (
                        <button 
                          onClick={() => {
                            setEditingCustomer({...customer, originalId: customer.id});
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-500 border border-orange-100 font-black text-[10px] uppercase tracking-wider hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95 group"
                        >
                          <ShoppingBag className="h-3 w-3 group-hover:scale-110 transition-transform" />
                          #{customer.orders.length}
                        </button>
                      ) : (
                        <span className="text-slate-200 font-black text-[10px] uppercase tracking-widest">#0</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-5 py-4 sm:py-5 overflow-hidden">
                      <p className="font-black text-sm sm:text-[16px] text-[#4A7C59] tracking-tight leading-none">{formatPrice(customer.totalSpent)}</p>
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-300 mt-1.5 uppercase tracking-tight opacity-60">Avg: {formatPrice(customer.totalSpent / Math.max(1, customer.orders.length))}</p>
                    </td>
                    <td className="px-4 sm:px-5 py-4 sm:py-5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                        {/* Botón EFECTIVO (Rápido) */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(
                                "h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl shadow-sm transition-all border",
                                customer.cashEnabled 
                                  ? "bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" 
                                  : "bg-slate-50 text-slate-300 border-slate-100 dark:bg-slate-800 dark:border-white/5"
                              )}
                              onClick={() => handleToggleCash(customer)}
                            >
                              <BadgeEuro className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>{customer.cashEnabled ? 'Bloquear Pago Efectivo' : 'Habilitar Pago Efectivo'}</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5 shadow-sm transition-all"
                              onClick={() => {
                                const generatedSlug = customer.slug || (customer.gallerySettings?.galleryTitle ? customer.gallerySettings.galleryTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '');
                                setEditingCustomer({
                                  ...customer,
                                  slug: generatedSlug,
                                  originalId: customer.id,
                                  originalEmail: customer.email,
                                  originalPhone: customer.phone,
                                  originalDni: customer.dni
                                })
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar ficha del cliente</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-400 border border-orange-100 dark:border-orange-500/20 shadow-sm transition-all"
                              onClick={() => handleSendWelcomeEmail(customer)}
                            >
                              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Enviar Email de Bienvenida</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5 shadow-sm transition-all"
                              onClick={() => {
                                  const welcomeMsg = `🎨 ¡Bienvenido/a a Pujalte Creative Studio! 📸✨\n\nHola *${customer.name}*, es un placer saludarte. \n\nFiel a nuestro lema: "La tecnología al servicio de los recuerdos", hemos habilitado tu acceso a nuestra plataforma privada. 🚀\n\nDesde aquí podrás ver, gestionar y pedir tus fotos de forma sencilla:\n\n🔗 Acceso: https://pujalte-tienda.vercel.app/\n👤 Usuario: *${customer.name.toUpperCase()}*\n🔑 Contraseña: *${customer.dni}*\n\n(Te recomendamos copiar y pegar tus datos para acceder más rápido) ⚡️\n\nCualquier duda o consulta, ¡escríbenos por aquí mismo! \nEstamos para ayudarte. 👋😊`;
                                  window.open(`https://api.whatsapp.com/send?phone=${customer.phone.replace(/\D/g, '')}&text=${encodeURIComponent(welcomeMsg)}`, '_blank');
                              }}
                            >
                              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Contactar por WhatsApp</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-red-50 text-red-300 hover:text-red-600 hover:bg-red-100 border border-red-100 shadow-sm transition-all"
                              onClick={() => setDeletingCustomer(customer)}
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Eliminar Cliente</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredCustomers.length === 0 && (
          <div className="py-20 text-center space-y-4">
<div className="w-20 h-20 bg-white dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-50 dark:border-white/5 transition-colors">
              <Users className="h-8 w-8 text-slate-200 dark:text-slate-700" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">No se han encontrado clientes</p>
              <p className="text-sm text-slate-400 font-medium tracking-tight">Prueba con otros términos de búsqueda.</p>
            </div>
          </div>
        )}
      </div>

        {/* Modal de Edición */}
        <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
          <DialogContent className="w-[95vw] sm:max-w-[950px] h-[90dvh] max-h-[90dvh] overflow-hidden rounded-[2rem] p-0 flex flex-col shadow-2xl border-none bg-white">
            <div className="absolute top-4 right-4 z-[60]">
              <Button variant="ghost" size="icon" onClick={() => setEditingCustomer(null)} className="rounded-full bg-slate-50/50 hover:bg-slate-100 hover:text-slate-900 h-8 w-8 transition-all"><X className="h-4 w-4 text-slate-400 group-hover:text-slate-900" /></Button>
            </div>
            <Tabs defaultValue="galeria" className="h-full flex flex-col">
              <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-slate-50 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="space-y-0.5 text-center sm:text-left transition-all">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">Gestionar Cliente</DialogTitle>
                  <div className="flex items-center justify-center sm:justify-start gap-2 opacity-80">
                    <div className="h-1 w-4 sm:w-6 rounded-full bg-[#4A7C59]" />
                    <p className="text-[11px] sm:text-[13px] font-black text-[#4A7C59] uppercase tracking-wider">
                      {editingCustomer?.name} <span className="text-slate-300 mx-1">•</span> {editingCustomer?.dni}
                    </p>
                  </div>
                </div>
                <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl h-10 sm:h-11">
                  <TabsTrigger value="datos" className="rounded-lg sm:rounded-xl px-4 sm:px-6 text-[10px] sm:text-[12px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#4A7C59] data-[state=active]:shadow-sm transition-all h-full">Datos</TabsTrigger>
                  <TabsTrigger value="galeria" className="rounded-lg sm:rounded-xl px-4 sm:px-6 text-[10px] sm:text-[12px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#4A7C59] data-[state=active]:shadow-sm transition-all h-full">Galería</TabsTrigger>
                  <TabsTrigger value="pedidos" className="rounded-lg sm:rounded-xl px-4 sm:px-6 text-[10px] sm:text-[12px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#4A7C59] data-[state=active]:shadow-sm transition-all h-full">Pedidos</TabsTrigger>
                </TabsList>
              </DialogHeader>

                <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 custom-scrollbar">
                  {editingCustomer && (
                    <>
                      <TabsContent value="datos" className="m-0 space-y-6 animate-in fade-in slide-in-from-left-4 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-2 transition-all">
                            <Label className="text-[13px] font-black uppercase tracking-widest text-[#4A7C59] pl-1">Nombre Completo</Label>
                            <Input value={editingCustomer.name} onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })} className="rounded-2xl h-12 text-base font-bold bg-slate-50/50 border-slate-100 px-5" />
                          </div>
                          <div className="space-y-2 transition-all">
                            <Label className="text-[13px] font-black uppercase tracking-widest text-slate-400 pl-1">DNI / Identificación</Label>
                            <Input value={editingCustomer.dni || ''} onChange={(e) => setEditingCustomer({...editingCustomer, dni: e.target.value})} className="rounded-2xl h-12 text-base font-bold bg-slate-50/50 border-slate-100 px-5" />
                          </div>
                          <div className="space-y-2 transition-all">
                            <Label className="text-[13px] font-black uppercase tracking-widest text-slate-400 pl-1">Correo Electrónico</Label>
                            <Input value={editingCustomer.email} onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})} className="rounded-2xl h-12 text-base font-bold bg-slate-50/50 border-slate-100 px-5" />
                          </div>
                          <div className="space-y-2 transition-all">
                            <Label className="text-[13px] font-black uppercase tracking-widest text-slate-400 pl-1">Teléfono Contacto</Label>
                            <Input value={editingCustomer.phone || ''} onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})} className="rounded-2xl h-12 text-base font-bold bg-slate-50/50 border-slate-100 px-5" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Mensaje de Bienvenida</Label>
                          <textarea 
                            value={editingCustomer.gallerySettings?.welcomeMessage || ''} 
                            onChange={(e) => setEditingCustomer({ ...editingCustomer, gallerySettings: { ...editingCustomer.gallerySettings, welcomeMessage: e.target.value }})}
                            className="w-full p-6 rounded-[2rem] text-sm font-medium border-slate-100 bg-slate-50/30 min-h-[100px] outline-none shadow-inner transition-all focus:bg-white focus:ring-1 focus:ring-[#4A7C59]/10"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="galeria" className="m-0 space-y-5 animate-in fade-in slide-in-from-right-4 outline-none pb-8">
                        {/* SELECTOR DE MODOS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                          {[
                            { id: 'solo-fotos', label: 'VISITA', icon: Camera, desc: 'Solo visualizar' },
                            { id: 'dual', label: 'GALERÍA', icon: ShoppingBag, desc: 'Selección y Tienda' },
                            { id: 'archivos', label: 'DESCARGA', icon: Download, desc: 'Entrega archivos' }
                          ].map((mode) => (
                            <button 
                              key={mode.id} 
                              onClick={() => setEditingCustomer({ ...editingCustomer, gallerySettings: { ...editingCustomer.gallerySettings, digitalFiles: { ...editingCustomer.gallerySettings?.digitalFiles, mode: mode.id, enabled: mode.id !== 'solo-fotos' } } })}
                              className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1", (editingCustomer.gallerySettings?.digitalFiles?.mode === mode.id || (!editingCustomer.gallerySettings?.digitalFiles?.mode && mode.id === 'dual')) ? "bg-[#4A7C59] border-[#4A7C59] text-white shadow-md" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200")}
                            >
                              <mode.icon className="h-5 w-5" />
                              <span className="text-[10px] font-black tracking-widest">{mode.label}</span>
                              <span className={cn("text-[7px] font-bold opacity-70", (editingCustomer.gallerySettings?.digitalFiles?.mode === mode.id || (!editingCustomer.gallerySettings?.digitalFiles?.mode && mode.id === 'dual')) ? "text-white" : "text-slate-400")}>{mode.desc}</span>
                            </button>
                          ))}
                        </div>

                        {/* CONFIGURACIÓN Y MÚSICA */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-8 grid grid-cols-2 gap-2">
                             {[
                                { label: 'Marca Agua', icon: ImageIcon, field: 'watermarkEnabled', color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Bloqueo Cap.', icon: Lock, field: 'safetyLockEnabled', color: 'text-amber-500', bg: 'bg-amber-50' },
                                { label: 'Forzar Sel.', icon: Star, field: 'shopRequiresFavorite', color: 'text-orange-500', bg: 'bg-orange-50' },
                                { label: 'Pago Efec.', icon: BadgeEuro, field: 'cashEnabled', color: 'text-green-500', bg: 'bg-green-50', root: true }
                             ].map((item) => (
                                <div key={item.label} className="bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between shadow-sm h-11">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border shrink-0", item.bg)}><item.icon className={cn("h-3.5 w-3.5", item.color)} /></div>
                                    <p className="text-[10px] font-black uppercase text-slate-800">{item.label}</p>
                                  </div>
                                  <Switch checked={item.root ? (editingCustomer as any)[item.field] : (editingCustomer.gallerySettings as any)[item.field]} onCheckedChange={(checked) => item.root ? setEditingCustomer({ ...editingCustomer, [item.field]: checked }) : setEditingCustomer({ ...editingCustomer, gallerySettings: { ...editingCustomer.gallerySettings, [item.field]: checked } })} className="scale-75" />
                                </div>
                             ))}
                          </div>
                          <div className="md:col-span-4 rounded-xl bg-indigo-50/50 border border-indigo-100 p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2"><Music className="h-3.5 w-3.5 text-indigo-600" /><span className="text-indigo-900 font-black uppercase text-[9px]">Música</span></div>
                              <Button variant="outline" size="sm" onClick={() => setIsMusicPickerOpen(true)} className="h-5 rounded-lg text-[7px] font-black bg-white px-2">MOD</Button>
                            </div>
                            <p className="text-indigo-900 text-[8px] font-black uppercase truncate italic">{editingCustomer?.gallerySettings?.bgMusic?.name || 'No music'}</p>
                          </div>
                        </div>

                        {/* GESTIÓN DE FOTOS */}
                        <div className="space-y-3">
                          <button onClick={() => setIsPhotosModalOpen(true)} className="w-full bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-lg hover:bg-slate-800 transition-all text-left">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"><Cloud className="h-5 w-5 text-blue-400" /></div>
                              <div>
                                <h4 className="text-white text-base font-black uppercase italic tracking-tighter leading-none">Gestionar Galería</h4>
                                <p className="text-slate-400 font-bold uppercase text-[11px] mt-2 tracking-tighter">Fotos: <span className="text-blue-400 font-black">{editingCustomer?.gallerySettings?.photos?.length || 0} ARCHIVOS</span></p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-white" />
                          </button>
                        <div className="space-y-4">
                           <button 
                             onClick={() => setIsGalleryConfigOpen(!isGalleryConfigOpen)}
                             className="flex items-center justify-between w-full p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group shadow-sm"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm transition-all group-hover:scale-105 group-hover:rotate-6">
                                    <Settings2 className={`h-4 w-4 transition-all ${isGalleryConfigOpen ? 'text-[#4A7C59]' : 'text-slate-400'}`} />
                                 </div>
                                 <div className="text-left">
                                    <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-widest leading-none">Opciones de Galería</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{isGalleryConfigOpen ? 'Haz clic para plegar' : 'Configuración de precios y textos'}</p>
                                 </div>
                              </div>
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${isGalleryConfigOpen ? 'bg-[#4A7C59]/10 text-[#4A7C59]' : 'bg-white text-slate-400'}`}>
                                 <ChevronDown className={`h-4 w-4 transition-transform duration-500 ${isGalleryConfigOpen ? 'rotate-180' : ''}`} />
                              </div>
                           </button>

                           <AnimatePresence>
                             {isGalleryConfigOpen && (
                               <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                 className="overflow-hidden"
                               >
                                  <div className="space-y-5 pt-2 pb-1">
                                     <div onClick={() => (document.getElementById('edit-upload') as any)?.click()} className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#4A7C59] hover:bg-[#4A7C59]/5 text-slate-400 flex items-center justify-center cursor-pointer relative overflow-hidden transition-all group">
                                       <input id="edit-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleUploadPhotos} disabled={isUploading} />
                                       <div className="flex items-center gap-3">
                                          {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-[#4A7C59]" /> : <Upload className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                                          <span className="font-black uppercase tracking-widest text-[10px]">{isUploading ? 'Subiendo...' : 'Subir archivos rápido'}</span>
                                       </div>
                                       {isUploading && <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100"><div className="h-full bg-[#4A7C59] transition-all duration-300" style={{ width: `${(uploadStatus.current/uploadStatus.total)*100}%` }} /></div>}
                                     </div>

                                     <div className="space-y-4">
                                       <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 grid grid-cols-4 gap-3 shadow-sm">
                                          {[
                                            { label: 'Fotos Incluidas', key: 'packIncluded' },
                                            { label: 'Foto Extra', key: 'extraPrintPrice', euro: true },
                                            { label: 'Archivo', key: 'price', euro: true },
                                            { label: 'Galeria completa', key: 'fullPackPrice', euro: true }
                                          ].map((f) => (
                                            <div key={f.key} className="space-y-1">
                                              <Label className="text-[9px] font-black uppercase text-slate-400 block text-center truncate px-1">{f.label}</Label>
                                              <div className="relative">
                                                <Input 
                                                  type="number" 
                                                  value={f.key === 'packIncluded' ? (editingCustomer.gallerySettings?.includedPhotos ?? (editingCustomer.gallerySettings?.digitalFiles as any)?.[f.key] ?? 0) : (editingCustomer.gallerySettings?.digitalFiles as any)?.[f.key] ?? 0} 
                                                  onChange={(e) => {
                                                    const v = parseFloat(e.target.value) || 0;
                                                    const s = { ...editingCustomer.gallerySettings };
                                                    if (f.key === 'packIncluded') s.includedPhotos = v;
                                                    s.digitalFiles = { ...s.digitalFiles, [f.key]: v };
                                                    setEditingCustomer({ ...editingCustomer, gallerySettings: s });
                                                  }} 
                                                  className="rounded-xl h-10 px-2 font-black text-xs text-[#4A7C59] text-center border-slate-100 bg-slate-50 focus:bg-white" 
                                                />
                                                {f.euro && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">€</span>}
                                              </div>
                                            </div>
                                          ))}
                                       </div>

                                       <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Título de Galería</Label>
                                            <Input 
                                              value={editingCustomer.gallerySettings?.galleryTitle || ''} 
                                              onChange={(e) => {
                                                const title = e.target.value;
                                                setEditingCustomer({ 
                                                  ...editingCustomer, 
                                                  slug: generateSlug(title),
                                                  gallerySettings: { 
                                                    ...editingCustomer.gallerySettings, 
                                                    galleryTitle: title 
                                                  } 
                                                });
                                              }} 
                                              className="rounded-[1.25rem] h-11 text-[13px] font-bold border-slate-100 px-4 bg-white focus:bg-white transition-all shadow-sm" 
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Slug URL</Label>
                                            <Input 
                                              value={editingCustomer.slug || ''} 
                                              onChange={(e) => setEditingCustomer({ ...editingCustomer, slug: generateSlug(e.target.value) })} 
                                              className="rounded-[1.25rem] h-11 text-[13px] font-bold bg-slate-50 border-slate-100 px-4 text-slate-500 shadow-sm" 
                                            />
                                          </div>
                                       </div>

                                       <div className="space-y-1 pt-1">
                                          <Label className="text-[10px] font-black uppercase text-emerald-600 pl-1 italic">Link de Galería Directo</Label>
                                          <div className="flex gap-2">
                                            <Input 
                                              readOnly 
                                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/galeria/${editingCustomer.slug || ''}`}
                                              className="rounded-[1.25rem] h-10 text-[11px] font-bold bg-emerald-50/50 border-emerald-100 px-4 text-emerald-700 shadow-sm flex-1 cursor-default"
                                            />
                                            <Button 
                                              type="button" 
                                              size="sm" 
                                              variant="outline"
                                              className="h-10 rounded-xl px-4 border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-black text-[10px] uppercase tracking-widest gap-2 transition-all active:scale-95 shrink-0"
                                              onClick={() => {
                                                const url = `${window.location.origin}/galeria/${editingCustomer.slug || ''}`;
                                                navigator.clipboard.writeText(url);
                                                toast({ 
                                                  title: '¡Link Copiado!', 
                                                  description: 'Listo para enviar por WhatsApp.',
                                                  className: "bg-[#4A7C59] text-white border-none font-bold rounded-2xl shadow-xl"
                                                });
                                              }}
                                            >
                                              <Copy className="h-4 w-4" />
                                              Copiar
                                            </Button>
                                          </div>
                                        </div>

                                       <div className="space-y-1">
                                         <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Subtítulo (Dedicatoria)</Label>
                                         <textarea 
                                           value={editingCustomer.gallerySettings?.gallerySubtitle || ''} 
                                           onChange={(e) => setEditingCustomer({ ...editingCustomer, gallerySettings: { ...editingCustomer.gallerySettings, gallerySubtitle: e.target.value } })}
                                           className="w-full p-4 rounded-[1.5rem] text-xs font-bold border-slate-100 bg-slate-50/50 min-h-[80px] outline-none focus:bg-white focus:border-slate-200 transition-all scrollbar-hide shadow-sm"
                                           placeholder="Escribre algo bonito para el cliente..."
                                         />
                                       </div>
                                     </div>
                                  </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>

                          {/* PANEL DE ARCHIVOS SELECCIONADOS */}
                          {((editingCustomer.orders && editingCustomer.orders.length > 0) || (editingCustomer.gallerySettings?.selectionConfirmed && editingCustomer.gallerySettings?.lastSelection?.length > 0)) && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-5 space-y-4 animate-in fade-in slide-in-from-top-4">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><CheckCircle2 className="h-5 w-5" /></div>
                                     <div><h4 className="text-sm font-black text-slate-800 uppercase leading-none">Selección Confirmada</h4><p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">Nombres limpios para Lightroom</p></div>
                                  </div>
                                  <Button size="sm" onClick={() => {
                                    let names: string[] = [];
                                    
                                    // 1. Obtener nombres de pedidos
                                    if (editingCustomer.orders) {
                                      names = [...names, ...editingCustomer.orders.flatMap((o: any) => 
                                        o.items.flatMap((i: any) => 
                                          (i.note || i.notes || '').split(/[|,,; \n]+/)
                                            .map((s: string) => s.trim().replace(/\.[^/.]+$/, ""))
                                            .filter((s: string) => s.length > 0 && !s.startsWith('http') && !s.includes('FOTO:'))
                                        )
                                      )];
                                    }
                                    
                                    // 2. Obtener nombres de la selección directa (Caso Vero Martinez)
                                    if (editingCustomer.gallerySettings?.selectionConfirmed && editingCustomer.gallerySettings?.lastSelection && editingCustomer.gallerySettings?.photos) {
                                      const selectedIds = new Set(editingCustomer.gallerySettings.lastSelection);
                                      const directNames = editingCustomer.gallerySettings.photos
                                        .filter((p: any) => selectedIds.has(p.id))
                                        .map((p: any) => p.name || p.fileName?.replace(/\.[^/.]+$/, "") || "");
                                      names = [...names, ...directNames];
                                    }
                                    
                                    const uniqueNames = [...new Set(names.filter(n => n.length > 0))];
                                    navigator.clipboard.writeText(uniqueNames.join(", "));
                                    toast({ title: '¡Copiado!', description: `¡Copiados ${uniqueNames.length} nombres para Lightroom!` });
                                  }} className="rounded-xl bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white font-black text-[10px] h-8 shadow-sm"><Copy className="h-3 w-3 mr-2" /> COPIAR LISTA</Button>
                               </div>
                                <div className="bg-white/80 rounded-2xl p-4 border border-emerald-100 max-h-[220px] overflow-y-auto custom-scrollbar">
                                   {(() => {
                                      const selectedPhotoNames = new Set<string>();
                                      const selectedPhotoObjects: any[] = [];
                                      
                                      if (editingCustomer.orders) {
                                        editingCustomer.orders.forEach((o: any) => {
                                          o.items.forEach((i: any) => {
                                            const itemNotes = i.note || i.notes || '';
                                            if (itemNotes) {
                                              itemNotes.split(/[|,,; \n]+/).forEach((s: string) => {
                                                const cleanName = s.trim().replace(/\.[^/.]+$/, "");
                                                if (cleanName && !cleanName.startsWith('http') && !cleanName.includes('FOTO:')) {
                                                  selectedPhotoNames.add(cleanName);
                                                }
                                              });
                                            }
                                          });
                                        });
                                      }
                                      
                                      if (editingCustomer.gallerySettings?.selectionConfirmed && editingCustomer.gallerySettings?.lastSelection && editingCustomer.gallerySettings?.photos) {
                                        const directIds = new Set(editingCustomer.gallerySettings.lastSelection);
                                        editingCustomer.gallerySettings.photos.forEach((p: any) => {
                                          if (directIds.has(p.id)) {
                                            selectedPhotoNames.add(p.name || p.fileName?.replace(/\.[^/.]+$/, ""));
                                          }
                                        });
                                      }

                                      if (editingCustomer.gallerySettings?.photos) {
                                        editingCustomer.gallerySettings.photos.forEach((p: any) => {
                                          const pName = p.name || p.fileName?.replace(/\.[^/.]+$/, "");
                                          if (selectedPhotoNames.has(pName)) {
                                            selectedPhotoObjects.push(p);
                                          }
                                        });
                                      }
                                      
                                      const namesArray = Array.from(selectedPhotoNames);
                                      if (namesArray.length === 0) {
                                        return <div className="text-[10px] font-bold text-emerald-800/50 italic py-2">Esperando selección...</div>;
                                      }

                                      return (
                                        <div className="text-[11px] font-mono text-emerald-800/80 leading-relaxed bg-white/50 p-3 rounded-xl border border-dashed border-emerald-200">
                                          {namesArray.join(', ')}
                                        </div>
                                      );
                                   })()}
                                </div>
                               {editingCustomer.gallerySettings?.selectionItems && editingCustomer.gallerySettings.selectionItems.length > 0 && (
                                  <div className="p-3 bg-white/50 rounded-[1.25rem] border border-orange-100/50 text-[10px] space-y-2 shadow-sm mb-2">
                                     <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-orange-600 font-black uppercase text-[8px] tracking-widest pl-1">
                                           <Package className="h-3 w-3" /> ARTÍCULOS DE TIENDA (SELECCIONADOS)
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                           {editingCustomer.gallerySettings.selectionItems.map((i: any, idx: number) => (
                                              <Badge key={idx} variant="outline" className="bg-orange-50/80 text-orange-700 border-orange-100 text-[9px] font-black py-1 px-3 rounded-lg shadow-sm">
                                                 {i.quantity}x {i.name} {i.variantName ? `· ${i.variantName}` : ''}
                                              </Badge>
                                           ))}
                                        </div>
                                      </div>
                                   </div>
                                )}
                               {editingCustomer.orders && (
                                   <div className="space-y-2 pt-1">
                                      {editingCustomer.orders.map((o: any) => {
                                         const hasNote = o.notes && o.notes.trim();
                                         const extraProducts = o.items.filter((i: any) => i.productName && !i.productName.toLowerCase().includes('foto'));
                                         
                                         if (!hasNote && extraProducts.length === 0) return null;
                                         
                                         return (
                                            <div key={o.id} className="p-3 bg-white/50 rounded-[1.25rem] border border-emerald-100/50 text-[10px] space-y-2 shadow-sm">
                                               {hasNote && (
                                                  <div className="space-y-1">
                                                     <div className="flex items-center gap-1.5 text-blue-600 font-black uppercase text-[8px] tracking-widest pl-1">
                                                        <MessageSquare className="h-3 w-3" /> NOTA DEL PEDIDO
                                                     </div>
                                                     <div className="text-slate-600 font-bold leading-relaxed bg-blue-50/50 p-2.5 rounded-xl italic">
                                                        "{o.notes}"
                                                     </div>
                                                  </div>
                                               )}
                                               {extraProducts.length > 0 && (
                                                  <div className="space-y-1.5 mt-2">
                                                     <div className="flex items-center gap-1.5 text-orange-600 font-black uppercase text-[8px] tracking-widest pl-1">
                                                        <Package className="h-3 w-3" /> PRODUCTOS ADICIONALES
                                                     </div>
                                                     <div className="flex flex-wrap gap-1.5">
                                                        {extraProducts.map((i: any, idx: number) => {
                                                            const itemPhotoUrl = i.fileUrl || i.notes?.split(' | ').find((p: any) => p.trim().startsWith('FOTO:'))?.split('FOTO: ')[1];
                                                            
                                                            return (
                                                              <Badge key={idx} variant="outline" className="bg-orange-50/80 text-orange-700 border-orange-100 text-[9px] font-black py-1 px-2 pr-3 rounded-lg shadow-sm flex items-center gap-2">
                                                                {itemPhotoUrl && (
                                                                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 border border-orange-200 shadow-sm">
                                                                    <img 
                                                                      src={itemPhotoUrl} 
                                                                      alt={i.productName || 'Miniatura'} 
                                                                      className="w-full h-full object-cover"
                                                                    />
                                                                  </div>
                                                                )}
                                                                <div className="flex flex-col">
                                                                  <span className="leading-tight">{i.productName} (x{i.quantity})</span>
                                                                  {i.notes && !i.notes.includes('FOTO:') && (
                                                                    <span className="text-[7px] text-orange-400 font-bold italic truncate max-w-[120px]">{i.notes}</span>
                                                                  )}
                                                                </div>
                                                              </Badge>
                                                            );
                                                         })}
                                                     </div>
                                                  </div>
                                               )}
                                            </div>
                                         );
                                      })}
                                   </div>
                                )}
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                             <Button variant="outline" className="flex-1 rounded-xl h-11 text-[10px] font-black uppercase border-slate-200" onClick={() => window.open(`/galeria/${editingCustomer.slug}?preview=true`, '_blank')}><Eye className="h-4 w-4 mr-2" /> VISTA PREVIA</Button>
                             <Button className="flex-1 bg-[#4A7C59]/10 hover:bg-[#4A7C59] text-[#4A7C59] hover:text-white rounded-xl h-11 text-[10px] font-black uppercase transition-all" onClick={() => {
                               const u = `${window.location.origin}/galeria/${editingCustomer.slug}`;
                               const m = `¡Hola ${editingCustomer.name}! Ya tienes tu galería: ${u}`;
                               window.open(`https://api.whatsapp.com/send?phone=${editingCustomer.phone?.replace(/\D/g, '')}&text=${encodeURIComponent(m)}`, '_blank');
                             }}><Send className="h-4 w-4 mr-2" /> WHATSAPP</Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="pedidos" className="m-0 min-h-[400px] animate-in fade-in slide-in-from-right-4 outline-none pb-8">
                        {editingCustomer.orders && editingCustomer.orders.length > 0 ? (
                          <div className="space-y-4 pt-2">
                             <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">REGISTRO DE SELECCIONES</p>
                                <Badge className="bg-[#4A7C59]/10 text-[#4A7C59] border-none font-black px-3 py-1 rounded-full text-[10px]">
                                   {editingCustomer.orders.length} TOTAL
                                </Badge>
                             </div>
                             
                             <div className="grid gap-3">
                                {editingCustomer.orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order: any, idx: number) => {
                                   const orderDate = new Date(order.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                                   const orderNum = editingCustomer.orders.length - idx;
                                   
                                   return (
                                     <div key={order.id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                           <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#4A7C59] font-black text-sm shadow-sm">
                                                #{orderNum}
                                              </div>
                                              <div>
                                                <p className="text-[13px] font-black text-slate-900 uppercase">Selección Confirmada</p>
                                                <p className="text-[10px] font-bold text-slate-400 capitalize">{orderDate}</p>
                                              </div>
                                           </div>
                                           <Badge variant="outline" className="border-[#4A7C59]/20 text-[#4A7C59] font-black text-[9px] uppercase px-2 py-0.5 rounded-lg bg-white">
                                              {order.status === 'delivered' ? 'ENTREGADO' : 'PROCESANDO'}
                                           </Badge>
                                        </div>
                                        
                                        <div className="space-y-1 bg-white/50 rounded-xl p-3 border border-slate-50">
                                           {order.items.map((item: any, i: number) => (
                                              <div key={i} className="flex flex-col gap-1">
                                                 <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                                    <span>{item.productName} {item.variantName ? `(${item.variantName})` : ''}</span>
                                                    <span className="text-[#4A7C59]">x{item.quantity}</span>
                                                 </div>
                                                 {item.note && (
                                                   <p className="text-[9px] text-slate-400 italic bg-white p-1.5 rounded-lg border border-slate-50 mt-1">
                                                      "{item.note}"
                                                   </p>
                                                 )}
                                              </div>
                                           ))}
                                        </div>
                                        
                                        <div className="mt-4 flex items-center justify-between pt-4 border-t border-dashed border-slate-100 px-1">
                                           <div className="flex flex-col">
                                              <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Total Inversión</span>
                                              <span className="text-sm font-black text-slate-900">{formatPrice(order.total)}</span>
                                           </div>
                                           <Button 
                                              variant="ghost" size="sm" 
                                              onClick={() => {
                                                setEditingCustomer(null);
                                                toast({ title: 'Detalle de Pedido', description: 'Cerrando ficha de cliente para ir a Pedidos...' });
                                              }}
                                              className="h-8 rounded-lg text-[9px] font-black uppercase text-slate-400 hover:text-[#4A7C59] hover:bg-[#4A7C59]/5"
                                           >
                                              VER EN PEDIDOS <ChevronRight className="ml-1 h-3 w-3" />
                                           </Button>
                                        </div>
                                     </div>
                                   )
                                })}
                             </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                            <History className="h-10 w-10 mb-4 opacity-20" />
                            <p className="text-[9px] font-black uppercase tracking-widest">Sin registros de selección todavía</p>
                          </div>
                        )}
                      </TabsContent>
                    </>
                  )}
                </div>

                <DialogFooter className="p-4 sm:p-6 border-t border-slate-50 bg-slate-50/20 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 shrink-0">
                  <Button variant="ghost" onClick={() => setEditingCustomer(null)} className="w-full sm:w-auto rounded-xl text-xs font-black uppercase tracking-widest h-11 px-8 text-slate-400 hover:text-slate-600">Cancelar</Button>
                  <Button 
                    onClick={async () => {
                      if (!editingCustomer.name || !editingCustomer.email) {
                        toast({ title: 'Error', description: 'Nombre y Email obligatorios', variant: 'destructive' })
                        return
                      }
                      setUpdating(true)
                      try {
                        const { doc, deleteDoc, setDoc, updateDoc, serverTimestamp, getDocs, query, collection, where } = await import('firebase/firestore')
                        
                        // GARANTIZAR SLUG ÚNICO
                        let finalSlug = editingCustomer.slug || '';
                        if (finalSlug) {
                          let count = 1;
                          let exists = true;
                          while (exists) {
                            const q = query(collection(db, COLLECTIONS.CLIENTS), where("slug", "==", finalSlug));
                            const snap = await getDocs(q);
                            const duplicate = snap.docs.find(d => d.id !== (editingCustomer.originalId || editingCustomer.id));
                            if (!duplicate) {
                              exists = false;
                            } else {
                              count++;
                              finalSlug = `${editingCustomer.slug.split('-').filter((s: string, i: number, a: string[]) => i < a.length - 1 || isNaN(parseInt(s))).join('-')}-${count}`;
                            }
                          }
                        }

                        const docId = editingCustomer.id || editingCustomer.originalId
                        const docRef = doc(db, COLLECTIONS.CLIENTS, docId)
                        
                        const data = {
                          name: editingCustomer.name,
                          dni: (editingCustomer.dni || '').toUpperCase().trim(),
                          email: (editingCustomer.email || '').toLowerCase().trim(),
                          phone: editingCustomer.phone || '',
                          slug: finalSlug,
                          gallerySettings: editingCustomer.gallerySettings || {},
                          cashEnabled: !!editingCustomer.cashEnabled,
                          updatedAt: serverTimestamp()
                        }

                        // Actualización SIMPLE sin borrar y recrear (evita duplicados y pérdida de fotos por cambio de ID)
                        await updateDoc(docRef, data)

                        toast({ title: 'Éxito', description: 'Cliente actualizado' })
                        await reloadFirebase()
                      } catch (e) {
                        toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' })
                      } finally {
                        setUpdating(false)
                      }
                    }} 
                    disabled={updating}
                    className="w-full sm:w-auto bg-[#4A7C59] hover:bg-[#3d664a] text-white rounded-xl text-[12px] font-black uppercase tracking-widest h-12 px-10 shadow-xl shadow-green-900/10 min-w-[200px]"
                  >
                    {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Cambios"}
                  </Button>
                </DialogFooter>
              </Tabs>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmación de borrado */}
        <Dialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
          <DialogContent className="w-[95vw] sm:max-w-[400px] rounded-[2rem] p-6 sm:p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Confirmar Eliminación</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
                ¿Seguro que quieres eliminar a <strong>{deletingCustomer?.name}</strong>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setDeletingCustomer(null)} className="flex-1 rounded-xl h-12 font-bold text-slate-400">Cancelar</Button>
              <Button 
                onClick={handleDeleteCustomer}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-black uppercase text-xs tracking-widest"
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de CREACIÓN */}
        <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
          <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2.5rem] p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nuevo Cliente</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-400">Registra un cliente manualmente.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Nombre</Label>
                <Input 
                  placeholder="Nombre completo" 
                  value={newCustomer.name} 
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = generateSlug(name);
                    setNewCustomer({...newCustomer, name, slug})
                  }}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</Label>
                  <Input 
                    placeholder="email@ejemplo.com" 
                    value={newCustomer.email} 
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">DNI/NIE</Label>
                  <Input 
                    placeholder="12345678X" 
                    value={newCustomer.dni} 
                    onChange={(e) => setNewCustomer({...newCustomer, dni: e.target.value})}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 gap-3">
              <Button variant="ghost" onClick={() => setIsAddingCustomer(false)} className="rounded-xl h-11 font-bold">Cancelar</Button>
              <Button 
                onClick={handleAddCustomer}
                className="bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-xl h-11 px-6 font-black uppercase text-xs tracking-widest flex-1"
              >
                Crear Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Otros Modales (Música, Fotos) se mantienen simplificados para asegurar integridad */}
        <Dialog open={isMusicPickerOpen} onOpenChange={(open) => {
            if (!open) {
                previewAudio.pause()
                previewAudio.src = ''
                setPlayingSong(null)
            }
            setIsMusicPickerOpen(open)
        }}>
          <DialogContent className="w-[95vw] sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-white/80 backdrop-blur-2xl">
              <DialogHeader className="p-6 pb-0 border-none">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tighter">Fonoteca</DialogTitle>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Banda sonora personalizada</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                    <Music2 className="text-white h-5 w-5" />
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 pt-0 pb-4 border-b border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      placeholder="Buscar en la biblioteca..."
                      value={musicSearch}
                      onChange={(e) => setMusicSearch(e.target.value)}
                      className="pl-11 h-10 rounded-2xl bg-slate-50 border-none focus-visible:bg-white shadow-inner transition-all text-xs font-bold"
                    />
                  </div>
                  
                  <label className={cn(
                    "flex items-center gap-2 px-4 h-10 rounded-2xl cursor-pointer transition-all font-black text-[9px] uppercase tracking-widest shadow-lg shrink-0",
                    isMusicUploading ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                  )}>
                    {isMusicUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {isMusicUploading ? `${Math.round(musicUploadProgress)}%` : 'Añadir'}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="audio/*" 
                      onChange={handleQuickMusicUpload}
                      disabled={isMusicUploading}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 mt-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedMusicCategory('ALL')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      selectedMusicCategory === 'ALL' ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"
                    )}
                  >
                    Todas
                  </button>
                  {customTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedMusicCategory(tag.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        selectedMusicCategory === tag.id ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {librarySongs
                  .filter(s => {
                    const matchesSearch = (s.name || '').toLowerCase().includes(musicSearch.toLowerCase())
                    const matchesCategory = selectedMusicCategory === 'ALL' || s.category === selectedMusicCategory
                    return matchesSearch && matchesCategory
                  })
                  .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                  .map((song) => (
                  <div 
                    key={song.id} 
                    className="flex items-center justify-between p-3 rounded-[1.5rem] hover:bg-blue-50/50 group/song transition-all cursor-pointer"
                    onClick={() => handleSelectFromLibrary(song)}
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div 
                        className="relative flex-shrink-0 cursor-pointer" 
                        onClick={(e) => { e.stopPropagation(); togglePreview(song.url, song.id); }}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          playingSong === song.id 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                            : "bg-slate-100 text-slate-400 hover:bg-blue-500 hover:text-white"
                        )}>
                          {playingSong === song.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                        </div>
                      </div>
                      <div className="truncate">
                        <h4 className="text-[11px] font-black text-slate-800 truncate leading-tight uppercase tracking-tight">{song.name}</h4>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">Música Original</p>
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover/song:opacity-100 transition-opacity pr-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                         <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
                {librarySongs.length === 0 && (
                  <div className="py-20 text-center space-y-3">
                    <Disc className="h-10 w-10 text-slate-100 mx-auto animate-spin" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay música en la fonoteca</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-100 flex justify-end">
                 <Button variant="ghost" onClick={() => setIsMusicPickerOpen(false)} className="rounded-xl font-bold text-slate-400 mt-0">Cerrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isPhotosModalOpen} onOpenChange={setIsPhotosModalOpen}>
          <DialogContent className="sm:max-w-[90vw] lg:max-w-[75vw] w-full p-8 rounded-[2.5rem] border-none shadow-2xl flex flex-col h-[85vh]">
            <DialogHeader className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 text-left">
              <div className="w-full sm:w-auto">
                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Fotos de Galería</DialogTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestiona los archivos y la foto de portada</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {selectedPhotos.size > 0 && (
                  <Button 
                    onClick={handleDeleteSelectedPhotos}
                    className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-red-900/10 transition-all animate-in slide-in-from-right-4"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar ({selectedPhotos.size})
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={handleSelectAllPhotos}
                  className="h-10 px-4 rounded-xl border-slate-100 bg-white font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all whitespace-nowrap"
                >
                  {selectedPhotos.size === (editingCustomer?.gallerySettings?.photos?.length || 0) ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </Button>
                <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/50">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none">{editingCustomer?.gallerySettings?.photos?.length || 0} Archivos</p>
                </div>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
              {editingCustomer?.gallerySettings?.photos?.map((photo: any) => {
                const isSelected = selectedPhotos.has(photo.id)
                return (
                  <div 
                    key={photo.id} 
                    className="flex flex-col gap-2 group/photo"
                  >
                    <div 
                      onClick={() => togglePhotoSelection(photo.id)}
                      className={cn(
                        "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer",
                        isSelected 
                          ? "border-[#4A7C59] ring-4 ring-[#4A7C59]/10 scale-[0.95]" 
                          : "border-slate-100 hover:border-[#4A7C59]/30 hover:shadow-lg"
                      )}
                    >
                      <img 
                        src={photo.url} 
                        className="w-full h-full object-cover" 
                        alt={photo.name}
                      />
                      
                      {/* Checkbox de Selección Siempre Visible si está seleccionado */}
                      <div className={cn(
                        "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 border shadow-md",
                        isSelected 
                          ? "bg-[#4A7C59] border-[#4A7C59] text-white scale-110" 
                          : "bg-white/80 border-slate-200 text-slate-400 group-hover/photo:opacity-100 opacity-0"
                      )}>
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </div>

                      {/* Badge de Portada */}
                      {photo.isCover && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white p-1 rounded-lg shadow-lg">
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}

                      {/* Botón de Zoom (Solo Icono) */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setZoomedPhoto(photo.url); }}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md text-slate-600 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-sm"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Nombre del Archivo y Menú Rápido */}
                    <div className="px-1 flex flex-col">
                      <p className="text-[10px] font-black text-slate-500 uppercase truncate tracking-tight mb-1" title={photo.fileName || photo.name}>
                        {photo.name || photo.fileName?.replace(/\.[^/.]+$/, "") || 'Sin nombre'}
                      </p>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSetCover(photo.id); }}
                          className={cn(
                            "flex-1 h-6 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all",
                            photo.isCover ? "bg-amber-100 text-amber-700 pointer-events-none" : "bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white"
                          )}
                        >
                          Portada
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar esta foto?')) handleDeletePhoto(photo.id); }}
                          className="w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pie del Modal con Botón Cerrar - AHORA SOLO AL FINAL (NO FLOTANTE) */}
            <div className="p-8 pt-6 pb-12 border-t border-slate-100 mt-8">
              <Button 
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-xl group transition-all"
                onClick={() => setIsPhotosModalOpen(false)}
              >
                He terminado de gestionar
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Visor de Foto Ampliada (Zoom) - DENTRO para la misma capa de portal */}
            {zoomedPhoto && (
              <div 
                className="fixed inset-0 z-[9999] bg-black backdrop-blur-3xl flex flex-col items-center justify-center p-4 sm:p-20 animate-in fade-in zoom-in-95 duration-300"
                onClick={() => setZoomedPhoto(null)}
              >
                {editingCustomer?.gallerySettings?.photos && (() => {
                  const photos = editingCustomer.gallerySettings.photos;
                  const currentIndex = photos.findIndex((p: any) => p.url === zoomedPhoto);
                  const navigate = (dir: 'prev' | 'next', e: React.MouseEvent) => {
                    e.stopPropagation();
                    const nextIndex = dir === 'prev' 
                      ? (currentIndex - 1 + photos.length) % photos.length 
                      : (currentIndex + 1) % photos.length;
                    setZoomedPhoto(photos[nextIndex].url);
                  };

                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center gap-6" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setZoomedPhoto(null)}
                        className="absolute top-0 right-0 p-6 text-white/30 hover:text-white transition-colors z-[10000] hover:scale-110 active:scale-90"
                      >
                        <X className="h-10 w-10" />
                      </button>

                      <div className="w-full flex-1 flex items-center justify-between px-6 min-h-0 min-w-0">
                        {/* Navegación Izquierda - Carril forzado de 200px (LG) */}
                        <div className="hidden sm:flex w-32 lg:w-56 items-center justify-center shrink-0 h-full">
                          <button 
                            onClick={(e) => navigate('prev', e)}
                            className="group bg-white/[0.02] hover:bg-white/10 text-white p-8 rounded-full border border-white/5 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 shadow-2xl flex items-center justify-center"
                          >
                            <ChevronLeft className="h-10 w-10 text-white/30 group-hover:text-white transition-colors" />
                          </button>
                        </div>

                        {/* Contenedor Imagen Central (Limitado para aire lateral) */}
                        <div className="flex-1 h-full flex items-center justify-center overflow-hidden py-4 px-10">
                          <div 
                            className="relative flex items-center justify-center w-full h-full cursor-pointer pointer-events-auto max-w-[85%] lg:max-w-[75%]" 
                            onClick={(e) => navigate('next', e)}
                            title="Siguiente foto"
                          >
                            <img 
                              src={zoomedPhoto} 
                              alt="Zoom" 
                              className="max-h-full max-w-full object-contain rounded-2xl shadow-[0_0_120px_rgba(0,0,0,1)] border border-white/5 animate-in zoom-in-95 duration-500 select-none pointer-events-none"
                            />
                          </div>
                        </div>

                        {/* Navegación Derecha - Carril forzado de 200px (LG) */}
                        <div className="hidden sm:flex w-32 lg:w-56 items-center justify-center shrink-0 h-full">
                          <button 
                            onClick={(e) => navigate('next', e)}
                            className="group bg-white/[0.02] hover:bg-white/10 text-white p-8 rounded-full border border-white/5 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 shadow-2xl flex items-center justify-center"
                          >
                            <ChevronRight className="h-10 w-10 text-white/30 group-hover:text-white transition-colors" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8 flex items-center justify-center gap-4 w-full max-w-xl">
                        <Button 
                          onClick={() => handleDeletePhotoByUrl(zoomedPhoto!)}
                          variant="destructive"
                          className="h-14 w-14 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center p-0 border-none shrink-0"
                          title="Eliminar esta foto"
                        >
                          <Trash2 className="h-6 w-6" />
                        </Button>

                        <div className="bg-black/40 backdrop-blur-3xl px-12 py-5 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-center flex-1 min-w-0">
                          <p className="text-white text-base font-black uppercase tracking-[0.1em] mb-1 truncate w-full text-center px-4">
                            {photos[currentIndex]?.name || photos[currentIndex]?.fileName?.replace(/\.[^/.]+$/, "") || 'Archivo'}
                          </p>
                          <div className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-[#4A7C59] shadow-[0_0_10px_#4A7C59]" />
                             <p className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase">
                                FOTO {currentIndex + 1} DE {photos.length}
                             </p>
                          </div>
                        </div>

                        <div className="relative shrink-0">
                           <input 
                              type="file" 
                              id="zoom-upload-trigger" 
                              className="hidden" 
                              multiple 
                              accept="image/*"
                              onChange={(e) => {
                                handleUploadPhotos(e);
                                setZoomedPhoto(null); // Cerramos zoom para ver la subida en el modal
                              }}
                           />
                           <Button 
                              onClick={() => document.getElementById('zoom-upload-trigger')?.click()}
                              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center p-0 border-none"
                              title="Subir más fotos"
                           >
                              <Upload className="h-6 w-6" />
                           </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>


      </div>
    </TooltipProvider>
  )
}
