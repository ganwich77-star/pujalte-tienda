'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  ToggleLeft, 
  ToggleRight, 
  Layout, 
  Link as LinkIcon, 
  Sparkles,
  Eye,
  ChevronDown,
  MoreVertical,
  Copy,
  Download,
  ExternalLink,
  Maximize2,
  Volume2,
  VolumeX,
  MoveVertical
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LandingConfig, Promo } from '@/lib/landing-config'
import { fixPath, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PromoModal } from '@/components/landing/PromoModal'
import { ImageCropper } from './image-cropper'

interface PromosTabProps {
  config: LandingConfig
  onUpdateConfig: (config: LandingConfig) => void
  onSave: (config?: LandingConfig) => void
}

export function PromosTab({ config, onUpdateConfig, onSave }: PromosTabProps) {
  const promos = config.promos || []
  const [previewPromo, setPreviewPromo] = useState<Promo | null>(null)
  
  // Estados para el Cropper
  const [cropperOpen, setCropperOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [activePromoId, setActivePromoId] = useState<string | number | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleAddPromo = () => {
    const newPromo: Promo = {
      id: Date.now(),
      type: 'image',
      url: '',
      title: 'Nueva Promoción',
      subtitle: 'Descripción breve de la oferta',
      badge: 'OFERTA',
      color: 'from-amber-400 to-orange-500',
      action: 'shop',
      activa: true,
      buttonText: '¡Me interesa!',
      contentPosition: 'bottom-left'
    }
    onUpdateConfig({ ...config, promos: [...promos, newPromo] })
  }

  const handleUpdatePromo = (id: string | number, field: keyof Promo, value: any) => {
    let updatedPromos = promos.map(p => p.id === id ? { ...p, [field]: value } : p)
    
    // Auto-detectar tipo si se cambia la URL manualmente
    if (field === 'url' && typeof value === 'string') {
      const isVideo = value.match(/\.(mp4|mov|webm|m4v)/i) || value.includes('firebasestorage') && value.includes('video');
      if (isVideo) {
        updatedPromos = updatedPromos.map(p => p.id === id ? { ...p, type: 'video' } : p)
      } else if (value.match(/\.(jpg|jpeg|png|webp|gif|avif)/i)) {
        updatedPromos = updatedPromos.map(p => p.id === id ? { ...p, type: 'image' } : p)
      }
    }
    
    onUpdateConfig({ ...config, promos: updatedPromos })
  }

  const handleDirectUpload = async (id: string | number, file: File | Blob) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    // Detectamos tipo por el MIME del archivo
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    const detectedType = isVideo ? 'video' : 'image'

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Error en el servidor de subida')
      
      const data = await res.json()
      if (data.url) {
        // Actualizamos URL y Tipo de golpe para que la persistencia sea correcta
        const updatedPromos = promos.map(p => 
          p.id === id ? { ...p, url: data.url, type: detectedType as 'image' | 'video' } : p
        )
        onUpdateConfig({ ...config, promos: updatedPromos })
        toast({ 
          title: "Subida Exitosa", 
          description: `Se ha configurado el ${isVideo ? 'vídeo' : 'banner'} correctamente.`,
        })
      }
    } catch (e) {
      console.error("Upload error:", e)
      toast({ title: "Error en subida", description: "No se pudo subir el archivo. Revisa tu conexión.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePromo = (id: string | number) => {
    const updatedPromos = promos.filter(p => p.id !== id)
    onUpdateConfig({ ...config, promos: updatedPromos })
  }

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 px-1 md:px-0">
        <div className="space-y-1 md:space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A7C59]/10 text-[#4A7C59] text-[9px] md:text-[10px] font-black uppercase tracking-widest italic mb-1 md:mb-2">
            <Layout className="h-3 w-3" />
            Configuración Visual
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 md:gap-4 italic uppercase">
            Banners <span className="text-[#4A7C59]">Promocionales</span>
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium max-w-lg">Gestiona el carrusel de entrada de la web. Mejora el impacto visual con contenido optimizado.</p>
        </div>
        <Button 
          onClick={handleAddPromo}
          className="w-full md:w-auto bg-[#4A7C59] hover:bg-[#3d664a] rounded-2xl px-6 md:px-10 h-14 md:h-16 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl shadow-[#4A7C59]/20 gap-3 transition-all active:scale-95 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          Nuevo Banner
        </Button>
      </div>

      {/* Guía de Optimización Premium */}
      <div className="p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-slate-50 border border-slate-200/60 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Sparkles className="h-16 w-16 text-slate-900" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 md:gap-8">
          <div className="flex-1 space-y-1 md:space-y-2">
            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Guía de contenido para Banners
            </h4>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">
              Para que el modal de promociones se vea espectacular, te recomendamos:
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
            <div className="flex-1 sm:flex-initial px-4 md:px-5 py-2.5 md:py-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 group/item hover:border-[#4A7C59]/30 transition-colors">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <ImageIcon className="h-4 md:h-5 w-4 md:w-5 text-amber-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase truncate">Imágenes 1:1</span>
                <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase truncate">1080x1080px .webp</span>
              </div>
            </div>
            
            <div className="flex-1 sm:flex-initial px-4 md:px-5 py-2.5 md:py-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 group/item hover:border-[#4A7C59]/30 transition-colors">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Video className="h-4 md:h-5 w-4 md:w-5 text-blue-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase truncate">Vídeo Vertical/1:1</span>
                <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase truncate">MP4 {'<' } 5MB (Mudo)</span>
              </div>
            </div>

            <button 
              onClick={() => {
                const activePromos = promos.filter(p => p.activa);
                if (activePromos.length > 0) {
                  setPreviewPromo(activePromos[0]);
                } else {
                  toast({ title: "Sin banners activos", description: "Activa al menos un banner para ver la previsualización real." });
                }
              }}
              className="w-full sm:w-auto px-4 md:px-5 py-2.5 md:py-3 bg-[#4A7C59] hover:bg-[#3d664a] rounded-2xl shadow-lg flex items-center gap-3 md:gap-4 group/item transition-all active:scale-95"
            >
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Eye className="h-4 md:h-5 w-4 md:w-5 text-white" />
              </div>
              <div className="flex flex-col items-start px-2 md:px-0">
                <span className="text-[9px] md:text-[10px] font-black text-white uppercase">Vista Previa</span>
                <span className="text-[8px] md:text-[9px] text-white/70 font-bold uppercase italic">Fidelidad 100%</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {promos.map((promo, idx) => (
          <AccordionItem 
            key={promo.id} 
            value={`item-${promo.id}`} 
            className={cn(
              "border-2 rounded-[2rem] overflow-hidden transition-all duration-300 bg-white",
              promo.activa ? 'border-slate-100 shadow-md' : 'border-slate-100 opacity-70 grayscale'
            )}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 md:px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="h-12 w-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                  {promo.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800"><Video className="h-4 w-4 text-white" /></div>
                  ) : (
                    <img src={fixPath(promo.url)} className="w-full h-full object-cover" />
                  )}
                </div>
                
                <AccordionTrigger className="flex-1 hover:no-underline py-0 justify-start">
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-[#4A7C59]">Banner #{idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase",
                          promo.color || 'bg-slate-400'
                        )}>
                          {promo.badge}
                        </span>
                        {promo.zoom && (
                          <div className="h-4 w-4 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                            <Maximize2 className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 text-left line-clamp-1">{promo.title || 'Sin Título'}</span>
                  </div>
                </AccordionTrigger>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto sm:mr-0 sm:ml-auto border-t sm:border-t-0 sm:border-l border-slate-200/60 sm:pl-4 pt-3 sm:pt-0 mt-1 sm:mt-0">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1 px-2 md:px-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ver</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-9 w-9 md:h-10 md:w-10 text-slate-400 hover:text-[#4A7C59] hover:bg-[#4A7C59]/10 rounded-xl transition-colors"
                      onClick={(e) => { e.stopPropagation(); setPreviewPromo(promo); }}
                    >
                      <Eye className="h-4 w-4 md:h-4.5 md:w-4.5" />
                    </Button>
                  </div>

                  <div className="flex flex-col items-center gap-1 px-2 md:px-3 border-l border-slate-200/60">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Estado</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpdatePromo(promo.id, 'activa', !promo.activa); }}
                      className="h-9 md:h-10 transition-all active:scale-90 flex items-center"
                    >
                      {promo.activa ? (
                        <ToggleRight className="h-7 w-7 md:h-8 md:w-8 text-[#4A7C59]" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 md:h-8 md:w-8 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 pl-3 border-l border-slate-200/60">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Acciones</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-xl hover:bg-slate-100">
                        <MoreVertical className="h-5 w-5 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-2xl">
                      <DropdownMenuItem className="rounded-xl gap-2 font-medium" onClick={() => setPreviewPromo(promo)}>
                        <Eye className="h-4 w-4" /> Previsualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl gap-2 font-medium" onClick={() => promo.url && window.open(fixPath(promo.url), '_blank')}>
                        <ExternalLink className="h-4 w-4" /> Ver Archivo Original
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="rounded-xl gap-2 font-medium" onClick={() => {
                        const newPromo = { ...promo, id: Date.now(), title: `${promo.title} (Copia)` };
                        onUpdateConfig({ ...config, promos: [...promos, newPromo] });
                        toast({ title: "Banner Duplicado", description: "Se ha creado una copia correctamente." });
                      }}>
                        <Copy className="h-4 w-4" /> Duplicar Banner
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="rounded-xl gap-2 font-medium text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => {
                          handleDeletePromo(promo.id);
                          toast({ title: "Eliminado", description: "Banner borrado" });
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar Permanentemente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <AccordionContent className="p-8 pt-0 border-t border-slate-100 bg-white">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
                <div className="relative aspect-video rounded-3xl bg-slate-900 overflow-hidden shadow-inner group">
                  {promo.type === 'video' || promo.url?.match(/\.(mp4|mov|webm|m4v)/i) ? (
                    <video 
                      src={fixPath(promo.url)} 
                      muted 
                      playsInline 
                      autoPlay 
                      loop
                      className="w-full h-full object-cover opacity-80 transition-all duration-300" 
                      style={{ 
                        transform: promo.zoom ? `scale(${promo.zoomScale || 1.1})` : 'scale(1)',
                        transformOrigin: `center ${promo.zoomY ?? 50}%`
                      }}
                    />
                  ) : (
                    <img 
                      src={fixPath(promo.url)} 
                      alt="" 
                      className="w-full h-full object-cover opacity-80 transition-all duration-300" 
                      style={{ 
                        transform: promo.zoom ? `scale(${promo.zoomScale || 1.1})` : 'scale(1)',
                        transformOrigin: `center ${promo.zoomY ?? 50}%`
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <div className={cn(
                      "absolute flex flex-col gap-2 p-4",
                      promo.contentPosition === 'top-left' && "top-0 left-0 text-left",
                      promo.contentPosition === 'top-right' && "top-0 right-0 text-right",
                      promo.contentPosition === 'bottom-left' && "bottom-0 left-0 text-left",
                      promo.contentPosition === 'bottom-right' && "bottom-0 right-0 text-right",
                      promo.contentPosition === 'center' && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center",
                      !promo.contentPosition && "bottom-0 left-0 text-left"
                    )}>
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-[6px] font-black text-white uppercase mb-1 shadow-sm",
                        promo.color ? `bg-gradient-to-r ${promo.color}` : 'bg-slate-400'
                      )}>
                        {promo.badge}
                      </span>
                      <p className="text-white text-[10px] font-black leading-tight drop-shadow-md">{promo.title}</p>
                    </div>
                  </div>
                  <Button 
                    variant="secondary"
                    className="absolute top-3 right-3 h-8 px-3 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 text-[9px] font-black uppercase"
                    onClick={() => setPreviewPromo(promo)}
                  >
                    <Eye className="h-3 w-3 mr-2" /> Probar
                  </Button>
                </div>

                <div className="space-y-8 lg:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Título</Label>
                      <Input value={promo.title} onChange={(e) => handleUpdatePromo(promo.id, 'title', e.target.value)} className="rounded-xl font-bold h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Badge</Label>
                      <Input value={promo.badge} onChange={(e) => handleUpdatePromo(promo.id, 'badge', e.target.value)} className="rounded-xl font-bold h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Subtítulo</Label>
                    <Input value={promo.subtitle} onChange={(e) => handleUpdatePromo(promo.id, 'subtitle', e.target.value)} className="rounded-xl font-bold h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Media URL</Label>
                    <div className="flex gap-2">
                      <Input value={promo.url} onChange={(e) => handleUpdatePromo(promo.id, 'url', e.target.value)} className="rounded-xl font-bold h-11 flex-1" />
                      <Button 
                        variant="outline" 
                        className={cn("h-11 rounded-xl px-4 border-dashed", isUploading && "animate-pulse")}
                        disabled={isUploading}
                        onClick={() => document.getElementById(`file-${promo.id}`)?.click()}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <input 
                        id={`file-${promo.id}`} 
                        type="file" 
                        accept="image/*,video/*"
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setImageToCrop(reader.result as string);
                              setActivePromoId(promo.id);
                              setCropperOpen(true);
                            };
                            reader.readAsDataURL(file);
                          } else if (file.type.startsWith('video/')) {
                            // Validación de vídeo (subimos a 20MB para dar más margen)
                            if (file.size > 20 * 1024 * 1024) {
                              toast({ title: "Vídeo demasiado grande", description: "El archivo supera los 20MB. Por favor, comprímelo un poco.", variant: "destructive" });
                              return;
                            }
                            handleDirectUpload(promo.id, file);
                          }
                        }} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mt-6 bg-slate-100/50 p-6 rounded-2xl border border-slate-200/60">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500/80 ml-1 tracking-wider">Tipo de Media</Label>
                      <Select value={promo.type} onValueChange={(v) => handleUpdatePromo(promo.id, 'type', v)}>
                        <SelectTrigger className="rounded-xl font-bold h-12 bg-white border-slate-200 shadow-sm transition-all hover:border-[#4A7C59]/40 hover:shadow-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="image" className="font-semibold py-3 cursor-pointer">✨ Imagen Optimizado</SelectItem>
                          <SelectItem value="video" className="font-semibold py-3 cursor-pointer">🎬 Vídeo en Bucle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500/80 ml-1 tracking-wider">Destino Acción</Label>
                      <Select value={promo.action} onValueChange={(v) => handleUpdatePromo(promo.id, 'action', v)}>
                        <SelectTrigger className="rounded-xl font-bold h-12 bg-white border-slate-200 shadow-sm transition-all hover:border-[#4A7C59]/40 hover:shadow-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="shop" className="font-semibold py-3 cursor-pointer">🛍️ Ir a la Tienda</SelectItem>
                          <SelectItem value="contact" className="font-semibold py-3 cursor-pointer">📞 Ir a Contacto</SelectItem>
                          <SelectItem value="none" className="font-semibold py-3 cursor-pointer">❌ Sin Acción</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500/80 ml-1 tracking-wider">Texto del Botón</Label>
                      <Select 
                        value={promo.buttonText} 
                        onValueChange={(v) => handleUpdatePromo(promo.id, 'buttonText', v)}
                      >
                        <SelectTrigger className="rounded-xl font-bold h-12 bg-white border-slate-200 shadow-sm transition-all hover:border-[#4A7C59]/40 hover:shadow-md">
                          <SelectValue placeholder="Elige un texto..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="¡Me interesa!" className="font-semibold py-2">¡Me interesa!</SelectItem>
                          <SelectItem value="Ver Tienda" className="font-semibold py-2">Ver Tienda</SelectItem>
                          <SelectItem value="Comprar Ahora" className="font-semibold py-2">Comprar Ahora</SelectItem>
                          <SelectItem value="Más Información" className="font-semibold py-2">Más Información</SelectItem>
                          <SelectItem value="Ver Modelos" className="font-semibold py-2">Ver Modelos</SelectItem>
                          <SelectItem value="Reservar" className="font-semibold py-2">Reservar</SelectItem>
                          <SelectItem value="Descubrir" className="font-semibold py-2">Descubrir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500/80 ml-1 tracking-wider">Posición Contenido</Label>
                      <Select value={promo.contentPosition || 'bottom-left'} onValueChange={(v) => handleUpdatePromo(promo.id, 'contentPosition', v)}>
                        <SelectTrigger className="rounded-xl font-bold h-12 bg-white border-slate-200 shadow-sm transition-all hover:border-[#4A7C59]/40 hover:shadow-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="top-left" className="font-semibold py-2">↖️ Arriba Izq</SelectItem>
                          <SelectItem value="top-right" className="font-semibold py-2">↗️ Arriba Der</SelectItem>
                          <SelectItem value="bottom-left" className="font-semibold py-2">↙️ Abajo Izq</SelectItem>
                          <SelectItem value="bottom-right" className="font-semibold py-2">↘️ Abajo Der</SelectItem>
                          <SelectItem value="center" className="font-semibold py-2">🎯 Centro (Superpuesto)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 mt-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500/80 mb-2 tracking-wider flex items-center gap-2">
                          Zoom & Audio
                        </Label>
                        <div className="bg-slate-50/80 rounded-[2.5rem] border border-slate-200 p-6 shadow-[-4px_-4px_12px_rgba(255,255,255,0.8),inset_2px_2px_8px_rgba(0,0,0,0.05)] space-y-6">
                          {/* FILA DE INTERRUPTORES */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* ZOOM TOGGLE */}
                            <div className={cn(
                              "flex items-center justify-between p-4 rounded-[1.5rem] border transition-all duration-300",
                              promo.zoom ? "bg-white border-[#4A7C59]/20 shadow-sm" : "bg-slate-100/50 border-slate-200"
                            )}>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-xl transition-colors",
                                  promo.zoom ? "bg-[#4A7C59] text-white" : "bg-white border border-slate-200 text-slate-300 shadow-sm"
                                )}>
                                  <Maximize2 className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Efecto Zoom</span>
                              </div>
                              <Switch 
                                checked={promo.zoom || false} 
                                onCheckedChange={(checked) => handleUpdatePromo(promo.id, 'zoom', checked)}
                                className="data-[state=checked]:bg-[#4A7C59] scale-90"
                              />
                            </div>

                            {/* AUDIO TOGGLE (Si es video) */}
                            {(promo.type === 'video' || promo.url?.match(/\.(mp4|mov|webm|m4v)/i)) && (
                              <div className={cn(
                                "flex items-center justify-between p-4 rounded-[1.5rem] border transition-all duration-300",
                                promo.muted ? "bg-white border-amber-200 shadow-sm" : "bg-slate-100/50 border-slate-200"
                              )}>
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    promo.muted ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-300 shadow-sm"
                                  )}>
                                    {promo.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                  </div>
                                  <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Silenciar Vídeo</span>
                                </div>
                                <Switch 
                                  checked={promo.muted !== false} 
                                  onCheckedChange={(checked) => handleUpdatePromo(promo.id, 'muted', checked)}
                                  className="data-[state=checked]:bg-amber-500 scale-90"
                                />
                              </div>
                            )}
                          </div>

                          {/* FILA DE SLIDERS (Solo si zoom está activo) */}
                          <AnimatePresence>
                            {promo.zoom && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 px-2"
                              >
                                {/* Slider Intensidad */}
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Intensidad</label>
                                    <span className="text-[10px] font-black text-[#4A7C59] bg-[#4A7C59]/5 px-2 py-0.5 rounded-md border border-[#4A7C59]/10">
                                      {(promo.zoomScale || 1.25).toFixed(2)}x
                                    </span>
                                  </div>
                                  <Slider
                                    defaultValue={[promo.zoomScale || 1.25]}
                                    max={1.5}
                                    min={1.05}
                                    step={0.01}
                                    onValueChange={([val]) => handleUpdatePromo(promo.id, 'zoomScale', val)}
                                    className="py-1 cursor-pointer"
                                  />
                                </div>

                                {/* Slider Eje Y */}
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Punto Enfoque</label>
                                    <span className="text-[10px] font-black text-[#4A7C59] bg-[#4A7C59]/5 px-2 py-0.5 rounded-md border border-[#4A7C59]/10">
                                      {Math.round(promo.zoomY ?? 50)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-black text-slate-300">UP</span>
                                    <Slider
                                      defaultValue={[promo.zoomY ?? 50]}
                                      max={100}
                                      min={0}
                                      step={1}
                                      onValueChange={([val]) => handleUpdatePromo(promo.id, 'zoomY', val)}
                                      className="flex-1 py-1 cursor-pointer"
                                    />
                                    <span className="text-[8px] font-black text-slate-300">DW</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
        <Button 
          onClick={() => onSave(config)}
          className="w-full sm:w-auto bg-[#4A7C59] hover:bg-[#3d664a] rounded-2xl px-12 h-14 md:h-16 font-black uppercase tracking-widest text-sm md:text-lg shadow-xl shadow-[#4A7C59]/20 transition-all active:scale-95"
        >
          Guardar Todos los Cambios
        </Button>
      </div>

      <AnimatePresence>
        {previewPromo && (
          <PromoModal 
            promos={[previewPromo]}
            onClose={() => setPreviewPromo(null)}
            onOpenStore={() => { 
              setPreviewPromo(null)
            }}
            onContact={() => { 
              setPreviewPromo(null)
            }}
          />
        )}
      </AnimatePresence>

      <ImageCropper
        image={imageToCrop}
        open={cropperOpen}
        onClose={() => {
          setCropperOpen(false)
          setImageToCrop(null)
        }}
        onCropComplete={(croppedFile) => {
          if (activePromoId) {
            handleDirectUpload(activePromoId, croppedFile)
          }
        }}
        aspect={16 / 9}
      />
    </div>
  )
}
