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
    }, 3000)

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
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gray-300 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  y: [null, -100],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              duration: 1.5,
            }}
            className="relative mb-8"
          >
            {/* Glow effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 scale-150"
            />
            
            {/* Logo */}
            <motion.img
              src={logo || "/logo_ia.png"}
              alt="Cargando tienda..."
              className="relative z-10 w-48 h-48 md:w-64 md:h-64 object-contain"
              animate={{
                filter: [
                  'drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))',
                  'drop-shadow(0 0 30px rgba(147, 51, 234, 0.3))',
                  'drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Rotating ring */}
            <motion.div
              className="absolute inset-0 border-2 border-transparent rounded-full"
              style={{
                background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899) border-box',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>

          {/* Store Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-2xl md:text-3xl font-light text-gray-600 mb-4 text-center px-4 italic"
          >
            {storeName || "La tecnología al servicio de los recuerdos."}
          </motion.h1>



          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 200 }}
            transition={{ delay: 1.5, duration: 1.5 }}
            className="mt-12 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
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
