'use client'

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Eye,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Layers,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Settings,
  ShoppingCart,
  Trash2,
  Upload,
  User,
  Users,
  Sparkles,
  Grid,
  Type,
  ChevronDown,
  Monitor,
  Truck,
  Camera,
  Music,
  Moon,
  Sun
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardTab } from './DashboardTab'
import { ProductsTab } from './ProductsTab'
import { OrdersTab } from './OrdersTab'
import { ImportTab } from './ImportTab'
import { ConfigTab } from './ConfigTab'
import { CheckoutTab } from './CheckoutTab'
import { CategoriesTab } from './CategoriesTab'
import { CustomersTab } from './CustomersTab'
import { ExportTab } from './ExportTab'
import { Product, Category, Order, StoreConfig } from '@/types'
import { Button } from '@/components/ui/button'
import { PacksTab } from './PacksTab'
import { PromosTab } from './PromosTab'
import { db, COLLECTIONS } from '@/lib/firebase'
import { collection, query, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { useMemo } from 'react'
import LandingPacksTab from './LandingPacksTab'
import LandingProductsTab from './LandingProductsTab'
import LandingCategoriesTab from './LandingCategoriesTab'
import { SuppliersTab } from './SuppliersTab'
import { GalleriesTab } from './GalleriesTab'
import { MusicTab } from './MusicTab'

interface AdminPanelProps {
  stats: {
    totalSales: number
    totalOrders: number
    totalRevenue: number
  }
  orders: Order[]
  categories: Category[]
  products: Product[]
  config: StoreConfig
  showImages: boolean
  setShowImages: (show: boolean) => void
  isProductDialogOpen: boolean
  setIsProductDialogOpen: (open: boolean) => void
  productForm: any
  setProductForm: (form: any) => void
  editingProduct: Product | null
  uploading: boolean
  formatPrice: (price: number) => string
  isSaving: boolean
  onSaveProduct: (data?: any) => void
  onToggleActive: (product: Product) => void
  onDeleteProduct: (id: string) => void
  onReorderProducts: (products: Product[]) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onUpdateProductField: (id: string, field: string, value: any) => void
  onUpdateStatus: (id: string, status: string) => void
  onUpdateOrder: (order: Order) => void
  onDeleteOrder: (id: string) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDownloadTemplate: () => void
  onSaveConfig: (newConfig?: StoreConfig) => void
  onUpdateConfig: (config: StoreConfig) => void
  onRefreshCategories: () => void
  addVariant: () => void
  updateVariant: (index: number, field: string, value: any) => void
  removeVariant: (index: number) => void
  resetProductForm: () => void
  onLogout?: () => void
  onViewStore?: () => void
}

export function AdminPanel(props: AdminPanelProps) {
  const {
    stats, orders, categories, products, config, showImages, setShowImages,
    formatPrice, onUpdateStatus, onDeleteOrder, uploading, onFileUpload,
    onDownloadTemplate, onSaveConfig, onUpdateConfig, onRefreshCategories,
    onLogout, onViewStore, isSaving
  } = props

  const [activeTab, setActiveTab] = useState('galleries')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLandingExpanded, setIsLandingExpanded] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [firebaseClients, setFirebaseClients] = useState<Record<string, any>>({})
  const [customerIdToEdit, setCustomerIdToEdit] = useState<string | null>(null)
  const [returnTab, setReturnTab] = useState<string | null>(null)

  const navigateWithFilter = (tab: string, filter: string = 'all') => {
    setActiveTab(tab)
    setActiveFilter(filter)
  }

  useEffect(() => {
    const savedMode = localStorage.getItem('pujalte_admin_dark_mode') === 'true'
    setIsDarkMode(savedMode)
    
    // Cargar proveedores
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSuppliers(data)
        else setSuppliers([])
      })
      .catch(err => {
        console.error(err)
        setSuppliers([])
      })

    // Cargar clientes de Firebase para resolver nombres "DESCONOCIDO"
    loadFirebaseClients()
  }, [])
  
  const loadFirebaseClients = async () => {
    try {
      const q = collection(db, COLLECTIONS.CLIENTS)
      const snap = await getDocs(q)
      const map: Record<string, any> = {}
      snap.forEach(d => { map[d.id] = d.data() })
      setFirebaseClients(map)
    } catch (e) {
      console.error('Error cargando clientes en AdminPanel:', e)
    }
  }

  const handleDismissAlert = async (type: string) => {
    try {
      const batch = writeBatch(db);
      const clients = Object.entries(firebaseClients);
      let count = 0;

      clients.forEach(([id, data]) => {
        const clientRef = doc(db, COLLECTIONS.CLIENTS, id);
        if (type === 'selections') {
          if (data.gallerySettings?.selectionConfirmed && !data.gallerySettings?.selectionReviewed) {
            batch.update(clientRef, { 'gallerySettings.selectionReviewed': true });
            count++;
          }
        } else if (type === 'empty') {
          if ((data.gallerySettings?.photos?.length || 0) === 0 && !data.gallerySettings?.hideEmptyAlert) {
            batch.update(clientRef, { 'gallerySettings.hideEmptyAlert': true });
            count++;
          }
        }
      });

      if (count > 0) {
        await batch.commit();
        await loadFirebaseClients();
      }
    } catch (e) {
      console.error('Error descartando alertas:', e);
    }
  }

  const toggleDarkMode = () => {
    const newVal = !isDarkMode
    setIsDarkMode(newVal)
    localStorage.setItem('pujalte_admin_dark_mode', String(newVal))
  }

  // Enriquecer pedidos con nombres reales si son descriptores genéricos o si faltan datos
  const enrichedOrders = useMemo(() => {
    return orders.map(order => {
      // Si el nombre es un DNI o genérico, intentamos buscar el nombre real en los clientes de Firebase
      const nameIsGeneric = !order.customerName || 
                            order.customerName === 'DESCONOCIDO' || 
                            order.customerName === 'Cliente sin nombre' || 
                            order.customerName.startsWith('Cliente DNI:');
      
      if (!nameIsGeneric) return order

      const fields = (order.customFields || {}) as any
      const dni = (fields.dni || '').trim().toUpperCase()
      const email = (order.customerEmail || '').toLowerCase().trim()
      const phone = (order.customerPhone || '').trim()
      
      // Intentar encontrar al cliente por DNI, Email o Teléfono
      let match: any = null;
      
      // 1. Intentar por clave directa (ID documento)
      match = firebaseClients[dni] || firebaseClients[email] || firebaseClients[phone];
      
      // 2. Si no hay match directo, buscamos en los valores
      if (!match) {
        match = Object.values(firebaseClients).find((c: any) => {
          const cDni = (c.dni || '').trim().toUpperCase();
          const cEmail = (c.email || '').toLowerCase().trim();
          const cPhone = (c.phone || '').trim();
          return (dni && cDni === dni) || (email && cEmail === email) || (phone && cPhone === phone);
        });
      }

      if (match && match.name) {
        return { ...order, customerName: match.name }
      }
      
      // Si no hay match pero el nombre empieza por "Cliente DNI:", limpiamos el prefijo para que sea más legible
      if (order.customerName?.startsWith('Cliente DNI:')) {
        const pureId = order.customerName.replace('Cliente DNI: ', '');
        // Si el pureId parece una galería (ej: CP-25-01), lo dejamos claro
        if (pureId.includes('-')) {
          return { ...order, customerName: `Galería: ${pureId}` };
        }
      }

      return order
    })
  }, [orders, firebaseClients])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'galleries', label: 'Galerías', icon: Camera },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Productos', icon: LayoutGrid },
    { id: 'categories', label: 'Categorías', icon: Layers },
    { id: 'promos', label: 'Banners', icon: Sparkles },
    { id: 'music', label: 'Música', icon: Music },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'export', label: 'Exportar', icon: Download },
  ]

  const landingItems = [
    { id: 'l-products', label: 'L. Cromos', icon: Grid },
    { id: 'l-packs', label: 'L. Paquetes', icon: Package },
    { id: 'l-categories', label: 'L. Categorías', icon: LayoutGrid },
    { id: 'l-config', label: 'L. General', icon: Type },
  ]

  const alertsCount = useMemo(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const clients = Object.values(firebaseClients || {})
    const confirmedSelections = clients.filter(c => c.gallerySettings?.selectionConfirmed && c.gallerySettings?.lastSelection?.length > 0 && !c.gallerySettings?.selectionReviewed).length
    const emptyGalleries = clients.filter(c => (c.gallerySettings?.photos?.length || 0) === 0 && !c.gallerySettings?.hideEmptyAlert).length
    return pendingOrders + confirmedSelections + emptyGalleries
  }, [orders, firebaseClients])

  const bottomItems = [
    { id: 'upload', label: 'Importar', icon: Upload },
    { id: 'checkout', label: 'Formulario', icon: ClipboardList },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ]

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 overflow-x-hidden",
      isDarkMode ? "dark bg-[#020617]" : "bg-slate-50"
    )}>
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-10 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-10">
        {/* Sidebar / Mobile Nav - Premium Design */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="mb-4 lg:mb-10 px-2 group flex lg:flex-col items-start justify-between lg:justify-start gap-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 group-hover:text-[#4A7C59] transition-colors duration-500 dark:text-white">
                  Panel Control
                </h1>
                <button 
                  onClick={toggleDarkMode}
                  className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#4A7C59] transition-all dark:bg-slate-900 dark:border-slate-800"
                >
                  {isDarkMode ? <Sun className="h-4 w-4 text-amber-400 fill-amber-400" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 w-6 sm:h-1.5 sm:w-10 rounded-full bg-[#4A7C59]" />
                <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-widest text-[#4A7C59]">
                  ADMINISTRACIÓN
                </p>
              </div>
            </div>
            
            {onViewStore && (
              <button 
                onClick={onViewStore}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#4A7C59] hover:opacity-80 transition-all group/back sm:mt-4"
              >
                <ChevronLeft className="h-3 w-3 transform group-hover/back:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Volver a la Tienda</span>
                <span className="sm:hidden">Tienda</span>
              </button>
            )}
          </div>

          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 gap-1 sm:gap-2 px-1 scrollbar-hide -mx-2 sm:mx-0 border-b lg:border-none border-slate-100 mb-2 lg:mb-0">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab(item.id)
                  if (item.id === 'customers') setReturnTab(null)
                }}
                className={`flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-3.5 rounded-lg lg:rounded-[1.25rem] text-[9px] lg:text-xs font-black transition-all whitespace-nowrap min-w-fit lg:w-full relative overflow-hidden group/btn ${
                  activeTab === item.id
                  ? 'bg-white lg:bg-white text-[#4A7C59] shadow-sm lg:shadow-[0_10px_25px_-5px_rgba(74,124,89,0.15)] border border-[#4A7C59]/10'
                  : 'bg-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                <div className={`p-1 lg:p-2 rounded-md lg:rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-[#4A7C59] text-white rotate-3' : 'bg-slate-50 text-slate-400 group-hover/btn:bg-slate-100'}`}>
                  <item.icon className="h-3 w-3 lg:h-4 lg:h-4" />
                </div>
                <span className="uppercase tracking-tight">{item.label}</span>
                {item.id === 'dashboard' && alertsCount > 0 && (
                  <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[10px] font-black text-white ml-2 animate-pulse shadow-lg shadow-red-500/20">
                    {alertsCount}
                  </span>
                )}
                {activeTab === item.id && (
                  <ChevronRight className="h-4 w-4 ml-auto hidden lg:block text-[#4A7C59]/40" />
                )}
              </motion.button>
            ))}

            <div className="h-px bg-slate-100 my-2 mx-4 hidden lg:block" />

            {/* SECCIÓN LANDING DESPLEGABLE */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsLandingExpanded(!isLandingExpanded)}
              className={`flex lg:hidden items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black transition-all group/landing-btn ${
                landingItems.some(i => i.id === activeTab)
                ? 'bg-[#4A7C59]/5 text-[#4A7C59]'
                : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <div className={`p-1 rounded-md transition-all duration-300 ${landingItems.some(i => i.id === activeTab) ? 'bg-[#4A7C59] text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Monitor className="h-3 w-3" />
              </div>
              <span className="uppercase">Land. {isLandingExpanded ? '▲' : '▼'}</span>
            </motion.button>

            {/* Versión Desktop de Landing */}
            <motion.button
              onClick={() => setIsLandingExpanded(!isLandingExpanded)}
              className={`hidden lg:flex items-center gap-3 px-5 py-3.5 rounded-[1.25rem] text-xs font-black transition-all lg:w-full group/landing-btn ${
                landingItems.some(i => i.id === activeTab)
                ? 'bg-[#4A7C59]/5 text-[#4A7C59]'
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${landingItems.some(i => i.id === activeTab) ? 'bg-[#4A7C59] text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Monitor className="h-4 w-4" />
              </div>
              <span className="tracking-widest uppercase">Landing</span>
              <motion.div animate={{ rotate: isLandingExpanded ? 180 : 0 }} className="ml-auto">
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isLandingExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex lg:flex-col gap-1 sm:gap-1.5 lg:pl-4"
                >
                  {landingItems.map((item) => (
                    <motion.button
                      key={item.id}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      onClick={() => navigateWithFilter(item.id, 'all')}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black tracking-tight transition-all lg:w-full whitespace-nowrap min-w-fit ${
                        activeTab === item.id
                        ? 'bg-white text-[#4A7C59] shadow-sm border border-[#4A7C59]/10'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${activeTab === item.id ? 'bg-[#4A7C59] text-white' : 'bg-slate-50 text-slate-300'}`}>
                        <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </div>
                      <span className="uppercase">{item.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-px bg-slate-100 my-2 mx-4 hidden lg:block" />

            {bottomItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateWithFilter(item.id, 'all')}
                className={`flex items-center gap-2.5 sm:gap-4 px-3.5 sm:px-5 py-2 sm:py-3.5 rounded-xl sm:rounded-[1.25rem] text-[10px] sm:text-xs font-black transition-all whitespace-nowrap min-w-fit lg:w-full relative overflow-hidden group/btn ${
                  activeTab === item.id
                  ? 'bg-white text-[#4A7C59] shadow-[0_10px_25px_-5px_rgba(74,124,89,0.15)] border border-[#4A7C59]/10'
                  : 'bg-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 lg:w-1.5 bg-[#4A7C59] rounded-r-full hidden sm:block"
                  />
                )}

                <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-[#4A7C59] text-white rotate-3 sm:rotate-6' : 'bg-slate-100 text-slate-400 group-hover/btn:bg-slate-200 group-hover/btn:text-slate-600'}`}>
                  <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>

                <span className="tracking-tight uppercase">{item.label}</span>

                {activeTab === item.id && (
                  <ChevronRight className="h-4 w-4 ml-auto hidden lg:block text-[#4A7C59]/40" />
                )}
              </motion.button>
            ))}
          </div>

          <div className="mt-4 lg:mt-10 pt-4 lg:pt-8 flex lg:flex-col gap-2 sm:gap-3 border-t border-slate-100 px-2 overflow-x-auto lg:overflow-visible scrollbar-hide">
            {onViewStore && (
              <Button
                variant="ghost"
                className="justify-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl text-[#4A7C59] hover:bg-[#4A7C59]/5 transition-all h-9 sm:h-12 px-3 sm:px-5 font-black border border-transparent hover:border-[#4A7C59]/10 whitespace-nowrap"
                onClick={onViewStore}
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-[#4A7C59]/10 group-hover:bg-[#4A7C59]/20 transition-colors">
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <span className="text-[9px] sm:text-xs uppercase tracking-widest">Tienda</span>
              </Button>
            )}
 
            {onLogout && (
              <Button
                variant="ghost"
                className="justify-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-all h-9 sm:h-12 px-3 sm:px-5 font-black border border-transparent hover:border-red-100 whitespace-nowrap"
                onClick={onLogout}
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-red-50/30">
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <span className="text-[9px] sm:text-xs uppercase tracking-widest text-red-400">Salir</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-100 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] p-2 sm:p-4 min-h-[500px] sm:min-h-[600px] animate-in fade-in slide-in-from-right-2 duration-400 relative overflow-visible">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4A7C59]/[0.02] rounded-full -mr-32 -mt-32 pointer-events-none" />
            <div className="relative z-10 h-full">
              {activeTab === 'dashboard' && (
                <DashboardTab
                  stats={stats}
                  orders={enrichedOrders}
                  categories={categories}
                  products={products}
                  formatPrice={formatPrice}
                  firebaseClients={firebaseClients}
                  setActiveTab={navigateWithFilter}
                  onDismissAlert={handleDismissAlert}
                />
              )}

              {activeTab === 'products' && (
                <ProductsTab
                  products={products}
                  categories={categories}
                  showImages={showImages}
                  setShowImages={setShowImages}
                  isProductDialogOpen={props.isProductDialogOpen}
                  setIsProductDialogOpen={props.setIsProductDialogOpen}
                  productForm={props.productForm}
                  setProductForm={props.setProductForm}
                  editingProduct={props.editingProduct}
                  formatPrice={formatPrice}
                  onSaveProduct={props.onSaveProduct}
                  onToggleActive={props.onToggleActive}
                  onDeleteProduct={props.onDeleteProduct}
                  onReorderProducts={props.onReorderProducts}
                  onAddProduct={props.onAddProduct}
                  onEditProduct={props.onEditProduct}
                  onUpdateProductField={props.onUpdateProductField}
                  isSaving={isSaving}
                  addVariant={props.addVariant}
                  updateVariant={props.updateVariant}
                  removeVariant={props.removeVariant}
                  resetProductForm={props.resetProductForm}
                  suppliers={suppliers}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesTab
                  categories={categories}
                  products={products}
                  onRefresh={onRefreshCategories}
                />
              )}



              {activeTab === 'orders' && (
                <OrdersTab
                  orders={enrichedOrders}
                  formatPrice={formatPrice}
                  onUpdateStatus={onUpdateStatus}
                  onUpdateOrder={props.onUpdateOrder}
                  onDeleteOrder={onDeleteOrder}
                  initialFilter={activeTab === 'orders' ? activeFilter : 'all'}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersTab
                  orders={enrichedOrders}
                  formatPrice={formatPrice}
                  customerIdToEdit={customerIdToEdit}
                  config={config}
                  initialFilter={activeTab === 'customers' ? activeFilter : 'all'}
                  onClose={() => {
                    setCustomerIdToEdit(null)
                    if (returnTab) {
                      setActiveTab(returnTab)
                      setReturnTab(null)
                    }
                  }}
                />
              )}

              {activeTab === 'suppliers' && (
                <SuppliersTab />
              )}

              {activeTab === 'galleries' && (
                <GalleriesTab 
                  onEditCustomerGallery={(customer) => {
                    const key = (customer.dni || customer.email || customer.phone).trim().toUpperCase()
                    setCustomerIdToEdit(key)
                    setReturnTab('galleries')
                    setActiveTab('customers')
                  }} 
                  onAddCustomer={() => {
                    setCustomerIdToEdit('NEW') // Usamos un trigger para que CustomersTab sepa que queremos añadir uno nuevo
                    setReturnTab('galleries')
                    setActiveTab('customers')
                  }}
                  config={config}
                  onUpdateConfig={onUpdateConfig}
                  onSaveConfig={onSaveConfig}
                  initialFilter={activeTab === 'galleries' ? activeFilter : 'all'}
                />
              )}

              {activeTab === 'music' && (
                <MusicTab />
              )}

              {activeTab === 'export' && (
                <ExportTab
                  orders={enrichedOrders}
                  products={products}
                />
              )}

              {activeTab === 'upload' && (
                <ImportTab 
                  uploading={uploading} 
                  onFileUpload={onFileUpload} 
                  onDownloadTemplate={onDownloadTemplate} 
                />
              )}

              {activeTab === 'checkout' && (
                <CheckoutTab
                  config={config}
                  onUpdateConfig={onUpdateConfig}
                  onSave={onSaveConfig}
                />
              )}

              {activeTab === 'config' && (
                <ConfigTab 
                  config={config} 
                  onUpdateConfig={onUpdateConfig} 
                  onSave={onSaveConfig} 
                />
              )}

              {activeTab === 'promos' && (
                <PromosTab 
                  config={config as any} 
                  onUpdateConfig={(newConfig) => onUpdateConfig(newConfig as any)} 
                  onSave={(cfg) => onSaveConfig(cfg as any)} 
                />
              )}

              {/* TABS DE LA LANDING INTEGRADAS */}
              {activeTab === 'l-products' && (
                <LandingProductsTab
                  config={config as any}
                  setConfig={(newCfg: any) => {
                    if (typeof newCfg === 'function') {
                      const updated = newCfg(config);
                      onUpdateConfig(updated);
                    } else {
                      onUpdateConfig(newCfg);
                    }
                  }}
                  categories={config.categorias || []}
                  handleFileUpload={props.onFileUpload as any}
                  injectPreset={() => {}}
                  handleImportCSV={() => {}}
                  presets={{}}
                />
              )}

              {activeTab === 'l-packs' && (
                <LandingPacksTab
                  products={config.galeria || []}
                  categories={config.categorias || []}
                  onUpdate={(newItems: any) => onUpdateConfig({ ...config, galeria: newItems })}
                />
              )}

              {activeTab === 'l-categories' && (
                <LandingCategoriesTab
                  categories={config.categorias || []}
                  products={config.galeria || []}
                  onUpdate={(newCats: any) => onUpdateConfig({ ...config, categorias: newCats })}
                />
              )}

              {activeTab === 'l-config' && (
                <div className="p-8">
                   <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                     <h3 className="text-amber-900 font-bold mb-2">Editor General de Landing</h3>
                     <p className="text-amber-800 text-sm">Usa la sección "Ajustes" para datos compartidos o pide al asistente cambios específicos para el catálogo dinámico.</p>
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .dark .bg-white { background-color: #0f172a !important; }
        .dark .bg-slate-50 { background-color: #1e293b !important; }
        .dark .text-slate-900, .dark .text-slate-800, .dark .text-slate-700 { color: #f8fafc !important; }
        .dark .text-slate-500, .dark .text-slate-400 { color: #94a3b8 !important; }
        .dark .border-slate-100, .dark .border-slate-200, .dark .border-slate-50 { border-color: #1e293b !important; }
        .dark .shadow-sm { shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5); }
        .dark input, .dark textarea { background-color: #1e293b !important; color: white !important; border-color: #334155 !important; }
        .dark .bg-slate-100 { background-color: #1e293b !important; }
        .dark .hover\\:bg-slate-50:hover { background-color: #1e293b !important; }
        .dark .bg-white\\/40, .dark .bg-white\\/80, .dark .bg-white\\/50 { background-color: rgba(15, 23, 42, 0.8) !important; }
        .dark .text-slate-400 { color: #64748b !important; }
        .dark .text-slate-600 { color: #cbd5e1 !important; }
      `}</style>
    </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
