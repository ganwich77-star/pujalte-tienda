'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
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
  Star
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { Order } from '@/types'
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  setDoc,
  serverTimestamp
} from 'firebase/firestore'
import { 
  uploadBytesResumable, 
  getDownloadURL,
  ref
} from 'firebase/storage'
import { storage } from '@/lib/firebase'

interface CustomersTabProps {
  orders: Order[]
  formatPrice: (price: number) => string
  customerIdToEdit?: string | null
}

export function CustomersTab({ orders, formatPrice, customerIdToEdit }: CustomersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [firebaseClients, setFirebaseClients] = useState<Record<string, any>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    cashEnabled: false,
    gallerySettings: {
      galleryTitle: '',
      shopRequiresFavorite: false,
      digitalFiles: {
        enabled: false,
        price: 0,
        packIncluded: 0,
        extraPrice: 0
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
  const [customTags, setCustomTags] = useState<any[]>([])
  const [playingSong, setPlayingSong] = useState<string | null>(null)
  const [previewAudio] = useState(new Audio())
  const [uploadStatus, setUploadStatus] = useState({ current: 0, total: 0 })
  const router = useRouter()
  const initialEditProcessed = useRef(false)

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

  // Limpiar audio al desmontar o cerrar picker
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause()
        previewAudio.src = ''
      }
    }
  }, [previewAudio])

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

  const handleSelectFromLibrary = (song: any) => {
    const musicData = { url: song.url, name: song.name, libraryId: song.id }
    setEditingCustomer({
      ...editingCustomer,
      gallerySettings: {
        ...editingCustomer.gallerySettings,
        bgMusic: musicData
      }
    })
    setIsMusicPickerOpen(false)
    previewAudio.pause()
    setPlayingSong(null)
    toast({ title: 'Canción seleccionada', description: 'Banda sonora asignada desde la fonoteca.' })
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name || (!newCustomer.email && !newCustomer.phone && !newCustomer.dni)) {
      toast({ title: 'Datos incompletos', description: 'Nombre y al menos un dato de contacto son necesarios.', variant: 'destructive' })
      return
    }
    setUpdating(true)
    try {
      const { doc: firestoreDoc, setDoc: firestoreSet, serverTimestamp } = await import('firebase/firestore')
      
      // Si no hay slug, generamos uno amigable basado en el nombre
      const finalSlug = (newCustomer.slug || newCustomer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || 
                        (newCustomer.dni || newCustomer.email || newCustomer.phone).trim().toUpperCase();

      const key = (newCustomer.dni || newCustomer.email || newCustomer.phone).trim().toUpperCase()
      
      await firestoreSet(firestoreDoc(db, COLLECTIONS.CLIENTS, key), {
        ...newCustomer,
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
          shopRequiresFavorite: false,
          digitalFiles: {
            enabled: false,
            price: 0,
            packIncluded: 0,
            extraPrice: 0
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
    const files = e.target.files
    if (!files || !editingCustomer) return

    const clientKey = editingCustomer.id || (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
    setIsUploading(true)
    setUploadStatus({ current: 0, total: files.length })
    
    const newPhotos: any[] = [...(editingCustomer.gallerySettings?.photos || [])]
    const uploadPromises = Array.from(files).map(async (file) => {
      const storageRef = ref(storage, `clients/${clientKey}/gallery/${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      return new Promise((resolve, reject) => {
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
              isCover: newPhotos.length === 0 // Primera foto es portada por defecto
            }
            newPhotos.push(photoData)
            setUploadStatus(prev => ({ ...prev, current: prev.current + 1 }))
            resolve(photoData)
          }
        )
      })
    })

    try {
      await Promise.all(uploadPromises)
      
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
      
      toast({ title: 'Fotos subidas', description: `${files.length} fotos añadidas a la galería.` })
    } catch (error) {
      console.error('Error subiendo fotos:', error)
      toast({ title: 'Error', description: 'No se pudieron subir algunas fotos.', variant: 'destructive' })
    } finally {
      setIsUploading(false)
      setUploadProgress({})
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
        gallerySettings: fc.gallerySettings || {}
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
      
      // 1. Prioridad por DNI (ID o campo dni)
      if (dni && customerMap.has(dni)) {
        matchKey = dni;
      } else {
        // 2. Si no es el ID directo, buscamos entre los valores (por si el ID es el email o teléfono)
        for (const [key, cust] of customerMap.entries()) {
          const custDni = (cust.dni || '').trim().toUpperCase();
          const custEmail = (cust.email || '').toLowerCase().trim();
          const custPhone = (cust.phone || '').trim();

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

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.dni.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-white/5 dark:text-white shadow-inner focus-visible:bg-white dark:focus-visible:bg-slate-800 focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 transition-all font-medium text-sm"
            />
          </div>
          {selectedIds.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="h-10 sm:h-12 rounded-xl sm:rounded-2xl px-4 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100"
            >
              <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Borrar ({selectedIds.size})</span>
            </Button>
          )}
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
                {customer.cashEnabled && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[8px] px-2 py-0.5 rounded-full uppercase">EFECTIVO OK</Badge>
                )}
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
                        const welcomeMsg = `🎨 ¡Bienvenido/a a Pujalte Creative Studio! 📸✨\n\nHola *${customer.name}*, es un placer saludarte. \n\nFiel a nuestro lema: "La tecnología al servicio de los recuerdos", hemos habilitado tu acceso a nuestra plataforma privada. 🚀\n\nDesde aquí podrás ver, gestionar y pedir tus fotos de forma sencilla:\n\n🔗 Acceso: https://pujalte-tienda.vercel.app/\n👤 Usuario: *${customer.name.split(' ')[0].toUpperCase()}*\n🔑 Contraseña: *${customer.dni}*\n\n(Te recomendamos copiar y pegar tus datos para acceder más rápido) ⚡️\n\nCualquier duda o consulta, ¡escríbenos por aquí mismo! \nEstamos para ayudarte. 👋😊`;
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
                        <div className="min-w-0 pr-2">
                          <p className="font-black text-xs sm:text-[13px] text-slate-900 tracking-tight leading-none uppercase truncate">{customer.name}</p>
                          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate mt-1 opacity-70">{customer.dni || 'SIN DNI'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-4 sm:py-5 overflow-hidden">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 truncate group-hover:text-slate-500 transition-colors">
                          <Mail className="h-2.5 w-2.5 flex-shrink-0" /> <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 truncate group-hover:text-slate-500 transition-colors">
                          <Phone className="h-2.5 w-2.5 flex-shrink-0" /> <span className="truncate">{customer.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 sm:py-5 text-center">
                      <Badge variant="outline" className="bg-white border-slate-100 font-black text-[9px] h-5 min-w-[20px] px-1 justify-center">
                        {customer.orders.length}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-5 py-4 sm:py-5 overflow-hidden">
                      <p className="font-black text-xs sm:text-[14px] text-[#4A7C59] tracking-tighter leading-none">{formatPrice(customer.totalSpent)}</p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tighter opacity-60">Avg: {formatPrice(customer.totalSpent / Math.max(1, customer.orders.length))}</p>
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
                                  const welcomeMsg = `🎨 ¡Bienvenido/a a Pujalte Creative Studio! 📸✨\n\nHola *${customer.name}*, es un placer saludarte. \n\nFiel a nuestro lema: "La tecnología al servicio de los recuerdos", hemos habilitado tu acceso a nuestra plataforma privada. 🚀\n\nDesde aquí podrás ver, gestionar y pedir tus fotos de forma sencilla:\n\n🔗 Acceso: https://pujalte-tienda.vercel.app/\n👤 Usuario: *${customer.name.split(' ')[0].toUpperCase()}*\n🔑 Contraseña: *${customer.dni}*\n\n(Te recomendamos copiar y pegar tus datos para acceder más rápido) ⚡️\n\nCualquier duda o consulta, ¡escríbenos por aquí mismo! \nEstamos para ayudarte. 👋😊`;
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
          <DialogContent className="w-[95vw] sm:max-w-[950px] min-h-[90vh] h-[90vh] overflow-hidden rounded-[2.5rem] p-0 flex flex-col shadow-2xl border-none">
            <div className="p-6 sm:p-10 flex flex-col h-full">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-800">Gestionar Cliente</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-400">
                  Configura los accesos, la galería y los pedidos de forma avanzada.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {editingCustomer && (
                  <Tabs defaultValue={customerIdToEdit ? "galeria" : "datos"} className="w-full">
                    <TabsList className="grid grid-cols-3 mb-8 bg-slate-100/50 p-1.5 rounded-[1.25rem] h-12">
                      <TabsTrigger value="datos" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                        <UserPlus className="h-4 w-4" /> Datos
                      </TabsTrigger>
                      <TabsTrigger value="galeria" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                        <Camera className="h-4 w-4" /> Galería
                      </TabsTrigger>
                      <TabsTrigger value="pedidos" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                        <History className="h-4 w-4" /> Pedidos
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="min-h-[500px]">
                      <TabsContent value="datos" className="space-y-8 outline-none pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Nombre Completo</Label>
                            <Input 
                              value={editingCustomer.name} 
                              onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                              className="rounded-2xl h-12 text-sm font-bold bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                              placeholder="Ej: María García Pérez"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">DNI / Identificación</Label>
                            <Input 
                              value={editingCustomer.dni || ''} 
                              onChange={(e) => setEditingCustomer({...editingCustomer, dni: e.target.value})}
                              className="rounded-2xl h-12 text-sm font-bold bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                              placeholder="12345678X"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo Electrónico</Label>
                            <Input 
                              value={editingCustomer.email} 
                              onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                              className="rounded-2xl h-12 text-sm font-bold bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                              placeholder="cliente@ejemplo.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono Contacto</Label>
                            <Input 
                              value={editingCustomer.phone || ''} 
                              onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                              className="rounded-2xl h-12 text-sm font-bold bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                              placeholder="+34 600 000 000"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="galeria" className="space-y-10 outline-none pb-12 px-1">
                        {/* MODO DE GALERÍA */}
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] mb-4">Modo de Exhibición</p>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { value: 'photos', icon: ImageIcon, label: 'Solo Fotos', sub: 'Sin Archivos' },
                              { value: 'both', icon: ShoppingBag, label: 'Dual', sub: 'Físico + Digital' },
                              { value: 'digital', icon: Download, label: 'Archivos', sub: 'Solo Digital' },
                            ].map((mode) => {
                              const current = editingCustomer.gallerySettings?.galleryMode || 'photos'
                              const isActive = current === mode.value
                              return (
                                <button
                                  key={mode.value}
                                  onClick={() => setEditingCustomer({
                                    ...editingCustomer,
                                    gallerySettings: { ...editingCustomer.gallerySettings, galleryMode: mode.value }
                                  })}
                                  className={cn(
                                    "flex flex-col items-center gap-2 p-4 sm:p-5 rounded-[1.75rem] border transition-all text-center group",
                                    isActive
                                      ? "bg-[#4A7C59] border-[#4A7C59] text-white shadow-xl shadow-[#4A7C59]/20 scale-[1.03]"
                                      : "bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-white hover:shadow-lg hover:border-slate-200"
                                  )}
                                >
                                  <mode.icon className={cn("h-5 w-5 mb-1 group-hover:scale-125 transition-transform duration-500", isActive ? "text-white" : "text-slate-400")} />
                                  <div className="space-y-0.5">
                                    <span className={cn("text-[10px] font-black uppercase block leading-none tracking-tight", isActive ? "text-white" : "text-slate-800")}>{mode.label}</span>
                                    <span className={cn("text-[7px] font-black uppercase block leading-none tracking-tighter", isActive ? "text-white/70" : "text-slate-400")}>{mode.sub}</span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* GRID DE CONTROLES CÓMODO Y ESPACIADO */}
                        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                          {/* BLOQUE DE SWITCHES (IZQUIERDA) */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* MARCA AGUA */}
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:border-[#4A7C59]/20 transition-all group min-h-[85px] w-full">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                  <ImageIcon className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">Marca Agua</p>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400/80">Protección</p>
                                </div>
                              </div>
                              <Switch 
                                checked={editingCustomer.gallerySettings?.watermark ?? false}
                                onCheckedChange={(checked) => setEditingCustomer({
                                  ...editingCustomer,
                                  gallerySettings: { ...editingCustomer.gallerySettings, watermark: checked }
                                })}
                                className="shrink-0"
                              />
                            </div>

                            {/* BLOQUEO CAPTURAS */}
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:border-[#4A7C59]/20 transition-all group min-h-[85px] w-full">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50/50 border border-amber-100/50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                                  <Lock className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">Bloqueo Cap.</p>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500/60">Capturas</p>
                                </div>
                              </div>
                              <Switch 
                                checked={editingCustomer.gallerySettings?.preventScreenshot ?? false}
                                onCheckedChange={(checked) => setEditingCustomer({
                                  ...editingCustomer,
                                  gallerySettings: { ...editingCustomer.gallerySettings, preventScreenshot: checked }
                                })}
                                className="shrink-0"
                              />
                            </div>

                            {/* FORZADO DE GALERÍA / FAVORITOS */}
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:border-[#4A7C59]/20 transition-all group min-h-[85px] w-full">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50/50 border border-orange-100/50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                                  <Star className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">Forzar Sel.</p>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400">Favoritos</p>
                                </div>
                              </div>
                              <Switch 
                                checked={editingCustomer.gallerySettings?.shopRequiresFavorite ?? false}
                                onCheckedChange={(checked) => setEditingCustomer({
                                  ...editingCustomer,
                                  gallerySettings: { ...editingCustomer.gallerySettings, shopRequiresFavorite: checked }
                                })}
                                className="shrink-0"
                              />
                            </div>

                            {/* PAGO EFECTIVO */}
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:border-[#4A7C59]/20 transition-all group min-h-[85px] w-full">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-50/50 border border-green-200/50 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all duration-500">
                                  <BadgeEuro className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">Pago Efec.</p>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-green-500/60">Recogida</p>
                                </div>
                              </div>
                              <Switch 
                                checked={editingCustomer.cashEnabled ?? false}
                                onCheckedChange={(checked) => setEditingCustomer({ ...editingCustomer, cashEnabled: checked })}
                                className="shrink-0"
                              />
                            </div>
                          </div>


                          {/* ZONA DE SUBIDA (DERECHA) */}
                          <div className="sm:w-44 lg:w-52 relative group rounded-[1.75rem] border-2 border-dashed border-slate-100 hover:border-[#4A7C59]/40 transition-all bg-slate-50/20 hover:bg-[#4A7C59]/5 flex items-center justify-center">
                            <label className="flex flex-col items-center justify-center h-full w-full py-8 cursor-pointer">
                              <div className="w-12 h-12 rounded-full bg-white border border-slate-50 flex items-center justify-center text-[#4A7C59] shadow-lg shadow-green-900/5 mb-4 group-hover:scale-110 transition-transform">
                                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                              </div>
                              <div className="text-center px-4">
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Cargar Fotos</p>
                                <p className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none">Arrastra o haz clic</p>
                              </div>
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleUploadPhotos}
                                disabled={isUploading}
                              />
                            </label>
                            {isUploading && (
                              <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-[1.75rem] flex flex-col items-center justify-center p-6 z-10 animate-in fade-in zoom-in-95 duration-500 shadow-2xl">
                                <p className="text-[10px] font-black text-[#4A7C59] uppercase mb-3">Procesando {uploadStatus.current}/{uploadStatus.total}</p>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-[#4A7C59]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(uploadStatus.current/uploadStatus.total)*100}%` }}
                                  />
                                </div>
                                <p className="text-[8px] font-black text-slate-400 mt-2 uppercase tracking-tighter">No cierres esta ventana</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* FOTOS INCLUIDAS Y PRECIO EXTRA */}
                        <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-50">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fotos Incluidas (Pack)</Label>
                            <Input 
                              type="number"
                              value={editingCustomer.gallerySettings?.digitalFiles?.packIncluded || 0}
                              onChange={(e) => setEditingCustomer({
                                ...editingCustomer,
                                gallerySettings: { ...editingCustomer.gallerySettings, digitalFiles: { ...editingCustomer.gallerySettings?.digitalFiles, packIncluded: parseInt(e.target.value) || 0 } }
                              })}
                              className="rounded-2xl h-12 font-black text-sm text-[#4A7C59] border-slate-100 bg-slate-50/10 focus:bg-white shadow-inner"
                              placeholder="Ej: 15"
                            />
                            <p className="text-[8px] font-bold text-slate-300 uppercase italic">0 = Selección ilimitada gratuita</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Coste Foto Extra (€)</Label>
                            <Input 
                              type="number"
                              value={editingCustomer.gallerySettings?.digitalFiles?.price || 15}
                              onChange={(e) => setEditingCustomer({
                                ...editingCustomer,
                                gallerySettings: { ...editingCustomer.gallerySettings, digitalFiles: { ...editingCustomer.gallerySettings?.digitalFiles, price: parseFloat(e.target.value) || 0 } }
                              })}
                              className="rounded-2xl h-12 font-black text-sm text-[#4A7C59] border-slate-100 bg-slate-50/10 focus:bg-white shadow-inner"
                              placeholder="Ej: 12"
                            />
                             <p className="text-[8px] font-bold text-slate-300 uppercase italic">Precio por unidad adicional fuera del pack</p>
                          </div>
                        </div>

                        {/* LISTA DE FOTOS Y BANDA SONORA (FILA COMBINADA) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* BANDASONORA MINI */}
                            <div className={cn(
                              "p-6 rounded-[2rem] border transition-all flex flex-col justify-between group h-32",
                              editingCustomer.gallerySettings?.bgMusic 
                                ? "bg-indigo-50/30 border-indigo-100" 
                                : "bg-slate-50/20 border-slate-50"
                            )}>
                              <div className="flex items-center justify-between">
                                <div className={cn(
                                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm border",
                                  editingCustomer.gallerySettings?.bgMusic ? "bg-indigo-600 text-white border-indigo-500" : "bg-white text-indigo-400 border-slate-100"
                                )}>
                                  <Music className="h-5 w-5" />
                                </div>
                                {editingCustomer.gallerySettings?.bgMusic && (
                                  <button onClick={handleDeleteMusic} className="text-red-400 hover:text-red-600 p-2 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-red-50 transition-all">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <div className="overflow-hidden">
                                  <h3 className="text-[9px] font-black uppercase text-slate-800 tracking-wider">Música de Fondo</h3>
                                  <p className="text-[8px] font-bold text-indigo-600/70 uppercase truncate">
                                    {editingCustomer.gallerySettings?.bgMusic ? editingCustomer.gallerySettings.bgMusic.name : "Sin música asignada"}
                                  </p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest border-slate-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0"
                                  onClick={() => { setIsMusicPickerOpen(true); loadLibraryMusic(); }}
                                >
                                  {editingCustomer.gallerySettings?.bgMusic ? "Cambiar" : "Añadir"}
                                </Button>
                              </div>
                            </div>

                            {/* RESUMEN FOTOS */}
                            <div className="p-6 rounded-[2rem] border border-slate-50 bg-slate-50/10 flex flex-col justify-between h-32">
                              <div className="flex -space-x-3">
                                 {editingCustomer.gallerySettings?.photos?.slice(0, 5).map((p: any) => (
                                  <div key={p.id} className="w-11 h-11 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-md">
                                    <img src={p.url} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {(editingCustomer.gallerySettings?.photos?.length || 0) > 5 && (
                                  <div className="w-11 h-11 rounded-full border-2 border-white bg-[#4A7C59] flex items-center justify-center text-[10px] font-black text-white shadow-md">
                                    +{(editingCustomer.gallerySettings?.photos?.length || 0) - 5}
                                  </div>
                                )}
                                {(!editingCustomer.gallerySettings?.photos || editingCustomer.gallerySettings?.photos.length === 0) && (
                                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300">
                                    <ImageIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-[9px] font-black uppercase text-slate-800 tracking-wider">Total Archivos</h4>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">{editingCustomer.gallerySettings?.photos?.length || 0} fotos cargadas</p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setIsPhotosModalOpen(true)}
                                  disabled={!editingCustomer.gallerySettings?.photos?.length}
                                  className="h-8 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest border-slate-100 hover:bg-[#4A7C59] hover:text-white transition-all shadow-sm"
                                >
                                  Gestionar
                                </Button>
                              </div>
                            </div>
                          </div>

                        {/* CONFIGURACIÓN TEXTOS (URL Y MENSAJE) */}
                        <div className="space-y-8 pt-6 border-t border-slate-50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Título de Galería</Label>
                              <Input 
                                value={editingCustomer.gallerySettings?.galleryTitle || ''} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const generatedSlug = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                  setEditingCustomer({
                                    ...editingCustomer,
                                    gallerySettings: { ...editingCustomer.gallerySettings, galleryTitle: val },
                                    slug: generatedSlug || editingCustomer.slug
                                  });
                                }}
                                placeholder="Pj: Newborn Nora"
                                className="rounded-2xl h-12 text-sm font-bold bg-slate-50/50 border-slate-100 focus:bg-white shadow-inner"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-orange-400">Slug / URL Privada</Label>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">/galeria/</div>
                                <Input 
                                  value={editingCustomer.slug || ''} 
                                  onChange={(e) => setEditingCustomer({ ...editingCustomer, slug: e.target.value })}
                                  className="rounded-2xl h-12 pl-16 text-sm font-bold bg-orange-50/20 border-orange-100/50 text-orange-600 focus:bg-white shadow-inner"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensaje de Bienvenida Personalizado</Label>
                            <textarea 
                              value={editingCustomer.gallerySettings?.welcomeMessage || ''} 
                              onChange={(e) => setEditingCustomer({
                                ...editingCustomer,
                                gallerySettings: { ...editingCustomer.gallerySettings, welcomeMessage: e.target.value }
                              })}
                              className="w-full p-5 rounded-[2rem] text-sm font-medium border-slate-100 bg-slate-50/30 focus:bg-white transition-all border outline-none min-h-[120px] custom-scrollbar shadow-inner"
                              placeholder="Escribe algo especial para la familia..."
                            />
                          </div>
                        </div>

                        {/* ACCIONES FINALES ESTILO PREMIUM */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-50">
                          <Button 
                            variant="outline" 
                            className="flex-1 rounded-[1.5rem] h-14 font-black text-[12px] uppercase tracking-[0.15em] border-slate-100 hover:bg-slate-50 group hover:scale-[1.02] transition-all"
                            onClick={() => {
                              const slug = editingCustomer.slug || 'preview';
                              window.open(`/galeria/${slug}?preview=true`, '_blank');
                            }}
                          >
                            <Eye className="h-5 w-5 mr-3 text-slate-400 group-hover:text-[#4A7C59] transition-colors" /> Vista Previa
                          </Button>
                          <Button 
                            className="flex-1 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-[1.5rem] h-14 font-black text-[12px] uppercase tracking-[0.15em] shadow-2xl shadow-green-900/10 group hover:scale-[1.02] transition-all"
                            onClick={() => {
                              const slug = editingCustomer.slug;
                              const url = `${window.location.origin}/galeria/${slug}`;
                              const msg = `🎨 ¡Hola *${editingCustomer.name}*! 👋\n\nYa tenemos lista tu galería: *${editingCustomer.gallerySettings?.galleryTitle || 'Sesión Fotográfica'}*\n\n🔗 Accede aquí: ${url}\n👤 Usuario: *${editingCustomer.name.split(' ')[0].toUpperCase()}*\n🔑 Contraseña: *${editingCustomer.dni}*\n\n¡Espero que disfrutes reviviendo estos momentos! 🌿✨`;
                              window.open(`https://api.whatsapp.com/send?phone=${editingCustomer.phone?.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                          >
                            <Send className="h-5 w-5 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Enviar Galería
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="pedidos" className="outline-none space-y-6">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {editingCustomer.orders && editingCustomer.orders.length > 0 ? (
                            editingCustomer.orders.slice().reverse().map((order: any, i: number) => (
                              <div key={i} className="p-5 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm flex items-center justify-between hover:border-orange-200 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100">
                                    <ShoppingBag className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Pedido #{order.id?.slice(-6)}</p>
                                    <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Fecha desconocida'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-sm text-[#4A7C59]">{formatPrice(order.total)}</p>
                                  <p className="text-[7px] font-bold text-slate-300 uppercase">Impuestos incl.</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 p-10 flex flex-col items-center justify-center text-center space-y-4">
                              <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-50">
                                <History className="h-8 w-8" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Sin Pedidos</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aún no hay transacciones registradas</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                )}
              </div>

              <DialogFooter className="mt-8 pt-6 border-t border-slate-100 flex-row justify-end items-center bg-white px-1">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingCustomer(null)} className="rounded-2xl text-xs font-bold h-12 uppercase tracking-widest">Cancelar</Button>
                  <Button 
                    onClick={async () => {
                      if (!editingCustomer.name || !editingCustomer.email) {
                        toast({ title: 'Error', description: 'Nombre y Email obligatorios', variant: 'destructive' })
                        return
                      }
                      setUpdating(true)
                      try {
                        const { doc, deleteDoc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore')
                        const oldKey = (editingCustomer.originalId || editingCustomer.id).toString().toUpperCase()
                        const newKey = (editingCustomer.dni || editingCustomer.email).toString().toUpperCase()
                        const data = {
                          name: editingCustomer.name,
                          dni: (editingCustomer.dni || '').toUpperCase(),
                          email: (editingCustomer.email || '').toLowerCase(),
                          phone: editingCustomer.phone || '',
                          slug: editingCustomer.slug || '',
                          gallerySettings: editingCustomer.gallerySettings || {},
                          cashEnabled: !!editingCustomer.cashEnabled,
                          updatedAt: serverTimestamp()
                        }
                        if (oldKey !== newKey) {
                          await deleteDoc(doc(db, COLLECTIONS.CLIENTS, oldKey))
                          await setDoc(doc(db, COLLECTIONS.CLIENTS, newKey), { ...data, createdAt: editingCustomer.createdAt || serverTimestamp() })
                        } else {
                          await updateDoc(doc(db, COLLECTIONS.CLIENTS, oldKey), data)
                        }
                        toast({ title: 'Éxito', description: 'Cliente actualizado' })
                        await reloadFirebase()
                        setEditingCustomer(null)
                      } catch (e) {
                        toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' })
                      } finally {
                        setUpdating(false)
                      }
                    }}
                    disabled={updating}
                    className="bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-2xl px-6 text-xs font-black h-12 uppercase tracking-widest shadow-lg shadow-green-100"
                  >
                    {updating ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </DialogFooter>
            </div>
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
                    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
        <Dialog open={isMusicPickerOpen} onOpenChange={setIsMusicPickerOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[400px] rounded-[2.5rem] p-6">
             <DialogHeader><DialogTitle>Seleccionar Música</DialogTitle></DialogHeader>
             <div className="py-4 text-center text-slate-400 text-xs font-bold uppercase">Fonoteca próximamente integrada</div>
             <Button onClick={() => setIsMusicPickerOpen(false)} className="w-full rounded-xl">Cerrar</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={isPhotosModalOpen} onOpenChange={setIsPhotosModalOpen}>
          <DialogContent className="sm:max-w-[90vw] lg:max-w-[75vw] w-full p-8 rounded-[2.5rem] border-none shadow-2xl flex flex-col h-[85vh]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Fotos de Galería</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestiona los archivos y la foto de portada</p>
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{editingCustomer?.gallerySettings?.photos?.length || 0} Archivos</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
              {editingCustomer?.gallerySettings?.photos?.map((photo: any) => (
                <div key={photo.id} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 group/photo hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <img src={photo.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-between items-start">
                      <button 
                        onClick={() => handleSetCover(photo.id)} 
                        className={cn(
                          "p-2 rounded-xl transition-all", 
                          photo.isCover ? "bg-[#4A7C59] text-white" : "bg-white/90 hover:bg-white text-slate-600 shadow-lg"
                        )}
                      >
                        <Star className={cn("h-4 w-4", photo.isCover ? "fill-white" : "")} />
                      </button>
                      <button 
                        onClick={() => handleDeletePhoto(photo.id)} 
                        className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="mt-6 pt-6 border-t border-slate-100">
               <Button variant="outline" onClick={() => setIsPhotosModalOpen(false)} className="w-full rounded-[1.25rem] h-12 font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 transition-all">Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  )
}
