'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SizeGuideProps {
  isOpen: boolean
  onClose: () => void
}

export function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden"
          style={{ height: '100dvh' }}
        >
          {/* BOTÓN CERRAR - FLOTANTE Y GRANDE */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[10001] p-4 bg-white/10 hover:bg-white/20 transition-all rounded-full text-white border border-white/20 shadow-2xl group active:scale-95 cursor-pointer"
          >
            <X className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" />
            <span className="sr-only">Cerrar</span>
          </button>

          {/* CONTENEDOR DE LA IMAGEN - AJUSTE INTELIGENTE SIN SCROLL */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="relative w-full h-full p-4 md:p-10 flex items-center justify-center select-none cursor-default"
          >
            <img 
              src={`/pujaltefotografia/guia_tamanos.jpg?v=${Date.now()}`} 
              alt="Guía de Tamaños Pujalte"
              className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]"
            />
          </motion.div>
          
          {/* OVERLAY PARA CERRAR PINCHANDO FUERA */}
          <div 
            className="absolute inset-0 -z-10 cursor-pointer" 
            onClick={onClose} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
