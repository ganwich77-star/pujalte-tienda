'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import SplashScreen from '@/components/SplashScreen'
import landingData from '@/data/landing-config.json'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag,
  Plus,
  LayoutGrid,
  List,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Star,
  Image as ImageIcon,
  Camera,
  Heart,
  Users,
  Briefcase,
  Baby,
  MapPin,
  Instagram,
  Quote,
  Send,
  ArrowRight,
  Package,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Product, Category, Order, StoreConfig, ProductVariant } from '@/types'
import { useCartStore, type CartItem } from '@/store/cart'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { ShopHeader } from '@/components/shop/ShopHeader'
import { SizeGuide } from '@/components/shop/SizeGuide'
import { CategoryBar } from '@/components/shop/CategoryBar'
import { ProductCard } from '@/components/shop/ProductCard'
import { ProductListItem } from '@/components/shop/ProductListItem'
import { LegalDialogs } from '@/components/shop/LegalDialogs'
import { cn, fixPath } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// Default config merging landing data and shop defaults
const defaultConfig: StoreConfig = {
  ...landingData,
  whatsappNumber: landingData.whatsapp || '34650494728',
  storeName: landingData.nombre || 'Pujalte Fotografía',
  showImages: true,
  currency: 'EUR',
  phone: landingData.telefono || '650494728',
  email: landingData.email || 'hola@pujaltefotografia.es',
  slogan: landingData.slogan || '',
  subtitulo: landingData.subtitulo || 'Más que fotografía, tus mejores recuerdos',
  enableCash: true,
  enableBizum: true,
  enableCard: true,
  formFields: [
    { id: 'name', label: 'Nombre completo', placeholder: 'Tu nombre', type: 'text', required: true, active: true },
    { id: 'phone', label: 'Teléfono / WhatsApp', placeholder: '+34 600 000 000', type: 'tel', required: true, active: true },
    { id: 'email', label: 'Email', placeholder: 'tu@email.com', type: 'email', required: false, active: true },
    { id: 'address', label: 'Dirección de envío', placeholder: 'Calle, número, ciudad...', type: 'text', required: false, active: true },
    { id: 'notes', label: 'Notas adicionales', placeholder: 'Instrucciones especiales...', type: 'textarea', required: false, active: true }
  ]
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [view, setView] = useState<'landing' | 'shop'>('landing')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  
  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  // Cart state
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  // Admin state
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalRevenue: 0 })
  const [config, setConfig] = useState<StoreConfig>(defaultConfig)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    image: '',
    imagePosition: 'center',
    hasVariants: false,
    variantType: '',
    variants: [] as { id?: string; name: string; price: string; stock: string; sortOrder: number }[]
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [itemWithNote, setItemWithNote] = useState<CartItem | null>(null)
  const [tempNote, setTempNote] = useState('')
  const { addItem, getItemCount } = useCartStore()

  // Landing specific logic
  const [activeLandingCategory, setActiveLandingCategory] = useState('todos')
  
  const landingCategories = useMemo<string[]>(() => {
    if (!config) return ['todos']
    const configCats = config.categorias || []
    return ['todos', ...configCats]
  }, [config])

  const filteredGallery = useMemo(() => {
    if (!config || !config.galeria) return []
    if (activeLandingCategory === 'todos') return config.galeria
    return config.galeria.filter((img: any) => img.categoria === activeLandingCategory)
  }, [activeLandingCategory, config])

  const iconMap: Record<string, any> = {
    heart: Heart,
    briefcase: Briefcase,
    baby: Baby,
    package: Package,
  }

  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)


  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const message = `¡Hola! Soy ${formData.name}.

${formData.message}

Mi email: ${formData.email}`
    
    window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
    setIsSubmitting(false)
    setFormData({ name: '', email: '', message: '' })
  }


  // Fetch functions
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Error al cargar productos')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudieron cargar los productos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProducts = async () => {
    try {
      const res = await fetch('/api/products?all=true')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) { console.error(error) }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (error) { console.error(error) }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) { console.error(error) }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        if (orders.length > 0) {
          const totalSales = orders.length
          const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
          setStats({ totalSales, totalOrders: totalSales, totalRevenue })
        }
      }
    } catch (error) { console.error(error) }
  }

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setConfig(data)
        }
      }
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    async function init() {
      // Cargamos configuración, productos y categorías en paralelo para evitar bloqueos
      Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchConfig()
      ])
    }
    init()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchAllProducts()
      fetchCategories()
      fetchOrders()
      fetchStats()
    }
  }, [isAdmin])

  useEffect(() => {
    if (orders.length > 0 && stats.totalOrders === 0) {
      fetchStats()
    }
  }, [orders])

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: variant ? (Number(product.price) + Number(variant.price)) : product.price,
      quantity: 1,
      image: product.image,
      variantId: variant?.id,
      variantName: variant?.name,
      productId: product.id
    }
    setItemWithNote(cartItem)
    setTempNote('')
  }

  const confirmAddToCart = () => {
    if (itemWithNote) {
      addItem({ ...itemWithNote, notes: tempNote })
      toast({ 
        title: '¡Añadido al carrito!', 
        description: `${itemWithNote.name} ${itemWithNote.variantName ? `— ${itemWithNote.variantName}` : ''}${tempNote ? ' (con nota)' : ''}`,
        className: "bg-primary text-primary-foreground border-none font-bold rounded-xl shadow-lg",
      })
      setItemWithNote(null)
      setTempNote('')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: config.currency
    }).format(price || 0)
  }

  // Admin Handlers
  const handleSaveProduct = async () => {
    if (!productForm.name || (!productForm.hasVariants && !productForm.price)) {
      toast({ title: 'Error', description: 'Nombre y precio son requeridos', variant: 'destructive' })
      return
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const body = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price) || 0,
        stock: productForm.hasVariants ? 0 : parseInt(productForm.stock) || 0,
        categoryId: productForm.categoryId || null,
        image: productForm.image || null,
        imagePosition: (productForm as any).imagePosition || 'center',
        hasVariants: productForm.hasVariants,
        variantType: productForm.hasVariants ? productForm.variantType : null
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Error al guardar producto')
      const savedProduct = await res.json()
      
      if (productForm.hasVariants && productForm.variants.length > 0) {
        for (const variant of productForm.variants) {
          const vMethod = variant.id ? 'PUT' : 'POST'
          const vUrl = variant.id ? `/api/variants/${variant.id}` : '/api/variants'
          await fetch(vUrl, {
            method: vMethod,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: savedProduct.id,
              name: variant.name,
              price: parseFloat(variant.price),
              stock: parseInt(variant.stock) || 0,
              sortOrder: variant.sortOrder
            })
          })
        }
      }
      
      toast({ title: '¡Guardado!', description: 'Producto guardado correctamente' })
      setIsProductDialogOpen(false)
      resetProductForm()
      fetchAllProducts()
      fetchStats()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudo guardar el producto', variant: 'destructive' })
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast({ title: 'Eliminado', description: 'Producto eliminado correctamente' })
      fetchAllProducts()
      fetchStats()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudo eliminar el producto', variant: 'destructive' })
    }
  }

  const handleReorderProducts = async (newProducts: Product[]) => {
    // Actualizar estado local inmediatamente para suavidad
    setProducts(newProducts)
    
    try {
      // Actualizar sortOrder en la base de datos para cada producto
      const updates = newProducts.map((product, index) => {
        return fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...product, sortOrder: index + 1 })
        })
      })
      
      await Promise.all(updates)
      toast({ title: 'Orden guardado', description: 'El catálogo ha sido reordenado' })
    } catch (error) {
      console.error('Error reordering products:', error)
      toast({ title: 'Error', description: 'No se pudo guardar el nuevo orden', variant: 'destructive' })
      fetchAllProducts() // Revertir si hay error
    }
  }

  const handleToggleActive = async (product: Product) => {
    handleUpdateProductField(product.id, 'active', !product.active)
  }

  const handleUpdateProductField = async (productId: string, field: string, value: any) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return

      const updatedProduct = { ...product, [field]: value }
      
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      })

      if (!res.ok) throw new Error('Error al actualizar campo')
      
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: value } : p))
      toast({ title: 'Actualizado', description: `${field} actualizado correctamente` })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudo actualizar el campo', variant: 'destructive' })
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    try {
      await fetch(`/api/variants/${variantId}`, { method: 'DELETE' })
      toast({ title: 'Variante eliminada', description: 'La variante ha sido eliminada' })
      fetchAllProducts()
    } catch (error) { console.error(error) }
  }

  const resetProductForm = () => {
    setProductForm({ 
      name: '', description: '', price: '', stock: '', categoryId: '', image: '', imagePosition: 'center',
      hasVariants: false, variantType: '', variants: [] 
    })
    setEditingProduct(null)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      categoryId: product.categoryId || '',
      image: product.image || '',
      imagePosition: (product as any).imagePosition || 'center',
      hasVariants: product.hasVariants,
      variantType: product.variantType || '',
      variants: product.variants.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price.toString(),
        stock: v.stock.toString(),
        sortOrder: v.sortOrder
      }))
    })
    setIsProductDialogOpen(true)
  }

  const addVariant = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', price: '', stock: '0', sortOrder: prev.variants.length + 1 }]
    }))
  }

  const updateVariant = (index: number, field: string, value: string) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }))
  }

  const removeVariant = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status })
      })
      if (!res.ok) throw new Error('Error al actualizar estado')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o))
      toast({ title: 'Estado actualizado', description: 'El pedido ha cambiado de estado' })
      fetchStats()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' })
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar pedido')
      setOrders(prev => prev.filter(o => o.id !== orderId))
      toast({ title: 'Pedido eliminado', description: 'El pedido ha sido borrado correctamente' })
      fetchStats()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudo eliminar el pedido', variant: 'destructive' })
    }
  }


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-excel', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ 
        title: '¡Archivo procesado!', 
        description: `Creados: ${data.created}, Actualizados: ${data.updated}`
      })
      fetchAllProducts()
      fetchCategories()
      fetchStats()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Error al procesar archivo', variant: 'destructive' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveConfig = async (newConfig?: StoreConfig) => {
    const configToSave = newConfig || config
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      })
      if (res.ok) {
        toast({ title: '¡Guardado!', description: 'Configuración actualizada' })
        fetchConfig()
      }
    } catch (error) { console.error(error) }
  }

  const toggleShowImages = () => {
    const newConfig = { ...config, showImages: !config.showImages }
    setConfig(newConfig)
    handleSaveConfig(newConfig)
  }

  const downloadTemplate = () => {
    const csv = `nombre,precio,stock,descripcion,categoria,imagen,id\nCamiseta Premium,29.99,50,Camiseta de algodón orgánico,Ropa,,prod-1`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'plantilla_productos.csv'
    link.click()
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategoryId ? product.categoryId === selectedCategoryId : true
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen">
      {showSplash && (
        <SplashScreen 
        logo={fixPath(config.logo || landingData.logo)}
        storeName={config.slogan || "La tecnología al servicio de los recuerdos."}
        onComplete={() => {
          setShowSplash(false)
          setView('shop')
        }} 
      />
      )}
      
      {isAdmin ? (
        <AdminPanel 
          stats={stats}
          orders={orders}
          categories={categories}
          products={products}
          config={config}
          showImages={config.showImages}
          setShowImages={toggleShowImages}
          isProductDialogOpen={isProductDialogOpen}
          setIsProductDialogOpen={setIsProductDialogOpen}
          productForm={productForm}
          setProductForm={setProductForm}
          editingProduct={editingProduct}
          uploading={uploading}
          formatPrice={formatPrice}
          onSaveProduct={handleSaveProduct}
          onToggleActive={handleToggleActive}
          onDeleteProduct={handleDeleteProduct}
          onReorderProducts={handleReorderProducts}
          onEditProduct={openEditProduct}
          onUpdateProductField={handleUpdateProductField}
          onUpdateStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onFileUpload={handleFileUpload}
          onDownloadTemplate={downloadTemplate}
          onSaveConfig={handleSaveConfig}
          onUpdateConfig={setConfig}
          onRefreshCategories={fetchCategories}
          addVariant={addVariant}
          updateVariant={updateVariant}
          removeVariant={removeVariant}
          onViewStore={() => { setView('shop'); setIsAdmin(false); window.scrollTo(0, 0); }}
          onLogout={() => { setView('landing'); setIsAdmin(false); window.scrollTo(0, 0); }}
          resetProductForm={resetProductForm}
        />
      ) : view === 'shop' ? (
        /* TIENDA ONLINE */
        <div className="min-h-screen bg-background">
          <ShopHeader 
            config={config}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            cartCount={getItemCount()}
            formatPrice={formatPrice}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            onBackToWeb={() => setView('landing')}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          />

          <main className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                {config.slogan || "La tecnología al servicio de los recuerdos."}
              </h1>
              <p className="text-muted-foreground uppercase tracking-[0.3em] text-xs font-bold opacity-60">
                Tu tienda premium de comuniones
              </p>
            </div>

            <CategoryBar 
              categories={categories} 
              selectedCategoryId={selectedCategoryId} 
              onCategorySelect={setSelectedCategoryId} 
            />

            {/* AVISO IMPORTANTE */}
            <div className="flex flex-col items-center justify-center mb-12 mt-4 max-w-3xl mx-auto px-6 py-8 bg-gradient-to-br from-[#4A7C59]/[0.02] to-white border border-[#4A7C59]/10 rounded-[3rem] shadow-sm animate-in fade-in zoom-in duration-1000">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-[#4A7C59]/10 flex items-center justify-center text-[#4A7C59]">
                  <Camera className="h-5 w-5" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">Aviso importante</h4>
              </div>
              <p className="text-[14px] font-semibold text-slate-600/90 leading-relaxed text-center italic max-w-2xl">
                "Recordamos que los productos aquí mostrados no incluyen en ningún caso la sesión de fotos."
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden shadow-sm">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.filter(p => p.active).length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
                <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
                <p className="text-muted-foreground">Estamos actualizando nuestro catálogo. ¡Vuelve pronto!</p>
              </div>
            ) : config.showImages ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {filteredProducts.filter(p => p.active).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    config={config}
                    formatPrice={formatPrice}
                    handleAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-5xl mx-auto">
                {filteredProducts.filter(p => p.active).map((product) => (
                  <ProductListItem 
                    key={product.id} 
                    product={product} 
                    config={config}
                    formatPrice={formatPrice}
                    handleAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </main>

          <footer className="border-t bg-muted/50 py-12 px-4 mt-20">
            <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div className="space-y-4">
                <h3 className="font-bold text-lg">{config.storeName}</h3>
                <p className="text-sm text-muted-foreground">{config.slogan}</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider">Contacto</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center justify-center md:justify-start gap-2"><Phone className="h-4 w-4" /> {config.phone}</p>
                  <p className="flex items-center justify-center md:justify-start gap-2"><Mail className="h-4 w-4" /> {config.email}</p>
                </div>
              </div>
              <div className="space-y-4 md:text-right">
                <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {config.storeName}.</p>
                <LegalDialogs storeName={config.storeName} />
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* LANDING PAGE (WEB COMPLETA) */
        <div className="min-h-screen bg-white">
          <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent py-4'}`}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <button onClick={() => { console.log('Click Tienda'); setView('shop'); }} className="flex items-center gap-3 outline-none">
                <img src={fixPath(config.logo || landingData.logo)} alt={config.storeName} className="h-10 w-auto" />
              </button>
              
              <div className="hidden md:flex items-center gap-8">
                <a href="#servicios" className="text-gray-600 hover:text-[#4A7C59] transition-colors">Servicios</a>
                <a href="#galeria" className="text-gray-600 hover:text-[#4A7C59] transition-colors">Galería</a>
                <a href="#sobre-mi" className="text-gray-600 hover:text-[#4A7C59] transition-colors">Sobre Mí</a>
                <a href="#contacto" className="text-gray-600 hover:text-[#4A7C59] transition-colors">Contacto</a>
                <button 
                  onClick={() => { console.log('Abrir Splash'); setShowSplash(true); }}
                  className="bg-[#4A7C59] text-white px-5 py-2 rounded-full font-medium hover:bg-[#3d664a] transition-colors"
                >
                  Tienda Online
                </button>
              </div>
            </div>
          </nav>

          <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-[#4A7C59]/5">
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-center"
                >
                  <h1 className="text-5xl md:text-7xl font-light text-gray-900 mb-8 leading-[1.1] tracking-tight">
                    {(config.subtitulo || landingData.subtitulo || "Más que fotografía, tus mejores recuerdos").split(',').map((part: string, i: number, arr: string[]) => (
                      <span key={i} className="block">
                        {part.trim()}{i < arr.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </h1>
                  {config.slogan && (
                    <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                      {config.slogan}
                    </p>
                  )}
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => { console.log('Acceso directo Tienda'); setShowSplash(true); }}
                      className="bg-[#C87941] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-[#b06a38] transition-colors shadow-lg"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Acceso Tienda
                    </button>
                    <a 
                      href="#contacto"
                      className="bg-[#4A7C59] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#3d664a] transition-all hover:scale-105 shadow-lg shadow-[#4A7C59]/20"
                    >
                      Contratar Mis Servicios
                    </a>
                  </div>
                </motion.div>

                {(config.heroFoto || landingData.heroFoto) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="my-12 relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50"
                  >
                    <img 
                      src={fixPath(config.heroFoto || landingData.heroFoto)} 
                      alt={config.storeName} 
                      className="w-full h-[400px] md:h-[600px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="absolute top-1/4 -right-20 w-64 h-64 bg-[#4A7C59]/5 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute -bottom-1/4 -left-20 w-96 h-96 bg-[#4A7C59]/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          </section>

          {/* Servicios */}
          {(config.visibilidad?.servicios ?? true) && (
            <section id="servicios" className="py-24 md:py-32 bg-white">
              <div className="container mx-auto px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-20"
                >
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">¿Qué puedo hacer por ti?</h2>
                  <div className="w-24 h-0.5 bg-[#4A7C59] mx-auto opacity-30"></div>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {(config.servicios?.length > 0 ? config.servicios : landingData.servicios).filter((s: any) => s.activa).map((service: any, index: number) => {
                    const Icon = iconMap[service.icono] || Heart
                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <div className="relative h-full p-8 rounded-3xl border border-gray-100 bg-white hover:border-[#4A7C59]/20 hover:shadow-2xl hover:shadow-[#4A7C59]/5 transition-all duration-500">
                          <div className="mb-8 aspect-[4/3] rounded-2xl overflow-hidden relative shadow-md">
                            <img 
                              src={fixPath(service.foto)} 
                              alt={service.titulo} 
                              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute top-4 left-4 h-12 w-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                              <Icon className="h-6 w-6 text-[#4A7C59]" />
                            </div>
                          </div>
                          <h3 className="text-xl font-bold mb-4 text-gray-900">{service.titulo}</h3>
                          <p className="text-gray-600 leading-relaxed text-sm">{service.descripcion}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Categorías Section */}
              {landingCategories.length > 1 && (
                <section id="categorias" className="py-24 bg-gray-50/50">
                  <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                      <p className="text-[#4A7C59] font-bold tracking-[0.2em] uppercase text-xs mb-4">¿Buscas algo específico?</p>
                      <h2 className="text-4xl font-light text-gray-900 tracking-tight">Explora por Categorías</h2>
                      <div className="h-1 w-20 bg-[#4A7C59] mx-auto mt-6 opacity-20" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {landingCategories.filter(cat => cat !== 'todos').map((cat) => (
                        <motion.button
                          key={cat}
                          whileHover={{ y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setActiveLandingCategory(cat)
                            document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                          className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-4 group ${
                            activeLandingCategory === cat 
                              ? 'bg-white border-[#4A7C59] shadow-2xl shadow-[#4A7C59]/10' 
                              : 'bg-white/50 border-gray-100 hover:border-[#4A7C59]/30 hover:bg-white'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                            activeLandingCategory === cat ? 'bg-[#4A7C59] text-white rotate-6' : 'bg-gray-50 text-gray-400 group-hover:bg-[#4A7C59]/10 group-hover:text-[#4A7C59]'
                          }`}>
                            <Camera className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-gray-900 group-hover:text-[#4A7C59]">{cat}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Portfolio Section */}
          {(config.visibilidad?.galeria ?? true) && (
            <section id="portfolio" className="py-24 md:py-32 bg-gray-50/50">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="max-w-lg"
                  >
                    <p className="text-[#4A7C59] font-bold tracking-widest uppercase text-xs mb-4">Portfolio</p>
                    <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">Capturando la esencia de cada historia</h2>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap gap-2"
                  >
                    {landingCategories.map((cat: string) => (
                      <button
                        key={cat}
                        onClick={() => setActiveLandingCategory(cat)}
                        className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 border ${
                          activeLandingCategory === cat 
                            ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-lg shadow-[#4A7C59]/20' 
                            : 'bg-white text-gray-400 border-gray-100 hover:border-[#4A7C59]/30 hover:text-[#4A7C59]'
                        }`}
                      >
                        {cat === 'todos' ? 'Todos' : cat}
                      </button>
                    ))}
                  </motion.div>
                </div>
                
                <motion.div 
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence mode='popLayout'>
                    {(filteredGallery.length > 0 ? filteredGallery : landingData.galeria).map((img: any) => (
                      <motion.div
                        layout
                        key={img.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        className="aspect-square relative overflow-hidden rounded-3xl group cursor-pointer bg-white shadow-sm"
                      >
                        <img 
                          src={fixPath(img.src)} 
                          alt={img.alt} 
                          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-8">
                          <div>
                            <span className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-2 block">{img.categoria}</span>
                            <p className="text-white text-lg font-light leading-tight">{img.alt}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </section>
          )}

          {/* Sobre Mí */}
          {(config.visibilidad?.sobreMi ?? true) && (
            <section id="sobre-mi" className="py-24 md:py-32 bg-white overflow-hidden">
              <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="w-full lg:w-5/12"
                  >
                    <div className="relative">
                      <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl relative z-10 border-8 border-white">
                        <img 
                          src={fixPath(config.sobreMi?.foto || landingData.sobreMi.foto)} 
                          alt={config.storeName} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#4A7C59]/10 rounded-full blur-2xl z-0"></div>
                      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#4A7C59]/5 rounded-full blur-3xl z-0"></div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="w-full lg:w-7/12"
                  >
                    <p className="text-[#4A7C59] font-bold tracking-widest uppercase text-xs mb-6 px-4 py-1.5 bg-[#4A7C59]/5 inline-block rounded-full">La historia detrás del lente</p>
                    <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-10 leading-tight">Mi filosofía de trabajo</h2>
                    <div className="space-y-6 text-gray-600 text-lg leading-relaxed font-light">
                      {(config.sobreMi?.texto || landingData.sobreMi.texto).split('\n\n').map((paragraph: string, i: number) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                    <div className="mt-12 flex items-center gap-6">
                      <img src={fixPath(config.logo || landingData.logo)} alt="Signature" className="h-10 opacity-30 grayscale" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          )}

          {/* Testimonios */}
          {(config.visibilidad?.testimonios ?? true) && (
            <section className="py-24 md:py-32 bg-[#4A7C59]/5">
              <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900">Lo que dicen mis clientes</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {(config.testimonios?.length > 0 ? config.testimonios : landingData.testimonios).filter((t: any) => t.activo).map((testimonio: any, index: number) => (
                    <motion.div
                      key={testimonio.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-10 rounded-[2rem] shadow-sm relative group hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
                    >
                      <Quote className="absolute top-8 right-10 h-10 w-10 text-[#4A7C59]/5 group-hover:text-[#4A7C59]/10 transition-colors" />
                      <div className="flex gap-1 mb-6">
                        {[...Array(testimonio.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-[#4A7C59] text-[#4A7C59]" />
                        ))}
                      </div>
                      <p className="text-gray-600 mb-8 italic leading-relaxed font-light text-lg">&quot;{testimonio.texto}&quot;</p>
                      <div className="flex items-center gap-4 border-t border-gray-50 pt-6">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#4A7C59] text-xs">
                          {testimonio.nombre?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{testimonio.nombre}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{testimonio.fecha}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Contact Section */}
          <section id="contacto" className="py-24 md:py-32 bg-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl font-light text-gray-900 mb-8">Hablemos</h2>
              <p className="text-gray-500 mb-12 max-w-xl mx-auto">
                ¿Planeando una boda o evento especial? Me encantaría conocer tu historia.
              </p>
              <button 
                onClick={() => window.open(`https://wa.me/${config.whatsappNumber || '34650494728'}`, '_blank')}
                className="bg-[#4A7C59] text-white px-10 py-5 rounded-full font-bold shadow-xl hover:bg-[#3d664a] transition-all hover:scale-105"
              >
                Contactar por WhatsApp
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 bg-white border-t border-gray-50">
            <div className="container mx-auto px-4 text-center">
              <img src={fixPath(config.logo || landingData.logo)} alt="Logo" className="h-8 mx-auto mb-8 opacity-40 hover:opacity-100 transition-opacity" />
              <p className="text-gray-400 text-xs tracking-widest uppercase font-medium">
                © {new Date().getFullYear()} {config.storeName}. Todos los derechos reservados.
              </p>
            </div>
          </footer>
        </div>
      )}

      {/* COMMON DIALOGS & OVERLAYS */}
      {!isAdmin && (
        <>
          <LegalDialogs storeName={config.storeName} />
          
          <Dialog open={!!itemWithNote} onOpenChange={(open) => !open && setItemWithNote(null)}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Observaciones para el producto
                </DialogTitle>
                <div className="text-sm text-muted-foreground pt-2">
                  <p className="font-bold text-black">{itemWithNote?.name}</p>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea 
                  placeholder="Escribe aquí cualquier detalle que necesitemos saber..." 
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  className="min-h-[100px] rounded-xl"
                />
              </div>
              <DialogFooter>
                <Button onClick={confirmAddToCart} className="rounded-xl w-full">Añadir al Carrito</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl">
              {editingProduct && (
                <div className="flex flex-col">
                  <img src={fixPath(editingProduct.image || '')} className="w-full h-64 object-cover" alt="" />
                  <div className="p-8 space-y-4">
                    <h2 className="text-2xl font-bold">{editingProduct.name}</h2>
                    <p className="text-muted-foreground">{editingProduct.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-2xl font-bold text-primary">{formatPrice(Number(editingProduct.price))}</span>
                      <Button onClick={() => { addItem({ ...editingProduct, quantity: 1, price: Number(editingProduct.price) }); setIsProductDialogOpen(false); }}>
                        Añadir al Carrito
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <motion.a
            href={`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent('¡Hola! Me gustaría obtener más información sobre vuestros servicios.')}`}
            target="_blank"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <MessageCircle className="h-8 w-8" />
          </motion.a>
          <SizeGuide 
            isOpen={isSizeGuideOpen} 
            onClose={() => setIsSizeGuideOpen(false)} 
          />
        </>
      )}
    </div>
  )
}
