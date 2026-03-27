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

const HeaderContent = ({ current }: { current: Promo }) => (
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

const FooterContent = ({ current, handleAction }: { current: Promo, handleAction: (a: string) => void }) => {
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
  }, [current.url])
  
  const handleAction = (action: string) => {
    if (action === 'shop') onOpenStore()
    else if (action === 'contact') onContact()
    else onClose()
  }

  if (!current) return null

  const next = () => setIndex((index + 1) % promos.length)
  const prev = () => setIndex((index - 1 + promos.length) % promos.length)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
      />

      <motion.div
        layoutId="promo-container"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-6xl md:aspect-video overflow-hidden pointer-events-auto"
      >


        {/* CONTENEDOR PRINCIPAL - Flex col en móvil para separar los bloques */}
        <div className="relative w-full h-full flex flex-col md:block bg-zinc-900 md:bg-black overflow-x-hidden overflow-y-auto md:overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl">
          
          {/* HEADER MÓVIL (Fuera de la imagen) */}
          <div className="md:hidden w-full p-6 pt-10 text-center z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <HeaderContent current={current} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* SHARED MEDIA CONTAINER - Persistente y en el centro en móvil */}
          <div className="relative w-full aspect-video md:absolute md:inset-0 md:h-full md:aspect-auto z-0 overflow-hidden">
            <div className="relative w-full h-full">
              <MediaContent current={current} videoRef={videoRef} />
              {/* Capa de fundido para suavizar el cambio de contenido */}
              <motion.div 
                key={`overlay-${index}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 bg-black z-10 pointer-events-none"
              />
              <div className="absolute inset-0 bg-black/10 md:bg-black/20" />
            </div>
          </div>

          {/* FOOTER MÓVIL (Fuera de la imagen) */}
          <div className="md:hidden w-full p-8 pb-12 text-center z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <FooterContent current={current} handleAction={handleAction} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* DESKTOP CONTENT OVERLAY */}
          <div className="hidden md:block absolute inset-0 z-20 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="w-full h-full pointer-events-auto"
              >
                <div className={cn(
                  "absolute inset-0 flex flex-col p-16 lg:p-24",
                  current.contentPosition === 'top-left' && "justify-start items-start text-left",
                  current.contentPosition === 'top-right' && "justify-start items-end text-right",
                  current.contentPosition === 'bottom-left' && "justify-end items-start text-left",
                  current.contentPosition === 'bottom-right' && "justify-end items-end text-right",
                  (current.contentPosition === 'center' || !current.contentPosition) && "justify-center items-center text-center"
                )}>
                  <div className="space-y-8">
                    <HeaderContent current={current} />
                    <FooterContent current={current} handleAction={handleAction} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Botones de Navegación Lateral */}
          <button 
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full border border-white/10 bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-all shadow-xl"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full border border-white/10 bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-all shadow-xl"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Botón Cerrar */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500/50 transition-all shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
