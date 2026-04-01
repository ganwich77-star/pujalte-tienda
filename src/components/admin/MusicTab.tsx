'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Trash2, 
  Play, 
  Pause, 
  Loader2, 
  Music2, 
  Disc,
  X,
  Sparkles,
  Sun,
  Layers,
  Settings2,
  Plus,
  ChevronDown,
  Tag,
  ExternalLink
} from 'lucide-react'
import { db, COLLECTIONS, storage } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function MusicTab() {
  const [songs, setSongs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [playingSong, setPlayingSong] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [isManagingTags, setIsManagingTags] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [customTags, setCustomTags] = useState<any[]>([])
  const [audio] = useState(new Audio())

  const defaultTags = [
    { id: 'ROMANTICA', label: 'Romántica', icon: Sparkles },
    { id: 'ALEGRE', label: 'Alegre', icon: Sun },
    { id: 'INFANTIL', label: 'Infantil', icon: Sparkles },
    { id: 'EPICA', label: 'Épica', icon: Layers },
  ]

  useEffect(() => {
    loadSongs()
    loadTags()
    
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const loadTags = async () => {
    try {
      const q = query(collection(db, 'music_categories'), orderBy('label', 'asc'))
      const snap = await getDocs(q)
      const tags = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setCustomTags(tags.length > 0 ? tags : defaultTags)
    } catch (e) {
      console.error('Error loading tags:', e)
      setCustomTags(defaultTags)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      const { setDoc } = await import('firebase/firestore')
      const id = newTagName.toUpperCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      await setDoc(doc(db, 'music_categories', id), {
        label: newTagName,
        id: id
      })
      setNewTagName('')
      loadTags()
      toast({ title: 'Etiqueta creada' })
    } catch (e) {
      console.error('Error creating tag:', e)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteDoc(doc(db, 'music_categories', tagId))
      loadTags()
      toast({ title: 'Etiqueta eliminada' })
    } catch (e) {
      console.error('Error deleting tag:', e)
    }
  }

  const loadSongs = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'comuniones2026_music'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setSongs(list)
    } catch (e) {
      console.error('Error loading music:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes('audio')) {
      toast({ title: 'Archivo no válido', description: 'Por favor, selecciona un archivo MP3.', variant: 'destructive' })
      return
    }

    try {
      // Validar si ya existe una canción con el mismo nombre (fácilmente legible)
      const fileNameRaw = file.name.replace(/\.[^/.]+$/, "")
      const exists = songs.find(s => s.name.toLowerCase().trim() === fileNameRaw.toLowerCase().trim())
      
      if (exists) {
        toast({ 
          title: '🚨 ARCHIVO DUPLICADO', 
          description: `La canción "${fileNameRaw}" ya está en vuestro catálogo. No la hemos subido de nuevo para ahorrar espacio.`, 
          variant: 'destructive',
        })
        // Limpiamos el input para que podáis seleccionar otro
        e.target.value = ''
        return
      }

      setUploading(true)
      setUploadProgress(0)

      const storageRef = ref(storage, `library/music/${Date.now()}_${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          setUploading(false)
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          
          await addDoc(collection(db, 'comuniones2026_music'), {
            name: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            url,
            createdAt: serverTimestamp(),
            size: file.size,
            duration: '0:00',
            category: 'ALL'
          })

          toast({ title: 'Canción añadida', description: 'Se ha guardado en vuestra fonoteca.' })
          setUploading(false)
          loadSongs()
        }
      )
    } catch (e) {
      console.error('Error in upload process:', e)
      setUploading(false)
    }
  }

  const handleDelete = async (song: any) => {
    if (!confirm('¿Seguro que quieres eliminar esta canción de la biblioteca?')) return

    try {
      await deleteDoc(doc(db, 'comuniones2026_music', song.id))
      // Intentar borrar del storage también si existe la URL
      if (song.url) {
        try {
          const fileRef = ref(storage, song.url)
          await deleteObject(fileRef)
        } catch (e) {
          console.warn('Could not delete file from storage:', e)
        }
      }
      toast({ title: 'Canción eliminada' })
      loadSongs()
    } catch (e) {
      console.error('Error deleting song:', e)
    }
  }

  const togglePlay = (url: string, id: string) => {
    if (playingSong === id) {
      audio.pause()
      setPlayingSong(null)
    } else {
      audio.src = url
      audio.play()
      setPlayingSong(id)
    }
  }

  const handleUpdateCategory = async (songId: string, newCategory: string) => {
    try {
      const { updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'comuniones2026_music', songId), {
        category: newCategory
      })
      toast({ title: 'Categoría actualizada' })
      loadSongs()
    } catch (e) {
      console.error('Error updating category:', e)
    }
  }

  const filteredSongs = songs
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 p-6 rounded-3xl border border-white/50 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Music2 className="text-white h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Fonoteca Maestra</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catálogo musical "Insta-Style"</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            onClick={() => setIsManagingTags(true)}
            className="h-10 rounded-xl bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-slate-100 border border-slate-100"
          >
            <Settings2 className="h-4 w-4" /> Etiquetas
          </Button>

          <a 
            href="https://pixabay.com/music/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-100 shrink-0"
          >
            <ExternalLink className="h-3 w-3" /> Pixabay
          </a>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full md:w-36 h-10 rounded-xl bg-white/50 border-white/80 focus:bg-white shadow-sm transition-all text-xs font-bold"
            />
          </div>
          
          <label className={cn(
            "flex items-center gap-2 px-4 h-10 rounded-xl cursor-pointer transition-all font-black text-[10px] uppercase tracking-widest shadow-lg",
            uploading ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
          )}>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            {uploading ? `${Math.round(uploadProgress)}%` : 'Añadir'}
            <input type="file" className="hidden" accept="audio/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
            selectedCategory === 'ALL'
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
              : "bg-white text-slate-400 border-slate-100 hover:border-blue-200"
          )}
        >
          <Music2 className="h-3.5 w-3.5" /> Todas
        </button>
        {customTags.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
              selectedCategory === cat.id
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
                : "bg-white text-slate-400 border-slate-100 hover:border-blue-200"
            )}
          >
            <Tag className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <span className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Cargando vuestro catálogo...</span>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                <Disc className="h-10 w-10 text-slate-300 animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 tracking-tight">Vuestra biblioteca está vacía</h3>
            <p className="text-slate-400 text-sm max-w-xs mt-2">Subid vuestras canciones favoritas para asignarlas luego con un click.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {filteredSongs.map((song) => (
              <motion.div
                key={song.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group w-full"
              >
                <Card className="overflow-hidden rounded-2xl border-white bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 border p-3">
                  <div className="flex items-center gap-4">
                    {/* MINI PLAYER */}
                    <div className="relative flex-shrink-0 group/player">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors shadow-inner overflow-hidden">
                            {playingSong === song.id ? (
                                <div className="flex items-end gap-0.5 h-4">
                                    <div className="w-0.5 bg-blue-500 rounded-full animate-music-bar-1 h-2" />
                                    <div className="w-0.5 bg-blue-500 rounded-full animate-music-bar-2 h-4" />
                                    <div className="w-0.5 bg-blue-500 rounded-full animate-music-bar-3 h-3" />
                                </div>
                            ) : (
                                <Music2 className="text-slate-300 h-5 w-5" />
                            )}
                        </div>
                        <button 
                            onClick={() => togglePlay(song.url, song.id)}
                            className="absolute inset-0 flex items-center justify-center bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                        >
                            {playingSong === song.id ? <Pause className="text-blue-600 h-5 w-5" /> : <Play className="text-blue-600 fill-blue-600 h-5 w-5" />}
                        </button>
                    </div>

                    {/* SONG INFO */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[12px] font-black text-slate-800 truncate tracking-tight leading-tight uppercase mb-1">{song.name}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 bg-slate-100 text-slate-400 text-[9px] px-3 py-1 rounded-full font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                            <Tag className="h-2.5 w-2.5" />
                            {customTags.find(t => t.id === (song.category || 'ALL'))?.label || 'Sin etiqueta'}
                            <ChevronDown className="h-2 w-2" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 rounded-2xl border-slate-100 shadow-xl p-1">
                           <DropdownMenuLabel className="text-[9px] font-black uppercase text-slate-400 px-3 py-2">Cambiar categoría</DropdownMenuLabel>
                           {customTags.map(tag => (
                             <DropdownMenuItem 
                              key={tag.id}
                              onClick={() => handleUpdateCategory(song.id, tag.id)}
                              className={cn(
                                "text-[10px] font-bold py-2.5 px-3 rounded-xl transition-colors",
                                song.category === tag.id ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50"
                              )}
                             >
                               {tag.label}
                             </DropdownMenuItem>
                           ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* EXTRA INFO & ACTIONS */}
                    <div className="hidden md:flex items-center gap-6 px-4">
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tamaño</p>
                          <p className="text-[10px] font-bold text-slate-400">{song.size ? (song.size / (1024 * 1024)).toFixed(1) + ' MB' : '--'}</p>
                       </div>
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(song)}
                        className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-200 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="md:hidden">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(song)}
                        className="h-8 w-8 rounded-lg text-slate-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes music-bar-1 { 0%, 100% { height: 8px; } 50% { height: 16px; } }
        @keyframes music-bar-2 { 0%, 100% { height: 18px; } 50% { height: 10px; } }
        @keyframes music-bar-3 { 0%, 100% { height: 12px; } 50% { height: 22px; } }
        .animate-music-bar-1 { animation: music-bar-1 0.8s ease-in-out infinite; }
        .animate-music-bar-2 { animation: music-bar-2 1s ease-in-out infinite; }
        .animate-music-bar-3 { animation: music-bar-3 1.2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
      `}</style>
      {/* DIALOG GESTION ETIQUETAS */}
      <Dialog open={isManagingTags} onOpenChange={setIsManagingTags}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
           <div className="bg-slate-900 p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Tag className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Gestionar Etiquetas</h2>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Crea categorías personalizadas para vuestra música</p>
           </div>

           <div className="p-8 space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="Nueva etiqueta..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="rounded-2xl border-slate-100 bg-slate-50 h-10 text-xs font-bold focus-visible:bg-white transition-all pr-4"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Button 
                  onClick={handleCreateTag}
                  className="h-10 bg-blue-600 text-white rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100"
                >
                  Añadir
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Etiquetas actuales</p>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                   {customTags.map(tag => (
                     <div key={tag.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                              <Tag className="h-4 w-4" />
                           </div>
                           <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{tag.label}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteTag(tag.id)}
                          className="h-8 w-8 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
