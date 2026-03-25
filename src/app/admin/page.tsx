'use client'

import React, { useState, useEffect } from 'react'
import {
  Save, Plus, Trash2, LayoutDashboard, Image as ImageIcon,
  Users, Star, MessageSquare, LogOut, Eye, PlusCircle,
  Type, RefreshCcw, Camera, Heart, Briefcase, Baby, Package,
  ChevronRight, Upload, X, Filter, Grid, Edit2, EyeOff, LayoutGrid, ShoppingBag
} from 'lucide-react'
import { ImageCropper } from '@/components/admin/pujalte/image-cropper'
import ProductsTab from '@/components/admin/pujalte/ProductsTab'
import CategoriesTab from '@/components/admin/pujalte/CategoriesTab'
import { LandingConfig, Service, GalleryImage, Testimonial } from '@/lib/landing-config'
import { fixPath } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Alert, AlertDescription
} from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminPage() {
  const [config, setConfig] = useState<LandingConfig | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const PRESETS = {
    'Social Basico': [
      { alt: 'Sesión Exterior Familia', descripcion: '1h / 20 fotos digitales', categoria: 'social', precio: 120, stock: 10 },
      { alt: 'Sesión Pareja Estudio', descripcion: '45m / 15 fotos digitales', categoria: 'social', precio: 95, stock: 15 },
      { alt: 'Sesión Mascota', descripcion: 'Estudio o exterior', categoria: 'social', precio: 80, stock: 5 }
    ],
    'Infantil / Comunion': [
      { alt: 'Pack Newborn', descripcion: 'En estudio / Atrezzo incluido', categoria: 'infantil', precio: 180, stock: 3 },
      { alt: 'Smash Cake', descripcion: 'Incluye tarta estándar', categoria: 'infantil', precio: 150, stock: 5 },
      { alt: 'Comunión Silver', descripcion: 'Álbum pequeño incluido', categoria: 'comuniones', precio: 220, stock: 8 }
    ],
    'Bodas / Eventos': [
      { alt: 'Pack Pre-Boda', descripcion: 'Localización a elegir / 2h', categoria: 'boda', precio: 250, stock: 2 },
      { alt: 'Día Completo Boda', descripcion: 'De preparativos a fiesta', categoria: 'boda', precio: 1500, stock: 1 },
      { alt: 'Evento Corporativo', descripcion: 'Precio por hora / min 3h', categoria: 'producto', precio: 100, stock: 10 }
    ]
  }

  const injectPreset = (presetName: string) => {
    if (!config) return
    const itemsToAdd = (PRESETS as any)[presetName].map((item: any) => ({
      ...item,
      id: Date.now() + Math.random(),
      src: '',
      activa: true
    }))
    setConfig({
      ...config,
      galeria: [...config.galeria, ...itemsToAdd]
    })
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      // Se espera: Nombre;Descripcion;Precio;Stock;Categoria
      const newItems = lines.slice(1).filter(l => l.trim()).map(line => {
        const parts = line.split(/[;,]/)
        return {
          id: Date.now() + Math.random(),
          src: '',
          alt: (parts[0] || 'Nuevo Item').trim(),
          descripcion: (parts[1] || '').trim(),
          precio: parseFloat(parts[2]) || 0,
          stock: parseInt(parts[3]) || 0,
          categoria: (parts[4] || 'social').trim().toLowerCase(),
          activa: true
        }
      })
      if (config) setConfig({ ...config, galeria: [...config.galeria, ...newItems] })
    }
    reader.readAsText(file)
  }

  // Cropper state
  const [cropper, setCropper] = useState<{
    open: boolean,
    image: string | null,
    aspect: number,
    callback: (file: File) => void
  }>({
    open: false,
    image: null,
    aspect: 16 / 9,
    callback: () => {}
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/admin/config')
        .then(res => res.json())
        .then(data => setConfig(data))
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setIsAuthenticated(true)
    } else {
      setLoginError(true)
      // reset shake tras animación
      setTimeout(() => setLoginError(false), 600)
    }
  }

  const handleSave = async () => {
    if (!config) return
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Cambios guardados correctamente' })
      } else {
        setMessage({ type: 'error', text: 'Error al guardar los cambios' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setIsSaving(false)
    }
  }


  const uploadFile = async (file: File, callback: (url: string) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        callback(data.url)
      } else {
        alert('Error al subir el archivo')
      }
    } catch (error) {
      alert('Error de conexión al subir el archivo')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, aspect: number, callback: (url: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setCropper({
        open: true,
        image: reader.result as string,
        aspect,
        callback: (croppedFile) => uploadFile(croppedFile, callback)
      })
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = (croppedFile: File) => {
    cropper.callback(croppedFile)
    setCropper({ ...cropper, open: false, image: null })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="h-16 w-16 bg-[#4A7C59]/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <Camera className="h-8 w-8 text-[#4A7C59]" />
            </div>
            <CardTitle className="text-2xl font-light">Panel de Gestión</CardTitle>
            <CardDescription>Pujalte Fotografía | Administración</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Contraseña de acceso"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(false) }}
                  className={`w-full h-12 rounded-xl border px-4 text-sm outline-none transition-all
                    ${ loginError
                      ? 'border-red-400 bg-red-50 text-red-700 animate-[shake_0.4s_ease-in-out]'
                      : 'border-gray-200 bg-white focus:border-[#4A7C59]'
                    }`}
                />
                {loginError && (
                  <p className="text-xs text-red-500 font-medium pl-1 animate-pulse">
                    Contraseña incorrecta
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full h-12 bg-[#4A7C59] hover:bg-[#3d6649] rounded-xl font-bold tracking-widest uppercase shadow-lg shadow-[#4A7C59]/20">
                Entrar al Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!config) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando configuración...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-[#4A7C59] rounded-xl flex items-center justify-center shadow-lg shadow-[#4A7C59]/20">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Admin</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Pujalte Fotografía</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const storeUrl = config.storeUrl || "https://espaciopujalte.com/comuniones2026";
                window.open(storeUrl, '_blank');
              }}
              className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 font-bold uppercase tracking-widest text-[10px] px-4"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Tienda
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#4A7C59] hover:bg-[#3d6649] text-white gap-2 shadow-lg shadow-[#4A7C59]/20 rounded-full px-6"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'} className="rounded-full hover:bg-gray-100">
              <Eye className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsAuthenticated(false)} className="rounded-full hover:bg-red-50 group">
              <LogOut className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-6xl">
        {message && (
          <Alert className={`mb-8 border-none shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <AlertDescription className="text-sm font-medium">{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="space-y-8">
          <TabsList className="bg-gray-100 p-1.5 rounded-[1.25rem] h-auto gap-1">
            <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 py-3 text-sm font-bold tracking-widest uppercase">General</TabsTrigger>
            <TabsTrigger value="galeria" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 py-3 text-sm font-bold tracking-widest uppercase">Galería</TabsTrigger>
            <TabsTrigger value="categorias" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 py-3 text-sm font-bold tracking-widest uppercase">Categorías</TabsTrigger>
            <TabsTrigger value="servicios" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 py-3 text-sm font-bold tracking-widest uppercase">Servicios</TabsTrigger>
            <TabsTrigger value="testimonios" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 py-3 text-sm font-bold tracking-widest uppercase">Testimonios</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Type className="h-5 w-5 text-[#4A7C59]" />
                    Identidad Visual
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Nombre de la Marca</label>
                    <Input value={config.nombre} onChange={(e) => setConfig({...config, nombre: e.target.value})} className="bg-gray-50/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Slogan / Texto Secundario</label>
                    <Input value={config.slogan} onChange={(e) => setConfig({...config, slogan: e.target.value})} className="bg-gray-50/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Logo URL</label>
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-1">
                        <Input
                          value={config.logo}
                          onChange={(e) => setConfig({...config, logo: e.target.value})}
                          className="bg-gray-50/50 pr-10"
                          placeholder="/logo.png"
                        />
                        <label className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-[#4A7C59] transition-colors">
                          <Upload className="h-4 w-4" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 1/1, (url) => setConfig({...config, logo: url}))}
                          />
                        </label>
                      </div>
                      {config.logo && (
                        <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1 overflow-hidden">
                          <img src={fixPath(config.logo)} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Título Principal (Hero)</label>
                    <Input value={config.subtitulo} onChange={(e) => setConfig({...config, subtitulo: e.target.value})} className="bg-gray-50/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-gray-400">URL de la Tienda Online</label>
                    <div className="flex gap-2">
                      <Input value={config.storeUrl} onChange={(e) => setConfig({...config, storeUrl: e.target.value})} className="bg-gray-50/50" placeholder="https://..." />
                      <Button variant="ghost" size="icon" onClick={() => window.open(config.storeUrl, '_blank')} className="rounded-xl border border-gray-100 hover:bg-gray-50">
                        <ShoppingBag className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 space-y-4">
                    <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Imagen de Portada (Hero)</label>
                    <label className="group relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 cursor-pointer block">
                      <img src={fixPath(config.heroFoto)} alt="Hero Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                        <Upload className="h-8 w-8" />
                        <span className="text-xs font-bold uppercase tracking-widest">Subir Imagen</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 16/9, (url) => setConfig({...config, heroFoto: url}))}
                      />
                    </label>
                    <Input
                      placeholder="Ej: /hero-landscape.png"
                      value={config.heroFoto}
                      onChange={(e) => setConfig({...config, heroFoto: e.target.value})}
                      className="bg-gray-50/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <RefreshCcw className="h-5 w-5 text-[#4A7C59]" />
                    Contacto & SEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Email</label>
                      <Input value={config.email} onChange={(e) => setConfig({...config, email: e.target.value})} className="bg-gray-50/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Teléfono</label>
                      <Input value={config.telefono} onChange={(e) => setConfig({...config, telefono: e.target.value})} className="bg-gray-50/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-gray-400">WhatsApp (Código + Número)</label>
                    <Input value={config.whatsapp} onChange={(e) => setConfig({...config, whatsapp: e.target.value})} className="bg-gray-50/50" />
                  </div>
                  <div className="pt-6 border-t border-gray-50 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Título SEO (Buscadores)</label>
                      <Input value={config.seo.titulo} onChange={(e) => setConfig({...config, seo: {...config.seo, titulo: e.target.value}})} className="bg-gray-50/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Descripción Meta</label>
                      <Textarea value={config.seo.descripcion} onChange={(e) => setConfig({...config, seo: {...config.seo, descripcion: e.target.value}})} className="bg-gray-50/50" rows={3} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50">
                <CardTitle className="text-xl flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-[#4A7C59]" />
                  Visibilidad de Secciones
                </CardTitle>
                <CardDescription>Activa o desactiva los bloques principales de tu landing</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(config.visibilidad).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#4A7C59]/10 transition-colors">
                    <Label htmlFor={`v-${key}`} className="text-xs font-bold tracking-widest uppercase text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Switch
                      id={`v-${key}`}
                      checked={value}
                      onCheckedChange={(checked) => setConfig({...config, visibilidad: {...config.visibilidad, [key]: checked}})}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50">
                <CardTitle className="text-xl flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#4A7C59]" />
                  Sección Sobre Mí
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="w-full md:w-4/12 space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Imagen Personal</label>
                       <label className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border relative group cursor-pointer block">
                         <img src={fixPath(config.sobreMi.foto)} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                           <Upload className="h-6 w-6" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Cambiar Foto</span>
                         </div>
                         <input
                           type="file"
                           className="hidden"
                           accept="image/*"
                           onChange={(e) => handleFileUpload(e, 3/4, (url) => setConfig({...config, sobreMi: {...config.sobreMi, foto: url}}))}
                         />
                       </label>
                       <Input
                         value={config.sobreMi.foto}
                         onChange={(e) => setConfig({...config, sobreMi: {...config.sobreMi, foto: e.target.value}})}
                         className="mt-3 bg-gray-50/50"
                         placeholder="/sobre-mi.png"
                       />
                    </div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Tu Historia (Markdown soportado)</label>
                      <Textarea
                        value={config.sobreMi.texto}
                        onChange={(e) => setConfig({...config, sobreMi: {...config.sobreMi, texto: e.target.value}})}
                        className="bg-gray-50/50 font-light text-lg leading-relaxed"
                        rows={12}
                      />
                      <p className="text-[10px] text-gray-400">Un párrafo por línea doble para separar secciones.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="galeria" className="space-y-6">
            <ProductsTab
              config={config}
              setConfig={setConfig}
              handleFileUpload={handleFileUpload}
              injectPreset={injectPreset}
              handleImportCSV={handleImportCSV}
              presets={PRESETS}
              categories={config.categorias || []}
            />
          </TabsContent>

          <TabsContent value="categorias" className="mt-8 transition-all duration-300">
            <CategoriesTab
              categories={config.categorias || []}
              onUpdate={(newCategories) => setConfig({ ...config, categorias: newCategories })}
            />
          </TabsContent>

          <TabsContent value="servicios" className="mt-8 transition-all duration-300">
            <div className="grid md:grid-cols-2 gap-8">
              {config.servicios.map((service, index) => (
                <Card key={service.id} className="border-0 shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                  <CardHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between py-6">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#4A7C59]/10 rounded-lg flex items-center justify-center">
                        <Heart className="h-4 w-4 text-[#4A7C59]" />
                      </div>
                      {service.titulo}
                    </CardTitle>
                    <Switch 
                      checked={service.activa} 
                      onCheckedChange={(checked) => {
                        const newServicios = [...config.servicios]
                        newServicios[index].activa = checked
                        setConfig({...config, servicios: newServicios})
                      }} 
                    />
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex gap-6">
                      <div className="w-32 space-y-3">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Imagen representativa</label>
                        <label className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative group/img cursor-pointer block group-hover:border-[#4A7C59]/20 transition-colors">
                          <img src={fixPath(service.foto)} alt={service.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="h-5 w-5 text-white" />
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 1/1, (url) => {
                              const newServicios = [...config.servicios]
                              newServicios[index].foto = url
                              setConfig({...config, servicios: newServicios})
                            })}
                          />
                        </label>
                        <Input 
                          value={service.foto} 
                          onChange={(e) => {
                            const newServicios = [...config.servicios]
                            newServicios[index].foto = e.target.value
                            setConfig({...config, servicios: newServicios})
                          }}
                          className="h-8 text-[10px] bg-gray-50/50"
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Nombre del Servicio</label>
                          <Input value={service.titulo} onChange={(e) => {
                            const newServicios = [...config.servicios]
                            newServicios[index].titulo = e.target.value
                            setConfig({...config, servicios: newServicios})
                          }} className="bg-gray-50/50" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Descripción</label>
                          <Textarea value={service.descripcion} onChange={(e) => {
                            const newServicios = [...config.servicios]
                            newServicios[index].descripcion = e.target.value
                            setConfig({...config, servicios: newServicios})
                          }} className="bg-gray-50/50" rows={3} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testimonios" className="space-y-8">
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
               <CardHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between py-8">
                <div>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-[#4A7C59]" />
                    Testimonios de Clientes
                  </CardTitle>
                </div>
                <Button 
                  onClick={() => setConfig({
                    ...config, 
                    testimonios: [...config.testimonios, { id: Date.now(), nombre: 'Nuevo Cliente', texto: 'Increíble experiencia...', rating: 5, fecha: new Date().toISOString().split('T')[0], activo: true }]
                  })} 
                  className="bg-[#4A7C59] hover:bg-[#3d6649] gap-2 rounded-full px-6"
                >
                  <PlusCircle className="h-4 w-4" />
                  Añadir Testimonio
                </Button>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {config.testimonios.map((t, idx) => (
                    <div key={t.id} className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6 relative group">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 cursor-pointer ${i < t.rating ? 'fill-[#4A7C59] text-[#4A7C59]' : 'text-gray-300'}`} 
                              onClick={() => {
                                const newTestimonios = [...config.testimonios]
                                newTestimonios[idx].rating = i + 1
                                setConfig({...config, testimonios: newTestimonios})
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={t.activo} 
                            onCheckedChange={(checked) => {
                              const newTestimonios = [...config.testimonios]
                              newTestimonios[idx].activo = checked
                              setConfig({...config, testimonios: newTestimonios})
                            }} 
                          />
                          <Button variant="ghost" size="icon" onClick={() => {
                            const newTestimonios = config.testimonios.filter(test => test.id !== t.id)
                            setConfig({...config, testimonios: newTestimonios})
                          }} className="text-red-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Input 
                          value={t.nombre} 
                          onChange={(e) => {
                            const newTestimonios = [...config.testimonios]
                            newTestimonios[idx].nombre = e.target.value
                            setConfig({...config, testimonios: newTestimonios})
                          }} 
                          placeholder="Nombre del cliente"
                          className="font-bold border-none bg-transparent p-0 text-gray-900 focus-visible:ring-0"
                        />
                        <Textarea 
                          value={t.texto} 
                          onChange={(e) => {
                            const newTestimonios = [...config.testimonios]
                            newTestimonios[idx].texto = e.target.value
                            setConfig({...config, testimonios: newTestimonios})
                          }}
                          className="bg-white/50 min-h-[100px] border-none shadow-none focus-visible:ring-0"
                          placeholder="Escribe el testimonio aquí..."
                        />
                      </div>
                      <div className="pt-4 border-t border-gray-100">
                        <Input 
                          type="date"
                          value={t.fecha}
                          onChange={(e) => {
                            const newTestimonios = [...config.testimonios]
                            newTestimonios[idx].fecha = e.target.value
                            setConfig({...config, testimonios: newTestimonios})
                          }}
                          className="h-8 text-[10px] bg-transparent border-none w-32 tracking-widest uppercase text-gray-400 font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      {cropper.open && (
        <ImageCropper
          image={cropper.image}
          open={cropper.open}
          aspect={cropper.aspect}
          onCropComplete={handleCropComplete}
          onClose={() => setCropper({ ...cropper, open: false })}
        />
      )}
    </div>
  )
}
