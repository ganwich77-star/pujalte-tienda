'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, X, Settings2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('pujalte-cookies-consent')
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem('pujalte-cookies-consent', 'all')
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    localStorage.setItem('pujalte-cookies-consent', 'none')
    setIsVisible(false)
  }

  const handleSaveConfig = () => {
    localStorage.setItem('pujalte-cookies-consent', 'custom')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="fixed bottom-6 left-6 z-[9999] pointer-events-none"
        >
          <div className="w-full max-w-[320px] bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-3 pointer-events-auto flex flex-col gap-2">
            
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 h-5 w-5 rounded bg-white/10 flex items-center justify-center mt-0.5">
                <ShieldCheck className="h-2.5 w-2.5 text-[#4A7C59]" />
              </div>
              <p className="text-[9px] text-white/60 leading-tight">
                Utilizamos cookies propias y de terceros para analítica. Consulta nuestra{' '}
                <a href="/politica-cookies" className="text-white hover:text-[#4A7C59] underline decoration-[#4A7C59]">política</a>.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
              <button 
                onClick={() => setShowConfig(!showConfig)}
                className="text-[8px] font-bold uppercase tracking-wider text-white/30 hover:text-white transition-colors"
              >
                Ajustes
              </button>
              
              <div className="flex gap-1.5">
                <button 
                  onClick={handleRejectAll}
                  className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white/30 hover:text-red-400 transition-colors"
                >
                  Rechazar
                </button>
                <Button 
                  onClick={handleAcceptAll}
                  className="bg-[#4A7C59] hover:bg-[#3d664a] rounded-md h-6 px-3 text-[8px] font-bold uppercase tracking-wider text-white transition-all active:scale-95"
                >
                  Aceptar
                </Button>
              </div>
            </div>

            {/* Panel de Configuración Ultra-Compacto */}
            <AnimatePresence>
              {showConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="w-full space-y-2 pt-1 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5">
                    <span className="text-[9px] font-bold text-white/60">Necesarias</span>
                    <span className="text-[8px] font-black text-[#4A7C59]">OK</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5">
                    <span className="text-[9px] font-bold text-white/60">Análisis</span>
                    <input type="checkbox" defaultChecked className="accent-[#4A7C59] h-2.5 w-2.5" />
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5">
                    <span className="text-[9px] font-bold text-white/60">Publicidad</span>
                    <input type="checkbox" defaultChecked className="accent-[#4A7C59] h-2.5 w-2.5" />
                  </div>
                  <button 
                    onClick={handleSaveConfig}
                    className="w-full py-1.5 mt-1 bg-white/5 rounded-lg text-[9px] font-black text-white/60 uppercase hover:bg-white/10 transition-colors"
                  >
                    Guardar selección
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
