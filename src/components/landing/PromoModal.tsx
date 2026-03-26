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
    }, 6000)
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
        className="relative w-full max-w-6xl flex flex-col md:block md:aspect-[16/9] md:bg-white md:rounded-[2.5rem] md:overflow-hidden md:shadow-[0_0_100px_rgba(0,0,0,0.5)] md:border md:border-white/20 pointer-events-auto"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col w-full md:absolute md:inset-0"
          >
            {/* MOBILE ONLY: HEADER (ABOVE VIDEO) */}
            <div className="md:hidden flex flex-col items-center text-center p-6 space-y-4">
              <div className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-black uppercase tracking-[0.3em] text-white shadow-2xl text-[9px]",
                current.color || 'from-amber-400 to-orange-500',
                "bg-gradient-to-r"
              )}>
                <Sparkles className="h-3 w-3" />
                {current.badge}
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl italic">
                {current.title}
              </h2>
              
              <p className="text-sm sm:text-base text-white/80 font-medium leading-tight max-w-[280px] sm:max-w-md">
                {current.subtitle}
              </p>
            </div>

            {/* MEDIA CONTAINER (ALWAYS HORIZONTAL) */}
            <div className="relative w-full aspect-video md:absolute md:inset-0 bg-black rounded-[2rem] md:rounded-none overflow-hidden shadow-2xl z-10 transition-all duration-500">
              {/* Media Content */}
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

                {/* OVERLAY (Only visible on desktop/inside) */}
                <div className={cn(
                  "absolute inset-0 pointer-events-none transition-all duration-700 md:block hidden",
                  current.contentPosition === 'top-left' && "bg-gradient-to-br from-black/30 via-black/5 to-transparent",
                  current.contentPosition === 'top-right' && "bg-gradient-to-bl from-black/30 via-black/5 to-transparent",
                  current.contentPosition === 'bottom-left' && "bg-gradient-to-tr from-black/30 via-black/5 to-transparent",
                  current.contentPosition === 'bottom-right' && "bg-gradient-to-tl from-black/30 via-black/5 to-transparent",
                  current.contentPosition === 'center' && "bg-black/10",
                  !current.contentPosition && "bg-gradient-to-tr from-black/30 via-black/5 to-transparent"
                )} />
              </div>

              {/* DESKTOP ONLY CONTENT OVERLAY */}
              <div className={cn(
                "absolute inset-0 md:flex hidden flex-col z-20 p-10 lg:p-20 transition-all",
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
                    (current.contentPosition === 'top' || current.contentPosition === 'bottom-center' || current.contentPosition === 'center') 
                      ? "max-w-6xl w-full px-4 items-center" 
                      : "max-w-xl",
                    (current.contentPosition === 'top-right' || current.contentPosition === 'bottom-right') && "items-end text-right"
                  )}
                >
                  <div className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all",
                    current.color || 'from-amber-400 to-orange-500',
                    "bg-gradient-to-r"
                  )}>
                    <Sparkles className="h-3 w-3" />
                    {current.badge}
                  </div>
                  
                  <h2 className={cn(
                    "font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl italic transition-all mt-6",
                    (current.contentPosition === 'top' || current.contentPosition === 'bottom-center') 
                      ? "text-5xl" 
                      : "text-7xl"
                  )}>
                    {current.title}
                  </h2>
                  
                  <p className="text-xl md:text-2xl text-white/90 font-medium leading-tight drop-shadow-lg mt-4 max-w-lg">
                    {current.subtitle}
                  </p>

                  {current.action !== 'none' && (
                    <button 
                      onClick={() => handleAction(current.action)}
                      className="group relative flex items-center gap-4 bg-white text-black px-10 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] active:scale-95 overflow-hidden mt-8"
                    >
                      <div className="absolute inset-0 bg-[#4A7C59]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10">{current.buttonText || '¡Me interesa!'}</span>
                      <div className="relative z-10 p-2 bg-black text-white rounded-xl group-hover:bg-[#4A7C59] transition-colors">
                        {getActionIcon(current.action)}
                      </div>
                    </button>
                  )}
                </motion.div>
              </div>
            </div>

            {/* MOBILE ONLY: FOOTER (BELOW VIDEO) */}
            {current.action !== 'none' && (
              <div className="md:hidden flex justify-center p-6">
                <button 
                  onClick={() => handleAction(current.action)}
                  className="group relative flex items-center gap-4 bg-white text-black px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 overflow-hidden"
                >
                   <div className="absolute inset-0 bg-[#4A7C59]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">{current.buttonText || '¡Me interesa!'}</span>
                  <div className="relative z-10 p-2 bg-black text-white rounded-xl">
                    {getActionIcon(current.action)}
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* REFINED CLOSE BUTTON */}
        {/* Botón de cierre eliminado a petición del usuario */}

        {/* Navigation - Only show if more than 1 promo */}
        {promos.length > 1 && (
          <>
            <button 
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 md:h-12 md:w-12 rounded-full border border-white/10 bg-black/10 backdrop-blur-sm text-white/50 flex items-center justify-center hover:bg-black/40 hover:text-white transition-all active:scale-90"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <button 
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 md:h-12 md:w-12 rounded-full border border-white/10 bg-black/10 backdrop-blur-sm text-white/50 flex items-center justify-center hover:bg-black/40 hover:text-white transition-all active:scale-90"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
              {promos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1 transition-all duration-500 rounded-full ${index === i ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
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
        Haz clic fuera para continuar a la web
      </motion.p>
    </div>
  )
}

