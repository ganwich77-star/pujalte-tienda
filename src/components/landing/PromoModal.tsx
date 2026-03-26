'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Sparkles, Tag, ShoppingBag, Volume2, VolumeX } from 'lucide-react'
import { Promo } from '@/lib/landing-config'
import { fixPath } from '@/lib/utils'

// MEDIDAS RECOMENDADAS:
// Fotos: 1920x1080px (16:9) en formato .webp (calidad 80) para optimización máxima.
// Videos: MP4 (H.264) o WebM, resolución 720p, bitrate < 2Mbps para fluidez total.

interface PromoModalProps {
  promos: Promo[]
  onClose: () => void
  onOpenStore: () => void
  onContact: () => void
}

export function PromoModal({ promos, onClose, onOpenStore, onContact }: PromoModalProps) {
  const [index, setIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (promos.length <= 1) return
    
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % promos.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [index, promos.length])

  const next = () => setIndex((index + 1) % promos.length)
  const prev = () => setIndex((index - 1 + promos.length) % promos.length)

  const handleAction = (action: string) => {
    if (action === 'shop') onOpenStore()
    else if (action === 'contact') onContact()
    else onClose()
  }

  const current = promos[index]
  if (!current) return null

  // Icono dinámico simplificado basado en el badge
  const getIcon = (badge: string) => {
    const b = badge.toLowerCase()
    if (b.includes('oferta') || b.includes('descuento')) return Tag
    if (b.includes('tienda') || b.includes('comprar')) return ShoppingBag
    return Sparkles
  }
  
  const Icon = getIcon(current.badge)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
      {/* Background Overlay con desenfoque */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-6xl aspect-[16/9] bg-slate-900 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {current.type === 'video' ? (
              <video
                ref={videoRef}
                src={current.url}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src={fixPath(current.url)} 
                alt={current.title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-xl"
              >
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${current.color || 'from-amber-400 to-orange-500'} text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-xl`}>
                  <Icon className="h-3 w-3" />
                  {current.badge}
                </div>
                
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.05] tracking-tight">
                  {current.title}
                </h2>
                
                <p className="text-lg md:text-xl text-white font-black mb-10 leading-relaxed uppercase tracking-widest bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/10 inline-block">
                  {current.subtitle}
                </p>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleAction(current.action)}
                    className="bg-white text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-[#4A7C59] hover:text-white transition-all duration-300 shadow-2xl active:scale-95 group"
                  >
                    {current.buttonText}
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  {current.type === 'video' && (
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="h-14 w-14 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                    >
                      {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 md:top-10 md:right-10 z-50 h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
        >
          <X className="h-8 w-8" />
        </button>

        {/* Navigation - Only show if more than 1 promo */}
        {promos.length > 1 && (
          <>
            <div className="absolute bottom-10 right-8 md:right-20 z-50 flex items-center gap-4">
              <button 
                onClick={prev}
                className="h-14 w-14 rounded-2xl border border-white/20 bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 shadow-2xl"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={next}
                className="h-14 w-14 rounded-2xl border border-white/20 bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 shadow-2xl"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-10 left-8 md:left-20 z-50 flex gap-3">
              {promos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 transition-all duration-500 rounded-full ${index === i ? 'w-16 bg-white' : 'w-6 bg-white/20'}`}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
      
      {/* "Sugerencia de cierre" */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-[0.4em] pointer-events-none"
      >
        Haz clic fuera o en la X para continuar a la web
      </motion.p>
    </div>
  )
}

