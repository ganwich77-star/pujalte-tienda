'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Sparkles, ShoppingBag, MessageCircle, ArrowRight, Volume2, VolumeX } from 'lucide-react'
import { Promo } from '@/lib/landing-config'
import { cn, fixPath } from '@/lib/utils'

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
  
  const current = promos[index]
  
  useEffect(() => {
    if (promos.length <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % promos.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [index, promos.length])

  useEffect(() => {
    if (current?.type === 'video') {
      setIsMuted(current.muted ?? true)
    }
  }, [index, current?.id])

  const next = () => setIndex((index + 1) % promos.length)
  const prev = () => setIndex((index - 1 + promos.length) % promos.length)

  const handleAction = (action: string) => {
    if (action === 'shop') onOpenStore()
    else if (action === 'contact') onContact()
    else onClose()
  }

  if (!current) return null

  const getActionIcon = (action: string) => {
    if (action === 'shop') return <ShoppingBag className="w-5 h-5" />
    if (action === 'contact') return <MessageCircle className="w-5 h-5" />
    return <ArrowRight className="w-5 h-5" />
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0a0f0d]/90 backdrop-blur-xl"
      />

      <motion.div
        layoutId="promo-container"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-6xl aspect-[16/9] bg-white rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/20 pointer-events-auto"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* BACKGROUND MEDIA (HORIZONTAL FULL) */}
            <div className="absolute inset-0 w-full h-full">
              {(current.type === 'video' || current.url?.match(/\.(mp4|mov|webm|m4v)/i)) ? (
                <video 
                  ref={videoRef}
                  src={fixPath(current.url)} 
                  autoPlay 
                  loop 
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover transition-all duration-[10s] ease-out"
                  style={{ 
                    transform: current.zoom ? `scale(${current.zoomScale || 1.25})` : 'scale(1)',
                    transformOrigin: `center ${current.zoomY ?? 50}%`
                  }}
                />
              ) : (
                <img 
                  src={fixPath(current.url)} 
                  alt={current.title}
                  className="w-full h-full object-cover transition-all duration-[10s] ease-out"
                  style={{ 
                    transform: current.zoom ? `scale(${current.zoomScale || 1.25})` : 'scale(1)',
                    transformOrigin: `center ${current.zoomY ?? 50}%`
                  }}
                />
              )}

              {/* REFINED OVERLAY (MUCH LIGHTER TO PRESERVE ORIGINAL COLORS) */}
              <div className={cn(
                "absolute inset-0 pointer-events-none transition-all duration-700",
                current.contentPosition === 'top-left' && "bg-gradient-to-br from-black/30 via-black/5 to-transparent",
                current.contentPosition === 'top-right' && "bg-gradient-to-bl from-black/30 via-black/5 to-transparent",
                current.contentPosition === 'bottom-left' && "bg-gradient-to-tr from-black/30 via-black/5 to-transparent",
                current.contentPosition === 'bottom-right' && "bg-gradient-to-tl from-black/30 via-black/5 to-transparent",
                current.contentPosition === 'center' && "bg-black/10",
                !current.contentPosition && "bg-gradient-to-tr from-black/30 via-black/5 to-transparent"
              )} />
            </div>

            {/* CONTENT WITH POSITIONING */}
            <div className={cn(
              "absolute inset-0 flex flex-col z-20 transition-all",
              (current.contentPosition === 'top' || current.contentPosition === 'bottom-center') 
                ? "p-4 md:p-8" 
                : "p-8 md:p-12",
              current.contentPosition === 'top-left' && "justify-start items-start text-left",
              current.contentPosition === 'top' && "justify-start items-center text-center",
              current.contentPosition === 'top-right' && "justify-start items-end text-right",
              current.contentPosition === 'bottom-left' && "justify-end items-start text-left",
              current.contentPosition === 'bottom-center' && "justify-end items-center text-center",
              current.contentPosition === 'bottom-right' && "justify-end items-end text-right",
              current.contentPosition === 'center' && "justify-center items-center text-center",
              !current.contentPosition && "justify-end items-start text-left"
            )}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col",
                  (current.contentPosition === 'top' || current.contentPosition === 'bottom-center') 
                    ? "max-w-7xl w-full space-y-2" 
                    : "max-w-xl space-y-4",
                  (current.contentPosition === 'top' || current.contentPosition === 'bottom-center' || current.contentPosition === 'center') && "items-center",
                  (current.contentPosition === 'top-left' || current.contentPosition === 'bottom-left') && "items-start text-left",
                  (current.contentPosition === 'top-right' || current.contentPosition === 'bottom-right') && "items-end text-right"
                )}
              >
                {/* LINE 1: BADGE + TITLE for CENTER TOP/BOTTOM, OR STACKED for CORNERS */}
                {(current.contentPosition === 'top' || current.contentPosition === 'bottom-center') ? (
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "inline-flex items-center gap-2 rounded-full font-black uppercase tracking-[0.3em] text-white shadow-lg transition-all px-3 py-1 text-[8px]",
                      current.color || 'from-amber-400 to-orange-500',
                      "bg-gradient-to-r shrink-0"
                    )}>
                      <Sparkles className="h-2 w-2" />
                      {current.badge}
                    </div>
                    <h2 className="font-black text-white leading-none tracking-tighter drop-shadow-2xl italic text-2xl md:text-4xl">
                      {current.title}
                    </h2>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "inline-flex items-center gap-2 rounded-full font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all px-4 py-1.5 text-[9px]",
                      current.color || 'from-amber-400 to-orange-500',
                      "bg-gradient-to-r"
                    )}>
                      <Sparkles className="h-2.5 w-2.5" />
                      {current.badge}
                    </div>
                    <h2 className={cn(
                      "font-black text-white leading-[1] tracking-tighter drop-shadow-2xl italic transition-all",
                      current.contentPosition === 'center' ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl"
                    )}>
                      {current.title}
                    </h2>
                  </>
                )}
                
                {/* LINE 2: SUBTITLE */}
                <p className={cn(
                  "text-white/90 font-medium leading-tight drop-shadow-lg transition-all",
                  (current.contentPosition === 'top' || current.contentPosition === 'bottom-center')
                    ? "text-xs md:text-base max-w-3xl"
                    : "text-lg md:text-xl max-w-lg"
                )}>
                  {current.subtitle}
                </p>

                {current.action !== 'none' && (
                  <button 
                    onClick={() => handleAction(current.action)}
                    className={cn(
                      "group relative flex items-center gap-3 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 overflow-hidden",
                      (current.contentPosition === 'top' || current.contentPosition === 'bottom-center')
                        ? "px-6 py-3 mt-1"
                        : "px-8 py-5 mt-2"
                    )}
                  >
                    <div className="absolute inset-0 bg-[#4A7C59]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">{current.buttonText || '¡Me interesa!'}</span>
                    <div className="relative z-10 p-1.5 bg-black text-white rounded-lg group-hover:bg-[#4A7C59] transition-colors">
                      {getActionIcon(current.action)}
                    </div>
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* REFINED CLOSE BUTTON */}
        {/* Botón de cierre eliminado a petición del usuario */}

        {/* Navigation - Only show if more than 1 promo */}
        {promos.length > 1 ? (
          <>
            <div className="absolute bottom-10 right-8 md:right-20 z-50 flex items-center gap-4">
              {current.type === 'video' && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="h-14 w-14 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 shadow-2xl mr-4"
                >
                  {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </button>
              )}
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
        ) : (
          /* Case for single promo with video - Sound button needs to stay */
          current.type === 'video' && (
            <div className="absolute bottom-10 right-8 md:right-20 z-50">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="h-14 w-14 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 shadow-2xl"
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
            </div>
          )
        )}
      </motion.div>
      
      {/* "Sugerencia de cierre" */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-[0.4em] pointer-events-none"
      >
        Haz clic fuera para continuar a la web
      </motion.p>
    </div>
  )
}

