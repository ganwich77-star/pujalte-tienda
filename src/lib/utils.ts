import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fixPath(path: string | null | undefined) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  
  // Normalizamos para que siempre empiece por /
  let cleanPath = path
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`
  
  // Codificamos la URI para manejar espacios y caracteres especiales
  return encodeURI(cleanPath)
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
