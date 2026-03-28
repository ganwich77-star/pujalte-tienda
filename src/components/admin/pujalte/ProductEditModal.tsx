'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Trash2, Upload, LayoutGrid, Eye, EyeOff, Package, Pencil, 
  CheckCircle2, Euro, Layers, Scale, Hash, PlusCircle, X,
  Sparkles, ArrowRight, BarChart3, Clock, Layers2, ShieldCheck,
  Percent, Tag, Info, AlertCircle, Plus, ChevronDown, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GalleryImage } from '@/lib/landing-config'
// Función de seguridad local para evitar ReferenceError
const fixPath = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return path.startsWith('/') ? path : `/${path}`
}

import { motion, AnimatePresence } from 'framer-motion'

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: GalleryImage | null;
  onSave: (updatedProduct: GalleryImage) => void;
  categories: string[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, aspect: number, callback: (url: string) => void) => void;
}

interface TierPrice {
  minQty: number;
  price: number;
}

export default function ProductEditModal({ 
  isOpen, 
  onClose, 
  product, 
  onSave, 
  categories,
  handleFileUpload
}: ProductEditModalProps) {
  const [editedProduct, setEditedProduct] = useState<GalleryImage | null>(null);
  const [tierPrices, setTierPrices] = useState<TierPrice[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product });
      try {
        let tiers: any[] = [];
        if (product.tierPricing) {
          tiers = typeof product.tierPricing === 'string' 
            ? JSON.parse(product.tierPricing) 
            : product.tierPricing;
        }
        // Normalizar qty -> minQty por si acaso
        const normalizedTiers = (Array.isArray(tiers) ? tiers : []).map(t => ({
          minQty: Number(t.minQty || t.qty || 0),
          price: Number(t.price || 0)
        }));
        setTierPrices(normalizedTiers);
      } catch (e) {
        console.error("Error al cargar tramos:", e);
        setTierPrices([]);
      }
    }
  }, [product, isOpen]);

  if (!editedProduct) return null;

  const updateProduct = (updates: Partial<GalleryImage>) => {
    setEditedProduct(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleSave = () => {
    if (!editedProduct) return;
    
    // Función auxiliar para parsear números de forma segura (soporta coma decimal)
    const parseSafeNumber = (val: any) => {
      if (val === null || val === undefined || val === '') return 0;
      if (typeof val === 'number') return val;
      const parsed = parseFloat(String(val).replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    };

    // Filtrar, limpiar y ordenar tramos de forma robusta
    const validTiers = tierPrices
      .filter(t => (parseSafeNumber(t.minQty) > 0 && parseSafeNumber(t.price) > 0))
      .map(t => ({
        minQty: Math.round(parseSafeNumber(t.minQty)),
        price: parseSafeNumber(t.price)
      }))
      .sort((a, b) => a.minQty - b.minQty);

    const finalProduct: GalleryImage = {
      ...editedProduct,
      precio: parseSafeNumber(editedProduct.precio),
      salePrice: editedProduct.salePrice ? parseSafeNumber(editedProduct.salePrice) : undefined,
      tierPricing: validTiers.length > 0 ? JSON.stringify(validTiers) : undefined
    };

    onSave(finalProduct);
    onClose();
  };

  const addTier = () => {
    setTierPrices([...tierPrices, { minQty: 0, price: 0 }]);
  };

  const removeTier = (index: number) => {
    setTierPrices(tierPrices.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, updates: Partial<TierPrice>) => {
    const newTiers = [...tierPrices];
    newTiers[index] = { ...newTiers[index], ...updates };
    setTierPrices(newTiers);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 border-none bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto md:max-h-[90vh]">
        
        {/* SIDEBAR COMPACTO */}
        <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Editor Pro</p>
              <p className="text-xs font-bold text-white uppercase italic">Pujalte Studio</p>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
            <SidebarTab 
              active={activeTab === 'general'} 
              onClick={() => setActiveTab('general')}
              icon={<LayoutGrid className="h-4 w-4" />}
              label="General"
            />
            <SidebarTab 
              active={activeTab === 'precios'} 
              onClick={() => setActiveTab('precios')}
              icon={<BarChart3 className="h-4 w-4" />}
              label="Precios"
            />
            <SidebarTab 
              active={activeTab === 'variantes'} 
              onClick={() => setActiveTab('variantes')}
              icon={<Layers2 className="h-4 w-4" />}
              label="Variantes"
            />
          </nav>

          <div className="mt-8 hidden md:block px-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Data Guard Active</span>
              </div>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest italic leading-tight">Sincronización automática con motor de tienda v2.4</p>
            </div>
          </div>

          <div className="mt-auto hidden md:flex items-center gap-3 p-2 pt-6 border-t border-white/5">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
             <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] italic">Online Node 01</span>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div 
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col lg:flex-row gap-8">
                     {/* IMAGEN PRODUCTO */}
                     <div className="lg:w-48 shrink-0">
                        <label className="group relative aspect-square rounded-3xl overflow-hidden bg-white shadow-xl border-2 border-white cursor-pointer block hover:scale-[1.02] transition-transform duration-500">
                          {editedProduct.src ? (
                            <img src={fixPath(editedProduct.src)} alt={editedProduct.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-slate-200 gap-2">
                              <Upload className="h-8 w-8" />
                              <span className="text-[8px] font-black uppercase tracking-widest italic opacity-40">Subir Activo</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Pencil className="h-6 w-6 text-white" />
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, 1, (url) => updateProduct({ src: url }))} 
                          />
                        </label>
                        <div className="mt-4 px-2">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic text-center">Formato: JPG/PNG/WEBP</p>
                        </div>
                     </div>

                     <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic flex items-center gap-2">
                            <Info className="h-3 w-3" /> Información Básica
                          </Label>
                          <Input 
                            value={editedProduct.alt} 
                            onChange={(e) => updateProduct({ alt: e.target.value })}
                            className="h-14 bg-white border-2 border-slate-100 rounded-2xl font-black text-xl px-6 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-100 uppercase italic tracking-tighter"
                            placeholder="NOMBRE DEL PRODUCTO"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Categoría</Label>
                            <Select value={editedProduct.categoria} onValueChange={(val) => updateProduct({ categoria: val })}>
                              <SelectTrigger className="h-12 bg-white border-2 border-slate-100 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-none">
                                {categories.map(cat => (
                                  <SelectItem key={cat} value={cat} className="uppercase font-black text-[9px] tracking-widest py-3">
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Estado Stock</Label>
                            <div className="flex items-center h-12 bg-white border-2 border-slate-100 rounded-xl px-4 gap-4">
                               <Switch 
                                 checked={editedProduct.activa !== false} 
                                 onCheckedChange={(c) => updateProduct({ activa: c })}
                                 className="data-[state=checked]:bg-emerald-500"
                               />
                               <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-600">
                                 {editedProduct.activa !== false ? 'Publicado' : 'Borrador'}
                               </span>
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Descripción Corta</Label>
                       <textarea 
                        value={editedProduct.descripcion || ''} 
                        onChange={(e) => updateProduct({ descripcion: e.target.value })}
                        className="w-full h-32 bg-white border-2 border-slate-100 rounded-2xl font-bold text-xs px-6 py-4 focus:border-slate-300 outline-none transition-all shadow-sm resize-none italic leading-relaxed text-slate-500"
                        placeholder="Escribe una breve descripción para la tienda..."
                       />
                    </div>
                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Opciones Visuales</Label>
                        <div className="space-y-3">
                          <VisualToggle 
                            active={!!editedProduct.isFeatured} 
                            onChange={(c) => updateProduct({ isFeatured: c })}
                            icon={<Star className="h-4 w-4" />}
                            label="Producto Destacado"
                            activeColor="bg-slate-900"
                          />
                          <VisualToggle 
                            active={!!editedProduct.isNew} 
                            onChange={(c) => updateProduct({ isNew: c })}
                            icon={<Sparkles className="h-4 w-4" />}
                            label="Producto Novedad"
                            activeColor="bg-amber-400"
                          />
                          <VisualToggle 
                            active={editedProduct.mostrarPrecio !== false} 
                            onChange={(c) => updateProduct({ mostrarPrecio: c })}
                            icon={<Tag className="h-4 w-4" />}
                            label="Mostrar Precio Público"
                          />
                        </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'precios' && (
                <motion.div 
                  key="precios"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <CompactPriceControl 
                        label="PVP BASE"
                        value={editedProduct.precio || 0}
                        onChange={(val) => updateProduct({ precio: val })}
                        icon={<Euro className="h-4 w-4" />}
                        suffix="€"
                     />
                     <CompactPriceControl 
                        label="PVP OFERTA"
                        value={editedProduct.salePrice || 0}
                        onChange={(val) => updateProduct({ salePrice: val })}
                        icon={<Percent className="h-4 w-4 text-emerald-500" />}
                        suffix="€"
                        highlight
                     />
                  </div>

                  <CollapsibleSection 
                    title="Configuración de Cantidades"
                    subTitle="Pedido Mínimo y Salto de Cantidad"
                    icon={<Scale className="h-5 w-5" />}
                    isOpen={openSections.includes('cantidades')}
                    onToggle={() => toggleSection('cantidades')}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                       <CompactPriceControl 
                          label="PEDIDO MÍNIMO"
                          value={editedProduct.minQuantity || 1}
                          onChange={(val) => updateProduct({ minQuantity: Math.max(1, Math.round(val)) })}
                          icon={<Scale className="h-4 w-4 text-blue-500" />}
                          suffix="UDS"
                       />
                       <CompactPriceControl 
                          label="SALTO DE CANTIDAD"
                          value={editedProduct.stepQuantity || 1}
                          onChange={(val) => updateProduct({ stepQuantity: Math.max(1, Math.round(val)) })}
                          icon={<Hash className="h-4 w-4 text-indigo-500" />}
                          suffix="STEP"
                       />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection 
                    title="Escalado de Precios"
                    subTitle="Descuentos por volumen"
                    icon={<BarChart3 className="h-5 w-5" />}
                    isOpen={openSections.includes('escalado')}
                    onToggle={() => toggleSection('escalado')}
                  >
                    <div className="space-y-6 mt-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Gestiona tus tramos de descuento</p>
                        <Button 
                          onClick={addTier} 
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-6 h-10 font-black uppercase text-[9px] tracking-widest italic"
                        >
                           <PlusCircle className="h-3.5 w-3.5 mr-2" />
                           AÑADIR TRAMO
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tierPrices.map((tier, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl">
                             <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-[10px] italic">#{idx + 1}</div>
                             <div className="flex-1 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <Label className="text-[7px] font-black text-slate-300 uppercase tracking-widest">MIN QTY</Label>
                                   <Input 
                                     type="number" 
                                     value={tier.minQty} 
                                     onChange={(e) => updateTier(idx, { minQty: parseInt(e.target.value) || 0 })}
                                     className="h-10 border-none bg-white rounded-lg font-black text-sm italic no-spinner"
                                   />
                                </div>
                                <div className="space-y-1">
                                   <Label className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">PRECIO UNID.</Label>
                                   <Input 
                                     type="number" 
                                     step="any"
                                     value={tier.price} 
                                     onChange={(e) => updateTier(idx, { price: parseFloat(e.target.value) || 0 })}
                                     className="h-10 border-none bg-white rounded-lg font-black text-sm italic no-spinner text-emerald-500"
                                   />
                                </div>
                             </div>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => removeTier(idx)}
                               className="h-10 w-10 text-slate-200 hover:text-red-500"
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleSection>
                </motion.div>
              )}

              {activeTab === 'variantes' && (
                <motion.div 
                  key="variantes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-8 rounded-[36px] border-2 border-slate-100 shadow-sm space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center shadow-lg transition-all ${editedProduct.hasVariants ? 'bg-orange-600 text-white rotate-6' : 'bg-slate-50 text-slate-200'}`}>
                             <Layers2 className="h-8 w-8" />
                          </div>
                          <div>
                             <h4 className="font-black text-slate-900 uppercase tracking-tighter text-lg italic">Sistema de Variantes</h4>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Activa opciones personalizables para este producto</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 shadow-inner">
                           <Switch 
                             checked={editedProduct.hasVariants || false} 
                             onCheckedChange={(c) => updateProduct({ hasVariants: c })}
                             className="scale-125 data-[state=checked]:bg-orange-600"
                           />
                           <span className={`text-[9px] font-black uppercase tracking-widest italic ${editedProduct.hasVariants ? 'text-orange-600' : 'text-slate-300'}`}>
                             {editedProduct.hasVariants ? 'ACTIVO' : 'INACTIVO'}
                           </span>
                        </div>
                     </div>

                     {editedProduct.hasVariants && (
                       <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                          <div className="grid grid-cols-2 gap-4">
                             <CompactBehaviorButton 
                                active={(editedProduct.variantBehavior || 'add') === 'add'}
                                onClick={() => updateProduct({ variantBehavior: 'add' })}
                                icon={<Plus className="h-5 w-5" />}
                                title="SUMAR AL BASE"
                                color="emerald"
                             />
                             <CompactBehaviorButton 
                                active={editedProduct.variantBehavior === 'replace'}
                                onClick={() => updateProduct({ variantBehavior: 'replace' })}
                                icon={<ArrowRight className="h-5 w-5" />}
                                title="REEMPLAZAR"
                                color="blue"
                             />
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center justify-between px-2">
                                <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Lista de Variantes</Label>
                                <Button 
                                  onClick={() => {
                                    const newVariants = [...(editedProduct.variants || []), { id: crypto.randomUUID(), name: '', price: 0 }];
                                    updateProduct({ variants: newVariants });
                                  }}
                                  size="sm"
                                  className="h-10 bg-slate-950 hover:bg-black rounded-xl px-6 font-black uppercase text-[9px] tracking-widest italic"
                                >
                                   AÑADIR OPCIÓN
                                </Button>
                             </div>

                             <div className="space-y-3">
                                {editedProduct.variants?.map((v, i) => (
                                   <div key={v.id} className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-lg">
                                      <div className="flex-1">
                                         <Input 
                                           value={v.name} 
                                           onChange={(e) => {
                                             const newVariants = [...(editedProduct.variants || [])];
                                             newVariants[i].name = e.target.value;
                                             updateProduct({ variants: newVariants });
                                           }}
                                           className="h-11 border-none bg-white rounded-xl font-black text-xs uppercase px-5 italic tracking-tighter"
                                           placeholder="Ej: PACK PREMIUM / 10x15..."
                                         />
                                      </div>
                                      <div className="w-32 relative">
                                         <Input 
                                           type="number"
                                           step="any"
                                           value={v.price} 
                                           onChange={(e) => {
                                             const newVariants = [...(editedProduct.variants || [])];
                                             newVariants[i].price = parseFloat(e.target.value) || 0;
                                             updateProduct({ variants: newVariants });
                                           }}
                                           className="h-11 border-none bg-white rounded-xl font-black text-sm text-center pr-8 italic no-spinner"
                                         />
                                         <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-200 text-sm">€</span>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => {
                                          const newVariants = editedProduct.variants?.filter((_, idx) => idx !== i);
                                          updateProduct({ variants: newVariants });
                                        }}
                                        className="h-11 w-11 text-slate-200 hover:text-red-500 rounded-xl"
                                      >
                                         <Trash2 className="h-4 w-4" />
                                      </Button>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                     )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
             <div className="hidden sm:flex items-center gap-4">
                <Clock className="h-4 w-4 text-slate-300" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Última edición local: {new Date().toLocaleTimeString()}</span>
             </div>
             <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none h-12 rounded-xl font-black uppercase tracking-widest text-[10px] italic">Cancelar</Button>
                <Button 
                  onClick={handleSave} 
                  className="flex-1 sm:flex-none h-14 rounded-2xl bg-slate-950 text-white px-12 font-black uppercase tracking-[0.2em] text-[11px] italic shadow-xl shadow-slate-200/50 hover:bg-black transition-all group"
                >
                   GUARDAR CAMBIOS
                   <ArrowRight className="h-4 w-4 ml-4 group-hover:translate-x-1 transition-transform" />
                </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CollapsibleSection({ title, subTitle, icon, isOpen, onToggle, children }: { title: string, subTitle: string, icon: React.ReactNode, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div className={`bg-white border-2 rounded-[32px] overflow-hidden transition-all duration-500 ${isOpen ? 'border-slate-200 shadow-xl' : 'border-slate-50 shadow-sm'}`}>
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-6 transition-colors ${isOpen ? 'bg-slate-50/30' : 'bg-white hover:bg-slate-50/50'}`}
      >
        <div className="flex items-center gap-5">
           <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-slate-950 text-white rotate-6 shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
              {icon}
           </div>
           <div className="text-left">
              <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] italic">{title}</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{subTitle}</p>
           </div>
        </div>
        <div className={`h-9 w-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 transition-all duration-500 ${isOpen ? 'rotate-180 bg-slate-950 text-white border-none' : ''}`}>
           <ChevronDown className="h-4 w-4" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
           >
             <div className="p-8 pt-2 border-t border-slate-50/50">
                {children}
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-14 flex items-center gap-4 px-6 rounded-2xl transition-all duration-300 relative ${active ? 'bg-white/10 text-emerald-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 rotate-6' : 'bg-white/5'}`}>
        {icon}
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">{label}</span>
      {active && (
        <motion.div 
          layoutId="sidebarActive" 
          className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-full" 
        />
      )}
    </button>
  )
}

function VisualToggle({ active, onChange, icon, label, activeColor = "bg-emerald-500" }: { active: boolean, onChange: (v: boolean) => void, icon: React.ReactNode, label: string, activeColor?: string }) {
  return (
    <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all ${active ? 'bg-white shadow-md' : ''}`}>
       <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${active ? `${activeColor} text-white shadow-lg shadow-slate-900/10` : 'bg-white text-slate-200'}`}>
             {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-800">{label}</span>
       </div>
       <Switch checked={active} onCheckedChange={onChange} className={`data-[state=checked]:${activeColor} scale-110`} />
    </div>
  )
}

function CompactPriceControl({ label, value, onChange, icon, suffix, highlight }: { label: string, value: number, onChange: (v: number) => void, icon: React.ReactNode, suffix: string, highlight?: boolean }) {
  return (
    <div className={`bg-white p-5 rounded-3xl border-2 border-slate-50 transition-all hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 group ${highlight ? 'ring-2 ring-emerald-500/10' : ''}`}>
       <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all">
             {icon}
          </div>
          <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{label}</Label>
       </div>
       <div className="relative">
          <Input 
            type="number"
            step="any"
            value={value || ''} 
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`h-12 border-none bg-slate-50/50 rounded-xl font-black text-xl text-center focus:bg-white no-spinner transition-all italic tracking-tighter ${highlight ? 'text-emerald-500' : ''}`}
            placeholder="0"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-200 italic">{suffix}</span>
       </div>
    </div>
  )
}

function CompactBehaviorButton({ active, onClick, icon, title, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string, color: string }) {
  const styles = {
    emerald: active ? 'bg-slate-950 text-white ring-4 ring-emerald-500/10' : 'bg-white text-slate-400 border-2 border-slate-100 opacity-60 hover:opacity-100',
    blue: active ? 'bg-slate-950 text-white ring-4 ring-blue-500/10' : 'bg-white text-slate-400 border-2 border-slate-100 opacity-60 hover:opacity-100',
  }

  return (
    <button
      onClick={onClick}
      className={`h-24 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden w-full ${styles[color as keyof typeof styles]}`}
    >
       <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/10' : 'bg-slate-50 shadow-inner'}`}>
          {icon}
       </div>
       <span className="text-[9px] font-black uppercase tracking-widest italic">{title}</span>
       {active && (
         <div className={`absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-${color}-400 shadow-lg`} />
       )}
    </button>
  )
}
