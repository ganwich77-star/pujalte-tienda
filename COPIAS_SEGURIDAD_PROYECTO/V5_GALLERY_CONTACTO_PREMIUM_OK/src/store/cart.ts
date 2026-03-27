import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string | null
  // Datos de variante
  variantId?: string
  variantName?: string
  // Producto base
  productId?: string
  notes?: string
  fileUrl?: string
  fileName?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string, variantId?: string, notes?: string) => void
  updateQuantity: (id: string, quantity: number, variantId?: string, notes?: string) => void
  updateItem: (id: string, variantId: string | undefined, oldNotes: string | undefined, updates: Partial<CartItem>) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

// Genera una clave única para cada item (incluyendo variante)
const getItemKey = (id: string, variantId?: string, notes?: string) => {
  let key = variantId ? `${id}-${variantId}` : id
  const cleanNotes = notes?.trim()
  if (cleanNotes) key += `-${cleanNotes}`
  return key
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const itemKey = getItemKey(item.id, item.variantId, item.notes)
        const existingItem = state.items.find((i) => {
          const existingKey = getItemKey(i.id, i.variantId, i.notes)
          return existingKey === itemKey
        })
        
        if (existingItem) {
          return {
            items: state.items.map((i) => {
              const existingKey = getItemKey(i.id, i.variantId, i.notes)
              return existingKey === itemKey 
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            })
          }
        }
        return { items: [...state.items, item] }
      }),
      
      removeItem: (id, variantId, notes) => set((state) => {
        const itemKey = getItemKey(id, variantId, notes)
        return {
          items: state.items.filter((i) => {
            const existingKey = getItemKey(i.id, i.variantId, i.notes)
            return existingKey !== itemKey
          })
        }
      }),
      
      updateQuantity: (id, quantity, variantId, notes) => set((state) => {
        const itemKey = getItemKey(id, variantId, notes)
        
        if (quantity <= 0) {
          return {
            items: state.items.filter((i) => {
              const existingKey = getItemKey(i.id, i.variantId, i.notes)
              return existingKey !== itemKey
            })
          }
        }
        
        return {
          items: state.items.map((i) => {
            const existingKey = getItemKey(i.id, i.variantId, i.notes)
            return existingKey === itemKey ? { ...i, quantity } : i
          })
        }
      }),
      
      updateItem: (id, variantId, oldNotes, updates) => set((state) => {
        const oldKey = getItemKey(id, variantId, oldNotes)
        return {
          items: state.items.map((i) => {
            const existingKey = getItemKey(i.id, i.variantId, i.notes)
            return existingKey === oldKey ? { ...i, ...updates } : i
          })
        }
      }),
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        const state = get()
        return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },
      
      getItemCount: () => {
        const state = get()
        return state.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage'
    }
  )
)
