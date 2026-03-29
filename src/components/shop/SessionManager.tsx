'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUserStore } from '@/store/user'
import { 
  Clock, 
  LogOut, 
  Hand,
  ShieldAlert,
  Fingerprint
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

// CONFIGURACIÓN DE TIEMPO (15 MINUTOS)
const INACTIVITY_TIME = 15 * 60 * 1000 // 15 minutos en ms
const WARNING_TIME = 60 * 1000 // Mostrar aviso 60 segundos antes de cerrar

export function SessionManager() {
  const { isLoggedIn, logout } = useUserStore()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Función para reiniciar el cronómetro de inactividad
  const resetInactivity = useCallback(() => {
    setLastActivity(Date.now())
    if (showWarning) {
      setShowWarning(false)
      setTimeLeft(60)
    }
  }, [showWarning])

  // Escuchar eventos de usuario (ratón, teclado, scroll, touch)
  useEffect(() => {
    if (!isLoggedIn) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, resetInactivity))

    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivity))
    }
  }, [isLoggedIn, resetInactivity])

  // Comprobar inactividad cada segundo
  useEffect(() => {
    if (!isLoggedIn) return

    const interval = setInterval(() => {
      const now = Date.now()
      const diff = now - lastActivity

      // Si ha pasado el tiempo total de inactividad
      if (diff >= INACTIVITY_TIME) {
        logout()
        setShowWarning(false)
        return
      }

      // Si falta poco para que caduque la sesión, mostrar aviso
      if (diff >= (INACTIVITY_TIME - WARNING_TIME)) {
        setShowWarning(true)
        // Calcular segundos restantes exactos para el modal
        const secondsRemaining = Math.max(0, Math.ceil((INACTIVITY_TIME - diff) / 1000))
        setTimeLeft(secondsRemaining)
      } else {
        if (showWarning) setShowWarning(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isLoggedIn, lastActivity, logout, showWarning])

  if (!isLoggedIn) return null

  return (
    <AnimatePresence>
      {showWarning && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          {/* Fondo desenfocado */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          {/* Modal de Reconexión */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-[420px] rounded-[3rem] shadow-2xl relative overflow-hidden p-8 sm:p-10 text-center border-t-8 border-[#4A7C59]"
          >
            {/* Decoración Superior */}
            <div className="flex justify-center mb-8 relative">
              <div className="absolute inset-0 bg-[#4A7C59]/5 rounded-full blur-2xl scale-150" />
              <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-[#4A7C59] to-[#3D664A] flex items-center justify-center shadow-xl shadow-[#4A7C59]/30 relative z-10 transform -rotate-6">
                <Clock className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>

            <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tight uppercase italic">
              ¿Sigues ahí? 
            </h2>
            
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 px-4">
              Por tu seguridad, vamos a cerrar tu sesión automáticamente en <br/>
              <span className="text-[#4A7C59] font-black text-2xl tabular-nums ml-1 bg-[#4A7C59]/5 px-4 py-1 rounded-xl">00:{timeLeft.toString().padStart(2, '0')}</span> 
            </p>

            <div className="space-y-4">
              <Button 
                onClick={resetInactivity}
                className="w-full h-16 rounded-[2rem] bg-[#4A7C59] hover:bg-[#3D664A] text-white text-lg font-black uppercase tracking-widest transition-all shadow-lg shadow-[#4A7C59]/20 flex items-center justify-center gap-3 active:scale-95"
              >
                <Hand className="h-6 w-6" /> ESTOY AQUÍ
              </Button>

              <Button 
                variant="ghost"
                onClick={() => logout()}
                className="w-full h-12 text-slate-400 hover:text-red-500 hover:bg-red-50 text-[11px] font-black uppercase tracking-[0.2em] transition-all"
              >
                CERRAR SESIÓN AHORA
              </Button>
            </div>

            {/* Pie de seguridad */}
            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-center gap-2 opacity-30">
              <ShieldAlert className="h-4 w-4 text-[#4A7C59]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">IDENTIFICACIÓN PROTEGIDA</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
