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
  ExternalLink
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A7C59]/10 text-[#4A7C59] text-[10px] font-black uppercase tracking-widest italic mb-2">
            <Layout className="h-3 w-3" />
            Configuración Visual
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4 italic uppercase">
            Banners <span className="text-[#4A7C59]">Promocionales</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium max-w-lg">Gestiona el carrusel de entrada de la web. Mejora el impacto visual con contenido optimizado.</p>
        </div>
        <Button 
          onClick={handleAddPromo}
          className="bg-[#4A7C59] hover:bg-[#3d664a] rounded-2xl px-10 h-16 font-black uppercase tracking-widest text-xs shadow-2xl shadow-[#4A7C59]/20 gap-3 transition-all active:scale-95 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          Nuevo Banner
        </Button>
      </div>

      {/* Guía de Optimización Premium */}
      <div className="p-6 rounded-[2.5rem] bg-slate-50 border border-slate-200/60 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Sparkles className="h-16 w-16 text-slate-900" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1 space-y-2">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Guía de contenido para Banners
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Para que el modal de promociones se vea espectacular, te recomendamos:
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group/item hover:border-[#4A7C59]/30 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-900 uppercase">Imágenes 1:1</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">1080x1080px .webp</span>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group/item hover:border-[#4A7C59]/30 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Video className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-900 uppercase">Vídeo Vertical/1:1</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">MP4 {'<' } 5MB (Mudo)</span>
              </div>
            </div>

            <button 
              onClick={() => {
                const activePromos = promos.filter(p => p.activa);
                if (activePromos.length > 0) {
                  setPreviewPromo(activePromos[0]); // O podrías pasar lógicamente todos si PromoModal lo soporta
                } else {
                  toast({ title: "Sin banners activos", description: "Activa al menos un banner para ver la previsualización real." });
                }
              }}
              className="px-5 py-3 bg-[#4A7C59] hover:bg-[#3d664a] rounded-2xl shadow-lg flex items-center gap-4 group/item transition-all active:scale-95"
            >
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-white uppercase">Vista Previa</span>
                <span className="text-[9px] text-white/70 font-bold uppercase italic">Fidelidad 100%</span>
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
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50/50">
              <div className="h-12 w-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                {promo.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800"><Video className="h-4 w-4 text-white" /></div>
                ) : (
                  <img src={fixPath(promo.url)} className="w-full h-full object-cover" />
                )}
              </div>
              
              <AccordionTrigger className="flex-1 hover:no-underline py-0">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-[#4A7C59]">Banner #{idx + 1}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase",
                      promo.color || 'bg-slate-400'
                    )}>
                      {promo.badge}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{promo.title || 'Sin Título'}</span>
                </div>
              </AccordionTrigger>

              <div className="flex items-center gap-2 mr-0 ml-auto border-l border-slate-100 pl-4">
                <div className="flex flex-col items-center gap-1.5 px-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ver</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-10 w-10 text-slate-400 hover:text-[#4A7C59] hover:bg-[#4A7C59]/10 rounded-xl transition-colors"
                    onClick={(e) => { e.stopPropagation(); setPreviewPromo(promo); }}
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-1.5 px-3 border-l border-slate-100">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Estado</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUpdatePromo(promo.id, 'activa', !promo.activa); }}
                    className="h-10 transition-all active:scale-90 flex items-center"
                  >
                    {promo.activa ? (
                      <ToggleRight className="h-8 w-8 text-[#4A7C59]" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-300" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col items-center gap-1.5 pl-3 border-l border-slate-100">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Acciones</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                        <MoreVertical className="h-5 w-5 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-2xl">
                      <DropdownMenuItem className="rounded-xl gap-2 font-medium" onClick={() => setPreviewPromo(promo)}>
                        <Eye className="h-4 w-4" /> Previsualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl gap-2 font-medium">
                        <ExternalLink className="h-4 w-4" /> Ir al enlace
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="rounded-xl gap-2 font-medium" onClick={() => {
                        const newPromo = { ...promo, id: Math.random().toString(36).substr(2, 9), title: `${promo.title} (Copia)` };
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
                  {promo.type === 'video' ? (
                    <video src={promo.url} className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <img src={fixPath(promo.url)} alt="" className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
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
                          <SelectItem value="center" className="font-semibold py-2">🎯 Centro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-end pt-6">
        <Button 
          onClick={() => onSave(config)}
          className="bg-[#4A7C59] hover:bg-[#3d664a] rounded-2xl px-12 h-14 font-bold shadow-xl shadow-[#4A7C59]/20 transition-all active:scale-95 text-lg"
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
