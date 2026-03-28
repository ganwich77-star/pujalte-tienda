'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  onComplete: () => void
  logo?: string
  storeName?: string
}

export default function SplashScreen({ onComplete, logo, storeName }: SplashScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setIsAnimating(false)
      // Llamamos a onComplete inmediatamente para que la tienda cargue por debajo mientras el splash se desvanece
      onComplete()
    }, 1200)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gray-300 rounded-full"
                initial={{
                  x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
                  y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0,
                }}
                animate={{
                  y: [null, -100],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 1,
                }}
              />
            ))}
          </div>

          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              duration: 0.6,
            }}
            className="relative mb-8"
          >
            {/* Glow effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 scale-150"
            />
            
            {/* Logo */}
            <motion.img
              src={logo || "/api/placeholder/400/400"}
              alt="Cargando..."
              className="relative z-10 w-40 h-40 md:w-56 md:h-56 object-contain"
            />

            {/* Rotating ring */}
            <motion.div
              className="absolute inset-0 border-2 border-transparent rounded-full"
              style={{
                background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899) border-box',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>

          {/* Store Name */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[10px] font-black tracking-[0.4em] text-[#4A7C59] uppercase opacity-80"
          >
            POWERED BY PUJALTE CREATIVE STUDIO
          </motion.h1>

          {/* Loading bar highlight */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 h-0.5 w-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full origin-left"
            style={{ maxWidth: '80vw' }}
          />

          {/* Loading text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-4 text-sm text-gray-400"
          >
            Cargando...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
