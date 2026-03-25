import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fixPath(path: string) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  
  // Normalizamos para que siempre empiece por /
  let cleanPath = path
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`
  
  return cleanPath
}
