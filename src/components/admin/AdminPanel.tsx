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
  Monitor
} from 'lucide-react'
import { useState } from 'react'
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
import { PromosTab } from './pujalte/PromosTab'
import LandingPacksTab from './pujalte/PacksTab'
import LandingProductsTab from './pujalte/ProductsTab'
import LandingCategoriesTab from './pujalte/CategoriesTab'

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
  onSaveProduct: (data: any) => Promise<boolean>
  onToggleActive: (product: Product) => void
  onDeleteProduct: (id: string) => void
  onReorderProducts: (products: Product[]) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onUpdateProductField: (id: string, field: string, value: any) => void
  onUpdateStatus: (id: string, status: string) => void
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
    onLogout, onViewStore
  } = props

  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLandingExpanded, setIsLandingExpanded] = useState(false)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: LayoutGrid },
    { id: 'categories', label: 'Categorías', icon: Layers },
    { id: 'promos', label: 'Banners', icon: Sparkles },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'export', label: 'Exportar', icon: Download },
  ]

  const landingItems = [
    { id: 'l-products', label: 'L. Cromos', icon: Grid },
    { id: 'l-packs', label: 'L. Paquetes', icon: Package },
    { id: 'l-categories', label: 'L. Categorías', icon: LayoutGrid },
    { id: 'l-config', label: 'L. General', icon: Type },
  ]

  const bottomItems = [
    { id: 'upload', label: 'Importar', icon: Upload },
    { id: 'checkout', label: 'Formulario', icon: ClipboardList },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ]

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-10 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Sidebar / Mobile Nav - Premium Design */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="mb-6 lg:mb-10 px-2 group">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 group-hover:text-[#4A7C59] transition-colors duration-500">
              Panel Control
            </h1>
            <div className="flex items-center gap-2 mt-1 sm:mt-2">
              <div className="h-1 w-8 sm:h-1.5 sm:w-10 rounded-full bg-[#4A7C59]" />
              <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#4A7C59]">
                GESTIÓN ADMINISTRATIVA
              </p>
            </div>
            {onViewStore && (
              <button 
                onClick={onViewStore}
                className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#4A7C59] transition-all group/back px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5 transform group-hover/back:-translate-x-1 transition-transform" />
                Volver a la Tienda
              </button>
            )}
          </div>

          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 gap-1 sm:gap-2 px-1 scrollbar-hide -mx-2 sm:mx-0">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(item.id)}
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

            <div className="h-px bg-slate-100 my-2 mx-4 hidden lg:block" />

            {/* SECCIÓN LANDING DESPLEGABLE */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsLandingExpanded(!isLandingExpanded)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-[1.25rem] text-xs font-black transition-all lg:w-full group/landing-btn ${
                landingItems.some(i => i.id === activeTab)
                ? 'bg-[#4A7C59]/5 text-[#4A7C59]'
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${landingItems.some(i => i.id === activeTab) ? 'bg-[#4A7C59] text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Monitor className="h-4 w-4" />
              </div>
              <span className="tracking-widest uppercase">Landing</span>
              <motion.div
                animate={{ rotate: isLandingExpanded ? 180 : 0 }}
                className="ml-auto"
              >
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
                      onClick={() => setActiveTab(item.id)}
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
                onClick={() => setActiveTab(item.id)}
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
                className="justify-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl text-slate-400 hover:text-[#4A7C59] hover:bg-[#4A7C59]/5 transition-all h-9 sm:h-12 px-3 sm:px-5 font-black border border-transparent hover:border-[#4A7C59]/10 whitespace-nowrap"
                onClick={onViewStore}
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 group-hover:bg-[#4A7C59]/10 transition-colors">
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
          <div className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-100 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] p-2 sm:p-4 min-h-[500px] sm:min-h-[600px] animate-in fade-in slide-in-from-right-2 duration-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4A7C59]/[0.02] rounded-full -mr-32 -mt-32 pointer-events-none" />
            <div className="relative z-10 h-full">
              {activeTab === 'dashboard' && (
                <DashboardTab
                  stats={stats}
                  orders={orders}
                  categories={categories}
                  products={products}
                  formatPrice={formatPrice}
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
                  addVariant={props.addVariant}
                  updateVariant={props.updateVariant}
                  removeVariant={props.removeVariant}
                  resetProductForm={props.resetProductForm}
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
                  orders={orders}
                  formatPrice={formatPrice}
                  onUpdateStatus={onUpdateStatus}
                  onDeleteOrder={onDeleteOrder}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersTab
                  orders={orders}
                  formatPrice={formatPrice}
                />
              )}

              {activeTab === 'export' && (
                <ExportTab
                  orders={orders}
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

              {/* TABS DE LA LANDING INTEGRADAS CON LA BASE DE DATOS ÚNICA */}
              {activeTab === 'l-products' && (
                <LandingProductsTab
                  products={products}
                  categories={categories.map(c => c.name)}
                  onUpdateProductField={props.onUpdateProductField}
                  onDeleteProduct={props.onDeleteProduct}
                  onAddProduct={props.onAddProduct}
                  onEditProduct={props.onEditProduct}
                  onSaveProduct={props.onSaveProduct}
                  handleFileUpload={props.onFileUpload as any}
                />
              )}

              {activeTab === 'l-packs' && (
                <LandingPacksTab
                  products={products.filter(p => (p.categoryId === 'PAQUETES' || p.categoryId === 'social'))}
                  categories={categories.map(c => c.name)}
                  onUpdateProductField={props.onUpdateProductField}
                  onDeleteProduct={props.onDeleteProduct}
                  onAddProduct={props.onAddProduct}
                  onEditProduct={props.onEditProduct}
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
    </div>
  )
}
