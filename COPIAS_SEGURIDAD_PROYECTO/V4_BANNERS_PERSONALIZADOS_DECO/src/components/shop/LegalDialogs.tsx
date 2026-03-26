'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LegalDialogsProps {
  storeName: string
}

export function LegalDialogs({ storeName }: LegalDialogsProps) {
  return (
    <div className="flex justify-center md:justify-end gap-6 mt-2">
      {/* Aviso Legal */}
      <Dialog>
        <DialogTrigger asChild>
          <span className="text-xs hover:text-primary cursor-pointer transition-colors font-medium">Aviso Legal</span>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Aviso Legal</DialogTitle>
            <DialogDescription>Información legal sobre {storeName}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4 text-sm text-balance">
            <div className="space-y-4">
              <p><strong>Titular:</strong> Fotodetalles y Recordatorios 2026</p>
              <p><strong>Actividad:</strong> Comercio de complementos de fotografía y eventos.</p>
              <p>Este sitio web ha sido diseñado para la venta online de artículos relacionados con eventos de comunión. El acceso al sitio implica la aceptación de los términos establecidos en este documento.</p>
              <h4 className="font-bold pt-2">1. Propiedad Intelectual</h4>
              <p>Todos los contenidos de esta web (textos, imágenes, logos) son propiedad de {storeName} salvo que se indique lo contrario. Queda prohibida su reproducción sin consentimiento.</p>
              <h4 className="font-bold pt-2">2. Responsabilidad</h4>
              <p>{storeName} no se hace responsable de los daños derivados del uso de la web ni de los contenidos de terceros enlazados.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacidad */}
      <Dialog>
        <DialogTrigger asChild>
          <span className="text-xs hover:text-primary cursor-pointer transition-colors font-medium">Privacidad</span>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Política de Privacidad</DialogTitle>
            <DialogDescription>Tratamiento de datos personales (RGPD)</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4 text-sm">
            <div className="space-y-4">
              <p><strong>Responsable del tratamiento:</strong> Fotodetalles y Recordatorios 2026</p>
              <p><strong>Finalidad:</strong> Gestión de pedidos de compra e-commerce, atención al cliente y cumplimiento de obligaciones legales.</p>
              <p><strong>Legitimación:</strong> La base legal es la ejecución del contrato de compraventa y el interés legítimo para la atención de consultas.</p>
              <p><strong>Derechos:</strong> Puedes ejercer tus derechos de acceso, rectificación, supresión y portabilidad de tus datos enviando un email a nuestro contacto oficial.</p>
              <p>Sus datos no serán cedidos a terceros salvo obligación legal o necesidad técnica para la prestación del servicio (mensajería, pasarela de pago).</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Condiciones */}
      <Dialog>
        <DialogTrigger asChild>
          <span className="text-xs hover:text-primary cursor-pointer transition-colors font-medium">Condiciones</span>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Condiciones de Venta</DialogTitle>
            <DialogDescription>Términos aplicables a tus compras</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4 text-sm">
            <div className="space-y-4">
              <h4 className="font-bold">1. Precios e Impuestos</h4>
              <p>Todos los precios mostrados incluyen el IVA legalmente aplicable en España.</p>
              <h4 className="font-bold pt-2">2. Envíos y Plazos</h4>
              <p>Los envíos se realizan a través de agencias de transporte líderes. El plazo estimado de entrega es de 3 a 7 días laborables dependiendo de la personalización de los productos.</p>
              <h4 className="font-bold pt-2">3. Devoluciones</h4>
              <p>Al tratarse de productos que pueden ser personalizados por el cliente, **no se admiten devoluciones** una vez iniciado el proceso de producción, salvo por defecto de fabricación comprobado.</p>
              <p>Para productos no personalizados, dispones de 14 días naturales para ejercer tu derecho de desistimiento.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
