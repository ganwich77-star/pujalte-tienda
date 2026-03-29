'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Sparkles, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react'
import { Promo } from '@/lib/landing-config'
import { cn, fixPath } from '@/lib/utils'

interface PromoModalProps {
  promos: Promo[]
  onClose: () => void
  onOpenStore: () => void
  onContact: () => void
}

const HeaderContent = ({ current }: { current: Promo }) => {
  if (!current) return null
  return (
    <div className={cn(
      "flex flex-col space-y-3 md:space-y-4",
      "items-center text-center",
      current.contentPosition?.includes('left') && "md:items-start md:text-left",
      current.contentPosition?.includes('right') && "md:items-end md:text-right",
      current.contentPosition === 'center' && "md:items-center md:text-center"
    )}>
      <div className={cn(
        "inline-flex items-center gap-2 rounded-full px-5 py-2 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all",
        current.color || 'from-amber-400 to-orange-500',
        "bg-gradient-to-r"
      )}>
        <Sparkles className="h-3 w-3" />
        {current.badge}
      </div>
      <h2 className={cn(
        "font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl italic transition-all",
        "text-3xl md:text-4xl lg:text-5xl"
      )}>
        {current.title}
      </h2>
      <p className="text-xs md:text-base lg:text-lg text-white/80 font-medium leading-tight max-w-lg">
        {current.subtitle}
      </p>
    </div>
  )
}

const FooterContent = ({ current, handleAction }: { current: Promo, handleAction: (a: string) => void }) => {
  if (!current) return null
  const getActionIcon = (action: string) => {
    if (action === 'shop') return <ShoppingBag className="w-5 h-5" />
    if (action === 'contact') return <MessageCircle className="w-5 h-5" />
    return <ArrowRight className="w-5 h-5" />
  }

  return (
    <div className={cn(
      "flex flex-col",
      "items-center text-center",
      current.contentPosition?.includes('left') && "md:items-start md:text-left",
      current.contentPosition?.includes('right') && "md:items-end md:text-right",
      current.contentPosition === 'center' && "md:items-center md:text-center"
    )}>
      {current.action !== 'none' && (
        <button 
          onClick={() => handleAction(current.action)}
          className="group relative flex items-center gap-4 bg-white text-black px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] md:text-xs transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-xl active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#4A7C59]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10">{current.buttonText || '¡Me interesa!'}</span>
          <div className="relative z-10 p-2 bg-black text-white rounded-xl group-hover:bg-[#4A7C59] transition-colors">
            {getActionIcon(current.action)}
          </div>
        </button>
      )}
    </div>
  )
}

const MediaContent = ({ current, videoRef }: { current: Promo, videoRef: React.RefObject<HTMLVideoElement | null> }) => {
  if (!current) return null
  const isVideo = current.type === 'video' || 
                 (current.url && (
                   current.url.toLowerCase().endsWith('.mp4') || 
                   current.url.toLowerCase().endsWith('.mov') || 
                   current.url.toLowerCase().endsWith('.webm') || 
                   current.url.toLowerCase().endsWith('.m4v')
                 ))


  return (
    <div className="relative w-full h-full bg-black">
      {isVideo ? (
        <video 
          ref={videoRef}
          src={fixPath(current.url)} 
          autoPlay 
          loop 
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          style={{ 
            transform: current.zoom ? `scale(${current.zoomScale || 1.25})` : 'scale(1)',
            transformOrigin: `center ${current.zoomY ?? 50}%`
          }}
        />
      ) : (
        <img 
          src={fixPath(current.url)} 
          alt={current.title}
          className="w-full h-full object-cover"
          style={{ 
            transform: current.zoom ? `scale(${current.zoomScale || 1.25})` : 'scale(1)',
            transformOrigin: `center ${current.zoomY ?? 50}%`
          }}
        />
      )}
    </div>
  )
}

export function PromoModal({ promos, onClose, onOpenStore, onContact }: PromoModalProps) {
  const [index, setIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const current = promos[index]

  useEffect(() => {
    if (promos.length <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % promos.length)
    }, 5000) 
    return () => clearInterval(timer)
  }, [index, promos.length])

  useEffect(() => {
    if (!current || !current.url) return
    const video = videoRef.current
    if (video) {
        video.muted = true
        const playVideo = async () => {
            try {
                await video.play()
            } catch (err) {
                console.log("Autoplay blocked")
            }
        }
        playVideo()
    }
  }, [current?.url])
  
  const handleAction = (action: string) => {
    if (action === 'shop') onOpenStore()
    else if (action === 'contact') onContact()
    else onClose()
  }

  if (!current) return null

  const next = () => setIndex((index + 1) % promos.length)
  const prev = () => setIndex((index - 1 + promos.length) % promos.length)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-6xl overflow-hidden pointer-events-auto rounded-[2rem] md:rounded-[2.5rem] shadow-2xl"
      >
        <div className="relative w-full flex flex-col md:block bg-transparent overflow-hidden">
          
          {/* --- VERSIÓN MÓVIL (FLOTANTE SIN MARCOS) --- */}
          <div className="flex md:hidden flex-col w-full h-full bg-transparent">
            {/* Texto Arriba (Flotante) */}
            <div className="p-6 text-center">
              <AnimatePresence mode="wait">
                <motion.div key={index} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <HeaderContent current={current} />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Imagen Horizontal en el Centro (Aspect Video) */}
            <div className="relative w-full aspect-video overflow-hidden rounded-[1.5rem] shadow-2xl border border-white/10">
              <MediaContent current={current} videoRef={videoRef} />
            </div>

            {/* Botón Abajo (Flotante) */}
            <div className="p-8 text-center bg-transparent">
              <AnimatePresence mode="wait">
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                  <FooterContent current={current} handleAction={handleAction} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* --- VERSIÓN DESKTOP (CINEMATOGRÁFICA) --- */}
          <div className="hidden md:block relative w-full aspect-video">
            {/* Fondo Multimedia con Fundido Suave */}
            <div className="absolute inset-0 z-0 overflow-hidden">
               <AnimatePresence mode="popLayout">
                 <motion.div
                   key={index}
                   initial={{ opacity: 0, scale: 1.05 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                   className="absolute inset-0"
                 >
                   <MediaContent current={current} videoRef={videoRef} />
                 </motion.div>
               </AnimatePresence>
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10" />
            </div>

            {/* Contenido Inmersivo Agrupado (Texto + Acción) */}
            <div className={cn(
              "absolute inset-0 z-20 flex flex-col p-8 md:p-16 lg:p-24",
              current.contentPosition === 'top-left' && "justify-start items-start",
              current.contentPosition === 'top-right' && "justify-start items-end",
              current.contentPosition === 'bottom-left' && "justify-end items-start",
              current.contentPosition === 'bottom-right' && "justify-end items-end",
              current.contentPosition === 'center' && "justify-center items-center text-center",
              !current.contentPosition && "justify-end items-start"
            )}>
              <div className={cn(
                "flex flex-col gap-8 md:gap-10 transition-all max-w-2xl",
                current.contentPosition === 'center' && "items-center"
              )}>
                <AnimatePresence mode="wait">
                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <HeaderContent current={current} />
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    <FooterContent current={current} handleAction={handleAction} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Navegación Lateral */}
          {promos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 md:h-14 md:w-14 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-all border border-white/10 shadow-2xl">
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 md:h-14 md:w-14 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-all border border-white/10 shadow-2xl">
                <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            </>
          )}

        </div>
      </motion.div>
    </div>
  )
}
