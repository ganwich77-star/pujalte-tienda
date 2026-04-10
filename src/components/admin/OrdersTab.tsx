'use client'

import { 
  Download, Eye, ShoppingCart, Trash2, ArrowUpDown, ChevronDown, CheckSquare, Square, 
  XCircle, Edit3, Save, Search, Loader2, User, Camera, Plus, Minus, PlusCircle, Trash, X as CloseIcon,
  Package, ChevronUp, Image as ImageIcon, FileText, ZoomIn
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Order } from '@/types'
import { useState, useMemo, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { db, COLLECTIONS } from '@/lib/firebase'
import { collection, query, where, getDocs, limit, getDoc, doc } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { v4 as uuidv4 } from 'uuid'

interface OrdersTabProps {
  orders: Order[]
  formatPrice: (price: number) => string
  onUpdateStatus: (id: string, status: string) => void
  onUpdateOrder: (order: Order) => void
  onDeleteOrder: (id: string) => void
  initialFilter?: string
}

export function OrdersTab({ orders, formatPrice, onUpdateStatus, onUpdateOrder, onDeleteOrder, initialFilter = 'all' }: OrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState(initialFilter)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order | 'date' | 'total', direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [dniSearch, setDniSearch] = useState('')
  const [foundClients, setFoundClients] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)
  
  // Estados para secciones colapsables en edición del pedido
  const [isItemsOpen, setIsItemsOpen] = useState(true)
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false)

  // Recalcular total automáticamente basado en items
  const calculatedTotal = useMemo(() => {
    if (!editingOrder?.items) return 0;
    return editingOrder.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
  }, [editingOrder?.items]);

  // Actualizar el total en el estado si hay cambios
  useEffect(() => {
    if (editingOrder && Math.abs(calculatedTotal - (editingOrder.total || 0)) > 0.01) {
      setEditingOrder(prev => prev ? {...prev, total: calculatedTotal} : null);
    }
  }, [calculatedTotal]); // Eliminamos editingOrder de aquí para evitar bucles infinitos

  // Cargar productos al abrir el modal para poder añadirlos
  useEffect(() => {
    if (isEditDialogOpen && editingOrder) {
       const loadData = async () => {
         try {
           const q = query(collection(db, COLLECTIONS.PRODUCTS))
           const snap = await getDocs(q)
           const results: any[] = []
           snap.forEach(doc => results.push({ id: doc.id, ...doc.data() }))
           setAvailableProducts(results)

           // Reparar precios si están a 0 basándonos en los precios fijados del catálogo
           if (editingOrder && editingOrder.items) {
             let hasRepairs = false;
             const updated = editingOrder.items.map(it => {
               const pVal = typeof it.price === 'string' ? parseFloat(it.price) : it.price;
               if (!pVal || pVal <= 0) {
                 const searchNm = it.productName.toLowerCase().split('(')[0].replace(/[0-9]x/g, '').trim();
                 const match = results.find(rp => {
                   const cName = rp.name.toLowerCase().trim();
                   return rp.id === it.productId || cName === searchNm || it.productName.toLowerCase().includes(cName);
                 });
                 if (match) {
                   const px = match.variants?.[0]?.price || match.price || 0;
                   if (px > 0) {
                     hasRepairs = true;
                     return { ...it, price: typeof px === 'string' ? parseFloat(px) : px };
                   }
                 }
               }
               return it;
             });
             if (hasRepairs) {
               const newTot = updated.reduce((acc, i) => acc + ((i.price || 0) * (i.quantity || 1)), 0);
               setEditingOrder(prev => prev ? { ...prev, items: updated, total: newTot } : null);
             }
           }
         } catch(e) {
           console.error("Error cargando productos:", e)
         }
       }
       loadData()
    }
  }, [isEditDialogOpen, editingOrder?.id])

  // Efecto Maestro: Vincular automáticamente URLs de fotos por nombre de archivo
  useEffect(() => {
    if (isEditDialogOpen && editingOrder && editingOrder.items) {
      const needsLinking = editingOrder.items.some(item => item.fileName && !item.fileUrl);
      
      if (needsLinking) {
        const resolvePhotos = async () => {
          try {
            // Buscamos el cliente por ID o por nombre para obtener su galería
            let clientData: any = null;
            if (editingOrder.clientId) {
              const clientDoc = await getDoc(doc(db, COLLECTIONS.CLIENTS, editingOrder.clientId));
              if (clientDoc.exists()) clientData = clientDoc.data();
            }

            if (!clientData && editingOrder.customerName) {
              const q = query(collection(db, COLLECTIONS.CLIENTS), where("name", "==", editingOrder.customerName), limit(1));
              const snap = await getDocs(q);
              if (!snap.empty) clientData = snap.docs[0].data();
            }

            if (clientData?.gallerySettings?.photos) {
              const photos = clientData.gallerySettings.photos;
              const updatedItems = editingOrder.items.map(item => {
                if (item.fileName && !item.fileUrl) {
                  // Buscar coincidencia exacta o por base del nombre
                  const cleanName = item.fileName.split('.')[0].toLowerCase();
                  const match = photos.find((p: any) => 
                    p.name?.toLowerCase().includes(cleanName) || 
                    p.url?.toLowerCase().includes(cleanName)
                  );
                  if (match) return { ...item, fileUrl: match.url };
                }
                return item;
              });

              setEditingOrder(prev => prev ? { ...prev, items: updatedItems } : null);
            }
          } catch (e) {
            console.error("Error resolviendo fotos automáticas:", e);
          }
        };
        resolvePhotos();
      }
    }
  }, [isEditDialogOpen, editingOrder?.id]);

  const handleUpdateItem = (index: number, updates: any) => {
    if (!editingOrder) return;
    const newItems = [...editingOrder.items];
    newItems[index] = { ...newItems[index], ...updates };
    setEditingOrder({ ...editingOrder, items: newItems });
  }

  const handleAddProduct = (product: any) => {
    if (!editingOrder) return;
    const fixedPrice = product.variants?.[0]?.price || product.price || 0;
    const newItem = {
      id: uuidv4(),
      productId: product.id,
      productName: product.name,
      variantName: product.variants?.[0]?.name || '',
      price: typeof fixedPrice === 'string' ? parseFloat(fixedPrice) : fixedPrice,
      quantity: 1,
      image: product.image || product.thumbnail || '',
      note: ''
    };
    setEditingOrder({ ...editingOrder, items: [...editingOrder.items, newItem] });
    setIsAddingItem(false);
    setProductSearch('');
  }

  const handleRemoveItem = (index: number) => {
    if (!editingOrder) return;
    setEditingOrder({
      ...editingOrder,
      items: editingOrder.items.filter((_, i) => i !== index)
    });
  }



  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter === 'all') return true
      const orderStatus = (o.status || '').toLowerCase()
      
      // Normalización de filtros
      if (statusFilter === 'pending') return orderStatus === 'pending' || orderStatus === 'pendiente'
      if (statusFilter === 'completed') return orderStatus === 'paid' || orderStatus === 'pagado' || orderStatus === 'completed'
      return orderStatus === statusFilter.toLowerCase()
    })
  }, [orders, statusFilter])

  const handleSearchClients = async (val: string) => {
    setDniSearch(val)
    if (val.length < 2) {
      setFoundClients([])
      return
    }
    setIsSearching(true)
    try {
      const upperVal = val.toUpperCase();
      
      // Búsqueda por DNI (Mayúsculas)
      const qDni = query(
        collection(db, COLLECTIONS.CLIENTS),
        where("dni", ">=", upperVal),
        where("dni", "<=", upperVal + "\uf8ff"),
        limit(5)
      )
      
      // Búsqueda por NOMBRE (Valor tal cual)
      const qName = query(
        collection(db, COLLECTIONS.CLIENTS),
        where("name", ">=", val),
        where("name", "<=", val + "\uf8ff"),
        limit(5)
      )

      // Búsqueda por NOMBRE (Mayúsculas)
      const qNameUpper = query(
        collection(db, COLLECTIONS.CLIENTS),
        where("name", ">=", upperVal),
        where("name", "<=", upperVal + "\uf8ff"),
        limit(5)
      )

      const [snapDni, snapName, snapNameUpper] = await Promise.all([
        getDocs(qDni), 
        getDocs(qName),
        getDocs(qNameUpper)
      ])
      
      const results: any[] = []
      const seenIds = new Set<string>()

      const processSnap = (snap: any) => {
        snap.forEach((doc: any) => {
          if (!seenIds.has(doc.id)) {
            results.push({ id: doc.id, ...doc.data() })
            seenIds.add(doc.id)
          }
        })
      }

      processSnap(snapDni)
      processSnap(snapName)
      processSnap(snapNameUpper)
      
      setFoundClients(results.slice(0, 10))
    } catch (e) {
      console.error("Error buscando clientes:", e)
    } finally {
      setIsSearching(false)
    }
  }

  const selectClient = (client: any) => {
    if (!editingOrder) return
    setEditingOrder({
      ...editingOrder,
      customerName: client.name || editingOrder.customerName,
      customerPhone: client.phone || editingOrder.customerPhone,
      customerEmail: client.email || editingOrder.customerEmail,
      address: client.address || editingOrder.address || '',
      clientId: client.id,
      customFields: {
        ...(editingOrder.customFields || {}),
        dni: client.dni || ''
      }
    })
    setDniSearch('')
    setFoundClients([])
  }

  // Función para descargar PDF del pedido
  const generateOrderPDF = async () => {
    if (!editingOrder) return;
    setIsSearching(true); // Reutilizamos el loader para el PDF
 
    try {
      const doc = new jsPDF() as any;
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Estilos y Colores
      const primaryColor: [number, number, number] = [74, 124, 89]; // #4A7C59
      const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate
 
      // Cabecera
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('PUJALTE FOTOGRAFIA', 15, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('Detalle del Pedido / Albarán de Entrega', 15, 27);
      doc.text(`Fecha: ${new Date(editingOrder.createdAt).toLocaleDateString()}`, pageWidth - 15, 20, { align: 'right' });
      doc.text(`Referencia: ${editingOrder.id.slice(-8).toUpperCase()}`, pageWidth - 15, 27, { align: 'right' });
 
      // Línea separadora
      doc.setDrawColor(240, 240, 240);
      doc.line(15, 35, pageWidth - 15, 35);
 
      // Datos del Cliente - Limpieza solicitada
      const rawName = editingOrder.customerName || '';
      const rawDni = (editingOrder.customFields as any)?.dni || (editingOrder.customFields as any)?.DNI || '';
      
      let finalName = rawName;
      let finalDni = rawDni;

      // Limtear el nombre si contiene "Cliente DNI:" o sufijos de sistema
      if (rawName.includes('Cliente DNI:')) {
        finalName = rawName.split('Cliente DNI:')[0].trim() || 'Cliente';
        if (!finalDni || finalDni === 'N/A') {
          finalDni = rawName.split('Cliente DNI:')[1]?.split('_')[0]?.trim() || '';
        }
      } else if (rawName.includes('_')) {
        finalName = rawName.split('_')[0].trim();
      }

      // Limpiar DNI de sufijos (guión bajo en adelante)
      if (finalDni.includes('_')) {
        finalDni = finalDni.split('_')[0].trim();
      }
      
      // Si el nombre sigue pareciendo un DNI, intentamos normalizar
      if (/^[0-9]{8}[A-Z]$/i.test(finalName)) {
        if (!finalDni) finalDni = finalName;
        finalName = 'Cliente';
      }

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL CLIENTE', 15, 45);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${finalName || 'Cliente No Identificado'}`, 15, 52);
      doc.text(`DNI: ${finalDni || 'N/A'}`, 15, 57);
      
      const email = editingOrder.customerEmail || (editingOrder.customFields as any)?.email || (editingOrder.customFields as any)?.Email || (editingOrder.customFields as any)?.correo || 'N/A';
      const phone = editingOrder.customerPhone || (editingOrder.customFields as any)?.phone || (editingOrder.customFields as any)?.Teléfono || (editingOrder.customFields as any)?.Telefono || (editingOrder.customFields as any)?.telefono || 'N/A';

      doc.text(`Email: ${email}`, 15, 62);
      doc.text(`Teléfono: ${phone}`, 15, 67);
      
      if (editingOrder.address) {
        doc.text(`Dirección: ${editingOrder.address}`, 15, 72);
      }
 
      // Tabla de Productos con tipado para evitar errores
      interface TableItem {
        num: number;
        name: string;
        variant: string;
        quantity: number;
        price: string;
        subtotal: string;
        image: any;
        dim: { w: number, h: number };
      }
 
      const tableData: TableItem[] = await Promise.all(editingOrder.items.map(async (item, index) => {
        let imgData: string | null = null;
        let dimensions = { w: 18, h: 14 }; // Defaults
 
        if (item.fileUrl) {
          try {
            const res = await fetch(item.fileUrl);
            const blob = await res.blob();
            imgData = await new Promise<string | null>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
 
            if (imgData) {
              // Calcular dimensiones reales para evitar deformación
              const img = new Image();
              img.src = imgData;
              await new Promise((resolve) => { img.onload = resolve; });
              
              const maxWidth = 18;
              const maxHeight = 14;
              const ratio = img.width / img.height;
              
              if (ratio > maxWidth / maxHeight) {
                dimensions.w = maxWidth;
                dimensions.h = maxWidth / ratio;
              } else {
                dimensions.h = maxHeight;
                dimensions.w = maxHeight * ratio;
              }
            }
          } catch (e) {
            console.warn("CORS/Fetch error for image in PDF:", item.fileUrl);
          }
        }
 
        return {
          num: index + 1,
          name: item.fileName ? `${item.productName}\n(${item.fileName})` : item.productName,
          variant: item.variantName || 'Estándar',
          quantity: item.quantity,
          price: formatPrice(item.price),
          subtotal: formatPrice(item.price * item.quantity),
          image: imgData,
          dim: dimensions
        };
      }));
 
      autoTable(doc, {
        startY: 80,
        head: [['#', 'Producto / Foto', 'Opción', 'Cant.', 'Precio', 'Subtotal']],
        body: tableData.map(d => [d.num, d.name, d.variant, d.quantity, d.price, d.subtotal]),
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        bodyStyles: { minCellHeight: 20, valign: 'middle' },
        margin: { left: 15, right: 15 },
        didDrawCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 1) {
            const rowIdx = data.row.index;
            const item = tableData[rowIdx];
            if (item.image) {
              // Centrar imagen en el rectángulo disponible (18x14)
              const containerW = 18;
              const containerH = 14;
              const offsetX = (containerW - item.dim.w) / 2;
              const offsetY = (containerH - item.dim.h) / 2;
              
              const x = data.cell.x + data.cell.width - 22 + offsetX;
              const y = data.cell.y + 3 + offsetY;
              
              try {
                doc.addImage(item.image, x, y, item.dim.w, item.dim.h);
              } catch (e) {
                console.warn("Error al añadir imagen al PDF:", e);
              }
            }
          }
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 80 },
          2: { cellWidth: 30 }
        }
      });
 
      // Totales e Información final
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(pageWidth - 80, finalY - 5, pageWidth - 15, finalY - 5);
 
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL PEDIDO:`, pageWidth - 80, finalY);
      doc.text(formatPrice(editingOrder.total), pageWidth - 15, finalY, { align: 'right' });
 
      if (editingOrder.notes) {
        let cleanNotes = editingOrder.notes || '';
        // Si la nota contiene el separador de sistema, nos quedamos solo con la primera parte (Galería)
        if (cleanNotes.includes('| DNI:')) {
          cleanNotes = cleanNotes.split('| DNI:')[0].trim();
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Notas adicionales:', 15, finalY + 10);
        doc.text(cleanNotes, 15, finalY + 15, { maxWidth: 100 });
      }
 
      const fileName = `pedido_${editingOrder.id.slice(-6)}.pdf`;
 
      // Establecemos metadatos para que el visor del navegador sepa el nombre si se descarga después
      doc.setProperties({
        title: fileName,
        subject: `Pedido ${editingOrder.id}`,
        author: 'Sistema de Gestión'
      });
 
      // Abrimos en nueva pestaña para previsualización
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
 
      toast({ title: 'PDF Generado', description: 'Se ha abierto el albarán en una nueva pestaña.' });
 
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };
 
  // Limpiar búsqueda al cerrar modal
  useEffect(() => {
    if (!isEditDialogOpen) {
      setDniSearch('')
      setFoundClients([])
    }
  }, [isEditDialogOpen])

  const sortedOrders = useMemo(() => {
    let sortableOrders = [...filteredOrders]
    if (sortConfig !== null) {
      sortableOrders.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Order]
        let bVal: any = b[sortConfig.key as keyof Order]

        // Custom handling for dates and total
        if (sortConfig.key === 'date' || sortConfig.key === 'createdAt') {
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableOrders
  }, [orders, sortConfig])

  const requestSort = (key: any) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDeleteSelected = async () => {
    // Process one by one
    for (const id of Array.from(selectedIds)) {
      await onDeleteOrder(id)
    }
    setSelectedIds(new Set())
  }

  const handleEditOrder = (order: Order) => {
    // Especial para este caso: coger nombres de archivo de la captura
    const itemsWithRefs = order.items.map(item => {
      let fileName = item.fileName
      if (item.productName.toLowerCase().includes('bloque metacrilato') && !fileName) {
        fileName = '_PS10405'
      } else if (item.productName.toLowerCase().includes('lienzo') && !fileName) {
        fileName = '_PS10433'
      }
      return { ...item, fileName }
    })
    setEditingOrder({ ...order, items: itemsWithRefs })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingOrder) {
      onUpdateOrder(editingOrder)
      setIsEditDialogOpen(false)
    }
  }

  const exportToCSV = () => {
    // Definimos las cabeceras
    const headers = [
      'Seguimiento', 'Galería', 'Artículo', 'Observaciones', 'ID Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Email', 
      'Dirección', 'Variante', 'Cantidad', 'Precio Unit.', 'Total Linea', 
      'Estado', 'Método Pago', 'Notas Generales'
    ]

    const rows = orders.flatMap(order => 
      order.items.map(item => [
        order.trackingNumber || '-',
        order.clientId || '-', // Aquí incluimos la galería
        item.productName,
        (item.note || '').replace(/;/g, ' '), // Observaciones juntas al artículo
        order.id,
        new Date(order.createdAt).toLocaleDateString('es-ES'),
        order.customerName,
        order.customerPhone,
        order.customerEmail || '',
        (order.address || '').replace(/;/g, ' '),
        item.variantName || '',
        item.quantity,
        item.price,
        item.price * item.quantity,
        order.status,
        order.paymentMethod || '',
        (order.notes || '').replace(/;/g, ' ')
      ])
    )

    // Unimos todo en formato CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // Crear el archivo y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `informe_ventas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-0 pb-6 sm:pb-8 gap-4 sm:gap-0">
        <div className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Gestión de Pedidos</CardTitle>
          <CardDescription className="text-xs sm:text-sm font-medium text-slate-400">Control de ventas y estados de envío</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {selectedIds.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold flex items-center justify-center gap-2 sm:gap-3 active:scale-95 border border-red-100 text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Eliminar ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-[2rem] sm:rounded-[2.5rem] border-none p-6 sm:p-8 gap-6 shadow-2xl">
                <AlertDialogHeader className="gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-red-50 flex items-center justify-center mb-1">
                    <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 text-red-500" />
                  </div>
                  <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Eliminar {selectedIds.size} pedidos?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                    Esta acción no se puede deshacer. Los datos de los pedidos seleccionados se borrarán permanentemente del sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                  <AlertDialogCancel className="h-10 sm:h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm w-full sm:w-auto mt-0">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteSelected}
                    className="h-10 sm:h-12 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 border-none text-sm w-full sm:w-auto"
                  >
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            onClick={exportToCSV} 
            className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-[#4A7C59] hover:bg-[#3D6649] text-white shadow-lg shadow-[#4A7C59]/20 transition-all font-bold flex items-center justify-center gap-2 sm:gap-3 active:scale-95 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            Exportar CSV
          </Button>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 sm:h-12 w-full sm:w-[180px] rounded-xl sm:rounded-2xl border-slate-200 font-bold text-slate-600 bg-white shadow-sm focus:ring-[#4A7C59]/10">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-xl overflow-hidden">
              <SelectItem value="all" className="font-bold uppercase text-[10px] py-3 cursor-pointer">Todos</SelectItem>
              <SelectItem value="pending" className="font-bold uppercase text-[10px] py-3 cursor-pointer text-amber-600">Pendientes</SelectItem>
              <SelectItem value="completed" className="font-bold uppercase text-[10px] py-3 cursor-pointer text-emerald-600">Pagados / OK</SelectItem>
              <SelectItem value="cancelled" className="font-bold uppercase text-[10px] py-3 cursor-pointer text-red-600">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-2xl sm:rounded-[2.5rem] border border-slate-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* VISTA MÓVIL (CARDS) */}
          <div className="block sm:hidden divide-y divide-slate-50">
            {sortedOrders.map(order => {
              const getStatusColor = (status: string) => {
                const s = (status || '').toLowerCase()
                if (s === 'pending' || s === 'pendiente') return 'bg-amber-100 text-amber-700 border-amber-200'
                if (s === 'paid' || s === 'pagado' || s === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
                if (s === 'shipped' || s === 'enviado') return 'bg-blue-100 text-blue-700 border-blue-200'
                if (s === 'delivered' || s === 'entregado') return 'bg-slate-100 text-slate-700 border-slate-200'
                if (s === 'cancelled' || s === 'cancelado') return 'bg-red-100 text-red-700 border-red-200'
                return 'bg-slate-100 text-slate-600'
              }

              const orderDate = order.createdAt ? 
                (typeof order.createdAt === 'object' && 'seconds' in order.createdAt ? 
                  new Date((order.createdAt as any).seconds * 1000) : 
                  new Date(order.createdAt)) : 
                new Date();

              return (
                <div key={order.id} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedIds.has(order.id)} 
                        onCheckedChange={() => toggleSelect(order.id)}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-widest">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-slate-400">{orderDate.toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    <div 
                      className={`h-2.5 w-2.5 rounded-full shadow-lg ${order.paymentStatus === 'completed' ? 'bg-[#4A7C59] shadow-[#4A7C59]/40' : 'bg-red-500 shadow-red-500/40 animate-pulse'}`} 
                      title={order.paymentStatus === 'completed' ? 'Pagado' : 'Impagado'}
                    />
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px]">
                          <p className="font-bold text-slate-800 truncate">
                            <span className="text-[#4A7C59] font-black mr-1">{item.quantity}x</span>
                            {item.productName}
                          </p>
                          <span className="text-slate-400 font-mono text-[9px]">{item.variantName || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-slate-400">Total Inversión</span>
                      <span className="font-black text-base text-[#4A7C59] tracking-tighter tabular-nums">{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex-1 max-w-[140px]">
                      <Select value={order.status} onValueChange={(v) => onUpdateStatus(order.id, v)}>
                        <SelectTrigger className={`h-10 text-[9px] font-black uppercase tracking-wider rounded-xl border-none shadow-sm transition-all focus:ring-0 ${getStatusColor(order.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                          <SelectItem value="PENDIENTE" className="text-xs font-bold">PENDIENTE</SelectItem>
                          <SelectItem value="PAGADO" className="text-xs font-bold">PAGADO</SelectItem>
                          <SelectItem value="ENVIADO" className="text-xs font-bold">ENVIADO</SelectItem>
                          <SelectItem value="ENTREGADO" className="text-xs font-bold">ENTREGADO</SelectItem>
                          <SelectItem value="CANCELADO" className="text-xs font-bold text-red-600">CANCELADO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleEditOrder(order)}
                      className="flex-1 h-11 rounded-xl bg-white text-[#4A7C59] border-slate-100 font-bold text-xs gap-2 shadow-sm"
                    >
                      <Edit3 className="h-4 w-4" /> Editar Pedido
                    </Button>

                    <Dialog >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 h-11 rounded-xl bg-white text-slate-900 border-slate-100 font-bold text-xs gap-2 shadow-sm">
                          <Eye className="h-4 w-4" /> Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Detalle del Pedido #{order.id.slice(-8).toUpperCase()}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-1 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                            <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Cliente</p><p className="font-extrabold text-xs text-slate-800">{order.customerName}</p></div>
                            <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Teléfono</p><p className="font-extrabold text-xs text-slate-800">{order.customerPhone}</p></div>
                            <div className="sm:col-span-2"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Email</p><p className="font-extrabold text-xs text-slate-800">{order.customerEmail || '-'}</p></div>
                            <div className="sm:col-span-2"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Dirección de Entrega</p><p className="font-extrabold text-xs text-slate-800 leading-relaxed">{order.address || '-'}</p></div>
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Desglose de Productos</p>
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-2">
                                  <div className="flex justify-between items-start text-xs">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-black text-slate-900 text-sm">{item.productName}</span>
                                      {item.variantName && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.variantName}</span>}
                                      <span className="text-[10px] font-black text-[#4A7C59]">x{item.quantity}</span>
                                    </div>
                                    <span className="font-black text-slate-900 tabular-nums text-sm">{formatPrice(item.price * item.quantity)}</span>
                                  </div>
                                  {item.note && !item.fileUrl && !item.note.includes('http') && (
                                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic leading-relaxed">
                                      "{item.note}"
                                    </div>
                                  )}
                                  
                                  {(item.fileUrl || (item.note && item.note.includes('http'))) && (
                                    <div className="mt-1 flex flex-wrap gap-2">
                                      {((item.fileUrl as string) ? (item.fileUrl as string).split(', ') : (item.note?.includes('FOTO: ') ? [item.note.split('FOTO: ')[1].split(' | ')[0]] : [item.note || ''])).map((url: string, idx: number) => {
                                        if (!url || !url.includes('http')) return null;
                                        return (
                                          <a 
                                            key={idx}
                                            href={url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 bg-[#4A7C59]/10 text-[#4A7C59] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4A7C59] hover:text-white transition-all border border-[#4A7C59]/10 shadow-sm"
                                          >
                                            <ImageIcon className="h-3.5 w-3.5" /> {(item.fileUrl as string)?.includes(',') ? `Foto ${idx + 1}` : 'Ver Foto'}
                                          </a>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-200">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Total</span>
                              <span className="text-xl font-black tracking-tighter">{formatPrice(order.total)}</span>
                            </div>
                          </div>
                          
                          {order.notes && (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Notas del cliente</p>
                              <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic">"{order.notes}"</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm">
                          <Trash2 className="h-4 w-4.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95vw] rounded-[2.5rem] border-none p-6 shadow-2xl">
                        <AlertDialogHeader className="gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-1">
                            <Trash2 className="h-6 w-6 text-rose-500" />
                          </div>
                          <AlertDialogTitle className="text-xl font-black text-slate-900 tracking-tight">¿Eliminar pedido?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                            Esta acción es irreversible. Se eliminará el registro completo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col gap-2 mt-2">
                          <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm mt-0">Mantener</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteOrder(order.id)}
                            className="h-12 px-6 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 border-none text-sm"
                          >
                            Eliminar ahora
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
            {orders.length === 0 && (
              <div className="text-center py-20 px-5">
                <div className="flex flex-col items-center gap-3">
                  <ShoppingCart className="h-12 w-12 text-slate-100" />
                  <p className="text-sm font-bold text-slate-300">No hay pedidos registrados todavía</p>
                </div>
              </div>
            )}
          </div>

          {/* VISTA DESKTOP (TABLE) */}
          <div className="hidden sm:block w-full overflow-hidden">
            <ScrollArea className="h-[65vh]">
              <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[40px] sm:w-[50px] px-4 sm:px-8">
                    <Checkbox 
                      checked={selectedIds.size === orders.length && orders.length > 0} 
                      onCheckedChange={toggleSelectAll}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                    />
                  </TableHead>
                  <TableHead className="w-[40px] px-0 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ed</span>
                  </TableHead>
                  <TableHead 
                    className="py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => requestSort('customerName')}
                  >
                    <div className="flex items-center gap-2">
                      Cliente / ID / Fecha
                      <ArrowUpDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Artículos
                  </TableHead>
                  <TableHead 
                    className="py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors text-right"
                    onClick={() => requestSort('total')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Inversión
                      <ArrowUpDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900 transition-colors text-center"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Logística
                      <ArrowUpDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-30" />
                    </div>
                  </TableHead>
                  <TableHead className="py-4 sm:py-6 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map(order => {
                  const getStatusColor = (status: string) => {
                    const s = (status || '').toLowerCase()
                    if (s === 'pending' || s === 'pendiente') return 'bg-amber-100 text-amber-700 border-amber-200'
                    if (s === 'paid' || s === 'pagado' || s === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    if (s === 'shipped' || s === 'enviado') return 'bg-blue-100 text-blue-700 border-blue-200'
                    if (s === 'delivered' || s === 'entregado') return 'bg-slate-100 text-slate-700 border-slate-200'
                    if (s === 'cancelled' || s === 'cancelado') return 'bg-red-100 text-red-700 border-red-200'
                    return 'bg-slate-100 text-slate-600'
                  }

                  const orderDate = order.createdAt ? 
                    (typeof order.createdAt === 'object' && 'seconds' in order.createdAt ? 
                      new Date((order.createdAt as any).seconds * 1000) : 
                      new Date(order.createdAt)) : 
                    new Date();
                  
                  return (
                    <TableRow key={order.id} className={`hover:bg-slate-50/50 transition-colors border-slate-100 group ${selectedIds.has(order.id) ? 'bg-slate-50/80' : ''}`}>
                      <TableCell className="w-[40px] px-3">
                        <Checkbox 
                          checked={selectedIds.has(order.id)} 
                          onCheckedChange={() => toggleSelect(order.id)}
                          className="rounded-md border-slate-300 data-[state=checked]:bg-[#4A7C59] data-[state=checked]:border-[#4A7C59]"
                        />
                      </TableCell>
                      <TableCell className="w-[50px] px-1 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditOrder(order)}
                          className="h-8 w-8 rounded-lg bg-emerald-500 text-white border-none shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                          title="Editar Pedido"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 overflow-hidden">
                            <p className="text-[7px] font-mono font-black uppercase text-slate-300 shrink-0">#{order.id.slice(-6).toUpperCase()}</p>
                            <span className="text-slate-200 text-[8px] shrink-0">•</span>
                            <p className="text-[8px] font-bold text-slate-400 shrink-0">{orderDate.toLocaleDateString('es-ES')}</p>
                          </div>
                          <p className="font-black text-[12px] text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">{order.customerName}</p>
                          <p className="text-[9px] font-bold text-slate-400 tracking-wider font-mono uppercase">{order.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-0.5 max-w-[200px]">
                          {order.items.slice(0, 2).map((item, i) => (
                            <p key={i} className="text-[10px] font-bold text-slate-700 truncate leading-none mb-0.5">
                              <span className="text-[#4A7C59] font-black mr-1">{item.quantity}x</span>
                              {item.productName}
                              <span className="ml-1.5 text-slate-400 font-medium tracking-tight">(@{formatPrice(item.price || 0)})</span>
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mt-0.5">+{order.items.length - 2} productos</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <p className="font-black text-[13px] text-slate-900 tabular-nums tracking-tighter shrink-0 pr-2">{formatPrice(order.total)}</p>
                      </TableCell>
                      <TableCell className="py-2 w-[110px]">
                        <Select value={order.status} onValueChange={(v) => onUpdateStatus(order.id, v)}>
                          <SelectTrigger className={`h-7 px-2 text-[8px] font-black uppercase tracking-wider rounded-lg border-none shadow-sm transition-all focus:ring-0 ${getStatusColor(order.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="PENDIENTE" className="text-[9px] font-bold uppercase">PENDIENTE</SelectItem>
                            <SelectItem value="PAGADO" className="text-[9px] font-bold uppercase">PAGADO</SelectItem>
                            <SelectItem value="ENVIADO" className="text-[9px] font-bold uppercase">ENVIADO</SelectItem>
                            <SelectItem value="ENTREGADO" className="text-[9px] font-bold uppercase">ENTREGADO</SelectItem>
                            <SelectItem value="CANCELADO" className="text-[9px] font-bold text-red-600 uppercase">CANCELADO</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-2 pr-4 w-[120px]">
                        <div className="flex items-center justify-end gap-2">
                          <div 
                            className={`h-2 w-2 rounded-full shadow-sm shrink-0 ${order.paymentStatus === 'completed' ? 'bg-[#4A7C59]' : 'bg-rose-500 animate-pulse'}`} 
                            title={order.paymentStatus === 'completed' ? 'Pagado' : 'Impagado'}
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white text-slate-900 border border-slate-100 shadow-sm" title="Ver Detalles">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] sm:max-w-lg rounded-[2rem] sm:rounded-[2.5rem] border-none shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
                              <DialogHeader>
                                <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Detalle del Pedido #{order.id.slice(-8).toUpperCase()}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 sm:space-y-6 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
                                  <div>
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cliente</p>
                                    <p className="font-black text-sm sm:text-base text-slate-900">{order.customerName}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Teléfono</p>
                                    <p className="font-black text-sm sm:text-base text-slate-900">{order.customerPhone || '-'}</p>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                                      {/^\d+$/.test(order.customerEmail || '') ? 'DNI / ID Identificador' : 'Email de contacto'}
                                    </p>
                                    <p className="font-black text-sm sm:text-base text-slate-900">{order.customerEmail || '-'}</p>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Dirección de Entrega</p>
                                    <p className="font-black text-xs sm:text-sm text-slate-700 leading-relaxed">{order.address || '-'}</p>
                                  </div>
                                </div>
                                
                                      <div className="space-y-4">
                                        <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-2">Desglose de Productos</p>
                                        <div className="space-y-3">
                                          {order.items.map((item, i) => (
                                            <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-2 transition-all hover:border-[#4A7C59]/20">
                                              <div className="flex justify-between items-start text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                  <span className="font-black text-slate-900 text-sm sm:text-base">{item.productName}</span>
                                                  {item.variantName && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.variantName}</span>}
                                                  <span className="text-[10px] font-black text-[#4A7C59]">CANTIDAD: {item.quantity}</span>
                                                </div>
                                                <span className="font-black text-slate-900 tabular-nums text-sm sm:text-base">{formatPrice(item.price * item.quantity)}</span>
                                              </div>
                                              {item.note && !item.fileUrl && !item.note.includes('http') && (
                                                <div className="text-[10px] sm:text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                                                  "{item.note}"
                                                </div>
                                              )}

                                              {(() => {
                                                const urls = item.fileUrl ? (item.fileUrl as string).split(', ') : 
                                                             (item.note?.includes('FOTO: ') ? [item.note.split('FOTO: ')[1].split(' | ')[0]] : 
                                                             (item.note?.includes('http') ? [item.note] : []));
                                                
                                                const validUrls = urls.filter(u => u && u.includes('http'));
                                                
                                                if (validUrls.length === 0) return null;

                                                return (
                                                  <div className="mt-1 flex flex-wrap gap-2">
                                                    {validUrls.map((url, idx) => (
                                                      <a 
                                                        key={idx}
                                                        href={url} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2.5 bg-[#4A7C59] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3D6649] transition-all shadow-lg shadow-[#4A7C59]/20 active:scale-95"
                                                      >
                                                        <ImageIcon className="h-4 w-4" /> {validUrls.length > 1 ? `FOTO ${idx + 1}` : 'VER FOTO'}
                                                      </a>
                                                    ))}
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                <div className="flex justify-between items-center bg-slate-900 text-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-slate-200">
                                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-60">Total</span>
                                  <span className="text-2xl sm:text-3xl font-black tracking-tighter">{formatPrice(order.total)}</span>
                                </div>

                                {order.customFields && Object.keys(order.customFields).filter(k => !['name', 'phone', 'email', 'address', 'notes'].includes(k)).length > 0 && (
                                  <div className="space-y-2 sm:space-y-3">
                                    <p className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-widest">Adicional</p>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-slate-100/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200">
                                      {Object.entries(order.customFields).map(([key, value]) => {
                                        if (['name', 'phone', 'email', 'address', 'notes'].includes(key)) return null;
                                        return (
                                          <div key={key}>
                                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{key}</p>
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-700">{value || '-'}</p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {order.notes && (
                                  <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-100">
                                    <p className="text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Notas del cliente</p>
                                    <p className="text-[10px] sm:text-xs font-bold text-amber-800 leading-relaxed italic">"{order.notes}"</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm group"
                              >
                                <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-[2rem] sm:rounded-[2.5rem] border-none p-6 sm:p-8 gap-6 shadow-2xl">
                              <AlertDialogHeader className="gap-3">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-rose-50 flex items-center justify-center mb-1">
                                  <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 text-rose-500" />
                                </div>
                                <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Eliminar pedido?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                                  Esta acción es irreversible. Se eliminará el registro completo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                                <AlertDialogCancel className="h-10 sm:h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm w-full sm:w-auto mt-0">Mantener</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onDeleteOrder(order.id)}
                                  className="h-10 sm:h-12 px-6 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 border-none text-sm w-full sm:w-auto"
                                >
                                  Eliminar ahora
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-24 px-8 border-none">
                       <div className="flex flex-col items-center gap-5">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#4A7C59]/10 rounded-full blur-2xl scale-150 animate-pulse" />
                            <ShoppingCart className="h-16 w-16 text-[#4A7C59]/20 relative z-10" />
                          </div>
                          <p className="text-base font-black text-slate-300 tracking-tight">Vuestra tienda aún está esperando su primer pedido</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md rounded-3xl border-none p-6 shadow-2xl">
            <DialogHeader className="p-0 border-b border-slate-50 pb-4 mb-2">
              <div className="flex items-center justify-between w-full">
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Detalle y Edición del Pedido</DialogTitle>
                  <DialogDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">
                    Gestión de productos, cantidades y datos de entrega.
                  </DialogDescription>
                </div>
                <Button 
                  onClick={generateOrderPDF}
                  disabled={isSearching}
                  variant="outline"
                  className="rounded-2xl border-blue-100 text-blue-600 hover:bg-blue-50 transition-all gap-2 h-11 px-6 font-black text-[10px] uppercase tracking-widest shadow-sm shadow-blue-50 flex items-center justify-center group"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />}
                  Ver Albarán (PDF)
                </Button>
              </div>
            </DialogHeader>
            
            {editingOrder && (
              <>
                <div className="space-y-4 py-4">
                {/* BUSCADOR DE DNI DESPLEGABLE */}
                <div className="space-y-2">
                  <button 
                    onClick={() => setIsClientSearchOpen(!isClientSearchOpen)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100/50 hover:bg-blue-100/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                       <User className="h-3.5 w-3.5 text-blue-500" />
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Vincular Cliente Existente (Nombre o DNI)</span>
                    </div>
                    {isClientSearchOpen ? <ChevronUp className="h-3.5 w-3.5 text-blue-400" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-400" />}
                  </button>
 
                  {isClientSearchOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 space-y-2 mt-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            value={dniSearch}
                            onChange={(e) => handleSearchClients(e.target.value)}
                            placeholder="Buscar por NOMBRE o DNI..." 
                            className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-bold text-xs"
                          />
                          {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
                        </div>
                        
                        {foundClients.length > 0 && (
                          <div className="mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                            {foundClients.map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => selectClient(c)}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0"
                                type="button"
                              >
                                <span className="font-extrabold text-xs text-slate-900">{c.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">{c.dni} • {c.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-100/50">
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Nombre Completo</Label>
                            <Input 
                              value={editingOrder.customerName}
                              onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})}
                              className="h-11 rounded-xl bg-white border-none shadow-sm font-bold text-xs uppercase"
                            />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Teléfono</Label>
                            <Input 
                              value={editingOrder.customerPhone || ''}
                              onChange={(e) => setEditingOrder({...editingOrder, customerPhone: e.target.value})}
                              className="h-11 rounded-xl bg-white border-none shadow-sm font-bold text-xs"
                            />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">DNI del Cliente</Label>
                            <Input 
                              value={(editingOrder.customFields as any)?.dni || ''}
                              onChange={(e) => setEditingOrder({
                                ...editingOrder, 
                                customFields: { ...(editingOrder.customFields || {}), dni: e.target.value }
                              })}
                              className="h-11 rounded-xl bg-white border-none shadow-sm font-bold text-xs uppercase"
                              placeholder="Introduce el DNI..."
                            />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Email / Usuario</Label>
                            <Input 
                              value={editingOrder.customerEmail || ''}
                              onChange={(e) => setEditingOrder({...editingOrder, customerEmail: e.target.value})}
                              className="h-11 rounded-xl bg-white border-none shadow-sm font-bold text-xs"
                              placeholder="Introduce el email..."
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Dirección de Entrega</Label>
                            <Textarea 
                              value={editingOrder.address || ''}
                              onChange={(e) => setEditingOrder({...editingOrder, address: e.target.value})}
                              className="min-h-[60px] rounded-2xl bg-white border-none shadow-sm font-bold resize-none text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>



                  {/* SECCIÓN DE PRODUCTOS */}
                  <div className="col-span-2 mt-2 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <Label className="text-[10px] font-black text-[#4A7C59] uppercase tracking-widest">Artículos del Pedido</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsAddingItem(!isAddingItem)}
                        className="h-7 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5"
                      >
                        <PlusCircle className="h-3 w-3" /> Añadir Artículo
                      </Button>
                    </div>

                    {isAddingItem && (
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 border-dashed space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                          <Input 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Buscar producto..." 
                            className="pl-10 h-10 rounded-xl bg-white border-emerald-100 shadow-sm font-bold text-xs"
                          />
                        </div>
                        <div className="max-h-[150px] overflow-y-auto space-y-1 pr-1">
                          {availableProducts
                            .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                            .map(p => (
                              <button 
                                key={p.id}
                                onClick={() => handleAddProduct(p)}
                                className="w-full text-left p-2 rounded-xl bg-white hover:bg-emerald-500 hover:text-white transition-all group flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-extrabold text-[11px] leading-tight">{p.name}</p>
                                  <p className="text-[9px] opacity-70 font-bold">{formatPrice(p.price)}</p>
                                </div>
                                <PlusCircle className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {editingOrder.items.map((item, i) => (
                        <div key={i} className="p-3 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-3 relative group">
                          <div className="flex gap-4">
                            {/* MINIATURA DE IMAGEN (CLIC PARA ZOOM) */}
                                                         <div 
                               className="h-16 w-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden relative border border-slate-100 cursor-zoom-in hover:brightness-90 transition-all group"
                               onClick={() => {
                                 const photoMatch = item.note?.match(/FOTO:\s*(https:\/\/[^\s|]+)/i);
                                 const urls = item.fileUrl ? (item.fileUrl as string).split(', ') : (photoMatch ? [photoMatch[1]] : []);
                                 if (urls.length > 0) setPreviewImages(urls);
                               }}
                             >
                               {(() => {
                                 const photoMatch = item.note?.match(/FOTO:\s*(https:\/\/[^\s|]+)/i);
                                 const urls = item.fileUrl ? (item.fileUrl as string).split(', ') : (photoMatch ? [photoMatch[1]] : []);
                                 const finalImg = urls[0];
                                 return finalImg ? (
                                   <>
                                     <img src={finalImg} alt={item.productName} className="h-full w-full object-cover" />
                                     {urls.length > 1 && (
                                       <div className="absolute bottom-0 right-0 left-0 bg-black/60 text-white text-[7px] font-black text-center py-0.5">
                                         {urls.length} FOTOS
                                       </div>
                                     )}
                                   </>
                                 ) : (
                                   <div className="h-full w-full flex items-center justify-center bg-slate-50">
                                     <ImageIcon className="h-6 w-6 text-slate-200" />
                                   </div>
                                 );
                               })()}
                              <div className="absolute top-1 left-1 bg-white/90 backdrop-blur px-1 rounded-md border border-slate-100">
                                <span className="text-[8px] font-black text-slate-500 uppercase">#{i + 1}</span>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex justify-between items-start">
                                <div className="pr-8 flex-1 space-y-1">
                                  <Input 
                                    value={item.productName}
                                    onChange={(e) => handleUpdateItem(i, { productName: e.target.value })}
                                    className="h-6 p-0 bg-transparent border-none font-black text-[11px] text-slate-800 focus-visible:ring-0 uppercase tracking-tight"
                                    placeholder="Nombre del producto..."
                                  />
                                  <div className="flex items-center gap-1.5 group/opt">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">Medida/Opción:</span>
                                    <Input 
                                      value={item.variantName || ""}
                                      placeholder="P. ej: 13x18, 70x100..."
                                      onChange={(e) => handleUpdateItem(i, { variantName: e.target.value })}
                                      className="h-6 p-0 bg-transparent border-none font-bold text-[10px] text-emerald-600 focus-visible:ring-0 italic placeholder:text-slate-300"
                                    />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleRemoveItem(i)}
                                  className="h-6 w-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors absolute top-3 right-3"
                                >
                                  <Trash className="h-3 w-3" />
                                </button>
                              </div>

                              {/* CAMPO DE NOMBRE DE ARCHIVO */}
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <FileText className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                  <Input 
                                    placeholder="Nombre del archivo (p. ej. _PS10405)"
                                    value={item.fileName?.replace(/\.[^/.]+$/, "") || ''}
                                    onChange={(e) => handleUpdateItem(i, { fileName: e.target.value })}
                                    className="h-7 pl-6 pr-2 rounded-lg bg-slate-50 border-none font-bold text-[10px] text-slate-600 focus-visible:ring-slate-200"
                                  />
                                </div>
                                {item.fileName && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    <span className="text-[8px] font-black uppercase">Foto Vinculada</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-3 bg-emerald-50/30 p-2 rounded-xl border border-emerald-50">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleUpdateItem(i, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
                                  className="h-6 w-6 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
                                >
                                  <Minus className="h-3 w-3 text-slate-400" />
                                </button>
                                <span className="w-8 text-center font-black text-xs text-slate-900">{item.quantity}</span>
                                <button 
                                  onClick={() => handleUpdateItem(i, { quantity: (item.quantity || 1) + 1 })}
                                  className="h-6 w-6 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
                                >
                                  <Plus className="h-3 w-3 text-slate-400" />
                                </button>
                              </div>
                              <div className="h-4 w-px bg-emerald-100" />
                              <div className="flex items-center gap-5">
                                {/* 1. Precio Unitario (Primero) */}
                                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-emerald-100 shadow-sm focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
                                  <Input 
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => handleUpdateItem(i, { price: parseFloat(e.target.value) || 0 })}
                                    className="h-6 w-[45px] p-0 text-right bg-transparent border-none font-black text-[11px] tabular-nums focus-visible:ring-0 text-emerald-600"
                                  />
                                  <span className="text-[9px] font-black text-emerald-400">€/u</span>
                                </div>

                                <div className="h-4 w-px bg-emerald-100/30" />

                                {/* 2. Subtotal (Segundo) */}
                                <div className="flex flex-col items-start gap-1">
                                  <span className="text-[7px] font-black uppercase text-emerald-400 tracking-widest leading-none">Subtotal</span>
                                  <span className="text-[13px] font-black text-emerald-700 tabular-nums leading-none">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                                </div>
                              </div>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>

                     <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-xl shadow-slate-200 flex justify-between items-center mt-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Pedido</span>
                        <span className="text-xl font-black">{formatPrice(calculatedTotal)}</span>
                      </div>
                  </div>
                  <div className="space-y-1 col-span-2 mt-2 pt-2 border-t border-slate-50">
                    <Label className="text-[7px] font-black text-slate-300 uppercase tracking-widest ml-1">Notas Administrativas</Label>
                    <Textarea 
                      value={editingOrder.notes || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                      placeholder="Escribe aquí notas internas sobre este pedido..."
                      className="min-h-[35px] max-h-[60px] p-2 py-1 rounded-xl bg-slate-50 border-none shadow-none font-bold text-[9px] text-slate-500 placeholder:opacity-40 focus-visible:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="flex flex-row items-center justify-between gap-4 px-8 py-6 mt-4 border-t border-slate-100/50 bg-white rounded-b-[2.5rem]">
                  {/* Lado izquierdo: Eliminar */}
                  <div className="flex-shrink-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-10 px-4 rounded-xl text-rose-500 font-bold hover:bg-rose-50 hover:text-rose-600 text-xs gap-2 transition-all active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-[2.5rem] border-none p-6 sm:p-8 gap-6 shadow-2xl z-[300]">
                        <AlertDialogHeader className="gap-3">
                          <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center mb-1">
                            <Trash2 className="h-6 w-6 text-rose-500" />
                          </div>
                          <AlertDialogTitle className="text-xl font-black text-slate-900 tracking-tight">¿Eliminar pedido?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row gap-2 mt-2">
                          <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              onDeleteOrder(editingOrder.id);
                              setIsEditDialogOpen(false);
                            }}
                            className="h-12 px-6 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 border-none text-xs"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Lado derecho: Descartar y Guardar */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsEditDialogOpen(false)} 
                      className="h-10 px-4 rounded-xl text-slate-400 font-bold hover:bg-slate-50 text-xs transition-all active:scale-95"
                    >
                      Descartar
                    </Button>
                    <Button 
                      onClick={handleSaveEdit}
                      className="h-10 px-6 rounded-xl bg-[#4A7C59] text-white font-black hover:bg-[#3d6649] shadow-xl shadow-[#4A7C59]/10 text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Save className="h-4 w-4" /> Guardar Pedido
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
      {/* DIÁLOGO DE PREVISUALIZACIÓN DE IMÁGENES (GALERÍA) */}
      <Dialog open={previewImages.length > 0} onOpenChange={(open) => !open && setPreviewImages([])}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center z-[1000] focus:ring-0">
          {previewImages.length > 0 && (
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-6 p-4 pt-16">
              <button 
                onClick={() => setPreviewImages([])}
                className="fixed top-8 right-8 h-12 w-12 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-all z-[1010] backdrop-blur-md border border-white/20"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
              
              <div className="w-full flex flex-row items-center justify-center gap-6 py-8 px-4 max-h-[90vh]">
                {previewImages.map((url, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ scale: 0.9, opacity: 0, x: 20 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative flex flex-col items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-white text-[10px] font-black tracking-widest uppercase shadow-2xl mb-2">
                      Foto {idx + 1}
                    </div>
                    <img 
                      src={url} 
                      alt={`Preview ${idx + 1}`} 
                      className="max-h-[75vh] w-auto rounded-2xl shadow-2xl object-contain border-2 border-white/10"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
