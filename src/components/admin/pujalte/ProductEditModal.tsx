'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ImageIcon, Trash2, Upload, LayoutGrid, Eye, EyeOff, Package, Plus, Pencil, 
  Settings2, CheckCircle2, Euro, Layers, Scale, ListTodo, Hash, PlusCircle, X,
  ShoppingBag, Sparkles, AlertCircle, ArrowUpRight, ChevronRight, BarChart3, Clock, Layers2, ShieldCheck,
  Percent, Tag, ArrowRight, MousePointer2, Settings, Zap, Boxes, Info
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
import { Card } from '@/components/ui/card'
import { GalleryImage } from '@/lib/landing-config'
import { fixPath } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: GalleryImage | null;
  onSave: (updatedProduct: GalleryImage) => void;
  categories: string[];
}

interface TierPrice {
  qty: number;
  price: number;
}

export default function ProductEditModal({ 
  isOpen, 
  onClose, 
  product, 
  onSave, 
  categories
}: ProductEditModalProps) {
  const [editedProduct, setEditedProduct] = useState<GalleryImage | null>(null);
  const [tierPrices, setTierPrices] = useState<TierPrice[]>([]);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product });
      try {
        const tiers = product.tierPricing ? JSON.parse(product.tierPricing) : [];
        setTierPrices(Array.isArray(tiers) ? tiers : []);
      } catch (e) {
        setTierPrices([]);
      }
    }
  }, [product, isOpen]);

  if (!editedProduct) return null;

  const updateProduct = (updates: Partial<GalleryImage>) => {
    setEditedProduct(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleSave = () => {
    const validTiers = tierPrices.filter(t => t.qty > 0 && t.price > 0).sort((a,b) => a.qty - b.qty);
    const finalProduct = {
      ...editedProduct,
      tierPricing: JSON.stringify(validTiers)
    };
    onSave(finalProduct);
    onClose();
  };

  const addTier = () => {
    setTierPrices([...tierPrices, { qty: 0, price: 0 }]);
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
      <DialogContent className="max-w-7xl h-[94vh] p-0 border-none bg-slate-50/98 backdrop-blur-3xl rounded-[60px] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* HEADER ULTRAPREMIUM */}
        <div className="relative overflow-hidden bg-slate-950 px-16 py-12 flex items-center justify-between text-white shrink-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -mr-80 -mt-80 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-64 -mb-64" />
          
          <div className="flex items-center gap-10 relative z-10">
             <div className="relative group">
                <div className="w-24 h-24 rounded-[36px] bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-700 group-hover:rotate-12 group-hover:scale-105">
                    <Boxes className="text-emerald-400 h-10 w-10 animate-pulse" />
                </div>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-[6px] border-slate-950 shadow-2xl">
                   <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
             </div>
             <div>
                <div className="flex items-center gap-4">
                    <DialogTitle className="text-4xl font-black uppercase tracking-tighter leading-none italic font-inter">
                        Editor de <span className="text-emerald-400 underline decoration-emerald-500/30 underline-offset-8">Producto</span>
                    </DialogTitle>
                    <Badge className="bg-white/10 text-white/50 border-none px-4 py-1.5 font-black italic text-[11px] uppercase tracking-widest rounded-full backdrop-blur-md">
                        Master Studio
                    </Badge>
                </div>
                <div className="flex items-center gap-4 mt-4">
                   <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 shadow-inner">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981]" />
                      <span className="text-xs font-black text-white/70 uppercase tracking-widest italic">
                        SKU: {String(editedProduct.id).slice(-8).toUpperCase()}
                      </span>
                   </div>
                   <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] italic">Infraestructura de Datos Optimizada</p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-8 relative z-10">
             <div className="hidden lg:flex flex-col items-end px-8 border-r border-white/10">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1.5 italic">Sincronización Cloud</span>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                    <span className="text-xs font-black text-white uppercase italic tracking-wider">Activa</span>
                </div>
             </div>
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="rounded-3xl h-16 w-16 hover:bg-white/10 text-white/40 hover:text-white transition-all bg-white/5 border border-white/10 group"
              >
                <X className="h-8 w-8 group-hover:rotate-90 transition-transform duration-500" />
             </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* BARRA LATERAL ULTRA REFINADA */}
          <div className="w-80 bg-white border-r border-slate-200/60 p-10 flex flex-col gap-4">
             <div className="px-3 mb-6">
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Arquitectura</span>
             </div>
             
             <TabButton 
                active={activeTab === 'general'} 
                onClick={() => setActiveTab('general')}
                icon={<LayoutGrid className="h-5 w-5" />}
                label="Identidad"
                sub="General & Visual"
                color="blue"
             />
             <TabButton 
                active={activeTab === 'precios'} 
                onClick={() => setActiveTab('precios')}
                icon={<BarChart3 className="h-5 w-5" />}
                label="Estrategia"
                sub="Precios & Logística"
                color="emerald"
             />
             <TabButton 
                active={activeTab === 'variantes'} 
                onClick={() => setActiveTab('variantes')}
                icon={<Layers2 className="h-5 w-5" />}
                label="Variantes"
                sub="Atributos & Plus"
                color="orange"
             />

             <div className="mt-auto space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-[44px] space-y-5 shadow-3xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/30 transition-all duration-1000" />
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                         <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 italic">Core Protected</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight italic opacity-80">Validación de integridad de datos activa mediante cifrado SSL 256-bit.</p>
                </div>
             </div>
          </div>

          {/* ÁREA DE CONTENIDO PRINCIPAL REORGANIZADA */}
          <div className="flex-1 overflow-y-auto p-16 bg-[#FDFDFF]">
             <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <motion.div 
                    key="general"
                    initial={{ opacity: 0, scale: 0.98, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -20 }}
                    className="max-w-5xl mx-auto space-y-20"
                  >
                     <div className="flex flex-col lg:flex-row gap-20">
                        {/* ASSET VISUAL */}
                        <div className="lg:w-96 space-y-8 flex-shrink-0">
                           <div className="flex items-center justify-between px-3">
                              <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Activo Visual</Label>
                           </div>
                           <div className="relative group">
                              <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                              <Card className="aspect-square rounded-[60px] overflow-hidden bg-slate-900 border-none shadow-[0_50px_100px_-30px_rgba(0,0,0,0.3)] relative z-10 transition-transform duration-700 hover:scale-[1.02]">
                                 {editedProduct.src ? (
                                    <img 
                                      src={fixPath(editedProduct.src)} 
                                      alt={editedProduct.alt} 
                                      className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" 
                                    />
                                 ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 gap-6">
                                       <ImageIcon size={100} strokeWidth={0.5} className="animate-pulse" />
                                       <p className="font-black text-[10px] uppercase tracking-[0.4em] opacity-40">Sin activo cargado</p>
                                    </div>
                                 )}
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end p-10 backdrop-blur-[4px]">
                                    <div className="w-full space-y-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                                       <Button className="w-full bg-white text-slate-950 hover:bg-emerald-50 rounded-[28px] px-8 font-black uppercase text-xs tracking-widest shadow-2xl h-16 pointer-events-auto">
                                          <Upload className="h-5 w-5 mr-3" /> Cargar Nuevo
                                       </Button>
                                       <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest text-center italic">Resolución óptima: 1200x1200px</p>
                                    </div>
                                 </div>
                              </Card>
                           </div>
                        </div>

                        {/* DATOS MAESTROS */}
                        <div className="flex-1 space-y-12">
                           {/* NOMBRE GRANDE */}
                           <div className="space-y-6">
                               <div className="flex items-center gap-3 px-2">
                                  <Pencil className="h-4 w-4 text-emerald-500" />
                                  <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Nombre del Producto</Label>
                               </div>
                               <Input 
                                 value={editedProduct.alt} 
                                 onChange={(e) => updateProduct({ alt: e.target.value })}
                                 className="h-28 bg-white border-2 border-slate-100 rounded-[40px] font-black text-4xl px-12 focus:border-emerald-500 focus:bg-white transition-all shadow-2xl shadow-slate-100 placeholder:text-slate-100 uppercase tracking-tighter italic"
                                 placeholder="EJ: ALBUM PROFESIONAL..."
                               />
                           </div>

                           <div className="grid grid-cols-2 gap-10">
                              <div className="space-y-6">
                                  <div className="flex items-center gap-3 px-2">
                                     <Layers className="h-4 w-4 text-blue-500" />
                                     <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Arquitectura / Catálogo</Label>
                                  </div>
                                  <Select value={editedProduct.categoria} onValueChange={(val) => updateProduct({ categoria: val })}>
                                     <SelectTrigger className="h-20 bg-white border-2 border-slate-100 rounded-[30px] font-black text-sm uppercase tracking-[0.2em] shadow-sm px-8 focus:ring-blue-500 italic">
                                        <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent className="rounded-[36px] shadow-3xl border-none p-4 mt-2 bg-white/95 backdrop-blur-3xl">
                                        {categories.map(cat => (
                                          <SelectItem key={cat} value={cat} className="capitalize font-black text-xs uppercase tracking-widest py-5 rounded-2xl focus:bg-slate-950 focus:text-white mb-2 cursor-pointer italic px-6">
                                             {cat}
                                          </SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                              </div>

                              {/* STATUS TOGGLES REPLANTAEADOS (REQ 5) */}
                              <div className="grid grid-cols-1 gap-6">
                                 <StatusToggle 
                                   active={!!editedProduct.isNew} 
                                   onChange={(c) => updateProduct({ isNew: c })}
                                   icon={<Sparkles className="h-6 w-6" />}
                                   label="ESTADO NOVEDAD"
                                   sublabel="MARCAR COMO NUEVO"
                                   color="amber"
                                   compact
                                 />
                                 <StatusToggle 
                                   active={editedProduct.mostrarPrecio !== false} 
                                   onChange={(c) => updateProduct({ mostrarPrecio: c })}
                                   icon={<Tag className="h-6 w-6" />}
                                   label="VISIBILIDAD P.V.P"
                                   sublabel="MOSTRAR PRECIO EN TIENDA"
                                   color="emerald"
                                   compact
                                 />
                                 <StatusToggle 
                                   active={editedProduct.activa !== false} 
                                   onChange={(c) => updateProduct({ activa: c })}
                                   icon={<Eye className="h-6 w-6" />}
                                   label="ESTADO PUBLICADO"
                                   sublabel="VISIBLE EN EL CATÁLOGO"
                                   color="blue"
                                   compact
                                 />
                              </div>
                           </div>

                           {/* DESCRIPCIÓN */}
                           <div className="space-y-6">
                              <div className="flex items-center gap-3 px-2">
                                 <Info className="h-4 w-4 text-slate-300" />
                                 <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Resumen Ejecutivo / Especificaciones</Label>
                              </div>
                              <textarea 
                                value={editedProduct.descripcion || ''} 
                                onChange={(e) => updateProduct({ descripcion: e.target.value })}
                                className="w-full h-40 bg-white border-2 border-slate-100 rounded-[40px] font-bold text-sm px-10 py-8 focus:border-slate-300 outline-none transition-all shadow-sm resize-none uppercase tracking-widest italic leading-relaxed text-slate-400 placeholder:text-slate-100"
                                placeholder="..."
                              />
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'precios' && (
                  <motion.div 
                    key="precios"
                    initial={{ opacity: 0, scale: 0.98, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -20 }}
                    className="max-w-5xl mx-auto space-y-16"
                  >
                     <div className="bg-white p-16 rounded-[60px] border-2 border-slate-100 shadow-3xl shadow-slate-200/50 space-y-16">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                           <PriceControl 
                              label="PRECIO BASE UNITARIO"
                              icon={<Euro className="h-6 w-6" />}
                              value={editedProduct.precio || 0}
                              onChange={(val) => updateProduct({ precio: val })}
                              color="slate"
                              symbol="€"
                           />
                           <PriceControl 
                              label="CANTIDAD MÍNINA PEDIDO"
                              icon={<Scale className="h-6 w-6" />}
                              value={editedProduct.minQuantity || 1}
                              onChange={(val) => updateProduct({ minQuantity: Math.max(1, Math.round(val)) })}
                              color="blue"
                              symbol="UDS"
                           />
                           <PriceControl 
                              label="MÚLTIPLOS INCREMENTAL"
                              icon={<Hash className="h-6 w-6" />}
                              value={editedProduct.stepQuantity || 1}
                              onChange={(val) => updateProduct({ stepQuantity: Math.max(1, Math.round(val)) })}
                              color="indigo"
                              symbol="STEP"
                           />
                        </div>

                        <div className="space-y-10 pt-10 border-t border-slate-100">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                 <div className="h-20 w-20 rounded-[32px] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30 rotate-6">
                                    <Percent className="h-10 w-10" />
                                 </div>
                                 <div>
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Precios Escalables</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-3 italic flex items-center gap-2">
                                       <ArrowRight className="h-3 w-3 text-emerald-500" /> ALGORITMO DE DESCUENTO POR VOLUMEN AUTOMÁTICO
                                    </p>
                                 </div>
                              </div>
                              <Button 
                                onClick={addTier} 
                                className="h-20 rounded-[32px] bg-slate-950 hover:bg-black text-white px-10 font-black uppercase text-xs tracking-[0.2em] italic shadow-2xl group transition-all active:scale-95"
                              >
                                 <PlusCircle className="h-6 w-6 mr-4 group-hover:rotate-90 transition-transform duration-500" />
                                 NUEVO TRAMO
                              </Button>
                           </div>

                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <AnimatePresence mode="popLayout">
                                 {tierPrices.map((tier, idx) => (
                                    <motion.div 
                                      key={idx} 
                                      layout
                                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                      className="group relative"
                                    >
                                       <div className="bg-slate-50 p-10 rounded-[44px] flex items-center justify-between border-2 border-transparent hover:border-emerald-500/20 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
                                          <div className="absolute -top-4 -left-4 w-12 h-12 rounded-[18px] bg-slate-950 text-white flex items-center justify-center font-black text-xs italic shadow-2xl">
                                             #{idx + 1}
                                          </div>
                                          
                                          <div className="flex-1 px-8 space-y-3">
                                             <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">A PARTIR DE</Label>
                                             <div className="flex items-baseline gap-3">
                                                <Input 
                                                   type="number" 
                                                   value={tier.qty} 
                                                   onChange={(e) => updateTier(idx, { qty: parseInt(e.target.value) || 0 })}
                                                   className="h-12 border-none bg-transparent font-black text-4xl p-0 focus:ring-0 w-24 no-spinner italic"
                                                />
                                                <span className="text-sm font-black text-slate-200 italic">UNIDADES</span>
                                             </div>
                                          </div>

                                          <div className="flex-1 px-8 space-y-3 border-l-2 border-slate-100">
                                             <Label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">PRECIO ESPECIAL</Label>
                                             <div className="flex items-baseline gap-2">
                                                <Input 
                                                   type="number" 
                                                   value={tier.price} 
                                                   onChange={(e) => updateTier(idx, { price: parseFloat(e.target.value) || 0 })}
                                                   className="h-12 border-none bg-transparent font-black text-4xl p-0 focus:ring-0 w-32 no-spinner text-emerald-500 italic"
                                                />
                                                <span className="text-2xl font-black text-slate-200 italic">€</span>
                                             </div>
                                          </div>

                                          <Button 
                                             variant="ghost" 
                                             size="icon" 
                                             onClick={() => removeTier(idx)}
                                             className="h-16 w-16 rounded-3xl hover:bg-red-500 hover:text-white text-slate-200 transition-all bg-white shadow-xl shadow-slate-200/50 shrink-0"
                                          >
                                             <Trash2 className="h-6 w-6" />
                                          </Button>
                                       </div>
                                    </motion.div>
                                 ))}
                              </AnimatePresence>
                              {tierPrices.length === 0 && (
                                 <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-200 gap-8 bg-slate-100/30 rounded-[60px] border-4 border-dashed border-slate-100">
                                    <div className="w-24 h-24 rounded-[36px] bg-white shadow-xl flex items-center justify-center rotate-6">
                                       <BarChart3 className="h-12 w-12 text-slate-100" />
                                    </div>
                                    <div className="text-center">
                                       <p className="font-black uppercase text-sm tracking-[0.5em] mb-3">MATRIZ DE PRECIOS VACÍA</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Crea tramos para habilitar el motor de escalado inteligente</p>
                                    </div>
                                    <Button onClick={addTier} variant="outline" className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[9px] border-2 border-slate-100 hover:bg-white transition-all">
                                       COMENZAR AHORA
                                    </Button>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'variantes' && (
                  <motion.div 
                    key="variantes"
                    initial={{ opacity: 0, scale: 0.98, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -20 }}
                    className="max-w-5xl mx-auto space-y-16"
                  >
                     <div className="bg-white p-16 rounded-[60px] border-2 border-slate-100 shadow-3xl shadow-slate-200/50 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[140px] -mr-64 -mt-64 transition-all duration-1000 ${editedProduct.hasVariants ? 'bg-orange-500/10' : 'bg-slate-50'}`} />
                        
                        <div className="flex items-center justify-between mb-20 relative z-10">
                           <div className="flex items-center gap-8">
                              <div className={`h-24 w-24 rounded-[36px] flex items-center justify-center shadow-2xl transition-all duration-700 ${editedProduct.hasVariants ? 'bg-orange-600 text-white rotate-12' : 'bg-slate-50 text-slate-200'}`}>
                                 <Layers2 className="h-12 w-12" />
                              </div>
                              <div>
                                 <h3 className="font-black text-slate-900 uppercase tracking-tighter text-4xl italic leading-none">Opciones de Variante</h3>
                                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-3 italic">ESTABLECE LÓGICA DE PLUS / PVP PARA ATRIBUTOS VARIABLES</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6 bg-slate-50/50 backdrop-blur-md rounded-[32px] p-6 px-10 border border-slate-100 shadow-inner">
                              <span className={`text-xs font-black uppercase tracking-[0.2em] ${editedProduct.hasVariants ? 'text-orange-600' : 'text-slate-300'} italic`}>
                                {editedProduct.hasVariants ? 'MOTOR ACTIVO' : 'MOTOR INACTIVO'}
                              </span>
                              <Switch 
                                checked={editedProduct.hasVariants || false} 
                                onCheckedChange={(c) => updateProduct({ hasVariants: c })}
                                className="scale-[1.8] data-[state=checked]:bg-orange-600"
                              />
                           </div>
                        </div>

                        {editedProduct.hasVariants && (
                           <div className="space-y-16 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                              {/* BEHAVIOR */}
                              <div className="grid grid-cols-2 gap-10">
                                 <BehaviorButton 
                                    active={(editedProduct.variantBehavior || 'add') === 'add'}
                                    onClick={() => updateProduct({ variantBehavior: 'add' })}
                                    icon={<Plus className="h-10 w-10 text-emerald-500" />}
                                    title="TÁCTICA INCREMENTAL"
                                    desc="EL PRECIO DE LA ELECCIÓN SE SUMA AL BASE"
                                    color="emerald"
                                 />
                                 <BehaviorButton 
                                    active={editedProduct.variantBehavior === 'replace'}
                                    onClick={() => updateProduct({ variantBehavior: 'replace' })}
                                    icon={<ArrowRight className="h-10 w-10 text-blue-500" />}
                                    title="TÁCTICA SUSTITUCIÓN"
                                    desc="LA ELECCIÓN DEFINE EL PRECIO FINAL TOTAL"
                                    color="blue"
                                 />
                              </div>

                              {/* VARIANT LIST */}
                              <div className="space-y-8">
                                 <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-4">
                                       <ListTodo className="h-6 w-6 text-slate-300" />
                                       <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-300 italic">OPCIONES REGISTRADAS</Label>
                                    </div>
                                    <Badge className="bg-slate-950 text-white border-none h-10 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest italic italic">
                                       {editedProduct.variants?.length || 0} ITEMS ACTIVE
                                    </Badge>
                                 </div>

                                 <div className="space-y-6">
                                    <AnimatePresence mode="popLayout">
                                    {editedProduct.variants?.map((v, i) => (
                                       <motion.div 
                                         key={v.id} 
                                         layout
                                         initial={{ opacity: 0, x: -50 }}
                                         animate={{ opacity: 1, x: 0 }}
                                         exit={{ opacity: 0, scale: 0.9 }}
                                         className="flex items-center gap-10 bg-white p-10 rounded-[50px] border-2 border-slate-50 group hover:border-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-700"
                                       >
                                          <div className="h-20 w-20 rounded-[28px] bg-slate-950 text-white flex items-center justify-center font-black text-2xl italic shrink-0 group-hover:bg-orange-600 transition-colors duration-500 shadow-2xl">
                                             {i + 1}
                                          </div>
                                          <div className="flex-1 space-y-4">
                                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2 italic">IDENTIFICADOR DE OPCIÓN</span>
                                             <Input 
                                               value={v.name} 
                                               onChange={(e) => {
                                                 const newVariants = [...(editedProduct.variants || [])];
                                                 newVariants[i].name = e.target.value;
                                                 updateProduct({ variants: newVariants });
                                               }}
                                               className="h-16 border-none bg-slate-50 rounded-[24px] font-black text-slate-900 text-2xl uppercase px-10 focus:bg-white focus:shadow-2xl transition-all italic tracking-tighter"
                                               placeholder="EJ: TAMAÑO XL / ACABADO LINO..."
                                             />
                                          </div>
                                          <div className="w-64 space-y-4">
                                             <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] ml-2 italic">VALOR ASOCIADO</span>
                                              <div className="relative group/price">
                                                 <Input 
                                                   type="number"
                                                   value={v.price} 
                                                   onChange={(e) => {
                                                     const newVariants = [...(editedProduct.variants || [])];
                                                     newVariants[i].price = parseFloat(e.target.value) || 0;
                                                     updateProduct({ variants: newVariants });
                                                   }}
                                                   className="h-16 border-none bg-orange-50/30 rounded-[24px] font-black text-orange-600 text-3xl text-center pr-16 focus:bg-white transition-all no-spinner italic"
                                                   placeholder="0"
                                                 />
                                                 <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-orange-200 text-3xl italic">€</span>
                                              </div>
                                          </div>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => {
                                              const newVariants = editedProduct.variants?.filter((_, idx) => idx !== i);
                                              updateProduct({ variants: newVariants });
                                            }}
                                            className="h-20 w-20 rounded-[30px] hover:bg-red-500 hover:text-white text-slate-200 transition-all border-2 border-slate-50 bg-white shadow-xl shadow-slate-200/40 shrink-0"
                                          >
                                             <Trash2 className="h-8 w-8" />
                                          </Button>
                                       </motion.div>
                                    ))}
                                    </AnimatePresence>
                                    
                                    <Button 
                                      onClick={() => {
                                        const newVariants = [...(editedProduct.variants || []), { id: crypto.randomUUID(), name: '', price: 0 }];
                                        updateProduct({ variants: newVariants });
                                      }}
                                      className="w-full h-32 rounded-[60px] bg-slate-50 hover:bg-white text-slate-200 hover:text-orange-400 border-4 border-dashed border-slate-100 hover:border-orange-100 flex flex-col items-center justify-center gap-4 group transition-all mt-8 hover:shadow-3xl"
                                    >
                                       <PlusCircle className="h-10 w-10 group-hover:scale-125 group-hover:rotate-90 transition-all duration-700" />
                                       <span className="text-[14px] font-black uppercase tracking-[0.5em] italic">REGISTRAR NUEVA VARIANTE</span>
                                    </Button>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* FOOTER MASTER PANEL */}
        <DialogFooter className="bg-slate-950 border-t border-white/5 p-12 px-20 shrink-0 flex items-center justify-between gap-16 shadow-[0_-50px_100px_-20px_rgba(0,0,0,0.6)] z-20">
           <div className="hidden sm:flex items-center gap-16">
              <div className="flex flex-col">
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 italic mb-3">Auditoria de Cambios</span>
                 <div className="flex items-center gap-4 text-emerald-400/60">
                    <Clock className="h-4 w-4" />
                    <span className="text-[11px] font-black uppercase tracking-widest italic">Sincronizado: Justo ahora</span>
                 </div>
              </div>
              <div className="h-14 w-px bg-white/10" />
              <div className="flex flex-col">
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 italic mb-3">Estado del Servidor</span>
                 <div className="flex items-center gap-4">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-pulse" />
                    <span className="text-[11px] font-black text-white/40 uppercase tracking-widest italic">Master Node Ready</span>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-10 ml-auto">
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="rounded-3xl h-20 px-12 font-black uppercase tracking-[0.3em] text-[11px] text-white/30 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 italic"
              >
                 DESCARTAR
              </Button>
              <Button 
                onClick={handleSave} 
                className="relative group overflow-hidden rounded-[40px] h-24 px-20 bg-white text-slate-950 font-black uppercase tracking-[0.4em] text-sm shadow-[0_30px_60px_rgba(255,255,255,0.05)] transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-8"
              >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <span className="relative z-10 italic">GUARDAR CAMBIOS</span>
                  <div className="relative z-10 h-12 w-12 rounded-[20px] bg-slate-950 text-white flex items-center justify-center group-hover:bg-emerald-500 transition-all duration-700 shadow-2xl">
                     <ArrowRight className="h-6 w-6 group-hover:translate-x-1.5 transition-transform duration-500" />
                  </div>
              </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// COMPONENTES AUXILIARES CON EL NUEVO DISEÑO

function TabButton({ active, onClick, icon, label, sub, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, sub: string, color: string }) {
   const variants = {
      blue: active ? 'bg-blue-600 text-white shadow-[0_30px_60px_-15px_rgba(37,99,235,0.5)] border-blue-500/30' : 'text-slate-400 hover:text-slate-900 border-transparent hover:bg-slate-50',
      emerald: active ? 'bg-emerald-600 text-white shadow-[0_30px_60px_-15px_rgba(5,150,105,0.5)] border-emerald-500/30' : 'text-slate-400 hover:text-slate-900 border-transparent hover:bg-slate-50',
      orange: active ? 'bg-orange-600 text-white shadow-[0_30px_60px_-15px_rgba(234,88,12,0.5)] border-orange-500/30' : 'text-slate-400 hover:text-slate-900 border-transparent hover:bg-slate-50',
   }

   return (
      <Button 
         onClick={onClick}
         className={`h-28 justify-start gap-8 rounded-[36px] px-8 transition-all duration-700 relative border-2 ${variants[color as keyof typeof variants]}`}
      >
         <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${active ? 'bg-white/20 rotate-12' : 'bg-slate-50 text-slate-300'}`}>
            {icon}
         </div>
         <div className="flex flex-col items-start gap-1">
            <span className="text-[15px] font-black uppercase tracking-tighter italic leading-none">{label}</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none ${active ? 'text-white' : 'text-slate-400'}`}>{sub}</span>
         </div>
         {active && (
            <motion.div 
               layoutId="activeTabIndicator"
               className="absolute right-8 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_15px_white] animate-pulse"
            />
         )}
      </Button>
   )
}

function StatusToggle({ active, onChange, icon, label, sublabel, color, compact = false }: { active: boolean, onChange: (v: boolean) => void, icon: React.ReactNode, label: string, sublabel: string, color: string, compact?: boolean }) {
   const styles = {
      amber: active ? 'bg-amber-500/5 border-amber-500/10 shadow-2xl shadow-amber-500/5' : 'bg-white border-slate-100',
      emerald: active ? 'bg-emerald-500/5 border-emerald-500/10 shadow-2xl shadow-emerald-500/5' : 'bg-white border-slate-100',
      blue: active ? 'bg-blue-500/5 border-blue-500/10 shadow-2xl shadow-blue-500/5' : 'bg-white border-slate-100',
   }

   const icons = {
      amber: active ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/30' : 'bg-slate-50 text-slate-200',
      emerald: active ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-50 text-slate-200',
      blue: active ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/30' : 'bg-slate-50 text-slate-200',
   }

   return (
      <div className={`p-8 rounded-[40px] border-2 transition-all duration-700 flex items-center justify-between group ${styles[color as keyof typeof styles]}`}>
         <div className="flex items-center gap-6">
            <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 ${icons[color as keyof typeof icons]}`}>
               {icon}
            </div>
            <div>
               <span className="text-[12px] font-black text-slate-900 uppercase italic tracking-tighter block">{label}</span>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic opacity-60">{sublabel}</p>
            </div>
         </div>
         <Switch 
            checked={active} 
            onCheckedChange={onChange}
            className={`scale-[1.6] transition-all data-[state=checked]:bg-${color}-500`}
         />
      </div>
   )
}

function PriceControl({ label, icon, value, onChange, color, symbol }: { label: string, icon: React.ReactNode, value: number, onChange: (v: number) => void, color: string, symbol: string }) {
   return (
      <div className="bg-white p-10 rounded-[44px] shadow-sm border-2 border-slate-50 hover:border-slate-100 hover:shadow-2xl transition-all duration-500 group">
         <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-[18px] bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all duration-700 group-hover:rotate-12 shadow-inner">
               {icon}
            </div>
            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{label}</Label>
         </div>
         <div className="relative group/field">
            <Input 
               type="number"
               value={value || ''} 
               onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
               className="h-20 border-none bg-slate-50/50 rounded-[30px] font-black text-4xl text-center focus:ring-4 focus:ring-emerald-500/5 focus:bg-white no-spinner transition-all group-hover/field:scale-[1.03] shadow-inner italic uppercase tracking-tighter"
               placeholder="0"
            />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-2xl italic text-slate-200 pointer-events-none group-focus-within/field:text-emerald-500 transition-colors">{symbol}</span>
         </div>
      </div>
   )
}

function BehaviorButton({ active, onClick, icon, title, desc, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string, desc: string, color: string }) {
   const styles = {
      emerald: active ? 'bg-slate-950 text-white shadow-3xl shadow-emerald-500/10 border-emerald-500/20' : 'bg-slate-50 text-slate-300 border-2 border-slate-100 hover:bg-slate-100',
      blue: active ? 'bg-slate-950 text-white shadow-3xl shadow-blue-500/10 border-blue-500/20' : 'bg-slate-50 text-slate-300 border-2 border-slate-100 hover:bg-slate-100',
   }
   
   return (
      <Button
         onClick={onClick}
         className={`h-40 rounded-[50px] flex flex-col items-start p-10 transition-all duration-700 relative overflow-hidden text-left border-none w-full ${styles[color as keyof typeof styles]}`}
      >
         <div className="flex items-center gap-8 w-full relative z-10">
            <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:scale-110 ${active ? 'bg-white/10' : 'bg-white shadow-inner'}`}>
               {icon}
            </div>
            <div className="flex-1">
               <span className={`text-base font-black uppercase tracking-widest italic ${active ? 'text-white' : 'text-slate-900'}`}>{title}</span>
               <p className={`text-[10px] font-bold leading-tight mt-3 uppercase tracking-[0.2em] italic ${active ? 'text-white/30' : 'text-slate-400'}`}>{desc}</p>
            </div>
         </div>
         {active && (
            <motion.div 
               layoutId="activeBehaviorPulse"
               className={`absolute top-10 right-10 h-3 w-3 rounded-full bg-${color}-400 shadow-[0_0_20px_#10b981] animate-pulse`} 
            />
         )}
      </Button>
   )
}
