'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Truck, Edit, Trash2, Globe, User, Phone, 
  ExternalLink, Search, Loader2, Package, X, Check,
  LayoutGrid, List
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from '@/hooks/use-toast'
import { Supplier } from '@/types'

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      const data = await res.json()
      if (Array.isArray(data)) {
        setSuppliers(data)
      } else {
        setSuppliers([])
      }
    } catch (error) {
      console.error(error)
      setSuppliers([])
      toast({ title: 'Error', description: 'No se pudieron cargar los proveedores', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleOpenDialog = (supplier?: Supplier) => {
    setEditingSupplier(supplier || { name: '', url: '', contactName: '', phone: '' })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingSupplier?.name) {
      toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const method = editingSupplier.id ? 'PUT' : 'POST'
      const res = await fetch('/api/suppliers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSupplier)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error desconocido al guardar');
      }
      
      toast({ title: 'Éxito', description: `Proveedor ${editingSupplier.id ? 'actualizado' : 'creado'} correctamente` })
      setIsDialogOpen(false)
      fetchSuppliers()
    } catch (error: any) {
      console.error(error)
      toast({ 
        title: 'Error al guardar', 
        description: error.message || 'No se pudo guardar el proveedor', 
        variant: 'destructive' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor?')) return

    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      
      toast({ title: 'Eliminado', description: 'Proveedor eliminado correctamente' })
      fetchSuppliers()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'No se pudo eliminar el proveedor', variant: 'destructive' })
    }
  }

  const currentSuppliers = Array.isArray(suppliers) ? suppliers : []

  const filteredSuppliers = currentSuppliers.filter(s => 
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.contactName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Gestión de Proveedores</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Base de datos de suministros externos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <Button 
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setViewMode('grid')}
            className={`h-11 w-11 rounded-xl ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
          >
            <LayoutGrid className="h-5 w-5 text-slate-600" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setViewMode('list')}
            className={`h-11 w-11 rounded-xl ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
          >
            <List className="h-5 w-5 text-slate-600" />
          </Button>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-slate-950 hover:bg-black rounded-2xl px-8 h-14 font-black uppercase text-[11px] tracking-widest italic shadow-xl shadow-slate-200/50 group"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
          NUEVO PROVEEDOR
        </Button>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <Input 
          placeholder="BUSCAR PROVEEDOR POR NOMBRE O CONTACTO..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-16 pl-14 bg-white border-2 border-slate-100 rounded-[24px] font-bold text-sm focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-200 uppercase italic tracking-widest"
        />
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Sincronizando proveedores...</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSuppliers.map((supplier) => (
              <motion.div
                key={supplier.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-[32px] border-2 border-slate-50 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-blue-100" />
                
                <div className="relative space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-12 w-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)} className="h-10 w-10 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)} className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic leading-none">{supplier.name}</h3>
                    {supplier.url && (
                      <a href={supplier.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[9px] font-bold text-blue-500 hover:underline">
                        <Globe className="h-3 w-3" />
                        {supplier.url.replace(/^https?:\/\//, '')}
                        <ExternalLink className="h-2 w-2" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center">
                        <User className="h-3 w-3 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-600 uppercase italic">{supplier.contactName || 'SIN CONTACTO'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center">
                        <Phone className="h-3 w-3 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-600 italic">{supplier.phone || 'SIN TELÉFONO'}</span>
                    </div>
                  </div>

                  <div className="mt-4 bg-slate-50 rounded-2xl p-4 transition-colors group-hover:bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PRODUCTOS VINCULADOS</span>
                      </div>
                      <span className="text-xs font-black text-blue-600">{supplier._count?.products || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 italic">Nombre Empresa</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 italic">Web / URL</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 italic">Contacto</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 italic">Teléfono</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 italic text-center">Productos</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 italic text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-3">
                      <Input 
                        defaultValue={s.name} 
                        onBlur={async (e) => {
                          if (e.target.value !== s.name) {
                            try {
                              const res = await fetch('/api/suppliers', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...s, name: e.target.value })
                              });
                              if (res.ok) toast({ title: 'Actualizado', description: 'Nombre guardado' });
                            } catch (err) { console.error(err); }
                          }
                        }}
                        className="h-11 bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 font-bold text-sm uppercase italic"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        defaultValue={s.url || ''} 
                        onBlur={async (e) => {
                          if (e.target.value !== (s.url || '')) {
                            try {
                              const res = await fetch('/api/suppliers', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...s, url: e.target.value })
                              });
                              if (res.ok) toast({ title: 'Actualizado', description: 'URL guardada' });
                            } catch (err) { console.error(err); }
                          }
                        }}
                        className="h-11 bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 font-medium text-[11px] text-blue-500 italic"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        defaultValue={s.contactName || ''} 
                        onBlur={async (e) => {
                          if (e.target.value !== (s.contactName || '')) {
                            try {
                              const res = await fetch('/api/suppliers', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...s, contactName: e.target.value })
                              });
                              if (res.ok) toast({ title: 'Actualizado', description: 'Contacto guardado' });
                            } catch (err) { console.error(err); }
                          }
                        }}
                        className="h-11 bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 font-bold text-[11px] uppercase italic text-slate-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        defaultValue={s.phone || ''} 
                        onBlur={async (e) => {
                          if (e.target.value !== (s.phone || '')) {
                            try {
                              const res = await fetch('/api/suppliers', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...s, phone: e.target.value })
                              });
                              if (res.ok) toast({ title: 'Actualizado', description: 'Teléfono guardado' });
                            } catch (err) { console.error(err); }
                          }
                        }}
                        className="h-11 bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 font-bold text-[11px] italic text-slate-600"
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="h-8 w-8 bg-slate-100 rounded-lg inline-flex items-center justify-center text-[11px] font-black text-slate-400 italic">
                        {s._count?.products || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIÁLOGO CREAR/EDITAR */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-none bg-white rounded-[40px] shadow-2xl p-0 overflow-hidden">
          <div className="p-10 space-y-8">
            <DialogHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                    {editingSupplier?.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </DialogTitle>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Complete los datos de la entidad</p>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-1 italic">Nombre de la Empresa</Label>
                <Input 
                  value={editingSupplier?.name} 
                  onChange={(e) => setEditingSupplier(prev => ({ ...prev, name: e.target.value }))}
                  className="h-14 bg-slate-50 border-none rounded-2xl font-black text-lg px-6 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all uppercase italic tracking-tighter"
                  placeholder="NOMBRE DEL PROVEEDOR"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-1 italic">Web (URL)</Label>
                  <Input 
                    value={editingSupplier?.url || ''} 
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, url: e.target.value }))}
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold text-xs px-4 focus:bg-white italic"
                    placeholder="https://proveedor.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-1 italic">Teléfono</Label>
                  <Input 
                    value={editingSupplier?.phone || ''} 
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold text-xs px-4 focus:bg-white italic"
                    placeholder="+34 ..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-1 italic">Persona de Contacto</Label>
                <div className="relative">
                  <Input 
                    value={editingSupplier?.contactName || ''} 
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, contactName: e.target.value }))}
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold text-xs pl-12 focus:bg-white italic"
                    placeholder="NOMBRE DEL CONTACTO"
                  />
                  <User className="h-4 w-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] italic">Cancelar</Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 h-16 rounded-[24px] bg-slate-950 text-white px-8 font-black uppercase tracking-[0.2em] text-[11px] italic shadow-xl shadow-slate-200/50 hover:bg-black transition-all group"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <Check className="h-4 w-4 mr-3 text-emerald-400" />
                    GUARDAR DATOS
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
