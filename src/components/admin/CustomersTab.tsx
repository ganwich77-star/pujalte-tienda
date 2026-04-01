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
  Play
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
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    cashEnabled: false,
    gallerySettings: {
      shopRequiresFavorite: false
    }
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
      const key = (newCustomer.dni || newCustomer.email || newCustomer.phone).trim().toUpperCase()
      
      await firestoreSet(firestoreDoc(db, COLLECTIONS.CLIENTS, key), {
        ...newCustomer,
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
      setNewCustomer({ name: '', dni: '', email: '', phone: '', cashEnabled: false, gallerySettings: { shopRequiresFavorite: false } })
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
              className="pl-11 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50 shadow-inner focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 transition-all font-medium text-sm"
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
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4"
          >
            <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${item.bg} ${item.color}`}>
              <item.icon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
              <p className="text-sm sm:text-xl font-black text-slate-800 tracking-tight leading-none">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Customers List View */}
      {/* Customers List View */}
      <div className="mx-4 sm:mx-0 bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
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
                      className="flex-1 h-11 rounded-xl bg-white text-slate-900 border-slate-100 font-bold text-xs gap-2 shadow-sm"
                      onClick={() => setEditingCustomer({
                        ...customer,
                        originalId: customer.id,
                        originalEmail: customer.email,
                        originalPhone: customer.phone,
                        originalDni: customer.dni
                      })}
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
                      className="h-11 w-11 rounded-xl bg-[#4A7C59]/5 text-[#4A7C59] border border-[#4A7C59]/10 shadow-sm"
                      onClick={() => window.open(`https://api.whatsapp.com/send?phone=${customer.phone.replace(/\D/g, '')}`, '_blank')}
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
                      className="h-11 w-11 rounded-xl bg-orange-50 text-orange-500 border border-orange-100 shadow-sm"
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
                      className="h-11 w-11 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm"
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
                                  ? "bg-emerald-50 text-emerald-500 border-emerald-100 hover:bg-emerald-100" 
                                  : "bg-slate-50 text-slate-300 border-slate-100 hover:bg-white"
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
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-slate-50 text-slate-400 hover:text-[#4A7C59] hover:bg-white border border-slate-100 shadow-sm transition-all"
                              onClick={() => setEditingCustomer({
                                ...customer,
                                originalId: customer.id,
                                originalEmail: customer.email,
                                originalPhone: customer.phone,
                                originalDni: customer.dni
                              })}
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
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-orange-50 text-orange-400 hover:text-orange-600 hover:bg-white border border-orange-100 shadow-sm transition-all"
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
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-slate-50 text-slate-400 hover:text-[#4A7C59] hover:bg-white border border-slate-100 shadow-sm transition-all"
                              onClick={() => {
                                  window.open(`https://api.whatsapp.com/send?phone=${customer.phone.replace(/\D/g, '')}`, '_blank')
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
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Users className="h-8 w-8 text-slate-200" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 tracking-tight">No se han encontrado clientes</p>
              <p className="text-sm text-slate-400 font-medium">Intenta con otros términos de búsqueda.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[650px] rounded-[2rem] p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black">Editar Cliente</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Modifica los datos de contacto y permisos.
            </DialogDescription>
          </DialogHeader>

          {editingCustomer && (
              <Tabs defaultValue={customerIdToEdit ? "galeria" : "datos"} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-slate-100/50 p-1 rounded-2xl h-12">
                <TabsTrigger value="datos" className="rounded-xl font-bold text-xs gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <UserPlus className="h-3.5 w-3.5" /> Datos
                </TabsTrigger>
                <TabsTrigger value="galeria" className="rounded-xl font-bold text-xs gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Camera className="h-3.5 w-3.5" /> Galería
                </TabsTrigger>
                <TabsTrigger value="pedidos" className="rounded-xl font-bold text-xs gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <History className="h-3.5 w-3.5" /> Pedidos
                </TabsTrigger>
              </TabsList>
              
              <div className="min-h-[450px]">
                <TabsContent value="datos" className="space-y-4 sm:space-y-6 outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</Label>
                    <Input 
                      value={editingCustomer.name} 
                      onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                      className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">DNI / NIE</Label>
                    <Input 
                      value={editingCustomer.dni || ''} 
                      onChange={(e) => setEditingCustomer({...editingCustomer, dni: e.target.value})}
                      className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm"
                      placeholder="Sin DNI"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Email</Label>
                    <Input 
                      value={editingCustomer.email} 
                      onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                      className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono</Label>
                    <Input 
                      value={editingCustomer.phone || ''} 
                      onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                      className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#4A7C59]/5 border border-[#4A7C59]/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">Pago en Efectivo</p>
                    <p className="text-[10px] text-slate-500">Permite a este cliente pagar al recoger.</p>
                  </div>
                  <Switch 
                    checked={editingCustomer.cashEnabled} 
                    onCheckedChange={(checked) => setEditingCustomer({...editingCustomer, cashEnabled: checked})}
                  />
                </div>
              </TabsContent>

              <TabsContent value="galeria" className="space-y-5 outline-none">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fotos Incluidas (0 = Ilimitadas)</Label>
                    <Input 
                      type="number"
                      value={editingCustomer.gallerySettings?.includedPhotos || 0} 
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer, 
                        gallerySettings: { ...editingCustomer.gallerySettings, includedPhotos: parseInt(e.target.value) }
                      })}
                      className="rounded-xl h-11 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Precio Foto Extra (€)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editingCustomer.gallerySettings?.extraPrice || 0} 
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer, 
                        gallerySettings: { ...editingCustomer.gallerySettings, extraPrice: parseFloat(e.target.value) }
                      })}
                      className="rounded-xl h-11 text-sm font-bold text-[#4A7C59]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight italic">¿Vincular Tienda a Favoritos?</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tight leading-none">Actívalo para forzar la selección de la foto antes de comprar.</p>
                  </div>
                  <Switch 
                    checked={editingCustomer.gallerySettings?.shopRequiresFavorite ?? false} 
                    onCheckedChange={(checked) => setEditingCustomer({
                      ...editingCustomer, 
                      gallerySettings: { ...editingCustomer.gallerySettings, shopRequiresFavorite: checked }
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm h-[80px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight leading-none">Marca de Agua</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mt-1">Proteger fotos</p>
                        </div>
                      </div>
                      <Switch 
                        checked={editingCustomer.gallerySettings?.watermarkEnabled ?? true} 
                        onCheckedChange={(checked) => setEditingCustomer({
                          ...editingCustomer, 
                          gallerySettings: { ...editingCustomer.gallerySettings, watermarkEnabled: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm h-[80px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight leading-none">Bloqueo Capturas</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mt-1">Protección web</p>
                        </div>
                      </div>
                      <Switch 
                        checked={editingCustomer.gallerySettings?.safetyLockEnabled ?? true} 
                        onCheckedChange={(checked) => setEditingCustomer({
                          ...editingCustomer, 
                          gallerySettings: { ...editingCustomer.gallerySettings, safetyLockEnabled: checked }
                        })}
                      />
                    </div>
                  </div>

                  <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#4A7C59] hover:bg-slate-50 transition-all cursor-pointer bg-slate-50/50 p-6 text-center h-[172px] flex items-center justify-center">
                    <div className="space-y-2 pointer-events-none relative z-10 w-full">
                      <div className="w-12 h-12 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        {isUploading ? (
                          <div className="relative flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4A7C59] border-t-transparent" />
                            <span className="absolute text-[8px] font-black text-[#4A7C59] leading-none">
                              {Math.round((uploadStatus.current / uploadStatus.total) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <Upload className="h-6 w-6 text-[#4A7C59]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest italic leading-none">
                          {isUploading ? `Subiendo (${uploadStatus.current}/${uploadStatus.total})` : 'Subir fotos'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                          {isUploading ? 'Analizando...' : 'Arrastra archivos aquí'}
                        </p>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleUploadPhotos}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-20" 
                      title="" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Título de Galería</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-[#4A7C59] focus:bg-white transition-all shadow-inner"
                      placeholder="Ej: Boda de María y Juan"
                      value={editingCustomer.gallerySettings?.galleryTitle || ''}
                      onChange={(e) => {
                        setEditingCustomer({
                          ...editingCustomer,
                          gallerySettings: {
                            ...editingCustomer.gallerySettings,
                            galleryTitle: e.target.value
                          }
                        })
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mensaje de Bienvenida</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-[#4A7C59] focus:bg-white transition-all shadow-inner min-h-[52px] h-[52px] resize-none"
                      placeholder="Deja que la magia continúe..."
                      value={editingCustomer.gallerySettings?.welcomeMessage || ''}
                      onChange={(e) => {
                        setEditingCustomer({
                          ...editingCustomer,
                          gallerySettings: {
                            ...editingCustomer.gallerySettings,
                            welcomeMessage: e.target.value
                          }
                        })
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl", editingCustomer.gallerySettings?.bgMusic ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400")}>
                      <Music className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Música de Galería</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                        {editingCustomer.gallerySettings?.bgMusic?.name || 'Ningún archivo seleccionado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => {
                        loadLibraryMusic()
                        setIsMusicPickerOpen(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-xl gap-2 active:scale-95 transition-all shadow-lg shadow-blue-100"
                    >
                      <Music2 className="h-4 w-4" /> {editingCustomer.gallerySettings?.bgMusic ? 'CAMBIAR' : 'EXPLORAR'}
                    </Button>

                    {editingCustomer.gallerySettings?.bgMusic ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDeleteMusic}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-4 h-10 font-bold uppercase text-[10px]"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </Button>
                    ) : (
                      <div className="relative">
                        <Button 
                          disabled={isUploadingMusic}
                          className="bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-xl gap-2 active:scale-95 transition-all"
                        >
                          {isUploadingMusic ? (
                            <> <Loader2 className="h-4 w-4 animate-spin text-white" /> SUBIENDO... </>
                          ) : (
                            <> <Upload className="h-4 w-4" /> SUBIR MP3 </>
                          )}
                        </Button>
                        <input 
                          type="file" 
                          accept="audio/*"
                          onChange={handleUploadMusic}
                          disabled={isUploadingMusic}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>
                </div>


                {/* Lista de fotos subidas (Preview en Admin) */}
                {editingCustomer.gallerySettings?.photos?.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4 max-h-[200px] overflow-y-auto p-1">
                    {editingCustomer.gallerySettings.photos.map((photo: any) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group/photo border border-slate-100 shadow-sm">
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <button 
                            onClick={() => handleSetCover(photo.id)}
                            className={cn(
                              "p-1.5 rounded-full",
                              photo.isCover ? "bg-[#4A7C59] text-white" : "bg-white text-slate-500 hover:text-[#4A7C59]"
                            )}
                          >
                            <UserCheck className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1.5 rounded-full bg-white text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {photo.isCover && (
                          <div className="absolute top-1 left-1 bg-[#4A7C59] text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest shadow-sm">
                            Portada
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-11 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => {
                      const slug = (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
                      window.open(`/galeria/${slug}?preview=true`, '_blank')
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" /> Vista Previa
                  </Button>
                  <Button 
                    className="flex-1 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-xl h-11 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => {
                      try {
                        const slug = (editingCustomer.dni || editingCustomer.email || editingCustomer.phone || '').trim().toUpperCase()
                        const url = `${window.location.origin}/galeria/${slug}`
                        const firstName = editingCustomer.name?.split(' ')[0] || 'Cliente';
                        
                        const message = `👋 ✨ *¡Hola ${firstName}!*

*¡Buenas noticias!* ¡ya tienes lista tu galería online! 🎞️📷

Es el momento de revivir esos momentos mágicos. En el siguiente enlace podrás seleccionar tus fotos favoritas y convertirlas en recuerdos tangibles en nuestra tienda:

👉 ${url} ✨

Queremos que vuestro reportaje sea una experiencia inolvidable y que la tecnología os lo ponga muy fácil. 🚀💻

¿Nos ayudas a seguir creciendo? 🌱✨

En *PujalteFotografia* nos apasiona saber qué piensas. Si te ha gustado nuestro trabajo y el trato recibido, nos harías un favor enorme dejando una reseña en nuestro perfil. 💬🙏

*¿Nos regalas 5 estrellas?* ⭐⭐⭐⭐⭐ Un comentario contando vuestra experiencia sería el broche de oro perfecto para nosotros. 😜🎁

Puedes hacerlo directamente aquí 👇
📍 https://g.page/r/CTswPlAvjlLXEAo/review

Cualquier duda, ¡escríbeme! 📲

¡Mil gracias por vuestra confianza y apoyo! 🤗💖`;

                        const phone = editingCustomer.phone?.replace(/\D/g, '') || '';
                        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank')
                      } catch (e) {
                        console.error('Error al codificar mensaje:', e);
                        toast({ title: 'Error', description: 'No se pudo generar el enlace de WhatsApp.', variant: 'destructive' });
                      }
                    }}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar Galería
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="pedidos" className="outline-none">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {editingCustomer.orders.length > 0 ? (
                    editingCustomer.orders.slice().reverse().map((order: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Pedido #{order.id.slice(-6)}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()} • {order.items.length} productos</p>
                        </div>
                        <p className="font-black text-sm text-[#4A7C59] tracking-tighter">{formatPrice(order.total)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                        <FileText className="h-5 w-5 text-slate-300" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aún no hay pedidos registrados</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between items-center w-full">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="destructive" 
                onClick={() => {
                  setDeletingCustomer(editingCustomer)
                  setEditingCustomer(null)
                }}
                className="rounded-xl sm:rounded-2xl text-xs sm:text-sm h-10 sm:h-12 w-full sm:w-auto bg-red-50 text-red-600 hover:bg-red-100 border-red-100 border"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="ghost" onClick={() => setEditingCustomer(null)} className="rounded-xl sm:rounded-2xl text-xs sm:text-sm h-10 sm:h-12 w-full sm:w-auto mt-0">Cancelar</Button>
              <Button 
                  onClick={async () => {
                    if (!editingCustomer.name || !editingCustomer.email) {
                      toast({ title: 'Datos incompletos', description: 'Nombre y Email son obligatorios.', variant: 'destructive' })
                      return
                    }
                    
                    setUpdating(true)
                    try {
                      const { doc: firestoreDoc, deleteDoc: firestoreDelete, setDoc: firestoreSet, serverTimestamp } = await import('firebase/firestore')
                      
                      const oldKey = (editingCustomer.id || editingCustomer.originalId || editingCustomer.originalDni || editingCustomer.originalEmail || editingCustomer.originalPhone).trim().toUpperCase()
                      const newKey = (editingCustomer.dni || editingCustomer.email || editingCustomer.phone).trim().toUpperCase()
  
                      const updatedData = {
                        name: editingCustomer.name,
                        dni: (editingCustomer.dni || '').trim().toUpperCase(),
                        email: (editingCustomer.email || '').toLowerCase().trim(),
                        phone: (editingCustomer.phone || '').trim(),
                        cashEnabled: !!editingCustomer.cashEnabled,
                        gallerySettings: editingCustomer.gallerySettings || {},
                        updatedAt: serverTimestamp()
                      }
  
                      // Si la clave ha cambiado (ej: cambió el DNI), debemos borrar el documento viejo y crear uno nuevo
                      if (oldKey !== newKey) {
                        await firestoreDelete(firestoreDoc(db, COLLECTIONS.CLIENTS, oldKey))
                        await firestoreSet(firestoreDoc(db, COLLECTIONS.CLIENTS, newKey), {
                          ...updatedData,
                          createdAt: editingCustomer.createdAt || serverTimestamp()
                        })
                      } else {
                        // Si la clave es la misma, solo actualizamos
                        const { updateDoc: firestoreUpdate } = await import('firebase/firestore')
                        await firestoreUpdate(firestoreDoc(db, COLLECTIONS.CLIENTS, oldKey), updatedData)
                      }
  
                      toast({ title: 'Cliente actualizado', description: 'Los cambios se han guardado correctamente.' })
                      await reloadFirebase()
                    } catch (e) {
                      console.error('Error al actualizar cliente:', e)
                      toast({ title: 'Error', description: 'No se pudo actualizar el cliente.', variant: 'destructive' })
                    } finally {
                      setUpdating(false)
                    }
                  }}
                  disabled={updating}
                  className="bg-[#4A7C59] hover:bg-[#3D6649] rounded-xl sm:rounded-2xl px-8 text-xs sm:text-sm h-10 sm:h-12 w-full sm:w-auto"
              >
                {updating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de borrado */}
      <Dialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[450px] rounded-[2rem] p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black text-red-600">Eliminar Cliente</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              ¿Seguro que quieres eliminar a <strong>{deletingCustomer?.name}</strong>? 
              Se borrará de clientes. Los pedidos no se verán afectados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeletingCustomer(null)} className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-xs sm:text-sm flex-1 w-full mt-0">
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl sm:rounded-2xl h-10 sm:h-12 text-xs sm:text-sm flex-1 w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de CREACIÓN (Manual) */}
      <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] rounded-[2.5rem] p-6 sm:p-10 border-none shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-14 h-14 bg-[#4A7C59]/10 rounded-2xl flex items-center justify-center text-[#4A7C59] mb-2">
              <UserPlus className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">Añadir Cliente</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              Registra un nuevo cliente manualmente en tu base de datos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] pl-1">Nombre Completo</Label>
              <Input 
                placeholder="Ej: Juan Pérez"
                value={newCustomer.name} 
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="rounded-2xl h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59] pl-1">DNI / NIE</Label>
              <Input 
                placeholder="12345678Z"
                value={newCustomer.dni} 
                onChange={(e) => setNewCustomer({...newCustomer, dni: e.target.value})}
                className="rounded-2xl h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email</Label>
              <Input 
                placeholder="usuario@ejemplo.com"
                value={newCustomer.email} 
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                className="rounded-2xl h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Teléfono</Label>
              <Input 
                placeholder="600000000"
                value={newCustomer.phone} 
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="rounded-2xl h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900 leading-none">Pago en Efectivo</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Permite pagar al recoger.</p>
                </div>
                <Switch 
                  checked={newCustomer.cashEnabled} 
                  onCheckedChange={(checked) => setNewCustomer({...newCustomer, cashEnabled: checked})}
                />
              </div>

              <div className="p-5 rounded-3xl bg-orange-50/50 border border-orange-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900 leading-none italic">Forzar Selección</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vincula la tienda a favoritos.</p>
                </div>
                <Switch 
                  checked={newCustomer.gallerySettings?.shopRequiresFavorite ?? false} 
                  onCheckedChange={(checked) => setNewCustomer({
                    ...newCustomer, 
                    gallerySettings: { ...newCustomer.gallerySettings, shopRequiresFavorite: checked }
                  })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsAddingCustomer(false)} className="rounded-2xl h-12 flex-1 font-bold text-slate-400 hover:text-slate-900 mt-0">Cancelar</Button>
            <Button 
                onClick={handleAddCustomer}
                disabled={updating}
                className="bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-2xl px-8 h-12 flex-[1.5] font-black uppercase text-xs tracking-widest shadow-lg shadow-[#4A7C59]/20 transition-all"
            >
              {updating ? 'Procesando...' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Buscador de Música Estilo Instagram */}
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
            <div className="p-6 pb-4 border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Fonoteca</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Banda sonora personalizada</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <Music2 className="text-white h-5 w-5" />
                </div>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Buscar en la biblioteca..."
                  value={musicSearch}
                  onChange={(e) => setMusicSearch(e.target.value)}
                  className="pl-11 h-10 rounded-2xl bg-slate-50 border-none focus-visible:bg-white shadow-inner transition-all text-xs font-bold"
                />
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
                  const matchesSearch = s.name.toLowerCase().includes(musicSearch.toLowerCase())
                  const matchesCategory = selectedMusicCategory === 'ALL' || s.category === selectedMusicCategory
                  return matchesSearch && matchesCategory
                })
                .sort((a, b) => a.name.localeCompare(b.name))
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
    </div>
    </TooltipProvider>
  )
}
