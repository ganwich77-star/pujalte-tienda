'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'

export default function PepeMagicPage() {
  const router = useRouter()

  useEffect(() => {
    // ACTIVAMOS EL ACCESO MAESTRO AUTOMÁTICAMENTE
    localStorage.setItem('pujalte_fast_access', 'true')
    
    // REDIRIGIMOS AL PANEL DE CONTROL EN 1 SEGUNDO
    const timer = setTimeout(() => {
      router.push('/admin')
    }, 1500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-[#4A7C59] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#4A7C59]/40 mb-8 animate-bounce">
        <Camera className="h-12 w-12 text-white" />
      </div>
      
      <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic mb-2">
        ¡Hola Pepe!
      </h1>
      <p className="text-[#4A7C59] font-black uppercase tracking-[0.4em] text-xs animate-pulse">
        Activando Acceso Maestro...
      </p>

      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce" />
      </div>
    </div>
  )
}
