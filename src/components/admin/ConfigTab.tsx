'use client'

import { useState } from 'react'
import { 
  Save, 
  Settings, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ShieldCheck, 
  Globe, 
  MessageSquare,
  Sparkles,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Trash2,
  Info,
  Layers,
  Plus
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StoreConfig } from '@/types'
import { Badge } from '@/components/ui/badge'

interface ConfigTabProps {
  config: StoreConfig
  onUpdateConfig: (config: StoreConfig) => void
  onSave: (config?: StoreConfig) => void
}

export function ConfigTab({ config, onUpdateConfig, onSave }: ConfigTabProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Inicializar categorías por defecto si están vacías
  useState(() => {
    if (!config.sessionTypes || config.sessionTypes.length === 0) {
      onUpdateConfig({
        ...config,
        sessionTypes: ['COMUNIONES', 'BODAS', 'ESTUDIO', 'EXTERIORES']
      })
    }
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const storageRef = ref(storage, `config/logo_${Date.now()}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          onUpdateConfig({ ...config, logoUrl: url })
          resolve(url)
        })
      })
      toast({ title: "Logo actualizado", description: "El logo se ha subido correctamente." })
    } catch (error) {
      console.error("Error subiendo logo:", error)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const removeLogo = () => {
    onUpdateConfig({ ...config, logoUrl: null })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Settings className="h-6 w-6 text-[#4A7C59]" />
             Ajustes Globales
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">Configura el comportamiento y pagos de tu tienda.</p>
        </div>
        <Button 
          onClick={() => onSave(config)} 
          className="bg-[#4A7C59] hover:bg-[#3d664a] text-white rounded-xl sm:rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto shadow-lg shadow-[#4A7C59]/10 transition-all active:scale-95"
        >
          <Save className="h-4 w-4 mr-2" /> Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Ajustes Básicos e Identidad */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 overflow-hidden bg-white/60 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-50 bg-white/80 p-8">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Identidad y Localización
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre de la Tienda</Label>
                  <Input 
                    value={config.storeName} 
                    onChange={(e) => onUpdateConfig({ ...config, storeName: e.target.value })} 
                    placeholder="MiTienda" 
                    className="h-14 rounded-2xl border-slate-200 bg-white font-black text-slate-900 focus-visible:ring-[#4A7C59]/20"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Moneda Principal</Label>
                  <Select 
                    value={config.currency} 
                    onValueChange={(v) => onUpdateConfig({ ...config, currency: v })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                      <SelectItem value="USD">USD ($) - Dólar</SelectItem>
                      <SelectItem value="MXN">MXN ($) - Peso Mexicano</SelectItem>
                      <SelectItem value="ARS">ARS ($) - Peso Argentino</SelectItem>
                      <SelectItem value="COP">COP ($) - Peso Colombiano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">WhatsApp de Pedidos</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      value={config.whatsappNumber} 
                      onChange={(e) => onUpdateConfig({ ...config, whatsappNumber: e.target.value })} 
                      placeholder="34600000000" 
                      className="h-14 rounded-2xl border-slate-200 bg-white pl-12 font-bold tracking-wider text-slate-900 focus-visible:ring-[#4A7C59]/20"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-1">Formato: código país + número (ej: 34678000111)</p>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* GESTIÓN DE LOGO Y OPACIDAD */}
              <div className="space-y-6">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Logotipo de Marca
                </CardTitle>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Logo de la sesión</Label>
                    <div className="relative group aspect-square max-w-[200px] rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-4 text-center transition-all hover:border-[#4A7C59]/40 hover:bg-slate-100/50">
                      {config.logoUrl ? (
                        <>
                          <img 
                            src={config.logoUrl} 
                            alt="Logo" 
                            className="max-w-full max-h-full object-contain transition-opacity" 
                            style={{ opacity: (config.logoOpacity ?? 100) / 100 }}
                          />
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform flex gap-2">
                            <Button 
                              size="icon" 
                              variant="destructive" 
                              className="w-full h-9 rounded-xl"
                              onClick={removeLogo}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto">
                            {isUploadingLogo ? <span className="animate-spin text-slate-300">/</span> : <Upload className="h-5 w-5 text-slate-400" />}
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subir Logo</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="space-y-4">
                       <div className="flex justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Opacidad Logo</Label>
                          <span className="text-[10px] font-black text-[#4A7C59]">{config.logoOpacity ?? 100}%</span>
                       </div>
                       <Slider 
                         value={[config.logoOpacity ?? 100]} 
                         onValueChange={([val]) => onUpdateConfig({ ...config, logoOpacity: val })}
                         max={100}
                         step={1}
                         className="py-4"
                       />
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3">
                       <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                       <p className="text-[10px] font-medium text-slate-500 leading-relaxed">PujalteFotografía recomienda un 100% para logos de cliente y un 15-20% para marcas de agua sobre fotos.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NUEVA SECCIÓN: PASAPORTE DIGITAL */}
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-emerald-900/5 overflow-hidden bg-white/60 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-50 bg-white/80 p-8">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-[#4A7C59] flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Pasaporte Digital de Fidelidad
              </CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 mt-2 italic">Define los premios que ganarán tus clientes al acumular sesiones contigo.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                {(config.loyaltyMilestones || []).map((milestone, idx) => (
                  <div key={milestone.id} className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 group animate-in slide-in-from-right-2">
                    <div className="space-y-1 flex-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-[#4A7C59] pl-1">Al Sello nº</Label>
                      <Input 
                         type="number"
                         value={milestone.sessions}
                         onChange={(e) => {
                           const newMilestones = [...(config.loyaltyMilestones || [])];
                           newMilestones[idx].sessions = parseInt(e.target.value) || 0;
                           onUpdateConfig({ ...config, loyaltyMilestones: newMilestones });
                         }}
                         className="h-11 rounded-[1.25rem] bg-white border-slate-200 font-black text-slate-900 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1 flex-[3]">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Premio / Regalo</Label>
                      <div className="relative group/reward">
                        <Input 
                          value={milestone.reward}
                          onChange={(e) => {
                            const newMilestones = [...(config.loyaltyMilestones || [])];
                            newMilestones[idx].reward = e.target.value;
                            onUpdateConfig({ ...config, loyaltyMilestones: newMilestones });
                          }}
                          placeholder="Ej: Ampliación 30x40"
                          className="h-11 rounded-[1.25rem] bg-white border-slate-200 font-bold text-slate-700 pl-4 group-hover/reward:border-emerald-200 transition-all"
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        onUpdateConfig({ ...config, loyaltyMilestones: config.loyaltyMilestones?.filter((_, i) => i !== idx) });
                      }}
                      className="h-11 w-11 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {(!config.loyaltyMilestones || config.loyaltyMilestones.length === 0) && (
                  <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Crea tu primer hito para empezar</p>
                  </div>
                )}

                <Button 
                  variant="outline"
                  onClick={() => {
                    const newMilestones = [...(config.loyaltyMilestones || [])];
                    const nextSession = newMilestones.length > 0 ? Math.max(...newMilestones.map(m => m.sessions)) + 1 : 1;
                    newMilestones.push({ id: Math.random().toString(36).substring(2, 9), sessions: nextSession, reward: '' });
                    onUpdateConfig({ ...config, loyaltyMilestones: newMilestones });
                  }}
                  className="w-full h-14 rounded-2xl border-dashed border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 font-black uppercase tracking-widest text-[10px] gap-3 transition-all active:scale-95"
                >
                  <Plus className="h-5 w-5" /> Añadir Hito de Regalo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Seguridad y Estadisticas Rápidas */}
        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-blue-900/5 overflow-hidden bg-slate-900 text-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Acceso Administrativo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña de Panel</Label>
                <div className="relative group/pass">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={config.adminPassword || ''} 
                    onChange={(e) => onUpdateConfig({ ...config, adminPassword: e.target.value })} 
                    placeholder="admin123" 
                    className="h-14 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/20 font-black tracking-widest focus-visible:ring-white/20 pr-14 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[#4A7C59]">
                   <Sparkles className="h-4 w-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Seguridad Max</span>
                </div>
                <p className="text-[10px] font-medium text-white/60 leading-relaxed">
                  Cambia esta contraseña periódicamente para proteger los datos de tus clientes y pedidos.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2.5rem] bg-[#4A7C59] text-white shadow-xl shadow-[#4A7C59]/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-150" />
            <h3 className="text-lg font-black tracking-tight mb-2">Estado de la Tienda</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-black/10 p-3 rounded-xl border border-white/5">
                 <span className="text-[10px] font-black uppercase opacity-60">Visibilidad</span>
                 <Badge className="bg-white text-[#4A7C59] rounded-full text-[9px] font-black py-0">ONLINE</Badge>
               </div>
               <div className="flex justify-between items-center bg-black/10 p-3 rounded-xl border border-white/5">
                 <span className="text-[10px] font-black uppercase opacity-60">Pedidos Hoy</span>
                 <span className="text-sm font-black">0</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
