'use client'

import { Download, Eye, ShoppingCart, Trash2, ArrowUpDown, ChevronDown, CheckSquare, Square, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Order } from '@/types'
import { useState, useMemo } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface OrdersTabProps {
  orders: Order[]
  formatPrice: (price: number) => string
  onUpdateStatus: (id: string, status: string) => void
  onDeleteOrder: (id: string) => void
}

export function OrdersTab({ orders, formatPrice, onUpdateStatus, onDeleteOrder }: OrdersTabProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order | 'date' | 'total', direction: 'asc' | 'desc' } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
      <CardHeader className="flex flex-row items-center justify-between px-0 pb-8">
        <div className="space-y-1.5">
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Pedidos</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-400">Control de ventas y estados de envío</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="h-12 px-6 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold flex items-center gap-3 active:scale-95 border border-red-100"
                >
                  <Trash2 className="h-5 w-5" />
                  Eliminar ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2.5rem] border-none p-8 gap-6 shadow-2xl">
                <AlertDialogHeader className="gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                    <Trash2 className="h-7 w-7 text-red-500" />
                  </div>
                  <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">¿Eliminar {selectedIds.size} pedidos?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                    Esta acción no se puede deshacer. Los datos de los pedidos seleccionados se borrarán permanentemente del sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                  <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteSelected}
                    className="h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none"
                  >
                    Sí, eliminar para siempre
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            onClick={exportToCSV} 
            className="h-12 px-6 rounded-2xl bg-[#4A7C59] hover:bg-[#3D6649] text-white shadow-lg shadow-[#4A7C59]/20 transition-all font-bold flex items-center gap-3 active:scale-95"
          >
            <Download className="h-5 w-5" />
            Exportar Informe CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
          <ScrollArea className="h-[65vh]">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[50px] px-8">
                    <Checkbox 
                      checked={selectedIds.size === orders.length && orders.length > 0} 
                      onCheckedChange={toggleSelectAll}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                    />
                  </TableHead>
                  <TableHead 
                    className="w-[350px] py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => requestSort('customerName')}
                  >
                    <div className="flex items-center gap-2">
                      Artículos & Cliente
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => requestSort('total')}
                  >
                    <div className="flex items-center gap-2">
                      Inversión
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => requestSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      ID & Fecha
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Estado logístico
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Acción</TableHead>
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
                    <TableRow key={order.id} className={`hover:bg-slate-50/50 transition-colors border-slate-50 group ${selectedIds.has(order.id) ? 'bg-slate-50/80 shadow-inner' : ''}`}>
                      <TableCell className="px-8">
                        <Checkbox 
                          checked={selectedIds.has(order.id)} 
                          onCheckedChange={() => toggleSelect(order.id)}
                          className="rounded-md border-slate-300 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                        />
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="space-y-3">
                          <div className="flex flex-col mb-1">
                            <p className="font-black text-sm text-slate-900 tracking-tight">{order.customerName}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">{order.customerPhone}</p>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            {order.items.map((item, i) => (
                              <div key={i} className="group/item">
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#4A7C59]/10 text-[#4A7C59] text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{item.quantity}x</span>
                                  <p className="text-[11px] font-bold text-slate-600 leading-none">
                                    {item.productName}
                                    {item.variantName && <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase">({item.variantName})</span>}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-base text-[#4A7C59] tabular-nums tracking-tighter">{formatPrice(order.total)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-slate-500">
                          <p className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-widest truncate max-w-[80px]">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-[10px] font-bold">{orderDate.toLocaleDateString('es-ES')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={order.status} onValueChange={(v) => onUpdateStatus(order.id, v)}>
                          <SelectTrigger className={`h-9 text-[10px] font-black uppercase tracking-wider rounded-xl border-none shadow-sm transition-all focus:ring-0 ${statusColors[order.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-600'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-100 overflow-hidden shadow-2xl">
                            <SelectItem value="pending" className="text-xs font-bold py-2.5">PENDIENTE</SelectItem>
                            <SelectItem value="paid" className="text-xs font-bold py-2.5">PAGADO</SelectItem>
                            <SelectItem value="shipped" className="text-xs font-bold py-2.5">ENVIADO</SelectItem>
                            <SelectItem value="delivered" className="text-xs font-bold py-2.5">ENTREGADO</SelectItem>
                            <SelectItem value="cancelled" className="text-xs font-bold py-2.5">CANCELADO</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-5">
                          {/* Punto de estado de pago */}
                          <div 
                            className={`h-2.5 w-2.5 rounded-full shadow-lg ${order.paymentStatus === 'completed' ? 'bg-[#4A7C59] shadow-[#4A7C59]/40' : 'bg-red-500 shadow-red-500/40 animate-pulse'}`} 
                            title={order.paymentStatus === 'completed' ? 'Pagado' : 'Impagado'}
                          />
                          
                          <div className="flex items-center gap-2 p-1 bg-slate-50/50 rounded-2xl border border-slate-100/50 backdrop-blur-sm shadow-sm group">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white text-slate-900 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                  <Eye className="h-5 w-5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg rounded-[2.5rem] border-none shadow-2xl p-8">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Detalle del Pedido #{order.id.slice(-8).toUpperCase()}</DialogTitle>
                                </DialogHeader>
                              <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
                                  <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cliente</p><p className="font-extrabold text-sm text-slate-800">{order.customerName}</p></div>
                                  <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Teléfono</p><p className="font-extrabold text-sm text-slate-800">{order.customerPhone}</p></div>
                                  <div className="col-span-2"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email</p><p className="font-extrabold text-sm text-slate-800">{order.customerEmail || '-'}</p></div>
                                  <div className="col-span-2"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Dirección de Entrega</p><p className="font-extrabold text-sm text-slate-800 leading-relaxed">{order.address || '-'}</p></div>
                                </div>
                                
                                <div className="space-y-4">
                                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Desglose de Productos</p>
                                  <div className="space-y-3">
                                    {order.items.map((item, i) => (
                                      <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="font-black text-slate-800">{item.productName}{item.variantName ? ` (${item.variantName})` : ''} <span className="text-[#4A7C59]">x{item.quantity}</span></span>
                                          <span className="font-black text-slate-900 tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                        {item.note && (
                                          <p className="text-[11px] text-[#4A7C59] bg-[#4A7C59]/5 p-3 rounded-xl italic border-l-4 border-[#4A7C59] font-medium leading-relaxed">
                                            &quot;{item.note}&quot;
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl shadow-slate-200">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Total Recaudado</span>
                                    <span className="text-3xl font-black tracking-tighter">{formatPrice(order.total)}</span>
                                  </div>
                                </div>
                                
                                {order.customFields && Object.keys(order.customFields).filter(k => !['name', 'phone', 'email', 'address', 'notes'].includes(k)).length > 0 && (
                                  <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Información Adicional</p>
                                    <div className="grid grid-cols-2 gap-4 bg-slate-100/50 p-5 rounded-3xl border border-dashed border-slate-200">
                                      {Object.entries(order.customFields).map(([key, value]) => {
                                        if (['name', 'phone', 'email', 'address', 'notes'].includes(key)) return null;
                                        return (
                                          <div key={key}>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                                            <p className="text-xs font-bold text-slate-700">{value || '-'}</p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {order.notes && (
                                  <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Notas del cliente</p>
                                    <p className="text-xs font-bold text-amber-800 leading-relaxed italic">"{order.notes}"</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm group"
                                >
                                  <Trash2 className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-[2.5rem] border-none p-8 gap-6 shadow-2xl">
                                <AlertDialogHeader className="gap-3">
                                  <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-2">
                                    <Trash2 className="h-7 w-7 text-rose-500" />
                                  </div>
                                  <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">¿Eliminar pedido #{order.id.slice(-8).toUpperCase()}?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                    Esta acción es irreversible. Se eliminará el registro del cliente, datos de envío y desglose de artículos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                                  <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Mantener pedido</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => onDeleteOrder(order.id)}
                                    className="h-12 px-6 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 border-none"
                                  >
                                    Eliminar ahora
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </div>
                    </TableCell>
                    </TableRow>
                  )
                })}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                       <div className="flex flex-col items-center gap-3">
                          <ShoppingCart className="h-12 w-12 text-slate-100" />
                          <p className="text-sm font-bold text-slate-300">No hay pedidos registrados todavía</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
