import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Package, Settings, ShoppingCart, TrendingUp, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Order, Category, Product } from '@/types'

interface DashboardTabProps {
  stats: {
    totalSales: number
    totalOrders: number
    totalRevenue: number
  }
  orders: Order[]
  categories: Category[]
  products: Product[]
  formatPrice: (price: number) => string
}

export function DashboardTab({ stats, orders, categories, products, formatPrice }: DashboardTabProps) {
  const [chartType, setChartType] = useState<'status' | 'payment' | 'category'>('status')
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false)

  // Calcular ventas por método de pago
  const paymentStats = orders.reduce((acc, order) => {
    const method = order.paymentMethod || 'Web'
    acc[method] = (acc[method] || 0) + (order.total || 0)
    return acc
  }, {} as Record<string, number>)

  // Calcular ventas por categoría (mapeando productos)
  const categoryStats = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      // Buscamos el producto por nombre (o ID si lo tuviéramos)
      const product = products.find(p => p.name === item.productName)
      const categoryId = product?.categoryId || 'unassigned'
      const category = categories.find(c => c.id === categoryId)
      const categoryName = category?.name || 'Varios/Sin asignar'
      
      acc[categoryName] = (acc[categoryName] || 0) + (item.price * item.quantity)
    })
    return acc
  }, {} as Record<string, number>)

  const formatDate = (date: any) => {
    try {
      if (!date) return 'Fecha n/a'
      const d = new Date(date)
      if (isNaN(d.getTime())) return 'Fecha n/a'
      return d.toLocaleDateString('es-ES')
    } catch (e) {
      return 'Fecha n/a'
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards - Mantenemos igual para consistencia */}
        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-[#4A7C59]/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-4 sm:p-6">
            <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Ventas Totales</CardTitle>
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#4A7C59]" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{stats.totalSales}</div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-0.5 sm:mt-1">unidades entregadas</p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-4 sm:p-6">
            <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Pedidos</CardTitle>
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{stats.totalOrders}</div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-0.5 sm:mt-1">gestionados hoy</p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-4 sm:p-6">
            <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Ingresos</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-0.5 sm:mt-1">en pedidos activos</p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-4 sm:p-6">
            <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Catálogo</CardTitle>
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{categories.length}</div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-0.5 sm:mt-1">categorías activas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOP PRODUCTOS */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
              <TrendingUp className="h-4 w-4 text-[#4A7C59]" />
              Artículos Estrella
            </CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 italic">Los más deseados de la temporada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const productCounts = orders.flatMap(o => o.items).reduce((acc, item) => {
                  acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
                  return acc;
                }, {} as Record<string, number>);

                const topProducts = Object.entries(productCounts)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5);

                const maxQty = Math.max(...(Object.values(productCounts) as number[]), 1);

                return topProducts.map(([name, qty], index) => (
                  <div key={name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3 rounded-2xl bg-slate-50 border border-slate-100/50 group hover:border-[#4A7C59]/20 transition-all gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-white shadow-sm flex items-center justify-center text-[9px] sm:text-[10px] font-black text-[#4A7C59] flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 truncate">{name}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                       <span className="text-[10px] font-black text-[#4A7C59] uppercase tracking-tighter whitespace-nowrap">{(qty as number)} unidades</span>
                       <div className="h-1.5 w-16 sm:w-12 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-full bg-[#4A7C59]" 
                            style={{ width: `${((qty as number) / maxQty) * 100}%` }} 
                          />
                       </div>
                    </div>
                  </div>
                ));
              })()}
              {orders.length === 0 && <p className="text-[10px] font-black uppercase text-center py-12 text-slate-300 tracking-widest">Sin datos de ventas</p>}
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICOS DINÁMICOS */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                <BarChart3 className="h-4 w-4 text-[#4A7C59]" />
                Análisis de Ventas
              </CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 italic">Distribución detallada</CardDescription>
            </div>
            
            {/* Selector de Gráfico */}
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
               {[
                 { id: 'status', label: 'Estado' },
                 { id: 'payment', label: 'Pago' },
                 { id: 'category', label: 'Cat.' }
               ].map(t => (
                 <button
                   key={t.id}
                   onClick={() => setChartType(t.id as any)}
                   className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${chartType === t.id ? 'bg-white text-[#4A7C59] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {t.label}
                 </button>
               ))}
            </div>
          </CardHeader>
          <CardContent>
             <div className="space-y-4 pt-2">
              <AnimatePresence mode="wait">
                {chartType === 'status' && (
                  <motion.div 
                    key="status"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {[
                      { label: 'Completados/Pagados', status: ['paid', 'delivered', 'shipped'], color: 'bg-emerald-500' },
                      { label: 'Pendientes', status: ['pending'], color: 'bg-amber-500' },
                      { label: 'Cancelados', status: ['cancelled'], color: 'bg-red-500' }
                    ].map(group => {
                      const amount = orders
                        .filter(o => group.status.includes(o.status))
                        .reduce((sum, o) => sum + o.total, 0);
                      const count = orders.filter(o => group.status.includes(o.status)).length;
                      
                      return (
                        <div key={group.label} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{group.label} ({count})</span>
                            <span className="text-[13px] font-black text-slate-900 tabular-nums">{formatPrice(amount)}</span>
                          </div>
                          <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${stats.totalRevenue > 0 ? (amount / stats.totalRevenue) * 100 : 0}%` }}
                              className={`h-full ${group.color}`} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {chartType === 'payment' && (
                  <motion.div 
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {['Bizum', 'Card', 'Cash', 'Web'].map(method => {
                      const amount = paymentStats[method] || 0;
                      const count = orders.filter(o => (o.paymentMethod || 'Web') === method).length;
                      if (amount === 0 && count === 0) return null;

                      return (
                        <div key={method} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{method} ({count})</span>
                            <span className="text-[13px] font-black text-slate-900 tabular-nums">{formatPrice(amount)}</span>
                          </div>
                          <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${stats.totalRevenue > 0 ? (amount / stats.totalRevenue) * 100 : 0}%` }}
                              className="h-full bg-blue-500" 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {chartType === 'category' && (
                  <motion.div 
                    key="category"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {Object.entries(categoryStats)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([name, amount]) => (
                        <div key={name} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{name}</span>
                            <span className="text-[13px] font-black text-slate-900 tabular-nums">{formatPrice(amount as number)}</span>
                          </div>
                          <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${stats.totalRevenue > 0 ? ((amount as number) / stats.totalRevenue) * 100 : 0}%` }}
                              className="h-full bg-purple-500" 
                            />
                          </div>
                        </div>
                      ))}
                    {Object.keys(categoryStats).length === 0 && (
                      <p className="text-[10px] font-black uppercase text-center py-8 text-slate-300 tracking-widest">Sin datos de categorías</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PEDIDOS RECIENTES - DESPLEGABLE */}
      <Card className="rounded-[3rem] border-slate-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => setIsRecentOrdersOpen(!isRecentOrdersOpen)}
          className="w-full text-left bg-slate-50/50 hover:bg-slate-50 transition-colors"
        >
          <CardHeader className="flex flex-row items-center justify-between py-4 sm:py-6 px-4 sm:px-10">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#4A7C59]">
                 <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-900 truncate">Pedidos Recientes</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs font-bold text-slate-400 italic leading-none mt-1 truncate">
                  Últimas 5 operaciones
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
               <Badge variant="secondary" className="bg-[#4A7C59]/10 text-[#4A7C59] border-none font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-tighter text-[9px] sm:text-[10px]">{orders.length}</Badge>
               <motion.div
                 animate={{ rotate: isRecentOrdersOpen ? 90 : 0 }}
                 className="p-1 sm:p-2 rounded-full bg-white shadow-sm"
               >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
               </motion.div>
            </div>
          </CardHeader>
        </button>

        <AnimatePresence>
          {isRecentOrdersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <CardContent className="p-4 sm:p-10">
                <div className="space-y-4 sm:space-y-6">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] bg-slate-50/80 border border-slate-100 group hover:shadow-xl hover:shadow-[#4A7C59]/5 transition-all duration-500">
                      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                         <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#4A7C59] transition-colors flex-shrink-0">
                            <span className="text-[8px] sm:text-[10px] font-black font-mono">#{order.id.slice(-4)}</span>
                         </div>
                        <div className="min-w-0">
                          <p className="text-[12px] sm:text-[14px] font-black text-slate-800 uppercase tracking-tight truncate">{order.customerName}</p>
                          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                             <Badge variant="outline" className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#4A7C59] border-[#4A7C59]/20 rounded-lg whitespace-nowrap">{order.items.length} ART.</Badge>
                             <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">•</span>
                             <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{order.paymentMethod || 'WEB'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 pr-1">
                        <Badge className={`font-black uppercase tracking-widest text-[8px] sm:text-[9px] px-2 sm:px-3 py-1 rounded-full border-none shadow-md ${
                          order.status === 'pending' ? 'bg-amber-500 shadow-amber-500/10' : 
                          order.status === 'paid' ? 'bg-emerald-500 shadow-emerald-500/10' : 
                          order.status === 'shipped' ? 'bg-blue-500 shadow-blue-500/10' : 
                          order.status === 'delivered' ? 'bg-slate-900 shadow-slate-900/10' : 'bg-red-500 shadow-red-500/10'
                        }`}>
                          {order.status === 'pending' ? 'Pendiente' : 
                           order.status === 'paid' ? 'Pagado' : 
                           order.status === 'shipped' ? 'Enviado' : 
                           order.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                        </Badge>
                        <div className="flex flex-col items-end justify-center">
                           <p className="text-[14px] sm:text-[16px] font-black text-slate-900 tabular-nums leading-none tracking-tighter">
                             {formatPrice(order.total)}
                           </p>
                           <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">
                             {formatDate(order.createdAt)}
                           </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                       <ShoppingCart className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">No hay pedidos disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
