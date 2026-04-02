'use client'

import { useState, useEffect } from 'react'
import { 
  Camera, 
  Search, 
  Trash2, 
  Eye, 
  Send, 
  Users,
  Loader2,
  AlertCircle,
  LayoutGrid,
  List,
  CheckCircle2,
  MoreVertical,
  History,
  Edit3,
  Filter,
  Plus,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from 'framer-motion'
import { db, COLLECTIONS } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface GalleriesTabProps {
  onEditCustomerGallery: (customer: any) => void
  initialFilter?: string
}

export function GalleriesTab({ onEditCustomerGallery, initialFilter = 'all' }: GalleriesTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState(initialFilter)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (initialFilter) {
      setActionFilter(initialFilter)
    }
  }, [initialFilter])
  const [customers, setCustomers] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deletingGallery, setDeletingGallery] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSelectCustomerModalOpen, setIsSelectCustomerModalOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, COLLECTIONS.CLIENTS), orderBy('updatedAt', 'desc'))
      const snap = await getDocs(q)
      const list: any[] = []
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() })
      })
      setCustomers(list)
    } catch (e) {
      console.error('Error cargando clientes:', e)
      toast({ title: 'Error', description: 'No se pudieron cargar las galerías.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const customersWithGallery = customers.filter(c => (c.gallerySettings?.photos?.length || 0) > 0)
  const filteredGalleries = customers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.dni?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    const isConfirmed = c.gallerySettings?.selectionConfirmed && c.gallerySettings?.lastSelection?.length > 0;
    const isEmpty = !c.gallerySettings?.photos || c.gallerySettings.photos.length === 0;

    if (actionFilter === 'pending_action') return isConfirmed || isEmpty;
    if (actionFilter === 'empty') return isEmpty;
    if (actionFilter === 'confirmed') return isConfirmed;
    
    return true;
  })

  const handleDeleteGallery = async () => {
    if (!deletingGallery) return
    setIsDeleting(true)
    try {
      const clientRef = doc(db, COLLECTIONS.CLIENTS, deletingGallery.id)
      await updateDoc(clientRef, {
        'gallerySettings.photos': [],
        'gallerySettings.includedPhotos': 0,
        'updatedAt': new Date()
      })
      toast({ title: 'Galería eliminada', description: 'Se han borrado todas las fotos de la sesión.' })
      setDeletingGallery(null)
      loadCustomers()
    } catch (e) {
      console.error('Error deleting gallery:', e)
      toast({ title: 'Error', description: 'No se pudo eliminar la galería.', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">Galerías Clientes</h2>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-1 w-6 sm:h-1.5 sm:w-8 rounded-full bg-blue-500" />
            <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Gestión de Reportajes</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg sm:rounded-xl transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-blue-500" : "text-slate-400 hover:text-slate-600")}
            >
              <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg sm:rounded-xl transition-all", viewMode === 'list' ? "bg-white shadow-sm text-blue-500" : "text-slate-400 hover:text-slate-600")}
            >
              <List className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="relative group flex-1 md:w-64 min-w-[150px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50 shadow-inner focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-blue-500/10 transition-all font-medium text-sm"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-auto h-10 sm:h-12 px-4 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50 font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all gap-2">
              <Filter className="h-4 w-4 text-blue-500" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest py-3">Todos</SelectItem>
              <SelectItem value="pending_action" className="text-[10px] font-bold uppercase tracking-widest py-3 text-orange-500 font-black">Acción Pendiente</SelectItem>
              <SelectItem value="confirmed" className="text-[10px] font-bold uppercase tracking-widest py-3 text-emerald-500 font-black">Confirmadas</SelectItem>
              <SelectItem value="empty" className="text-[10px] font-bold uppercase tracking-widest py-3 text-rose-500 font-black">Sin Fotos</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setIsSelectCustomerModalOpen(true)}
            className="h-10 sm:h-12 px-6 rounded-xl sm:rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" /> Nuevo Reportaje
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-0">
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-500">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Reportajes</p>
            <p className="text-xl font-black text-slate-800 leading-none">{customersWithGallery.length}</p>
          </div>
        </div>
      </div>

      {/* Grid / List de Galerías */}
      <div className="px-2 sm:px-0">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando galerías...</p>
          </div>
        ) : filteredGalleries.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGalleries.map((customer) => {
                const coverPhoto = customer.gallerySettings?.photos?.find((p: any) => p.isCover)?.url || customer.gallerySettings?.photos?.[0]?.url;
                const photoCount = customer.gallerySettings?.photos?.length || 0;

                return (
                  <motion.div
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all overflow-hidden flex flex-col"
                  >
                    {/* Preview Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
                      {coverPhoto ? (
                        <img 
                          src={coverPhoto} 
                          alt={customer.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50/50 to-slate-200/30 text-slate-300">
                          <Camera className="h-12 w-12 mb-2 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Pendiente de Subida</p>
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div className="flex gap-2">
                          <Badge className="h-6 px-3 rounded-full font-black text-[10px] uppercase tracking-widest border-none shadow-lg bg-blue-500 text-white">
                            {photoCount} FOTOS
                          </Badge>
                          {photoCount === 0 && (
                            <Badge className="h-6 px-3 rounded-full font-black text-[10px] uppercase tracking-widest border-none shadow-lg bg-red-500 text-white animate-pulse">
                              <AlertCircle className="h-3 w-3 mr-1" /> SIN FOTOS
                            </Badge>
                          )}
                          {((customer.orders && customer.orders.length > 0) || (customer.gallerySettings?.selectionConfirmed && customer.gallerySettings?.lastSelection?.length > 0)) && (
                            <Badge className="h-6 px-3 rounded-full font-black text-[10px] uppercase tracking-widest border-none shadow-lg bg-emerald-500 text-white animate-pulse">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> CONFIRMADA
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <button className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-900 hover:bg-white transition-colors shadow-sm">
                                 <MoreVertical className="h-4 w-4" />
                               </button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                               <DropdownMenuItem onClick={() => onEditCustomerGallery(customer)} className="gap-2 font-bold text-xs uppercase tracking-tight">
                                 <Edit3 className="h-3.5 w-3.5" /> Gestionar Galería
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => {
                               const slug = customer.slug || 
                                            customer.gallerySettings?.galleryTitle?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                                            customer.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                                            (customer.dni || customer.id || '').trim().toUpperCase();
                               window.open(`/galeria/${slug}?preview=true`, '_blank')
                               }} className="gap-2 font-bold text-xs uppercase tracking-tight">
                                 <Eye className="h-3.5 w-3.5" /> Vista Previa
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => setDeletingGallery(customer)} className="gap-2 font-bold text-xs uppercase tracking-tight text-red-500 focus:text-red-600 focus:bg-red-50">
                                 <Trash2 className="h-3.5 w-3.5" /> Borrar Galería
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </div>

                      {/* Overlay retirado por petición del usuario */}
                    </div>

                    {/* Info */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h4 className="font-black text-slate-900 leading-tight uppercase truncate">{customer.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{customer.dni || 'Sin DNI'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex -space-x-2">
                             {customer.gallerySettings?.photos?.slice(0, 3).map((p: any, i: number) => (
                                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                                     <img src={p.url} className="w-full h-full object-cover" />
                                 </div>
                             ))}
                             {photoCount > 3 && (
                                 <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400">
                                     +{photoCount - 3}
                                 </div>
                             )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => onEditCustomerGallery(customer)}
                                className="w-11 h-11 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-500 hover:text-white transition-all shadow-sm border-[1.5px] border-slate-100 flex items-center justify-center group/btn"
                                title="Gestionar Galería"
                             >
                                <Edit3 className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
                             </button>
                             <button 
                                onClick={() => {
                                   const slug = customer.slug || 
                                                customer.gallerySettings?.galleryTitle?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                                                customer.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                                                (customer.dni || customer.id || '').trim().toUpperCase();
                                   window.open(`/galeria/${slug}?preview=true`, '_blank')
                                }}
                                className="w-11 h-11 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-100 flex items-center justify-center group/btn"
                                title="Vista Previa"
                             >
                                <Eye className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
                             </button>
                             <button 
                                onClick={() => {
                                    try {
                                       const slug = customer.slug || 
                                                   customer.gallerySettings?.galleryTitle?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                                                   customer.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                                                   (customer.dni || customer.id || '').trim().toUpperCase();
                                       const url = `${window.location.origin}/galeria/${slug}`
                                       const firstName = customer.name?.split(' ')[0] || 'Cliente';
                                       
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

                                       const phone = customer.phone?.replace(/\D/g, '') || '';
                                       window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank')
                                    } catch (e) {
                                       console.error('Error al codificar mensaje:', e);
                                       toast({ title: 'Error', description: 'No se pudo generar el enlace de WhatsApp.', variant: 'destructive' });
                                    }
                                }}
                                className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-100 flex items-center justify-center group/btn"
                                title="Enviar por WhatsApp"
                             >
                                <Send className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
                             </button>
                          </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            /* Modo Lista */
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-2 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Reportaje</th>
                    <th className="px-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fotos</th>
                    <th className="px-2 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Ult. Cambio</th>
                    <th className="px-2 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredGalleries.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group/row">
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden relative flex items-center justify-center border border-slate-100">
                             {(customer.gallerySettings?.photos?.length || 0) > 0 ? (
                               <img 
                                 src={customer.gallerySettings?.photos?.find((p: any) => p.isCover)?.url || customer.gallerySettings?.photos?.[0]?.url} 
                                 className="w-full h-full object-cover" 
                               />
                             ) : (
                               <Camera className="h-4 w-4 text-slate-300 opacity-50" />
                             )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 uppercase">{customer.name}</p>
                            <p className="text-[10px] font-medium text-slate-400">{customer.dni || customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500 text-white border-none font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-sm">
                            {customer.gallerySettings?.photos?.length || 0} FOTOS
                          </Badge>
                          {(customer.gallerySettings?.photos?.length || 0) === 0 && (
                            <Badge className="bg-red-500 text-white border-none font-black text-[10px] uppercase px-3 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-sm">
                              <AlertCircle className="h-3 w-3" /> SIN FOTOS
                            </Badge>
                          )}
                          {((customer.orders && customer.orders.length > 0) || (customer.gallerySettings?.selectionConfirmed && customer.gallerySettings?.lastSelection?.length > 0)) && (
                            <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase px-3 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-sm">
                              <CheckCircle2 className="h-3 w-3" /> CONFIRMADA
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-4 hidden sm:table-cell text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">
                          {customer.updatedAt?.toDate ? customer.updatedAt.toDate().toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                              onClick={() => onEditCustomerGallery(customer)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                              title="Gestionar Galería"
                           >
                              <Edit3 className="h-4 w-4" />
                           </button>
                           <button 
                              onClick={() => {
                                 const slug = customer.slug || 
                                              customer.gallerySettings?.galleryTitle?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                                              customer.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                                              (customer.dni || customer.id || '').trim().toUpperCase();
                                 window.open(`/galeria/${slug}?preview=true`, '_blank')
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                              title="Vista Previa"
                           >
                              <Eye className="h-4 w-4" />
                           </button>
                           <button 
                            onClick={() => setDeletingGallery(customer)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="py-20 text-center space-y-4 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Camera className="h-8 w-8 text-slate-200" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 tracking-tight">No hay galerías activas</p>
              <p className="text-sm text-slate-400 font-medium">Sube fotos a un cliente para crear su galería.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Confirmación Borrado */}
      <Dialog open={!!deletingGallery} onOpenChange={(o) => !o && setDeletingGallery(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[420px] rounded-[2rem] p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black text-red-600">Eliminar Galería</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              ¿Seguro que quieres borrar todas las fotos del reportaje de <strong>{deletingGallery?.name}</strong>? 
              El cliente seguirá existiendo, pero su galería estará vacía. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeletingGallery(null)} className="rounded-xl h-12 flex-1 mt-0">Cancelar</Button>
            <Button 
              onClick={handleDeleteGallery}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 flex-1"
            >
              {isDeleting ? 'Borrando...' : 'Sí, eliminar fotos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Seleccionar Cliente para Nuevo Reportaje */}
      <Dialog open={isSelectCustomerModalOpen} onOpenChange={setIsSelectCustomerModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
             <DialogTitle className="text-2xl font-black uppercase tracking-tight italic relative z-10">Nuevo Reportaje</DialogTitle>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 relative z-10">Selecciona un cliente para empezar</p>
          </div>

          <div className="p-6 space-y-6 bg-white">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="ESCRIBE NOMBRE O DNI..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-black text-[10px] uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-blue-500/20"
              />
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-100">
              {customers
                .filter(c => 
                  c.name?.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
                  c.dni?.toLowerCase().includes(customerSearchQuery.toLowerCase())
                )
                .map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      onEditCustomerGallery(customer)
                      setIsSelectCustomerModalOpen(false)
                      setCustomerSearchQuery('')
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-50 group transition-all text-left border border-transparent hover:border-blue-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-blue-500 group-hover:text-white transition-all">
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{customer.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{customer.dni || customer.email || 'SIN DATOS'}</p>
                      </div>
                    </div>
                    {(customer.gallerySettings?.photos?.length || 0) > 0 ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest rounded-lg">ACTIVA</Badge>
                    ) : (
                      <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest rounded-lg">VACÍA</Badge>
                    )}
                  </button>
                ))}
              
              {customers.length === 0 && !loading && (
                <div className="py-10 text-center">
                  <Users className="h-10 w-10 text-slate-100 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay clientes registrados</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-end">
            <Button variant="ghost" onClick={() => setIsSelectCustomerModalOpen(false)} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px]">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

