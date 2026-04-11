'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { Product, Category, Order, StoreConfig } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [config, setConfig] = useState<StoreConfig>({} as any)
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalRevenue: 0 })

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    categoryId: 'social',
    image: '',
    stock: 99,
    active: true,
    showPrice: true,
    isPack: false,
    hasVariants: false,
    variantType: '',
    variantBehavior: 'replace',
    variants: [],
    isNew: false,
    salePrice: null,
    minQuantity: 1,
    stepQuantity: 1,
    tierPricing: [],
    customOptions: null,
    supplierId: null,
    fotosIncluidas: 1
  })

  useEffect(() => {
    // SISTEMA DE RECONOCIMIENTO MAESTRO (PARA FAUSTINO)
    const fastAccess = localStorage.getItem('pujalte_fast_access')
    if (fastAccess === 'true') {
      setIsAdmin(true)
    }

    async function init() {
      try {
        const [pRes, catRes, confRes, ordRes] = await Promise.all([
          fetch('/api/products?admin=true'), fetch('/api/categories'), fetch('/api/config'), fetch('/api/orders')
        ])
        if (pRes.ok) setProducts(await pRes.json())
        if (catRes.ok) setCategories(await catRes.json())
        if (confRes.ok) setConfig(await confRes.json())
        if (ordRes.ok) {
          const ordData = await ordRes.json()
          setOrders(ordData)
          const revenue = ordData.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0)
          setStats({ totalSales: ordData.length, totalOrders: ordData.length, totalRevenue: revenue })
        }
      } catch (e) {
        console.error(e)
      } finally { setLoading(false) }
    }
    init()
  }, [])

  const handleSaveProduct = async (data?: any) => {
    setIsSaving(true)
    const payload = data || productForm
    try {
      const res = await fetch('/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast({ title: 'Éxito', description: 'Producto guardado correctamente.' })
        setIsProductDialogOpen(false)
        const freshRes = await fetch('/api/products?admin=true&t=' + Date.now());
        if (freshRes.ok) setProducts(await freshRes.json())
      } else {
        toast({ title: 'Error', description: 'No se pudo guardar el producto.', variant: 'destructive' })
      }
    } catch (e) { 
      console.error(e)
      toast({ title: 'Error de red', description: 'Fallo al conectar con el servidor.', variant: 'destructive' })
    } finally { setIsSaving(false) }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast({ title: 'Producto eliminado correctamente' });
        // Recargar para estar 100% seguros
        const freshRes = await fetch('/api/products?admin=true&t=' + Date.now());
        if (freshRes.ok) setProducts(await freshRes.json());
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  }

  const handleSaveConfig = async (newCfg?: StoreConfig) => {
    const configToSave = newCfg || config;
    
    // VALIDACIÓN DE SEGURIDAD (CIERRE DE AGUJERO): Evitar sobrescribir con objeto vacío
    const keysCount = Object.keys(configToSave || {}).length;
    if (keysCount < 5) {
      toast({ 
        title: '⛔ ERROR CRÍTICO DE SEGURIDAD', 
        description: 'La configuración parece estar vacía (0 artículos). Guardado bloqueado para evitar pérdida de datos. Recarga la página.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true)
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      })
      if (res.ok) {
        toast({ title: 'Configuración guardada correctamente' })
      } else {
        throw new Error('Error en el servidor al intentar guardar')
      }
    } catch (e) { 
      console.error(e)
      toast({ title: 'Error al guardar', description: 'Inténtalo de nuevo más tarde o contacta con soporte.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const targetPassword = config.adminPassword || 'admin123'
    if (password === targetPassword) {
      setIsAdmin(true)
      // Si el login es manual pero exitoso, también le damos la 'llave maestra'
      localStorage.setItem('pujalte_fast_access', 'true')
    } else {
      console.log('Login fallido localmente. Intenta con "admin123" si no has configurado local-db.')
      setLoginError(true); 
      setTimeout(() => setLoginError(false), 600)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload/bulk', { method: 'POST', body: formData })
      if (res.ok) {
        toast({ title: 'Importación completada' })
        setProducts(await fetch('/api/products?admin=true').then(r => r.json()))
      }
    } catch (e) { console.error(e) } finally { setUploading(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-[#4A7C59] tracking-widest animate-pulse">CARGANDO CONTROL MAESTRO...</div>

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border-0 rounded-[3rem] overflow-hidden p-4">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="mx-auto w-20 h-20 bg-[#4A7C59] rounded-[2rem] flex items-center justify-center shadow-xl shadow-[#4A7C59]/30 mb-6 rotate-3">
              <Camera className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">Master Control</CardTitle>
            <CardDescription className="text-[#4A7C59] font-black uppercase tracking-[0.3em] text-[9px] mt-2">Acceso Administrativo Unificado</CardDescription>
          </CardHeader>
          <CardContent className="pb-12 px-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="password"
                placeholder="PASSWORD"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full h-16 rounded-2xl border-none bg-neutral-100 px-6 text-center text-xl font-black tracking-[0.5em] outline-none transition-all focus:ring-4 focus:ring-[#4A7C59]/10 ${loginError ? 'bg-red-50 text-red-500 animate-shake' : ''}`}
              />
              <Button type="submit" className="w-full h-16 bg-[#4A7C59] hover:bg-[#3d6649] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4A7C59]/20 transition-all hover:scale-[1.02] active:scale-95">
                INICIAR ADMINISTRACIÓN
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AdminPanel
        {...{ stats, orders, categories, products, config, isProductDialogOpen, setIsProductDialogOpen, productForm, setProductForm, editingProduct, uploading, isSaving }}
        showImages={config.showImages}
        setShowImages={(s) => setConfig({ ...config, showImages: s })}
        formatPrice={(p) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p)}
        onSaveProduct={handleSaveProduct}
        onToggleActive={(p) => {
          const upd = { ...p, active: !p.active }
          fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(upd) })
          setProducts(products.map(x => x.id === p.id ? upd : x))
        }}
        onDeleteProduct={handleDeleteProduct}
        onReorderProducts={setProducts}
        onAddProduct={() => { 
          setEditingProduct(null); 
          setProductForm({ 
            name: '', price: 0, description: '', categoryId: 'social', image: '', stock: 99, active: true, 
            showPrice: true, isPack: false, hasVariants: false, variantType: '', variantBehavior: 'replace',
            variants: [], isNew: false, salePrice: null, minQuantity: 1, stepQuantity: 1, tierPricing: [],
            customOptions: null, supplierId: null, fotosIncluidas: 1
          }); 
          setIsProductDialogOpen(true) 
        }}
        onEditProduct={(p) => { 
          // Clonar para evitar mutaciones directas
          const processedProduct = { ...p };
          
          // Asegurar campos básicos y prevenir pérdida de imagen
          if (processedProduct.id) processedProduct.id = String(processedProduct.id);
          processedProduct.image = (p as any).image || (p as any).src || '';
          processedProduct.fotosIncluidas = (p.fotosIncluidas !== undefined && p.fotosIncluidas !== null) ? Number(p.fotosIncluidas) : 1;
          if (isNaN(processedProduct.fotosIncluidas)) processedProduct.fotosIncluidas = 1;

          try {
            // Normalizar tierPricing (debe ser Array)
            if (typeof processedProduct.tierPricing === 'string') {
              const trimmed = processedProduct.tierPricing.trim();
              processedProduct.tierPricing = (trimmed === '' || trimmed === 'null' || trimmed === '[]') 
                ? [] 
                : JSON.parse(processedProduct.tierPricing);
            }
            if (!Array.isArray(processedProduct.tierPricing)) processedProduct.tierPricing = [];

            // Normalizar customOptions (debe ser Array)
            if (typeof processedProduct.customOptions === 'string') {
              const trimmed = processedProduct.customOptions.trim();
              if (trimmed === '' || trimmed === 'null' || trimmed === '[]') {
                (processedProduct as any).customOptions = [];
              } else {
                try { (processedProduct as any).customOptions = JSON.parse(processedProduct.customOptions); } catch(e) { (processedProduct as any).customOptions = []; }
              }
            }
            if (!Array.isArray(processedProduct.customOptions)) (processedProduct as any).customOptions = [];

            // Asegurar variantes
            if (!Array.isArray(processedProduct.variants)) processedProduct.variants = [];
          } catch (e) {
            console.error('Error procesando datos del producto:', e);
            (processedProduct as any).tierPricing = [];
            (processedProduct as any).customOptions = [];
            processedProduct.variants = [];
          }
          
          setEditingProduct(processedProduct); 
          setProductForm(processedProduct); 
          setIsProductDialogOpen(true) 
        }}
        onUpdateStatus={async (id, s) => {
          await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: s }) })
          setOrders(orders.map(o => o.id === id ? { ...o, status: s } : o))
        }}
        onUpdateOrder={async (order) => {
          try {
            await fetch('/api/orders', { 
              method: 'PUT', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(order) 
            })
            setOrders(orders.map(o => o.id === order.id ? order : o))
            toast({ title: 'Pedido actualizado', description: 'Los cambios se han guardado correctamente.' })
          } catch (e) {
            console.error('Error actualizando pedido:', e)
            toast({ title: 'Error', description: 'No se pudieron guardar los cambios del pedido.', variant: 'destructive' })
          }
        }}
        onDeleteOrder={async (id) => {
          try {
            const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
              setOrders(prev => prev.filter(o => o.id !== id));
              toast({ title: 'Pedido eliminado correctamente' });
            } else {
              toast({ title: 'Error al eliminar', description: 'No se pudo borrar el pedido de la base de datos.', variant: 'destructive' });
            }
          } catch (e) {
            console.error('Error deleting order:', e);
            toast({ title: 'Error de red', variant: 'destructive' });
          }
        }}
        onFileUpload={handleFileUpload}
        onDownloadTemplate={() => window.open('/template.csv')}
        onSaveConfig={handleSaveConfig}
        onUpdateConfig={(c) => { setConfig(c); handleSaveConfig(c); }}
        onUpdateProductField={(id, f, v) => {
          setProducts(prev => prev.map(p => p.id === id ? { ...p, [f]: v } : p));
        }}
        onRefreshCategories={async () => setCategories(await fetch('/api/categories').then(r => r.json()))}
        addVariant={() => { 
          const v = [...(productForm.variants || [])]; 
          v.push({ 
            id: Math.random().toString(), 
            name: '', 
            sku: '', 
            price: 0, 
            stock: 99, 
            active: true, 
            sortOrder: v.length 
          }); 
          setProductForm({ ...productForm, variants: v }) 
        }}
        updateVariant={(i, f, v) => { const vr = [...(productForm.variants || [])]; vr[i] = { ...vr[i], [f]: v }; setProductForm({ ...productForm, variants: vr }) }}
        removeVariant={(i) => setProductForm({ ...productForm, variants: (productForm.variants || []).filter((_, x) => x !== i) })}
        resetProductForm={() => setProductForm({
          name: '',
          price: 0,
          description: '',
          categoryId: 'social',
          image: '',
          stock: 99,
          active: true,
          showPrice: true,
          isPack: false,
          hasVariants: false,
          variantType: '',
          variantBehavior: 'replace',
          variants: [],
          isNew: false,
          salePrice: null,
          minQuantity: 1,
          stepQuantity: 1,
          tierPricing: [],
          customOptions: null,
          supplierId: null,
          fotosIncluidas: 1
        })}
        onLogout={() => {
          localStorage.removeItem('pujalte_fast_access')
          setIsAdmin(false)
        }}
        onViewStore={() => window.location.href = '/'}
      />
    </div>
  )
}
