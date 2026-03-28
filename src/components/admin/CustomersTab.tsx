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
  Trash2,
  Plus,
  Save,
  Check,
  X as CloseIcon
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
import { db, COLLECTIONS } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  setDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore'

interface CustomersTabProps {
  orders: Order[]
  formatPrice: (price: number) => string
}

export function CustomersTab({ orders, formatPrice }: CustomersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    cashEnabled: false
  })
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [firebaseClients, setFirebaseClients] = useState<Record<string, any>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const router = useRouter()

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
    const snap = await getDocs(collection(db, 'clients'))
    const map: Record<string, any> = {}
    snap.forEach(d => { map[d.id] = d.data() })
    setFirebaseClients(map)
  }

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return
    try {
      const key = (deletingCustomer.dni || deletingCustomer.email || deletingCustomer.phone || '').trim().toUpperCase()
      if (key) {
        await deleteDoc(doc(db, COLLECTIONS.CLIENTS, key))
        const nextSelected = new Set(selectedIds)
        nextSelected.delete(key)
        setSelectedIds(nextSelected)
      }
      toast({ title: 'CLIENTE ELIMINADO', description: 'EL REGISTRO HA SIDO BORRADO DEL SISTEMA.' })
      await reloadFirebase()
      setDeletingCustomer(null)
    } catch (e) {
      toast({ title: 'ERROR', description: 'NO SE PUDO ELIMINAR EL CLIENTE.', variant: 'destructive' })
    }
  }

  const handleSaveCustomer = async () => {
    if (!editingCustomer) return
    setUpdating(true)
    try {
      const key = (editingCustomer.dni || editingCustomer.email || editingCustomer.phone || '').trim().toUpperCase()
      if (!key) throw new Error('Se requiere DNI, Email o Teléfono')
      
      const docRef = doc(db, COLLECTIONS.CLIENTS, key)
      await updateDoc(docRef, {
        name: editingCustomer.name,
        dni: editingCustomer.dni.trim().toUpperCase(),
        email: editingCustomer.email.trim().toLowerCase(),
        phone: editingCustomer.phone.trim(),
        cashEnabled: editingCustomer.cashEnabled,
        updatedAt: serverTimestamp()
      })
      
      toast({ title: 'CAMBIOS GUARDADOS', description: 'DATOS ACTUALIZADOS CORRECTAMENTE.' })
      await reloadFirebase()
      setEditingCustomer(null)
    } catch (e: any) {
      toast({ title: 'ERROR AL GUARDAR', description: e.message || 'FALLO EN LA ACCIÓN.', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleAddCustomer = async () => {
    setUpdating(true)
    try {
      const key = (newCustomer.dni || newCustomer.email || newCustomer.phone || '').trim().toUpperCase()
      if (!key) throw new Error('Se requiere al menos un identificador (DNI, Email o Teléfono)')
      
      const docRef = doc(db, COLLECTIONS.CLIENTS, key)
      await setDoc(docRef, {
        ...newCustomer,
        dni: newCustomer.dni.trim().toUpperCase(),
        email: newCustomer.email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      toast({ title: 'CLIENTE CREADO', description: 'EL NUEVO CLIENTE YA ESTÁ EN EL SISTEMA.' })
      await reloadFirebase()
      setIsAddingCustomer(false)
      setNewCustomer({ name: '', dni: '', email: '', phone: '', cashEnabled: false })
    } catch (e: any) {
      toast({ title: 'ERROR', description: e.message || 'NO SE PUDO CREAR EL CLIENTE.', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const toggleCashStatus = async (customer: any) => {
    const key = (customer.dni || customer.email || customer.phone || '').trim().toUpperCase()
    if (!key) return
    
    try {
      const docRef = doc(db, COLLECTIONS.CLIENTS, key)
      await updateDoc(docRef, {
        cashEnabled: !customer.cashEnabled,
        updatedAt: serverTimestamp()
      })
      await reloadFirebase()
      toast({ 
        title: !customer.cashEnabled ? 'EFECTIVO HABILITADO' : 'EFECTIVO BLOQUEADO',
        description: `ESTADO CAMBIADO PARA ${customer.name.toUpperCase()}`
      })
    } catch (e) {
      toast({ title: 'ERROR', description: 'NO SE PUDO CAMBIAR EL ESTADO.', variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`¿Seguro que quieres eliminar ${selectedIds.size} clientes?`)) return
    
    try {
      const { doc: firestoreDoc, deleteDoc: firestoreDelete } = await import('firebase/firestore')
      const deletePromises = Array.from(selectedIds).map(id => firestoreDelete(firestoreDoc(db, 'clients', id)))
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
      setSelectedIds(new Set(filteredCustomers.map(c => c.dni || c.email || c.phone)))
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">Base de Clientes</h2>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-1 w-6 sm:h-1.5 sm:w-8 rounded-full bg-[#4A7C59]" />
            <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Gestión de Audiencia</p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#4A7C59] transition-colors" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50 shadow-inner focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#4A7C59]/10 transition-all font-medium text-sm"
            />
          </div>
          <Button 
            onClick={() => setIsAddingCustomer(true)}
            className="bg-[#4A7C59] hover:bg-[#3D6649] text-white h-10 sm:h-12 px-6 flex items-center justify-center rounded-xl sm:rounded-2xl shadow-lg transition-all active:scale-95 font-black uppercase text-xs tracking-widest whitespace-nowrap"
          >
            Alta Cliente
          </Button>
          {selectedIds.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="h-10 sm:h-12 rounded-xl sm:rounded-2xl px-4 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100"
            >
              <Trash2 className="h-4 w-4" /> ({selectedIds.size})
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
            <div key={customer.dni || (customer.email + customer.phone)} className="p-5 space-y-4">
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
                <Button 
                  variant="ghost" 
                  className={`h-11 w-11 rounded-xl border shadow-sm transition-all ${
                    customer.cashEnabled 
                      ? 'bg-emerald-50 text-emerald-500 border-emerald-100' 
                      : 'bg-slate-50 text-slate-300 border-slate-100'
                  }`}
                  onClick={() => toggleCashStatus(customer)}
                >
                  {customer.cashEnabled ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 h-11 rounded-xl bg-white text-slate-900 border-slate-100 font-bold text-xs gap-2 shadow-sm"
                  onClick={() => setEditingCustomer({
                    ...customer,
                    originalEmail: customer.email,
                    originalPhone: customer.phone,
                    originalDni: customer.dni
                  })}
                >
                  <Edit2 className="h-4 w-4" /> Editar
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-11 w-11 rounded-xl bg-white text-slate-400 border border-slate-100 shadow-sm"
                  onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-11 w-11 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm"
                  onClick={() => setDeletingCustomer(customer)}
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* VISTA DESKTOP (TABLE) */}
        <div className="hidden sm:block w-full overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-auto">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-5 py-5 w-12">
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
                <th className="px-5 sm:px-6 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">Cliente / DNI</th>
                <th className="px-5 sm:px-6 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto</th>
                <th className="px-4 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Pedidos</th>
                <th className="px-5 sm:px-6 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Inversión</th>
                <th className="px-5 sm:px-6 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acción</th>
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
                    <td className="px-5 py-5 text-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-slate-300 text-[#4A7C59] focus:ring-[#4A7C59]"
                        checked={selectedIds.has(customer.dni || customer.email || customer.phone)}
                        onChange={() => toggleSelect(customer.dni || customer.email || customer.phone)}
                      />
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#4A7C59] font-black text-sm">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs sm:text-sm text-slate-800 tracking-tight truncate">{customer.name}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{customer.dni || 'SIN DNI'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-0.5 max-w-[150px]">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 truncate">
                          <Mail className="h-2.5 w-2.5 text-slate-300 shrink-0" /> {customer.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 truncate">
                          <Phone className="h-2.5 w-2.5 text-slate-300 shrink-0" /> {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Badge variant="outline" className="bg-slate-50 border-slate-100 font-bold text-[10px]">
                        {customer.orders.length}
                      </Badge>
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5">
                      <p className="font-black text-sm text-[#4A7C59] tracking-tighter">{formatPrice(customer.totalSpent)}</p>
                      <p className="text-[8px] font-medium text-slate-400 mt-0.5 truncate">Media: {formatPrice(customer.totalSpent / Math.max(1, customer.orders.length))}</p>
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleCashStatus(customer)}
                          className={`h-8 w-8 rounded-lg border transition-all ${
                            customer.cashEnabled 
                              ? 'bg-emerald-50 text-emerald-500 border-emerald-100' 
                              : 'bg-slate-50 text-slate-300 border-slate-100'
                          }`}
                        >
                          {customer.cashEnabled ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg bg-slate-900 text-white hover:bg-black shadow-sm transition-all"
                          onClick={() => setEditingCustomer({
                            ...customer,
                            originalEmail: customer.email,
                            originalPhone: customer.phone,
                            originalDni: customer.dni
                          })}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-emerald-500 shadow-sm transition-all"
                          onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank')}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg bg-red-50 text-red-400 border border-red-50 hover:bg-red-500 hover:text-white shadow-sm transition-all"
                          onClick={() => setDeletingCustomer(customer)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem] p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black">Editar Cliente</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Modifica los datos de contacto y permisos.
            </DialogDescription>
          </DialogHeader>

          {editingCustomer && (
            <div className="space-y-4 sm:space-y-6 py-4">
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
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditingCustomer(null)} className="rounded-xl sm:rounded-2xl text-xs sm:text-sm h-10 sm:h-12 w-full sm:w-auto mt-0">Cancelar</Button>
            <Button 
                onClick={handleSaveCustomer}
                disabled={updating}
                className="bg-[#4A7C59] hover:bg-[#3D6649] rounded-xl sm:rounded-2xl px-8 text-xs sm:text-sm h-10 sm:h-12 w-full sm:w-auto"
            >
              {updating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Modal de Alta Cliente */}
      <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem] p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black">Nuevo Cliente</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest">
              Añadir registro a la audiencia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre Completo</Label>
              <Input 
                value={newCustomer.name} 
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                placeholder="Nombre del cliente..."
                className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm bg-slate-50 border-none shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">DNI / NIE</Label>
                <Input 
                  value={newCustomer.dni} 
                  onChange={(e) => setNewCustomer({...newCustomer, dni: e.target.value})}
                  placeholder="12345678X"
                  className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm bg-slate-50 border-none shadow-inner uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono</Label>
                <Input 
                  value={newCustomer.phone} 
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="600000000"
                  className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm bg-slate-50 border-none shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Email (Opcional)</Label>
              <Input 
                value={newCustomer.email} 
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                placeholder="email@ejemplo.com"
                className="rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm bg-slate-50 border-none shadow-inner"
              />
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-emerald-900">Pago en Efectivo</p>
                <p className="text-[10px] text-emerald-600/70 font-medium">Permitir pago al recoger para este cliente</p>
              </div>
              <Switch 
                checked={newCustomer.cashEnabled} 
                onCheckedChange={(checked) => setNewCustomer({...newCustomer, cashEnabled: checked})}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setIsAddingCustomer(false)} className="rounded-xl sm:rounded-2xl h-12 flex-1 w-full order-2 sm:order-1">Cancelar</Button>
            <Button 
                onClick={handleAddCustomer}
                disabled={updating || !newCustomer.name}
                className="bg-[#4A7C59] hover:bg-[#3D6649] rounded-xl sm:rounded-2xl h-12 px-8 flex-1 w-full order-1 sm:order-2 shadow-lg"
            >
              {updating ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de borrado */}
      <Dialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[420px] rounded-[2rem] p-6 sm:p-8">
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
    </div>
  )
}
