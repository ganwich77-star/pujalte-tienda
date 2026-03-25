'use client'

import { Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StoreConfig } from '@/types'

interface ConfigTabProps {
  config: StoreConfig
  onUpdateConfig: (config: StoreConfig) => void
  onSave: () => void
}

export function ConfigTab({ config, onUpdateConfig, onSave }: ConfigTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de la Tienda</CardTitle>
        <CardDescription>Personaliza los ajustes de tu tienda online</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Nombre de la Tienda</Label>
            <Input 
              value={config.storeName} 
              onChange={(e) => onUpdateConfig({ ...config, storeName: e.target.value })} 
              placeholder="MiTienda" 
            />
          </div>
          <div className="space-y-2">
            <Label>Número de WhatsApp</Label>
            <Input 
              value={config.whatsappNumber} 
              onChange={(e) => onUpdateConfig({ ...config, whatsappNumber: e.target.value })} 
              placeholder="34600000000" 
            />
            <p className="text-xs text-muted-foreground">Formato: código país + número (sin + ni espacios)</p>
          </div>
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select 
              value={config.currency} 
              onValueChange={(v) => onUpdateConfig({ ...config, currency: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="MXN">MXN ($)</SelectItem>
                <SelectItem value="ARS">ARS ($)</SelectItem>
                <SelectItem value="COP">COP ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-base font-semibold">Métodos de Pago</Label>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 transition-all hover:bg-muted/40">
              <div className="space-y-0.5">
                <Label className="text-sm">Tarjeta Bancaria</Label>
                <p className="text-xs text-muted-foreground italic">Pasarela Paycomet</p>
              </div>
              <Switch 
                checked={config.enableCard} 
                onCheckedChange={(checked) => onUpdateConfig({ ...config, enableCard: checked })} 
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 transition-all hover:bg-muted/40">
              <div className="space-y-0.5">
                <Label className="text-sm">Bizum</Label>
                <p className="text-xs text-muted-foreground italic">Vía WhatsApp</p>
              </div>
              <Switch 
                checked={config.enableBizum} 
                onCheckedChange={(checked) => onUpdateConfig({ ...config, enableBizum: checked })} 
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 transition-all hover:bg-muted/40">
              <div className="space-y-0.5">
                <Label className="text-sm">Efectivo / Recogida</Label>
                <p className="text-xs text-muted-foreground italic">Vía WhatsApp</p>
              </div>
              <Switch 
                checked={config.enableCash} 
                onCheckedChange={(checked) => onUpdateConfig({ ...config, enableCash: checked })} 
              />
            </div>
          </div>
        </div>
        <Separator />
 
         <div className="space-y-4">
           <Label className="text-base font-semibold">Seguridad</Label>
           <div className="grid sm:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label>Contraseña de Administrador</Label>
               <Input 
                 type="password"
                 value={config.adminPassword || ''} 
                 onChange={(e) => onUpdateConfig({ ...config, adminPassword: e.target.value })} 
                 placeholder="Dejar vacío para admin123" 
               />
               <p className="text-xs text-muted-foreground italic">Esta contraseña se usa para acceder al panel de la tienda.</p>
             </div>
           </div>
         </div>
 
         <Separator />
        <div className="flex justify-end">
          <Button onClick={onSave} className="gap-2 px-8">
            <Save className="h-4 w-4" /> Guardar Cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
