'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy, Gift, ChevronRight, X, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { LoyaltyMilestone } from '@/types'

interface LoyaltyPassportProps {
  stamps: number
  milestones: LoyaltyMilestone[]
  customerName: string
}

export function LoyaltyPassport({ stamps, milestones, customerName }: LoyaltyPassportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  // Ordenar hitos por número de sesiones
  const sortedMilestones = [...milestones].sort((a, b) => a.sessions - b.sessions)
  
  // Encontrar el siguiente hito
  const nextMilestone = sortedMilestones.find(m => m.sessions > stamps)
  const completedMilestones = sortedMilestones.filter(m => m.sessions <= stamps)
  
  // Calcular progreso hacia el siguiente hito
  const currentLevelMilestone = sortedMilestones.filter(m => m.sessions <= stamps).reverse()[0]
  const startSessions = currentLevelMilestone ? currentLevelMilestone.sessions : 0
  const progress = nextMilestone 
    ? ((stamps - startSessions) / (nextMilestone.sessions - startSessions)) * 100 
    : 100

  useEffect(() => {
    // Mostrar una pequeña notificación al cargar si tiene sellos
    if (stamps > 0) {
      const timer = setTimeout(() => setShowNotification(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [stamps])

  return (
    <>
      {/* Notificación flotante / Badge */}
      <AnimatePresence>
        {showNotification && !isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <button 
              onClick={() => setIsOpen(true)}
              className="group relative flex items-center gap-4 bg-white/90 backdrop-blur-xl p-2 pr-6 rounded-full border border-emerald-100 shadow-2xl shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-[#4A7C59] text-white flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:rotate-12 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Pasaporte Digital</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">{stamps} {stamps === 1 ? 'Sello' : 'Sellos'}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold text-slate-400">Ver Premios</span>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </button>
            
            <button 
              onClick={() => setShowNotification(false)}
              className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal del Pasaporte */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-black/20 overflow-hidden"
            >
              {/* Cabecera Premium */}
              <div className="relative h-48 bg-[#4A7C59] flex flex-col items-center justify-center text-center p-8 overflow-hidden">
                {/* Círculos decorativos */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl" />
                
                <motion.div 
                  initial={{ rotate: -10, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4 relative z-10"
                >
                  <Trophy className="h-10 w-10 text-white" />
                </motion.div>
                
                <h2 className="text-2xl font-black text-white uppercase tracking-tight relative z-10">Pasaporte Pujalte</h2>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mt-1 relative z-10">Fidelidad Premium de {customerName}</p>
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-black/10 text-white/50 hover:text-white hover:bg-black/20 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Contador Central */}
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Acumulado</p>
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                      {stamps} <span className="text-lg text-[#4A7C59] tracking-normal">Sellos</span>
                    </h3>
                  </div>
                  
                  {nextMilestone && (
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#4A7C59]">Tu próximo regalo</p>
                      <p className="text-sm font-black text-slate-700 mt-1">{nextMilestone.reward}</p>
                    </div>
                  )}
                </div>

                {/* Barra de Progreso */}
                {nextMilestone && (
                  <div className="space-y-3">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#4A7C59] to-emerald-400 rounded-full relative"
                      >
                         <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </motion.div>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                      <span>{stamps} de {nextMilestone.sessions} Sesiones</span>
                      <span>Faltan {nextMilestone.sessions - stamps}</span>
                    </div>
                  </div>
                )}

                {/* Lista de Hitos / Colección */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[#4A7C59]" /> Hoja de Ruta de Premios
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {sortedMilestones.map((milestone) => {
                      const isCompleted = stamps >= milestone.sessions
                      return (
                        <div 
                          key={milestone.id}
                          className={cn(
                            "group p-4 rounded-2xl border transition-all flex items-center justify-between",
                            isCompleted 
                              ? "bg-emerald-50 border-emerald-100" 
                              : "bg-slate-50 border-slate-100 grayscale opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                              isCompleted ? "bg-[#4A7C59] text-white" : "bg-white text-slate-300"
                            )}>
                              {isCompleted ? <Check className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                 Sello nº {milestone.sessions}
                               </p>
                               <p className="text-sm font-black text-slate-900">{milestone.reward}</p>
                            </div>
                          </div>
                          
                          {isCompleted ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase">Desbloqueado</Badge>
                          ) : (
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-300">Pendiente</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3 text-center">
                   <p className="text-[9px] font-bold text-slate-400 leading-relaxed italic mx-auto">
                     * Los premios se canjean automáticamente en el estudio al realizar tu próxima sesión.
                   </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function Check(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
