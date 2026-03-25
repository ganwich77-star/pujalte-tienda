'use client'

import { Plus, Trash2, GripVertical, CheckCircle2, Circle } from 'lucide-react'
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
  onSave: () => void
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Formulario de Pedido</CardTitle>
            <CardDescription>Configura los datos que pides a tus clientes durante el checkout.</CardDescription>
          </div>
          <Button onClick={addField} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Añadir Campo
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/20">
            <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-sm border-b">
              <div className="col-span-1"></div>
              <div className="col-span-3">Etiqueta</div>
              <div className="col-span-3">Placeholder</div>
              <div className="col-span-2 text-center">Requerido</div>
              <div className="col-span-2 text-center">Activo</div>
              <div className="col-span-1"></div>
            </div>
            <div className="divide-y">
              {fields.map((field) => (
                <div key={field.id} className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${!field.active ? 'opacity-50 grayscale' : 'hover:bg-muted/30'}`}>
                  <div className="col-span-1 flex justify-center text-muted-foreground cursor-grab">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      value={field.label} 
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      value={field.placeholder || ''} 
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch 
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch 
                      checked={field.active}
                      onCheckedChange={(checked) => updateField(field.id, { active: checked })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {field.isCustom && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeField(field.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onSave} className="gap-2 px-8">
              <CheckCircle2 className="h-4 w-4" /> Guardar Formulario
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary border-none">Pro Tip</Badge>
              Optimización Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>Pide solo los datos esenciales. Cada campo extra reduce la tasa de conversión en un ~5%.</p>
            <p>Para pedidos locales, la dirección puede ser opcional si el cliente recoge en tienda.</p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
              Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pointer-events-none opacity-60 scale-95 origin-top">
              {fields.filter(f => f.active).slice(0, 3).map(f => (
                <div key={f.id} className="space-y-1">
                  <Label className="text-xs">{f.label} {f.required && <span className="text-destructive">*</span>}</Label>
                  <div className="h-8 rounded border bg-background" />
                </div>
              ))}
              <p className="text-[10px] text-center italic">Y así sucesivamente...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
