'use client'

import {
  Calendar,
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
  Sparkles
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
import { Product, Category, Order, StoreConfig } from '@/types'
import { Button } from '@/components/ui/button'
import { PacksTab } from './PacksTab'
import { PromosTab } from './pujalte/PromosTab'

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
  onSaveProduct: () => void
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: LayoutGrid },
    { id: 'categories', label: 'Categorías', icon: Layers },
    { id: 'promos', label: 'Banners', icon: Sparkles },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'upload', label: 'Importar', icon: Upload },
    { id: 'checkout', label: 'Formulario', icon: ClipboardList },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ]

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar / Mobile Nav - Premium Design */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="mb-10 px-2 group">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-[#4A7C59] transition-colors duration-500">
              Panel Control
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 w-10 rounded-full bg-[#4A7C59]" />
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4A7C59]">
                GESTIÓN ADMINISTRATIVA
              </p>
            </div>
          </div>

          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 gap-2 px-1">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-sm font-bold transition-all whitespace-nowrap min-w-fit lg:w-full relative overflow-hidden group/btn ${
                  activeTab === item.id
                  ? 'bg-white text-[#4A7C59] shadow-[0_10px_30px_-5px_rgba(74,124,89,0.2)] border border-[#4A7C59]/10'
                  : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#4A7C59] rounded-r-full"
                  />
                )}

                <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-[#4A7C59] text-white rotate-6' : 'bg-slate-100 text-slate-400 group-hover/btn:bg-slate-200 group-hover/btn:text-slate-600'}`}>
                  <item.icon className="h-4.5 w-4.5" />
                </div>

                <span className="tracking-tight">{item.label}</span>

                {activeTab === item.id && (
                  <ChevronRight className="h-4 w-4 ml-auto hidden lg:block text-[#4A7C59]/40" />
                )}
              </motion.button>
            ))}
          </div>

          <div className="mt-10 pt-8 flex flex-col gap-3 border-t border-slate-100 hidden lg:flex px-2">
            {onViewStore && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 rounded-2xl text-slate-500 hover:text-[#4A7C59] hover:bg-[#4A7C59]/5 transition-all h-12 px-5 font-bold border border-transparent hover:border-[#4A7C59]/10"
                onClick={onViewStore}
              >
                <div className="p-2 rounded-lg bg-slate-50">
                  <ExternalLink className="h-4 w-4" />
                </div>
                <span className="text-xs uppercase tracking-widest">Ir a la tienda</span>
              </Button>
            )}

            <div className="mt-8 pt-4 flex flex-col items-center gap-4 opacity-60">
               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">powered by pujalte creative studio</span>
            </div>
            {onLogout && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all h-12 px-5 font-bold border border-transparent hover:border-red-100"
                onClick={onLogout}
              >
                <div className="p-2 rounded-lg bg-red-50/50">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="text-xs uppercase tracking-widest">Cerrar Panel</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] p-2 md:p-3 min-h-[600px] animate-in fade-in slide-in-from-right-2 duration-400 relative overflow-hidden">
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

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
