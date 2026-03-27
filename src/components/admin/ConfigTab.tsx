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
  EyeOff
} from 'lucide-react'
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
        {/* Columna Izquierda: Ajustes Básicos */}
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
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 overflow-hidden bg-white/60 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-50 bg-white/80 p-8">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Métodos de Pago Activos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'card', name: 'Tarjeta Bancaria', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50', note: 'Pasarela Paycomet', checked: config.enableCard, key: 'enableCard' },
                  { id: 'bizum', name: 'Bizum / Transferencia', icon: Smartphone, color: 'text-[#00CCCC]', bg: 'bg-cyan-50', note: 'Gestión por WhatsApp', checked: config.enableBizum, key: 'enableBizum' },
                  { id: 'cash', name: 'Efectivo / Recogida', icon: Banknote, color: 'text-green-500', bg: 'bg-green-50', note: 'Pago en local', checked: config.enableCash, key: 'enableCash' }
                ].map((method) => (
                  <div key={method.id} className="group relative flex items-center justify-between p-5 rounded-[1.5rem] border border-slate-100 bg-white transition-all hover:border-[#4A7C59]/30 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl ${method.bg} flex items-center justify-center`}>
                        <method.icon className={`h-6 w-6 ${method.color}`} />
                      </div>
                      <div>
                        <Label className="text-sm font-black text-slate-900 group-hover:text-[#4A7C59] transition-colors">{method.name}</Label>
                        <p className="text-[10px] font-bold text-slate-400 italic mt-0.5">{method.note}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={method.checked} 
                      onCheckedChange={(checked) => onUpdateConfig({ ...config, [method.key]: checked })}
                      className="data-[state=checked]:bg-[#4A7C59]"
                    />
                  </div>
                ))}
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
