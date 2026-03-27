'use client'

import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  ClipboardList, 
  Sparkles, 
  Eye 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StoreConfig, FormField } from '@/types'
import { Badge } from '@/components/ui/badge'

interface CheckoutTabProps {
  config: StoreConfig
  onUpdateConfig: (config: StoreConfig) => void
  onSave: (config?: StoreConfig) => void
}

export function CheckoutTab({ config, onUpdateConfig, onSave }: CheckoutTabProps) {
  const fields = config.formFields || []

  const updateField = (id: string, updates: Partial<FormField>) => {
    const newFields = fields.map(f => f.id === id ? { ...f, ...updates } : f)
    onUpdateConfig({ ...config, formFields: newFields })
  }

  const addField = () => {
    const newField: FormField = {
      id: `custom_${Date.now()}`,
      label: 'Nuevo Campo',
      placeholder: 'Escribe aquí...',
      type: 'text',
      required: false,
      active: true,
      isCustom: true
    }
    onUpdateConfig({ ...config, formFields: [...fields, newField] })
  }

  const removeField = (id: string) => {
    onUpdateConfig({ ...config, formFields: fields.filter(f => f.id !== id) })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <ClipboardList className="h-6 w-6 text-[#4A7C59]" />
             Formulario Checkout
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">Configura los datos que pides a tus clientes.</p>
        </div>
        <Button 
          onClick={addField} 
          className="bg-black hover:bg-black/90 text-white rounded-xl sm:rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto shadow-lg shadow-black/10 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" /> Añadir Campo
        </Button>
      </div>

      <Card className="rounded-[2rem] border-none shadow-2xl shadow-black/5 overflow-hidden bg-white/60 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100 bg-white/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Campos del Formulario</CardTitle>
            <Badge variant="outline" className="rounded-full bg-slate-50 text-[9px] font-black">{fields.length} TOTAL</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {fields.map((field) => (
              <div 
                key={field.id} 
                className={`p-4 sm:p-6 transition-all ${!field.active ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-slate-50/50'}`}
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="hidden sm:flex items-center justify-center text-slate-200 cursor-grab active:cursor-grabbing shrink-0">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Etiqueta del Campo</Label>
                      <Input 
                        value={field.label} 
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="h-11 rounded-xl bg-white border-slate-200 font-bold uppercase tracking-tight text-xs focus-visible:ring-[#4A7C59]/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mensaje de Ayuda (Placeholder)</Label>
                      <Input 
                        value={field.placeholder || ''} 
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        className="h-11 rounded-xl bg-white border-slate-200 text-xs font-medium focus-visible:ring-[#4A7C59]/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center gap-1.5">
                         <Label className="text-[8px] font-black uppercase tracking-tighter text-slate-400">Requerido</Label>
                         <Switch 
                           checked={field.required}
                           onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                           className="data-[state=checked]:bg-[#4A7C59]"
                         />
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                         <Label className="text-[8px] font-black uppercase tracking-tighter text-slate-400">Público</Label>
                         <Switch 
                           checked={field.active}
                           onCheckedChange={(checked) => updateField(field.id, { active: checked })}
                           className="data-[state=checked]:bg-[#4A7C59]"
                         />
                      </div>
                    </div>

                    {field.isCustom && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeField(field.id)}
                        className="h-10 w-10 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
           <Button 
             onClick={() => onSave(config)} 
             className="bg-[#4A7C59] hover:bg-[#3d664a] text-white rounded-xl sm:rounded-2xl px-10 h-14 font-black uppercase tracking-[0.2em] text-[10px] w-full sm:w-auto shadow-xl shadow-[#4A7C59]/20 transition-all active:scale-95"
           >
             <CheckCircle2 className="h-5 w-5 mr-3" /> Guardar Formulario
           </Button>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] border-slate-100 bg-slate-50/50 shadow-sm overflow-hidden relative group transition-all hover:bg-white">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#4A7C59] opacity-20" />
          <CardHeader>
            <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-3 text-slate-900 italic">
               <div className="h-8 w-8 rounded-xl bg-[#4A7C59]/10 flex items-center justify-center">
                 <Sparkles className="h-4 w-4 text-[#4A7C59]" />
               </div>
               Optimización Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] sm:text-xs font-medium space-y-3 text-slate-500 leading-relaxed">
            <p>Pide solo los datos esenciales. Cada campo extra reduce la tasa de conversión significativamente.</p>
            <p className="p-3 bg-white/80 rounded-xl border border-slate-100 italic">
              &quot;Para pedidos locales, la dirección puede ser opcional si el cliente recoge en tienda.&quot;
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-[2.5rem] border-slate-100 bg-slate-50/50 shadow-sm overflow-hidden relative">
          <CardHeader>
            <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-3 text-slate-900 italic">
               <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                 <Eye className="h-4 w-4 text-blue-500" />
               </div>
               Vista Previa Móvil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pointer-events-none opacity-40 scale-100 py-2">
              {fields.filter(f => f.active).slice(0, 2).map(f => (
                <div key={f.id} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                  <div className="h-10 rounded-xl border-2 border-dashed border-slate-200" />
                </div>
              ))}
              <div className="h-12 w-full rounded-2xl bg-black/10" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
