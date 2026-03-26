'use client'

import { useState } from 'react'
import { Plus, Trash2, Image as ImageIcon, Video, ToggleLeft, ToggleRight, Layout, Link as LinkIcon, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LandingConfig, Promo } from '@/lib/landing-config'
import { fixPath } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface PromosTabProps {
  config: LandingConfig
  onUpdateConfig: (config: LandingConfig) => void
  onSave: () => void
}

export function PromosTab({ config, onUpdateConfig, onSave }: PromosTabProps) {
  const promos = config.promos || []

  const handleAddPromo = () => {
    const newPromo: Promo = {
      id: Date.now(),
      type: 'image',
      url: '',
      title: 'Nueva Promoción',
      subtitle: 'Descripción breve de la oferta',
      badge: 'OFERTA',
      color: 'from-amber-400 to-orange-500',
      buttonText: 'Ver Más',
      action: 'shop',
      activa: true
    }
    onUpdateConfig({ ...config, promos: [newPromo, ...promos] })
  }

  const handleUpdatePromo = (id: string | number, field: keyof Promo, value: any) => {
    const updatedPromos = promos.map(p => p.id === id ? { ...p, [field]: value } : p)
    onUpdateConfig({ ...config, promos: updatedPromos })
  }

  const handleDeletePromo = (id: string | number) => {
    const updatedPromos = promos.filter(p => p.id !== id)
    onUpdateConfig({ ...config, promos: updatedPromos })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-[#4A7C59]" />
            Banners Promocionales
          </h2>
          <p className="text-slate-500 text-sm font-medium">Gestiona el carrusel de entrada de la web.</p>
        </div>
        <Button 
          onClick={handleAddPromo}
          className="bg-[#4A7C59] hover:bg-[#3d664a] rounded-2xl px-8 h-12 font-bold shadow-lg shadow-[#4A7C59]/20 gap-2 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" /> Nueva Promo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {promos.map((promo, index) => (
          <Card key={promo.id} className={`overflow-hidden border-2 transition-all duration-300 ${promo.activa ? 'border-slate-100 shadow-xl' : 'border-slate-100 opacity-60 grayscale'}`}>
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row h-full">
                {/* Visual Preview */}
                <div className="w-full md:w-80 h-48 md:h-auto relative bg-slate-900 overflow-hidden group">
                  {promo.type === 'video' ? (
                    <video src={promo.url} className="w-full h-full object-cover opacity-50" />
                  ) : (
                    <img src={fixPath(promo.url)} alt="" className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${promo.color} text-[8px] font-black text-white uppercase tracking-widest mb-2 shadow-lg`}>
                      {promo.badge}
                    </div>
                    <p className="text-white text-sm font-black uppercase leading-tight">{promo.title}</p>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
                    {promo.type === 'video' ? <Video className="h-4 w-4 text-white" /> : <ImageIcon className="h-4 w-4 text-white" />}
                  </div>
                </div>

                {/* Form Editor */}
                <div className="flex-1 p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4 lg:col-span-2">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</Label>
                        <Input 
                          value={promo.title}
                          onChange={(e) => handleUpdatePromo(promo.id, 'title', e.target.value)}
                          className="rounded-xl border-slate-200 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etiqueta (Badge)</Label>
                        <Input 
                          value={promo.badge}
                          onChange={(e) => handleUpdatePromo(promo.id, 'badge', e.target.value)}
                          className="rounded-xl border-slate-200 font-bold"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtítulo / Promo</Label>
                      <Input 
                        value={promo.subtitle}
                        onChange={(e) => handleUpdatePromo(promo.id, 'subtitle', e.target.value)}
                        className="rounded-xl border-slate-200 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL Imagen o Video</Label>
                      <div className="relative">
                        <Input 
                          value={promo.url}
                          onChange={(e) => handleUpdatePromo(promo.id, 'url', e.target.value)}
                          className="rounded-xl border-slate-200 pr-10"
                        />
                        <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</Label>
                        <Select value={promo.type} onValueChange={(v) => handleUpdatePromo(promo.id, 'type', v)}>
                          <SelectTrigger className="rounded-xl border-slate-200 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Imagen</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acción</Label>
                        <Select value={promo.action} onValueChange={(v) => handleUpdatePromo(promo.id, 'action', v)}>
                          <SelectTrigger className="rounded-xl border-slate-200 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shop">Ir a Tienda</SelectItem>
                            <SelectItem value="contact">Ir a Contacto</SelectItem>
                            <SelectItem value="none">Nada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Banner Activo</span>
                      <button 
                        onClick={() => handleUpdatePromo(promo.id, 'activa', !promo.activa)}
                        className="transition-all active:scale-95"
                      >
                        {promo.activa ? <ToggleRight className="h-8 w-8 text-[#4A7C59]" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
                      </button>
                    </div>

                    <Button 
                      variant="ghost"
                      onClick={() => handleDeletePromo(promo.id)}
                      className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 font-bold gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end pt-6">
          <Button 
            onClick={onSave}
            className="bg-[#4A7C59] hover:bg-[#3d664a] rounded-2xl px-12 h-14 font-bold shadow-xl shadow-[#4A7C59]/20 transition-all active:scale-95 text-lg"
          >
            Guardar Todos los Cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
