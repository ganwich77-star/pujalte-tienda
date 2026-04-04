'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FastAdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Marcamos en el navegador que este dispositivo tiene acceso rápido
    // Esto lo usaremos en el panel para no pedir login si el token es válido
    localStorage.setItem('pujalte_fast_access', 'true')
    
    // Redirigimos directamente al panel de clientes que es lo que más usas
    router.push('/admin?tab=customers')
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#4A7C59] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4A7C59] animate-pulse">Entrando al panel...</p>
      </div>
    </div>
  )
}
