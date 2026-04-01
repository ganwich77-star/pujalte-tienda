'use client'

import { Download, Eye, ShoppingCart, Trash2, ArrowUpDown, ChevronDown, CheckSquare, Square, XCircle, Edit3, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Order } from '@/types'
import { useState, useMemo, useEffect } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { db, COLLECTIONS } from '@/lib/firebase'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { Search, Loader2, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OrdersTabProps {
  orders: Order[]
  formatPrice: (price: number) => string
  onUpdateStatus: (id: string, status: string) => void
  onUpdateOrder: (order: Order) => void
  onDeleteOrder: (id: string) => void
}

export function OrdersTab({ orders, formatPrice, onUpdateStatus, onUpdateOrder, onDeleteOrder }: OrdersTabProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order | 'date' | 'total', direction: 'asc' | 'desc' } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [dniSearch, setDniSearch] = useState('')
  const [foundClients, setFoundClients] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearchClients = async (val: string) => {
    setDniSearch(val)
    if (val.length < 3) {
      setFoundClients([])
      return
    }
    setIsSearching(true)
    try {
      const q = query(
        collection(db, COLLECTIONS.CLIENTS),
        where("dni", ">=", val.toUpperCase()),
        where("dni", "<=", val.toUpperCase() + "\uf8ff"),
        limit(5)
      )
      const snap = await getDocs(q)
      const results: any[] = []
      snap.forEach(doc => results.push({ id: doc.id, ...doc.data() }))
      setFoundClients(results)
    } catch (e) {
      console.error("Error buscando clientes:", e)
    } finally {
      setIsSearching(false)
    }
  }

  const selectClient = (client: any) => {
    if (!editingOrder) return
    setEditingOrder({
      ...editingOrder,
      customerName: client.name || editingOrder.customerName,
      customerPhone: client.phone || editingOrder.customerPhone,
      customerEmail: client.email || editingOrder.customerEmail,
      address: client.address || editingOrder.address || ''
    })
    setDniSearch(client.dni || '')
    setFoundClients([])
  }

  // Limpiar búsqueda al cerrar modal
  useEffect(() => {
    if (!isEditDialogOpen) {
      setDniSearch('')
      setFoundClients([])
    }
  }, [isEditDialogOpen])

  const sortedOrders = useMemo(() => {
    let sortableOrders = [...orders]
    if (sortConfig !== null) {
      sortableOrders.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Order]
        let bVal: any = b[sortConfig.key as keyof Order]

        // Custom handling for dates and total
        if (sortConfig.key === 'date' || sortConfig.key === 'createdAt') {
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableOrders
  }, [orders, sortConfig])

  const requestSort = (key: any) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDeleteSelected = async () => {
    // Process one by one
    for (const id of Array.from(selectedIds)) {
      await onDeleteOrder(id)
    }
    setSelectedIds(new Set())
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder({ ...order })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingOrder) {
      onUpdateOrder(editingOrder)
      setIsEditDialogOpen(false)
    }
  }

  const exportToCSV = () => {
    // Definimos las cabeceras
    const headers = [
      'Seguimiento', 'Artículo', 'Observaciones', 'ID Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Email', 
      'Dirección', 'Variante', 'Cantidad', 'Precio Unit.', 'Total Linea', 
      'Estado', 'Método Pago', 'Notas Generales'
    ]

    const rows = orders.flatMap(order => 
      order.items.map(item => [
        order.trackingNumber || '-',
        item.productName,
        (item.note || '').replace(/;/g, ' '), // Observaciones juntas al artículo
        order.id,
        new Date(order.createdAt).toLocaleDateString('es-ES'),
        order.customerName,
        order.customerPhone,
        order.customerEmail || '',
        (order.address || '').replace(/;/g, ' '),
        item.variantName || '',
        item.quantity,
        item.price,
        item.price * item.quantity,
        order.status,
        order.paymentMethod || '',
        (order.notes || '').replace(/;/g, ' ')
      ])
    )

    // Unimos todo en formato CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // Crear el archivo y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `informe_ventas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-0 pb-6 sm:pb-8 gap-4 sm:gap-0">
        <div className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Gestión de Pedidos</CardTitle>
          <CardDescription className="text-xs sm:text-sm font-medium text-slate-400">Control de ventas y estados de envío</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {selectedIds.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold flex items-center justify-center gap-2 sm:gap-3 active:scale-95 border border-red-100 text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Eliminar ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-[2rem] sm:rounded-[2.5rem] border-none p-6 sm:p-8 gap-6 shadow-2xl">
                <AlertDialogHeader className="gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-red-50 flex items-center justify-center mb-1">
                    <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 text-red-500" />
                  </div>
                  <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Eliminar {selectedIds.size} pedidos?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                    Esta acción no se puede deshacer. Los datos de los pedidos seleccionados se borrarán permanentemente del sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                  <AlertDialogCancel className="h-10 sm:h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm w-full sm:w-auto mt-0">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteSelected}
                    className="h-10 sm:h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none text-sm w-full sm:w-auto"
                  >
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            onClick={exportToCSV} 
            className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-[#4A7C59] hover:bg-[#3D6649] text-white shadow-lg shadow-[#4A7C59]/20 transition-all font-bold flex items-center justify-center gap-2 sm:gap-3 active:scale-95 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-2xl sm:rounded-[2.5rem] border border-slate-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* VISTA MÓVIL (CARDS) */}
          <div className="block sm:hidden divide-y divide-slate-50">
            {sortedOrders.map(order => {
              const statusColors = {
                pending: 'bg-amber-100 text-amber-700 border-amber-200',
                paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                shipped: 'bg-blue-100 text-blue-700 border-blue-200',
                delivered: 'bg-slate-100 text-slate-700 border-slate-200',
                cancelled: 'bg-red-100 text-red-700 border-red-200'
              }

              const orderDate = order.createdAt ? 
                (typeof order.createdAt === 'object' && 'seconds' in order.createdAt ? 
                  new Date((order.createdAt as any).seconds * 1000) : 
                  new Date(order.createdAt)) : 
                new Date();

              return (
                <div key={order.id} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedIds.has(order.id)} 
                        onCheckedChange={() => toggleSelect(order.id)}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-widest">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-slate-400">{orderDate.toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    <div 
                      className={`h-2.5 w-2.5 rounded-full shadow-lg ${order.paymentStatus === 'completed' ? 'bg-[#4A7C59] shadow-[#4A7C59]/40' : 'bg-red-500 shadow-red-500/40 animate-pulse'}`} 
                      title={order.paymentStatus === 'completed' ? 'Pagado' : 'Impagado'}
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-slate-900">{order.customerName}</h4>
                    <p className="text-[11px] font-bold text-slate-400">{order.customerPhone}</p>
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="bg-[#4A7C59]/10 text-[#4A7C59] text-[9px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{item.quantity}x</span>
                          <p className="text-[10px] font-bold text-slate-600 truncate flex-1">
                            {item.productName}
                            {item.variantName && <span className="text-[8px] text-slate-400 font-bold ml-1 uppercase">({item.variantName})</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-slate-400">Total Inversión</span>
                      <span className="font-black text-base text-[#4A7C59] tracking-tighter tabular-nums">{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex-1 max-w-[140px]">
                      <Select value={order.status} onValueChange={(v) => onUpdateStatus(order.id, v)}>
                        <SelectTrigger className={`h-10 text-[9px] font-black uppercase tracking-wider rounded-xl border-none shadow-sm transition-all focus:ring-0 ${statusColors[order.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-600'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                          <SelectItem value="pending" className="text-xs font-bold">PENDIENTE</SelectItem>
                          <SelectItem value="paid" className="text-xs font-bold">PAGADO</SelectItem>
                          <SelectItem value="shipped" className="text-xs font-bold">ENVIADO</SelectItem>
                          <SelectItem value="delivered" className="text-xs font-bold">ENTREGADO</SelectItem>
                          <SelectItem value="cancelled" className="text-xs font-bold text-red-600">CANCELADO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleEditOrder(order)}
                      className="flex-1 h-11 rounded-xl bg-white text-[#4A7C59] border-slate-100 font-bold text-xs gap-2 shadow-sm"
                    >
                      <Edit3 className="h-4 w-4" /> Editar Cliente
                    </Button>

                    <Dialog >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 h-11 rounded-xl bg-white text-slate-900 border-slate-100 font-bold text-xs gap-2 shadow-sm">
                          <Eye className="h-4 w-4" /> Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Detalle del Pedido #{order.id.slice(-8).toUpperCase()}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-1 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                            <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Cliente</p><p className="font-extrabold text-xs text-slate-800">{order.customerName}</p></div>
                            <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Teléfono</p><p className="font-extrabold text-xs text-slate-800">{order.customerPhone}</p></div>
                            <div className="sm:col-span-2"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Email</p><p className="font-extrabold text-xs text-slate-800">{order.customerEmail || '-'}</p></div>
                            <div className="sm:col-span-2"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Dirección de Entrega</p><p className="font-extrabold text-xs text-slate-800 leading-relaxed">{order.address || '-'}</p></div>
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Desglose de Productos</p>
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col gap-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-black text-slate-800">{item.productName}{item.variantName ? ` (${item.variantName})` : ''} <span className="text-[#4A7C59]">x{item.quantity}</span></span>
                                    <span className="font-black text-slate-900 tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                                  </div>
                                  {item.note && (
                                    <p className="text-[10px] text-[#4A7C59] bg-[#4A7C59]/5 p-2 rounded-lg italic border-l-2 border-[#4A7C59] font-medium leading-relaxed">
                                      &quot;{item.note}&quot;
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-200">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Total</span>
                              <span className="text-xl font-black tracking-tighter">{formatPrice(order.total)}</span>
                            </div>
                          </div>
                          
                          {order.notes && (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Notas del cliente</p>
                              <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic">"{order.notes}"</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm">
                          <Trash2 className="h-4 w-4.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95vw] rounded-[2.5rem] border-none p-6 shadow-2xl">
                        <AlertDialogHeader className="gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-1">
                            <Trash2 className="h-6 w-6 text-rose-500" />
                          </div>
                          <AlertDialogTitle className="text-xl font-black text-slate-900 tracking-tight">¿Eliminar pedido?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                            Esta acción es irreversible. Se eliminará el registro completo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col gap-2 mt-2">
                          <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm mt-0">Mantener</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteOrder(order.id)}
                            className="h-12 px-6 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 border-none text-sm"
                          >
                            Eliminar ahora
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
            {orders.length === 0 && (
              <div className="text-center py-20 px-5">
                <div className="flex flex-col items-center gap-3">
                  <ShoppingCart className="h-12 w-12 text-slate-100" />
                  <p className="text-sm font-bold text-slate-300">No hay pedidos registrados todavía</p>
                </div>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (TABLE) */}
          <div className="hidden sm:block w-full overflow-hidden">
            <ScrollArea className="h-[65vh]">
              <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[40px] sm:w-[50px] px-4 sm:px-8">
                    <Checkbox 
                      checked={selectedIds.size === orders.length && orders.length > 0} 
                      onCheckedChange={toggleSelectAll}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                    />
                  </TableHead>
                  <TableHead 
                    className="py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => requestSort('customerName')}
                  >
                    <div className="flex items-center gap-2">
                      Cliente / ID / Fecha
                      <ArrowUpDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Artículos
                  </TableHead>
                  <TableHead 
                    className="py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => requestSort('total')}
                  >
                    <div className="flex items-center gap-2">
                      Inversión
                      <ArrowUpDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Estado logístico
                      <ArrowUpDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead className="py-4 sm:py-6 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map(order => {
                  const statusColors = {
                    pending: 'bg-amber-100 text-amber-700 border-amber-200',
                    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    shipped: 'bg-blue-100 text-blue-700 border-blue-200',
                    delivered: 'bg-slate-100 text-slate-700 border-slate-200',
                    cancelled: 'bg-red-100 text-red-700 border-red-200'
                  }

                  const orderDate = order.createdAt ? 
                    (typeof order.createdAt === 'object' && 'seconds' in order.createdAt ? 
                      new Date((order.createdAt as any).seconds * 1000) : 
                      new Date(order.createdAt)) : 
                    new Date();
                  
                  return (
                    <TableRow key={order.id} className={`hover:bg-slate-50/50 transition-colors border-slate-100 group ${selectedIds.has(order.id) ? 'bg-slate-50/80' : ''}`}>
                      <TableCell className="w-[40px] px-3">
                        <Checkbox 
                          checked={selectedIds.has(order.id)} 
                          onCheckedChange={() => toggleSelect(order.id)}
                          className="rounded-md border-slate-300 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                        />
                      </TableCell>
                      <TableCell className="py-2 min-w-[150px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 overflow-hidden">
                            <p className="text-[7px] font-mono font-black uppercase text-slate-300 shrink-0">#{order.id.slice(-6).toUpperCase()}</p>
                            <span className="text-slate-200 text-[8px] shrink-0">•</span>
                            <p className="text-[8px] font-bold text-slate-400 shrink-0">{orderDate.toLocaleDateString('es-ES')}</p>
                          </div>
                          <p className="font-black text-[12px] text-slate-900 tracking-tight leading-tight truncate max-w-[140px]">{order.customerName}</p>
                          <p className="text-[9px] font-bold text-slate-400 tracking-wider font-mono uppercase">{order.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-0.5 max-w-[180px]">
                          {order.items.slice(0, 1).map((item, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-[#4A7C59] text-[9px] font-black shrink-0">x{item.quantity}</span>
                              <p className="text-[9px] font-bold text-slate-500 truncate leading-none">
                                {item.productName}
                              </p>
                            </div>
                          ))}
                          {order.items.length > 1 && (
                            <p className="text-[7px] font-black text-[#4A7C59]/50 uppercase ml-1 shrink-0">+{order.items.length - 1} más...</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <p className="font-black text-[12px] text-[#4A7C59] tabular-nums tracking-tighter text-right shrink-0 pr-4">{formatPrice(order.total)}</p>
                      </TableCell>
                      <TableCell className="py-2 min-w-[100px]">
                        <Select value={order.status} onValueChange={(v) => onUpdateStatus(order.id, v)}>
                          <SelectTrigger className={`h-6 px-2 text-[7px] font-black uppercase tracking-wider rounded-lg border-none shadow-sm transition-all focus:ring-0 ${statusColors[order.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-600'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="pending" className="text-[9px] font-bold">PENDIENTE</SelectItem>
                            <SelectItem value="paid" className="text-[9px] font-bold">PAGADO</SelectItem>
                            <SelectItem value="shipped" className="text-[9px] font-bold">ENVIADO</SelectItem>
                            <SelectItem value="delivered" className="text-[9px] font-bold">ENTREGADO</SelectItem>
                            <SelectItem value="cancelled" className="text-[9px] font-bold text-red-600">CANCELADO</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center py-2 w-[100px] pr-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <div 
                            className={`h-1.5 w-1.5 rounded-full shadow-md shrink-0 ${order.paymentStatus === 'completed' ? 'bg-[#4A7C59]' : 'bg-red-500 animate-pulse'}`} 
                            title={order.paymentStatus === 'completed' ? 'Pagado' : 'Impagado'}
                          />
                          <div className="flex items-center gap-1 p-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditOrder(order)}
                              className="h-6 w-6 rounded-md bg-white text-[#4A7C59] border border-slate-100 shadow-sm"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-white text-slate-900 border border-slate-100 shadow-sm">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[95vw] sm:max-w-lg rounded-[2rem] sm:rounded-[2.5rem] border-none shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
                                <DialogHeader>
                                  <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Detalle del Pedido #{order.id.slice(-8).toUpperCase()}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 sm:space-y-6 py-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
                                    <div><p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cliente</p><p className="font-extrabold text-xs sm:text-sm text-slate-800">{order.customerName}</p></div>
                                    <div><p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Teléfono</p><p className="font-extrabold text-xs sm:text-sm text-slate-800">{order.customerPhone}</p></div>
                                    <div className="sm:col-span-2"><p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email</p><p className="font-extrabold text-xs sm:text-sm text-slate-800">{order.customerEmail || '-'}</p></div>
                                    <div className="sm:col-span-2"><p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Dirección de Entrega</p><p className="font-extrabold text-xs sm:text-sm text-slate-800 leading-relaxed">{order.address || '-'}</p></div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Desglose de Productos</p>
                                    <div className="space-y-3">
                                      {order.items.map((item, i) => (
                                        <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-2">
                                          <div className="flex justify-between items-start text-sm">
                                            <div className="flex flex-col gap-1">
                                              <span className="font-black text-slate-800">{item.productName}{item.variantName ? ` (${item.variantName})` : ''} <span className="text-[#4A7C59]">x{item.quantity}</span></span>
                                              {item.fotosIncluidas !== undefined && (
                                                <div className="flex items-center gap-2">
                                                  <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1 uppercase tracking-widest leading-none">
                                                    {item.fotosIncluidas} {item.fotosIncluidas === 1 ? 'Foto Incluida' : 'Fotos Incluidas'}
                                                  </span>
                                                  {item.quantity > 1 && (
                                                    <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-widest leading-none shadow-lg shadow-slate-200">
                                                      {item.fotosIncluidas * item.quantity} Fotos Total del Pack
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            <span className="font-black text-slate-900 tabular-nums shrink-0">{formatPrice(item.price * item.quantity)}</span>
                                          </div>
                                          {item.note && (
                                            <p className="text-[11px] text-[#4A7C59] bg-[#4A7C59]/5 p-3 rounded-xl italic border-l-4 border-[#4A7C59] font-medium leading-relaxed">
                                              &quot;{item.note}&quot;
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-900 text-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-slate-200">
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-60">Total</span>
                                    <span className="text-2xl sm:text-3xl font-black tracking-tighter">{formatPrice(order.total)}</span>
                                  </div>

                                  {order.customFields && Object.keys(order.customFields).filter(k => !['name', 'phone', 'email', 'address', 'notes'].includes(k)).length > 0 && (
                                    <div className="space-y-2 sm:space-y-3">
                                      <p className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-widest">Adicional</p>
                                      <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-slate-100/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200">
                                        {Object.entries(order.customFields).map(([key, value]) => {
                                          if (['name', 'phone', 'email', 'address', 'notes'].includes(key)) return null;
                                          return (
                                            <div key={key}>
                                              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{key}</p>
                                              <p className="text-[10px] sm:text-xs font-bold text-slate-700">{value || '-'}</p>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {order.notes && (
                                    <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-100">
                                      <p className="text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Notas del cliente</p>
                                      <p className="text-[10px] sm:text-xs font-bold text-amber-800 leading-relaxed italic">"{order.notes}"</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm group"
                              >
                                <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-[2rem] sm:rounded-[2.5rem] border-none p-6 sm:p-8 gap-6 shadow-2xl">
                              <AlertDialogHeader className="gap-3">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-rose-50 flex items-center justify-center mb-1">
                                  <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 text-rose-500" />
                                </div>
                                <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Eliminar pedido?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                                  Esta acción es irreversible. Se eliminará el registro completo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                                <AlertDialogCancel className="h-10 sm:h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm w-full sm:w-auto mt-0">Mantener</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onDeleteOrder(order.id)}
                                  className="h-10 sm:h-12 px-6 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 border-none text-sm w-full sm:w-auto"
                                >
                                  Eliminar ahora
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-24 px-8 border-none">
                       <div className="flex flex-col items-center gap-5">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#4A7C59]/10 rounded-full blur-2xl scale-150 animate-pulse" />
                            <ShoppingCart className="h-16 w-16 text-[#4A7C59]/20 relative z-10" />
                          </div>
                          <p className="text-base font-black text-slate-300 tracking-tight">Vuestra tienda aún está esperando su primer pedido</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          </div>
        </div>

        {/* MODAL DE EDICIÓN DE PEDIDO */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-2xl rounded-[2rem] sm:rounded-[3rem] border-none shadow-2xl p-6 sm:p-10 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Editar Datos del Cliente</DialogTitle>
              <p className="text-sm font-medium text-slate-400 mt-1">Actualiza la información de entrega y contacto del pedido.</p>
            </DialogHeader>

            {editingOrder && (
              <div className="space-y-6">
                {/* BUSCADOR DE CLIENTES EXISTENTES */}
                <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 relative">
                  <Label className="text-[10px] font-black uppercase text-blue-500 tracking-widest ml-1 mb-2 block">Vincular Cliente Existente (DNI)</Label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      placeholder="Escribe el DNI para buscar..."
                      value={dniSearch}
                      onChange={(e) => handleSearchClients(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-none shadow-inner bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                    )}
                  </div>

                  {/* Resultados de búsqueda */}
                  <AnimatePresence>
                    {foundClients.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute inset-x-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 max-h-60 overflow-y-auto"
                      >
                        {foundClients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => selectClient(client)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 uppercase leading-none mb-1">{client.name}</p>
                              <div className="flex gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{client.dni}</span>
                                {client.phone && <span className="text-[10px] font-bold text-[#4A7C59]">{client.phone}</span>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre Completo</Label>
                    <Input 
                      value={editingOrder.customerName} 
                      onChange={(e) => setEditingOrder(prev => prev ? {...prev, customerName: e.target.value} : null)}
                      className="h-12 rounded-2xl border-slate-100 focus:border-[#4A7C59] focus:ring-[#4A7C59]/10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Teléfono</Label>
                    <Input 
                      value={editingOrder.customerPhone || ''} 
                      onChange={(e) => setEditingOrder(prev => prev ? {...prev, customerPhone: e.target.value} : null)}
                      className="h-12 rounded-2xl border-slate-100 focus:border-[#4A7C59] focus:ring-[#4A7C59]/10 font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email / DNI</Label>
                    <Input 
                      value={editingOrder.customerEmail || ''} 
                      onChange={(e) => setEditingOrder(prev => prev ? {...prev, customerEmail: e.target.value} : null)}
                      className="h-12 rounded-2xl border-slate-100 focus:border-[#4A7C59] focus:ring-[#4A7C59]/10 font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dirección de Entrega</Label>
                    <Textarea 
                      value={editingOrder.address || ''} 
                      onChange={(e) => setEditingOrder(prev => prev ? {...prev, address: e.target.value} : null)}
                      className="min-h-[100px] rounded-2xl border-slate-100 focus:border-[#4A7C59] focus:ring-[#4A7C59]/10 font-bold resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notas Administrativas</Label>
                    <Textarea 
                      value={editingOrder.notes || ''} 
                      onChange={(e) => setEditingOrder(prev => prev ? {...prev, notes: e.target.value} : null)}
                      className="min-h-[80px] rounded-2xl border-slate-100 focus:border-[#4A7C59] focus:ring-[#4A7C59]/10 font-bold resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    className="h-12 sm:h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 order-2 sm:order-1 flex-1"
                  >
                    Descartar cambios
                  </Button>
                  <Button 
                    onClick={handleSaveEdit}
                    className="h-12 sm:h-14 rounded-2xl bg-[#4A7C59] text-white font-black hover:bg-[#3D6649] shadow-xl shadow-[#4A7C59]/20 order-1 sm:order-2 flex-[2] gap-3"
                  >
                    <Save className="h-5 w-5" />
                    Guardar Cambios del Cliente
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
