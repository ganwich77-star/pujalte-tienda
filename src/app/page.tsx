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
  Search, // Added Search icon
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
import { PromoModal } from '@/components/landing/PromoModal'
import { CookieBanner } from '@/components/landing/CookieBanner'
import { cn } from '@/lib/utils'
import { LandingConfig } from '@/lib/landing-config'

// Función helper local para asegurar disponibilidad en el bundle
function fixPath(path: string | null | undefined) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  let cleanPath = path
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`
  return encodeURI(cleanPath)
}
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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
    { id: 'dni', label: 'DNI / NIE', placeholder: '12345678X', type: 'text', required: true, active: true },
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('featured')
  
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isPostAddDialogOpen, setIsPostAddDialogOpen] = useState(false)
  
  // Admin state
  const [categories, setCategories] = useState<Category[]>([])
  const [showPromo, setShowPromo] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalRevenue: 0 })
  const [config, setConfig] = useState<StoreConfig>(defaultConfig)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '0',
    categoryId: '',
    image: '',
    imagePosition: 'center',
    hasVariants: false,
    showPrice: true,
    isPack: false,
    packItems: '[]',
    variantType: '',
    variantBehavior: 'add',
    variants: [] as { id?: string; name: string; sku?: string; price: string; stock: string; sortOrder: number }[],
    minQuantity: '1',
    stepQuantity: '1',
    tierPricing: [] as { minQty: number; price: number }[]
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

  const activeTestimonios = useMemo(() => {
    return (config.testimonios?.length > 0 ? config.testimonios : landingData.testimonios).filter((t: any) => t.activo)
  }, [config.testimonios])

  const [testimonioIndex, setTestimonioIndex] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<any>(null)
  const [[page, direction], setPage] = useState([0, 0])

  const paginateTestimonio = (newDirection: number) => {
    setTestimonioIndex((prev) => (prev + newDirection + activeTestimonios.length) % activeTestimonios.length)
  }

  const paginateGallery = (newDirection: number) => {
    setGalleryIndex((prev) => (prev + newDirection + filteredGallery.length) % filteredGallery.length)
  }
  
  useEffect(() => {
    if (activeTestimonios.length <= 1) return
    const interval = setInterval(() => {
      paginateTestimonio(1)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeTestimonios.length])

  useEffect(() => {
    if (filteredGallery.length <= 1) return
    const interval = setInterval(() => {
      paginateGallery(1)
    }, 6000)
    return () => clearInterval(interval)
  }, [filteredGallery.length])


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
    } catch (error) { console.error('Error fetching all products:', error) }
    finally { setLoading(false) }
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
      // Calculamos estadísticas basadas en los pedidos de MySQL
      if (orders.length > 0) {
        const totalSales = orders.length
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
        setStats({ totalSales, totalOrders: totalSales, totalRevenue })
      } else {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          const totalSales = data.length
          const totalRevenue = data.reduce((sum: any, o: any) => sum + (Number(o.total) || 0), 0)
          setStats({ totalSales, totalOrders: totalSales, totalRevenue })
        }
      }
    } catch (error) { console.error('Error calculating stats:', error) }
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

  const handleAddToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price || 0, 
      quantity: quantity,
      image: product.image,
      variantId: variant?.id,
      variantName: variant?.name,
      variantPrice: variant?.price || 0,
      productId: product.id,
      basePrice: product.price || 0,
      salePrice: product.salePrice || undefined,
      tierPricing: product.tierPricing || undefined,
      variantBehavior: product.variantBehavior || undefined
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
      
      // Abrir diálogo de confirmación tras un breve delay para dejar ver el toast
      setTimeout(() => setIsPostAddDialogOpen(true), 500)
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
      const isUpdate = !!editingProduct
      const url = '/api/products' // Unificado para usar el manejador de MySQL que incluye todas las lógicas
      const method = isUpdate ? 'PUT' : 'POST'
      
      // Función auxiliar para parsear números con coma o punto
      const parseSafePrice = (val: any) => {
        if (!val && val !== 0) return 0;
        const s = String(val).replace(',', '.').replace(/[^\d.]/g, '');
        return parseFloat(s) || 0;
      };

      const body = {
        id: editingProduct?.id,
        name: productForm.name,
        description: productForm.description,
        price: parseSafePrice(productForm.price),
        categoryId: (productForm.categoryId === 'none' || !productForm.categoryId) ? null : productForm.categoryId,
        active: (productForm as any).active !== undefined ? !!(productForm as any).active : true,
        image: productForm.image || null,
        hasVariants: !!productForm.hasVariants,
        showPrice: (productForm as any).showPrice ?? true,
        isPack: (productForm as any).isPack ?? false,
        packItems: (productForm as any).packItems ?? '[]',
        variantType: productForm.hasVariants ? productForm.variantType : null,
        variantBehavior: productForm.variantBehavior || 'add',
        isNew: (productForm as any).isNew || false,
        salePrice: (productForm as any).salePrice ? parseSafePrice((productForm as any).salePrice) : null,
        minQuantity: parseInt(String(productForm.minQuantity)) || 1,
        stepQuantity: parseInt(String(productForm.stepQuantity)) || 1,
        tierPricing: Array.isArray(productForm.tierPricing) && productForm.tierPricing.length > 0 
          ? JSON.stringify(productForm.tierPricing.map(t => ({
              minQty: parseInt(String(t.minQty)) || 1,
              price: parseSafePrice(t.price)
            })))
          : null,
        variants: productForm.variants.map(v => ({
          name: v.name || "",
          sku: v.sku || "",
          price: parseSafePrice(v.price),
          stock: parseInt(String(v.stock)) || 0,
          sortOrder: v.sortOrder || 0,
          active: true
        }))
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Error al guardar producto')
      const savedProduct = await res.json()
      
      // Se eliminan las llamadas individuales a /api/variants ya que ahora el endpoint de producto maneja todo el array de variantes
      
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
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
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
      name: '', description: '', price: '', stock: '0', categoryId: '', image: '', imagePosition: 'center',
      hasVariants: false, showPrice: true, isPack: false, packItems: '[]', variantType: '', variantBehavior: 'add', variants: [],
      minQuantity: '1', stepQuantity: '1', tierPricing: []
    })
    setEditingProduct(null)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: (product.price ?? 0).toString(),
      stock: (product.stock ?? 0).toString(),
      categoryId: product.categoryId || '',
      image: product.image || '',
      imagePosition: (product as any).imagePosition || 'center',
      hasVariants: !!product.hasVariants,
      showPrice: product.showPrice ?? true,
      isPack: product.isPack ?? false,
      packItems: product.packItems || '[]',
      variantType: product.variantType || '',
      variantBehavior: product.variantBehavior || 'add',
      minQuantity: (product.minQuantity ?? 1).toString(),
      stepQuantity: (product.stepQuantity ?? 1).toString(),
      tierPricing: typeof product.tierPricing === 'string' 
        ? JSON.parse(product.tierPricing) 
        : (Array.isArray(product.tierPricing) ? product.tierPricing : []),
      variants: (product.variants || []).map(v => ({
        id: v.id || Math.random().toString(36).substr(2, 9),
        name: v.name || '',
        price: (v.price ?? 0).toString(),
        stock: (v.stock ?? 0).toString(),
        sortOrder: v.sortOrder ?? 0
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
      // Guardar en la tienda (Firebase/DB)
      const resShop = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      })

      // Guardar en la landing (JSON Local)
      const resLanding = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      })

      if (resShop.ok && resLanding.ok) {
        toast({ title: '¡Guardado!', description: 'Todo sincronizado: Tienda y Landing' })
        fetchConfig()
      } else {
        toast({ title: 'Aviso', description: 'Se guardó en uno de los sistemas pero falló el otro. Reintenta.', variant: 'destructive' })
      }
    } catch (error) { 
      console.error(error)
      toast({ title: 'Error crítico', description: 'Fallo de conexión al guardar.', variant: 'destructive' })
    }
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

  const allCombinedProducts = useMemo(() => {
    // Productos de MySQL
    const mysqlProds = products.map(p => ({ ...p, source: 'mysql' }));
    
    // Productos de JSON (catálogo configurado en admin) que tengan precio > 0
    const jsonProds = (config.galeria || [])
      .filter(g => (g.activa !== false) && ((g.precio && g.precio > 0) || (g.variants && g.variants.length > 0)))
      .map(g => {
        const mysqlCategory = categories.find(c => c.name.toLowerCase() === g.categoria?.toLowerCase());
        return {
          id: g.id.toString(),
          name: g.alt,
          description: g.descripcion || '',
          price: Number(g.precio) || 0,
          image: g.src,
          stock: g.stock ?? 99,
          categoryId: mysqlCategory ? mysqlCategory.id : g.categoria,
          category: mysqlCategory ? { id: mysqlCategory.id, name: mysqlCategory.name } : (g.categoria ? { id: g.categoria, name: g.categoria } : null),
          active: g.activa !== false,
          showPrice: g.mostrarPrecio !== false,
          isPack: false,
          packItems: null,
          hasVariants: g.hasVariants || (g.variants && g.variants.length > 0),
          variantType: 'Opción',
          variants: (g.variants || []).map((v: any) => ({
            ...v,
            id: v.id?.toString() || Math.random().toString(),
            price: Number(v.price) || 0,
            stock: v.stock ?? 99,
            active: v.active ?? true,
            sortOrder: v.sortOrder ?? 0
          })),
          variantBehavior: g.variantBehavior || 'add',
          isNew: g.isNew || false,
          source: 'json'
        } as Product;
      });

    return [...mysqlProds, ...jsonProds];
  }, [products, config.galeria]);

  const filteredProducts = allCombinedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtrado por categoría: 
    // - Si es 'featured', mostramos novedades y ofertas
    // - Si es MySQL, comparamos IDs
    // - Si es JSON, comparamos el campo categoria (string) con el nombre de la categoría seleccionada
    let matchesCategory = true;
    if (searchQuery.length === 0) { // Solo filtramos por categoría si NO hay búsqueda activa
      if (selectedCategoryId === 'featured') {
        matchesCategory = !!(product.isNew || product.salePrice);
      } else if (selectedCategoryId) {
        const selectedCat = categories.find(c => c.id === selectedCategoryId);
        if (selectedCat) {
          matchesCategory = product.categoryId === selectedCategoryId || 
                           product.categoryId?.toString().toLowerCase() === selectedCat.name.toLowerCase();
        } else {
          matchesCategory = product.categoryId === selectedCategoryId;
        }
      }
    }
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen">
      {showSplash && (
        <SplashScreen 
        logo={fixPath(config.logo || landingData.logo)}
        storeName={config.slogan || "POWERED BY PUJALTE CREATIVE STUDIO"}
        onComplete={() => {
          // Ya habremos cambiado la vista en el onClick, así que aquí solo nos aseguramos
          // de que el splash se desmonte tras el desvanecimiento
          setTimeout(() => setShowSplash(false), 600)
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
          onAddProduct={() => {
            resetProductForm()
            setIsProductDialogOpen(true)
          }}
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
              <div className="mb-4 space-y-3">
                <h2 className="text-[#4A7C59] uppercase tracking-[0.3em] text-[13px] font-bold opacity-90">
                  LA TECNOLOGÍA AL SERVICIO <br /> DE LOS RECUERDOS
                </h2>
                <div className="w-12 h-[1px] bg-[#4A7C59]/20 mx-auto" />
                <p className="text-[#4A7C59] uppercase tracking-[0.4em] text-[10px] font-black opacity-70">
                  POWERED BY PUJALTE CREATIVE STUDIO
                </p>
              </div>
            </div>

            <CategoryBar 
              categories={categories} 
              selectedCategoryId={selectedCategoryId} 
              onCategorySelect={setSelectedCategoryId} 
            />

            {/* AVISO IMPORTANTE MÁS DISCRETO */}
            <div className="flex items-center justify-center mb-8 gap-3 opacity-40 hover:opacity-100 transition-opacity">
              <Camera className="h-3 w-3 text-[#4A7C59]" />
              <p className="text-[10px] font-bold text-slate-400 tracking-wide">
                LOS PRODUCTOS NO INCLUYEN LA SESIÓN DE FOTOS
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
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 sm:gap-x-4 gap-y-6 sm:gap-y-8">
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

          <footer className="border-t bg-white py-4 px-4 mt-10">
            <div className="container mx-auto max-w-2xl text-center space-y-2">
              {/* Identidad */}
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-gray-900 leading-tight uppercase tracking-tight">{config.storeName}</h3>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em] opacity-80">POWERED BY PUJALTE CREATIVE STUDIO</p>
              </div>

              {/* Contacto Compacto */}
              <div className="flex flex-col items-center gap-1.5 pt-2">
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] text-gray-500 font-medium">
                  <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-[#4A7C59]/60" /> {config.phone}</p>
                  <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-[#4A7C59]/60" /> {config.email}</p>
                </div>
              </div>

              {/* Legal y Copyright */}
              <div className="pt-2 border-t border-gray-50 flex flex-col items-center gap-1">
                <p className="text-[8px] text-gray-300 font-medium tracking-wider uppercase">© {new Date().getFullYear()} {config.storeName}.</p>
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
                <a href="#productos" className="text-gray-600 hover:text-[#4A7C59] transition-colors">Productos</a>
                <a href="#sobre-mi" className="text-gray-600 hover:text-[#4A7C59] transition-colors">Sobre Mí</a>
                <a href="#contacto" className="text-gray-600 hover:text-[#4A7C59] transition-colors">Contacto</a>
                <button 
                  onClick={() => { 
                    setShowSplash(true); 
                    setTimeout(() => {
                      setView('shop');
                      window.scrollTo(0, 0);
                    }, 100);
                  }}
                  className="bg-[#4A7C59] text-white px-5 py-2 rounded-full font-medium hover:bg-[#3d664a] transition-colors"
                >
                  Tienda Online
                </button>
              </div>

              {/* Botón Menú Móvil */}
              <div className="md:hidden flex items-center gap-3">
                <button 
                  onClick={() => { 
                    setShowSplash(true); 
                    setTimeout(() => {
                      setView('shop');
                      window.scrollTo(0, 0);
                    }, 100);
                  }}
                  className="bg-[#4A7C59] text-white px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-[#3d664a] transition-all shadow-md"
                  title="Tienda"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ir a tienda</span>
                </button>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="p-2 text-gray-600 hover:text-[#4A7C59] transition-colors">
                      <Menu className="w-7 h-7" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] border-none p-0 flex flex-col">
                    <div className="p-8 pb-4">
                      <img src={fixPath(config.logo || landingData.logo)} alt={config.storeName} className="h-10 w-auto mb-8" />
                      <SheetTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900 border-none mb-2">
                        MENÚ
                      </SheetTitle>
                    </div>
                    
                    <div className="flex-1 flex flex-col p-8 gap-6">
                      <a href="#servicios" className="text-xl font-bold text-slate-600 hover:text-[#4A7C59] transition-colors">Servicios</a>
                      <a href="#productos" className="text-xl font-bold text-slate-600 hover:text-[#4A7C59] transition-colors">Productos</a>
                      <a href="#sobre-mi" className="text-xl font-bold text-slate-600 hover:text-[#4A7C59] transition-colors">Sobre Mí</a>
                      <a href="#contacto" className="text-xl font-bold text-slate-600 hover:text-[#4A7C59] transition-colors">Contacto</a>
                      
                      <div className="mt-auto pt-8 border-t border-slate-100">
                        <button 
                          onClick={() => { 
                            setShowSplash(true); 
                            setTimeout(() => {
                              setView('shop');
                              window.scrollTo(0, 0);
                            }, 100);
                          }}
                          className="w-full bg-[#4A7C59] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-[#4A7C59]/20"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Tienda Online
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </nav>
          
          <AnimatePresence>
            {showPromo && Array.isArray(config?.promos) && config.promos.filter((p: any) => p.activa).length > 0 && (
              <PromoModal 
                promos={config.promos.filter((p: any) => p.activa)}
                onClose={() => setShowPromo(false)}
                onOpenStore={() => { 
                  setShowPromo(false); 
                  setShowSplash(true); 
                  setTimeout(() => {
                    setView('shop');
                    window.scrollTo(0, 0);
                  }, 100);
                }} 
                onContact={() => { setShowPromo(false); document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }); }} 
              />
            )}
          </AnimatePresence>

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
                  <div className="mb-10">
                    <p className="text-xs font-black tracking-[0.4em] text-[#4A7C59] uppercase opacity-80">
                      POWERED BY PUJALTE CREATIVE STUDIO
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => { 
                        setShowSplash(true); 
                        setTimeout(() => {
                          setView('shop');
                          window.scrollTo(0, 0);
                        }, 100);
                      }}
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
                      style={{ objectPosition: (config as any).heroPosition || 'center' }}
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
                
                {(() => {
                  const activeServices = (config.servicios?.length > 0 ? config.servicios : landingData.servicios).filter((s: any) => s.activa);
                  const count = activeServices.length;
                  const gridCols = count === 2 ? 'lg:grid-cols-2' : count === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
                  
                  return (
                    <div className={`grid grid-cols-3 md:grid-cols-3 ${gridCols} gap-2 md:gap-8 max-w-7xl mx-auto`}>
                      {activeServices.map((service: any, index: number) => {
                        const Icon = iconMap[service.icono] || Heart
                        const isLastOdd = false; // Ya no necesitamos col-span-2 ya que siempre serán 3 en línea
                        
                        return (
                          <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group col-span-1"
                          >
                            <div className="relative h-full p-2.5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 bg-white hover:border-[#4A7C59]/20 hover:shadow-2xl hover:shadow-[#4A7C59]/5 transition-all duration-500">
                              <div className="mb-3 md:mb-8 aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden relative shadow-sm">
                                <img 
                                  src={fixPath(service.foto)} 
                                  alt={service.titulo} 
                                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
                                />
                                <div className="absolute top-2 left-2 md:top-4 md:left-4 h-8 w-8 md:h-12 md:w-12 bg-white/90 backdrop-blur-md rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg">
                                  <Icon className="h-4 w-4 md:h-6 md:w-6 text-[#4A7C59]" />
                                </div>
                              </div>
                              <h3 className="text-[10px] md:text-xl font-bold mb-1 md:mb-4 text-gray-900 line-clamp-1">{service.titulo}</h3>
                              <p className="text-gray-500 leading-tight md:leading-relaxed text-[8px] md:text-sm line-clamp-2 md:line-clamp-none">{service.descripcion}</p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  );
                })()}
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

                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                      {landingCategories.filter(cat => cat !== 'todos').map((cat) => (
                        <motion.button
                          key={cat}
                          whileHover={{ y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setActiveLandingCategory(cat)
                            document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                          className={`p-3 md:p-6 rounded-2xl md:rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-2 md:gap-4 group ${
                            activeLandingCategory === cat 
                              ? 'bg-white border-[#4A7C59] shadow-2xl shadow-[#4A7C59]/10' 
                              : 'bg-white/50 border-gray-100 hover:border-[#4A7C59]/30 hover:bg-white'
                          }`}
                        >
                          <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 ${
                            activeLandingCategory === cat ? 'bg-[#4A7C59] text-white rotate-6' : 'bg-gray-50 text-gray-400 group-hover:bg-[#4A7C59]/10 group-hover:text-[#4A7C59]'
                          }`}>
                            <Camera className="w-6 h-6" />
                          </div>
                           <span className="text-[8px] md:text-xs font-black uppercase tracking-widest text-gray-900 group-hover:text-[#4A7C59] line-clamp-1">{cat}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Portfolio Section */}
          {(config.visibilidad?.galeria ?? true) && (
            <section id="productos" className="py-24 md:py-32 bg-gray-50/50">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="max-w-lg"
                  >
                    <p className="text-[#4A7C59] font-bold tracking-widest uppercase text-xs mb-4">Portafolio</p>
                    <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 font-serif">Nuestra Galería de Momentos</h2>
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
                
                <div className="relative group/gallery overflow-hidden min-h-[350px] md:min-h-[500px] flex items-center">
                  <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div 
                      key={galleryIndex}
                      custom={direction}
                      variants={{
                        enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
                        center: { x: 0, opacity: 1 },
                        exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                      className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 px-4"
                    >
                      {/* En móvil mostramos 1, en desktop mostramos 3 empezando desde galleryIndex */}
                      {[0, 1, 2].map((offset) => {
                        const itemIdx = (galleryIndex + offset) % filteredGallery.length
                        const img = filteredGallery[itemIdx]
                        if (!img) return null
                        
                        return (
                          <div 
                            key={`${img.id}-${itemIdx}`}
                            className={cn(
                              "w-full transition-all duration-500",
                              offset > 0 ? "hidden md:block" : "block"
                            )}
                          >
                            <div 
                              onClick={() => setSelectedGalleryImage(img)}
                              className={cn(
                                "group aspect-square rounded-[2rem] overflow-hidden relative shadow-xl transition-all duration-700 cursor-pointer",
                                // Todas iguales
                                "scale-100 blur-0 opacity-100",
                                // Control de visibilidad
                                offset > 0 ? "hidden md:block" : "block"
                              )}
                            >
                              <img 
                                src={fixPath(img.src)} 
                                alt={img.alt} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" 
                              />
                              {img.isNew && (
                                <div className="absolute top-4 left-4 z-10">
                                  <div className="bg-amber-400 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg border border-white/20 animate-pulse uppercase tracking-wider">
                                    Nuevo
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 md:p-8">
                                <p className="text-white font-bold text-[10px] md:text-xs uppercase tracking-widest">{img.alt}</p>
                              </div>
                              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Search className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </motion.div>
                  </AnimatePresence>

                  {/* Manual Controls */}
                  <button 
                    onClick={() => { setPage([galleryIndex, -1]); paginateGallery(-1) }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-gray-900 opacity-0 group-hover/gallery:opacity-100 transition-all hover:scale-110 z-20 border border-gray-100"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => { setPage([galleryIndex, 1]); paginateGallery(1) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-gray-900 opacity-0 group-hover/gallery:opacity-100 transition-all hover:scale-110 z-20 border border-gray-100"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Lightbox / Zoom */}
                <Dialog open={!!selectedGalleryImage} onOpenChange={() => setSelectedGalleryImage(null)}>
                  <DialogContent className="!max-w-none w-screen h-screen p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-hidden z-[100] [&>button]:hidden">
                    {/* Background Layer with Blur and Dimming */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setSelectedGalleryImage(null)} />
                    
                    {/* The Image with its 'Filo Blanco' */}
                    <div className="relative z-10 flex items-center justify-center p-4 md:p-12 pointer-events-none">
                      <motion.img 
                        src={fixPath(selectedGalleryImage?.src)} 
                        alt="Zoom"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-sm border-[1.5px] border-white shadow-2xl pointer-events-auto cursor-pointer"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={() => setSelectedGalleryImage(null)}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
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

          {/* Contact Section - UNIFICADA Y SÓLIDA */}
          <section id="contacto" className="py-24 md:py-32 relative overflow-hidden bg-[#4A7C59]/5">
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white/40 backdrop-blur-md border border-white/20 p-12 md:p-20 rounded-[3rem] shadow-2xl text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#4A7C59] to-transparent opacity-30" />
                  
                  <span className="text-[#4A7C59] font-bold tracking-[0.2em] uppercase text-xs mb-6 block">¿Damos el primer paso?</span>
                  <h2 className="text-4xl md:text-6xl font-light text-gray-900 mb-8 leading-tight italic">Hablemos de tu gran historia</h2>
                  
                  <p className="text-gray-600 mb-12 max-w-xl mx-auto text-lg md:text-xl font-light leading-relaxed">
                    Cada detalle cuenta, cada momento es único. Estoy aquí para conocer tus ideas y convertirlas en recuerdos eternos.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent('¡Hola! Me gustaría obtener más información sobre vuestros servicios.')}`)}
                      className="group bg-[#4A7C59] text-white px-12 py-6 rounded-full font-bold shadow-2xl shadow-[#4A7C59]/30 hover:bg-[#3d664a] transition-all flex items-center gap-3 text-lg"
                    >
                      <MessageCircle className="w-6 h-6 transition-transform group-hover:rotate-12" />
                      Contactar por WhatsApp
                    </motion.button>
                  </div>
                  
                  <p className="mt-10 text-gray-400 text-sm font-light">
                    Respondo encantado en menos de 24 horas
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Testimonios */}
          {(config.visibilidad?.testimonios ?? true) && (
            <section className="py-24 md:py-32 bg-[#4A7C59]/5">
              <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900">Lo que dicen mis clientes</h2>
                </div>

                <div className="relative max-w-4xl mx-auto group min-h-[450px] flex items-center">
                  <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div 
                      key={testimonioIndex}
                      custom={direction}
                      variants={{
                        enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
                        center: { x: 0, opacity: 1 },
                        exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                      className="w-full px-4"
                    >
                      {activeTestimonios[testimonioIndex] && (
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-[#4A7C59]/5 relative group border border-gray-50 h-full">
                          <Quote className="absolute top-8 right-10 h-12 w-12 text-[#4A7C59]/10" />
                          <div className="flex gap-1 mb-8">
                            {[...Array(activeTestimonios[testimonioIndex].rating || 5)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-[#C87941] text-[#C87941]" />
                            ))}
                          </div>
                          <p className="text-gray-700 mb-10 italic leading-relaxed font-light text-xl md:text-2xl">
                            &quot;{activeTestimonios[testimonioIndex].texto}&quot;
                          </p>
                          <div className="flex items-center gap-5 border-t border-gray-100 pt-8 mt-auto">
                            <div className="h-14 w-14 rounded-2xl bg-[#4A7C59]/10 flex items-center justify-center font-bold text-[#4A7C59] text-lg">
                              {activeTestimonios[testimonioIndex].nombre?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900">{activeTestimonios[testimonioIndex].nombre}</p>
                              <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{activeTestimonios[testimonioIndex].fecha}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Testimonial Controls */}
                  <button 
                    onClick={() => { setPage([testimonioIndex, -1]); paginateTestimonio(-1) }}
                    className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md w-10 h-10 md:w-14 md:h-14 rounded-2xl shadow-xl flex items-center justify-center text-[#4A7C59] opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20 border border-gray-100"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => { setPage([testimonioIndex, 1]); paginateTestimonio(1) }}
                    className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md w-10 h-10 md:w-14 md:h-14 rounded-2xl shadow-xl flex items-center justify-center text-[#4A7C59] opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20 border border-gray-100"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Indicators - Movidos debajo del carrusel */}
                <div className="flex justify-center gap-3 mt-12">
                  {activeTestimonios.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonioIndex(i)}
                      className={`h-2 rounded-full transition-all duration-500 ${testimonioIndex === i ? 'w-8 bg-[#4A7C59]' : 'w-2 bg-gray-200 hover:bg-gray-300'}`}
                      aria-label={`Ir al testimonio ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}



          {/* Footer */}
          <footer className="py-8 bg-gray-900 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4A7C59]/30 to-transparent" />
            <div className="container mx-auto px-4 text-center relative z-10">
              {/* Logo eliminado según petición */}
              <div className="mb-4" />
              
              <div className="flex flex-col gap-6 items-center">
                <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.3em] uppercase font-black" suppressHydrationWarning>
                  © {new Date().getFullYear()} {config.storeName}. Todos los derechos reservados.
                </p>
                
                <div className="h-px w-12 bg-gray-800 my-2" />
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center gap-2"
                >
                  <p className="text-[#4A7C59] text-[10px] sm:text-xs tracking-[0.3em] font-black uppercase mb-1">
                    LA TECNOLOGÍA AL SERVICIO DE LOS RECUERDOS
                  </p>
                  <p className="text-white text-xs sm:text-base font-black tracking-[0.2em] italic opacity-80">
                    POWERED BY <span className="text-[#4A7C59]">PUJALTE</span> CREATIVE STUDIO
                  </p>
                </motion.div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#4A7C59]/10 rounded-full blur-3xl" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </footer>
        </div>
      )}

      {/* COMMON DIALOGS & OVERLAYS */}
      {!isAdmin && (
        <>
          {/* Eliminado LegalDialogs duplicado */}
          
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
                      <Button onClick={() => { 
                        addItem({ 
                          ...editingProduct, 
                          quantity: 1, 
                          price: Number(editingProduct.price) || 0,
                          basePrice: Number(editingProduct.price) || 0,
                          salePrice: editingProduct.salePrice || undefined,
                          tierPricing: editingProduct.tierPricing || undefined,
                          variantBehavior: editingProduct.variantBehavior || undefined
                        }); 
                        setIsProductDialogOpen(false); 
                        setTimeout(() => setIsPostAddDialogOpen(true), 500);
                      }}>
                        Añadir al Carrito
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isPostAddDialogOpen} onOpenChange={setIsPostAddDialogOpen}>
            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8">
              <DialogHeader className="space-y-4">
                <div className="h-16 w-16 bg-[#4A7C59]/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="h-8 w-8 text-[#4A7C59]" />
                </div>
                <DialogTitle className="text-2xl font-black text-center text-gray-900">¡Añadido con éxito!</DialogTitle>
                <div className="text-center text-gray-600 font-medium leading-relaxed">
                  ¿Qué te gustaría hacer ahora? Puedes seguir explorando o revisar tu carrito para finalizar el pedido.
                </div>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-6">
                <Button 
                  onClick={() => {
                    setIsPostAddDialogOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="h-14 rounded-2xl bg-[#4A7C59] hover:bg-[#3d664a] text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-[#4A7C59]/20"
                >
                  Ir al Carrito
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsPostAddDialogOpen(false)}
                  className="h-14 rounded-2xl border-2 border-gray-100 font-bold uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                >
                  Seguir Comprando
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="fixed bottom-6 right-6 z-50">
            <Popover>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-[#25D366] text-white w-16 h-16 rounded-full shadow-[0_10px_40px_rgba(37,211,102,0.4)] flex items-center justify-center relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <MessageCircle className="h-9 w-9 relative z-10" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent align="end" side="top" className="w-80 p-0 rounded-[2rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden bg-white mb-4">
                <div className="bg-[#25D366] p-6 text-white">
                  <h3 className="text-xl font-black italic">¿Cómo podemos ayudarte?</h3>
                  <p className="text-xs font-medium opacity-90 mt-1">El equipo de Pujalte te responderá en breve.</p>
                </div>
                <div className="p-3 bg-slate-50/50 flex flex-col gap-2">
                  {[
                    { label: 'Cita para Fotos DNI', msg: 'Hola, me gustaría pedir cita para fotos de DNI/Pasaporte.', icon: '🆔' },
                    { label: 'Cita Info Reportajes', msg: 'Hola, quiero información y cita para un reportaje (Comunión, Infantil, etc).', icon: '📸' },
                    { label: 'Consulta Pedido Online', msg: 'Hola, tengo una duda sobre un pedido realizado en la web.', icon: '🛍️' },
                    { label: 'Otras Consultas', msg: 'Hola, tengo una consulta general sobre vuestros servicios.', icon: '💬' }
                  ].map((opt, i) => (
                    <motion.a
                      key={i}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      href={`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(opt.msg)}`}
                      target="_blank"
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#25D366]/30 hover:shadow-md transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform">{opt.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 tracking-tight">{opt.label}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enviar Mensaje</span>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-[#25D366] transition-colors" />
                    </motion.a>
                  ))}
                </div>
                <div className="p-4 text-center border-t border-slate-100">
                  <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Pujalte Fotografía © 2026</span>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <SizeGuide 
            isOpen={isSizeGuideOpen} 
            onClose={() => setIsSizeGuideOpen(false)} 
          />
          <CookieBanner />
        </>
      )}
    </div>
  )
}
