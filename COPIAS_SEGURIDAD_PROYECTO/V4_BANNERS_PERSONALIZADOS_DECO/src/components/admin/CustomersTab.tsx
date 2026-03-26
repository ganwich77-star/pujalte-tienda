'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Trash2
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
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { Order } from '@/types'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

interface CustomersTabProps {
  orders: Order[]
  formatPrice: (price: number) => string
}

export function CustomersTab({ orders, formatPrice }: CustomersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [firebaseClients, setFirebaseClients] = useState<Record<string, any>>({})
  const router = useRouter()

  // Cargar datos de clientes desde Firebase (tiene DNI, cashEnabled actualizados)
  useEffect(() => {
    const loadFirebaseClients = async () => {
      try {
        const snap = await getDocs(collection(db, 'clients'))
        const map: Record<string, any> = {}
        snap.forEach(d => { map[d.id] = d.data() })
        setFirebaseClients(map)
      } catch (e) { console.error('Error cargando clients de Firebase:', e) }
    }
    loadFirebaseClients()
  }, [])

  const reloadFirebase = async () => {
    const snap = await getDocs(collection(db, 'clients'))
    const map: Record<string, any> = {}
    snap.forEach(d => { map[d.id] = d.data() })
    setFirebaseClients(map)
  }

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return
    try {
      // Eliminar de Firebase usando la clave (DNI, email o teléfono)
      const key = deletingCustomer.dni || deletingCustomer.email || deletingCustomer.phone
      if (key) {
        const { doc: firestoreDoc, deleteDoc: firestoreDelete } = await import('firebase/firestore')
        await firestoreDelete(firestoreDoc(db, 'clients', key))
      }
      toast({ title: 'Cliente eliminado', description: 'El cliente ha sido eliminado de la base de datos.' })
      await reloadFirebase()
      router.refresh()
      setDeletingCustomer(null)
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo eliminar el cliente.', variant: 'destructive' })
    }
  }

  const formatDate = (dateValue: any): Date => {
    if (!dateValue) return new Date()
    if (dateValue.seconds) return new Date(dateValue.seconds * 1000)
    const d = new Date(dateValue)
    return isNaN(d.getTime()) ? new Date() : d
  }

  const customers = useMemo(() => {
    const customerMap = new Map<string, {
      name: string; email: string; phone: string; address: string
      dni: string; orders: Order[]; totalSpent: number
      lastOrderDate: Date; marketing: boolean; cashEnabled: boolean
    }>()

    orders.forEach(order => {
      const customFields = (order.customFields || {}) as Record<string, any>
      const dni = (customFields.dni || '').trim().toUpperCase()
      const key = dni || (order.customerEmail?.toLowerCase() || order.customerPhone).trim()
      
      const existing = customerMap.get(key)
      const marketing = customFields.marketing === 'true' || customFields.marketing === true
      const cashEnabled = customFields.cashEnabled === 'true' || customFields.cashEnabled === true
      const orderDate = formatDate(order.createdAt)

      if (existing) {
        existing.orders.push(order)
        existing.totalSpent += order.total
        if (orderDate > existing.lastOrderDate) {
          existing.lastOrderDate = orderDate
          existing.address = order.address || existing.address
        }
        if (marketing) existing.marketing = true
        if (cashEnabled) existing.cashEnabled = true
      } else {
        customerMap.set(key, {
          name: order.customerName,
          email: order.customerEmail || 'Sin email',
          phone: order.customerPhone,
          address: order.address || 'Sin dirección',
          dni,
          orders: [order],
          totalSpent: order.total,
          lastOrderDate: orderDate,
          marketing,
          cashEnabled
        })
      }
    })

    // Fusionar con datos de Firebase: el DNI/cashEnabled de Firebase prevalece
    // También añade clientes que están en Firebase pero no tienen pedidos aún
    Object.values(firebaseClients).forEach((fc: any) => {
      const fcDni = (fc.dni || '').trim().toUpperCase()
      const fcEmail = (fc.email || '').toLowerCase().trim()
      const fcPhone = (fc.phone || '').trim()

      // Buscar el cliente en el mapa por DNI, email o teléfono
      let matchKey: string | null = null
      if (fcDni && customerMap.has(fcDni)) matchKey = fcDni
      else if (fcEmail && customerMap.has(fcEmail)) matchKey = fcEmail
      else if (fcPhone && customerMap.has(fcPhone)) matchKey = fcPhone

      if (matchKey) {
        const entry = customerMap.get(matchKey)!
        // Actualizar con datos más recientes de Firebase
        if (fcDni && !entry.dni) {
          // El DNI se guardó en Firebase pero no estaba en los pedidos: migrar la clave
          entry.dni = fcDni
          customerMap.delete(matchKey)
          customerMap.set(fcDni, entry)
        }
        if (fc.cashEnabled) entry.cashEnabled = true
        if (fc.name) entry.name = fc.name
        if (fc.email) entry.email = fc.email
        if (fc.phone) entry.phone = fc.phone
      }
      // Si no hay coincidencia y tiene DNI, crear entrada sin pedidos
      else if (fcDni && !customerMap.has(fcDni)) {
        customerMap.set(fcDni, {
          name: fc.name || 'Sin nombre',
          email: fc.email || 'Sin email',
          phone: fc.phone || '',
          address: '',
          dni: fcDni,
          orders: [],
          totalSpent: 0,
          lastOrderDate: new Date(),
          marketing: false,
          cashEnabled: fc.cashEnabled || false
        })
      }
    })

    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)
  }, [orders, firebaseClients])

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
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      {/* Header & Stats Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Base de Clientes</h2>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-8 rounded-full bg-[#4A7C59]" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Gestión de Audiencia</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
            <Input
              placeholder="Buscar por DNI, Nombre o Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50 shadow-inner focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Recurrentes', value: stats.repeat, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Info Campañas', value: stats.marketing, icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Gasto Medio', value: formatPrice(stats.avgSpent), icon: TrendingUp, color: 'text-[#4A7C59]', bg: 'bg-[#4A7C59]/5' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
              <p className="text-xl font-black text-slate-800 tracking-tight">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Customers List View */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente / DNI</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Pedidos</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Gastado</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Efectivo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredCustomers.map((customer, idx) => (
                  <motion.tr
                    layout
                    key={customer.dni || (customer.email + customer.phone)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-[#4A7C59]/5 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#4A7C59] font-black">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 tracking-tight">{customer.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{customer.dni || 'DNI NO REGISTRADO'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Mail className="h-3 w-3" /> {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Phone className="h-3 w-3" /> {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Badge variant="outline" className="bg-slate-50 border-slate-100 font-bold text-[10px]">
                        {customer.orders.length}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-[#4A7C59]">{formatPrice(customer.totalSpent)}</p>
                      <p className="text-[9px] font-medium text-slate-400 mt-0.5">Media: {formatPrice(customer.totalSpent / customer.orders.length)}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {customer.cashEnabled ? (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <span className="text-[8px] font-black text-emerald-600 uppercase">Habilitado</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 opacity-20">
                          <XCircle className="h-5 w-5 text-slate-400" />
                          <span className="text-[8px] font-black text-slate-500 uppercase">Bloqueado</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:text-[#4A7C59] hover:bg-white shadow-sm transition-all"
                          onClick={() => setEditingCustomer({
                            ...customer,
                            originalEmail: customer.email,
                            originalPhone: customer.phone,
                            originalDni: customer.dni
                          })}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-9 w-9 rounded-xl bg-slate-50 shadow-sm transition-all ${customer.cashEnabled ? 'text-emerald-500 bg-emerald-50 shadow-emerald-500/20' : 'text-slate-300'}`}
                          onClick={async () => {
                            if (!customer.dni) {
                              toast({ title: 'DNI Requerido', description: 'Este cliente no tiene DNI registrado. No se puede habilitar el efectivo.', variant: 'destructive' })
                              return
                            }
                            try {
                              const res = await fetch(`/api/admin/enable-cash?dni=${customer.dni}&enable=${!customer.cashEnabled}`, { method: 'POST' })
                              if (res.ok) {
                                toast({ title: customer.cashEnabled ? 'Efectivo Deshabilitado' : 'Efectivo Habilitado', description: 'El cambio se ha guardado correctamente.' })
                                setTimeout(() => window.location.reload(), 500)
                              }
                            } catch (e) { console.error(e) }
                          }}
                          title={customer.cashEnabled ? "Deshabilitar Efectivo" : "Habilitar Efectivo"}
                        >
                          <BadgeEuro className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:text-[#4A7C59] hover:bg-white shadow-sm transition-all"
                          onClick={() => {
                              window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank')
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl bg-red-50 text-red-300 hover:text-red-600 hover:bg-red-100 shadow-sm transition-all"
                          onClick={() => setDeletingCustomer(customer)}
                          title="Eliminar cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos de contacto y permisos de pago.
            </DialogDescription>
          </DialogHeader>

          {editingCustomer && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre Completo</Label>
                  <Input 
                    value={editingCustomer.name} 
                    onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    className="rounded-2xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">DNI / NIE</Label>
                  <Input 
                    value={editingCustomer.dni || ''} 
                    onChange={(e) => setEditingCustomer({...editingCustomer, dni: e.target.value})}
                    className="rounded-2xl h-12"
                    placeholder="Sin DNI"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</Label>
                  <Input 
                    value={editingCustomer.email} 
                    onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                    className="rounded-2xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono</Label>
                  <Input 
                    value={editingCustomer.phone || ''} 
                    onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                    className="rounded-2xl h-12"
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
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditingCustomer(null)} className="rounded-2xl">Cancelar</Button>
            <Button 
                onClick={async () => {
                    setUpdating(true)
                    try {
                        const params = new URLSearchParams()
                        params.set('dni', editingCustomer.dni || '')
                        params.set('name', editingCustomer.name || '')
                        params.set('email', editingCustomer.email || '')
                        params.set('phone', editingCustomer.phone || '')
                        params.set('enable', String(editingCustomer.cashEnabled))
                        params.set('originalDni', editingCustomer.originalDni || '')
                        params.set('originalEmail', editingCustomer.originalEmail || '')
                        params.set('originalPhone', editingCustomer.originalPhone || '')
                        
                        const res = await fetch(`/api/admin/enable-cash?${params.toString()}`, { method: 'POST' })
                        const data = await res.json()
                        
                        if (res.ok) {
                            toast({ title: 'Cliente Actualizado', description: 'Los cambios se han guardado correctamente.' })
                            // Recargar Firebase para mostrar el DNI inmediatamente
                            const snap = await getDocs(collection(db, 'clients'))
                            const map: Record<string, any> = {}
                            snap.forEach(d => { map[d.id] = d.data() })
                            setFirebaseClients(map)
                            router.refresh()
                            setEditingCustomer(null)
                        } else {
                            toast({ 
                                title: 'Error', 
                                description: data.details || data.error || 'No se pudo guardar.', 
                                variant: 'destructive' 
                            })
                        }
                    } catch (e) {
                         toast({ title: 'Error', description: 'No se pudo actualizar.', variant: 'destructive' })
                    } finally { setUpdating(false) }
                }}
                disabled={updating}
                className="bg-[#4A7C59] hover:bg-[#3D6649] rounded-2xl px-8"
            >
              {updating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de borrado */}
      <Dialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-red-600">Eliminar Cliente</DialogTitle>
            <DialogDescription className="text-slate-500">
              ¿Seguro que quieres eliminar a <strong>{deletingCustomer?.name}</strong>? 
              Se borrará de la base de datos de clientes. Sus pedidos históricos no se eliminarán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeletingCustomer(null)} className="rounded-2xl flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
