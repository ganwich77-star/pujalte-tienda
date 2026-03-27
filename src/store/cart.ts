import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number // Este es el precio UNITARIO calculado actual
  quantity: number
  image?: string | null
  // Datos de variante
  variantId?: string
  variantName?: string
  variantPrice?: number // Guardamos el precio de la variante por separado
  // Producto base
  productId?: string
  notes?: string
  fileUrl?: string
  fileName?: string
  // Datos para recálculo dinámico
  basePrice: number
  salePrice?: number
  tierPricing?: any // Puede ser string JSON o Array
  variantBehavior?: 'add' | 'replace'
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

// Lógica de cálculo de precio unitario dinámico
const calculateUnitPrice = (qty: number, item: Partial<CartItem>) => {
  let base = item.salePrice ? Number(item.salePrice) : Number(item.basePrice);
  
  if (item.tierPricing) {
    try {
      const tiers = typeof item.tierPricing === 'string' 
        ? JSON.parse(item.tierPricing) 
        : item.tierPricing;

      if (Array.isArray(tiers) && tiers.length > 0) {
        const applicableTier = [...tiers]
          .sort((a, b) => b.minQty - a.minQty)
          .find(t => qty >= t.minQty);
        if (applicableTier) base = Number(applicableTier.price);
      }
    } catch (e) {
      console.error("Error parsing tiers in cart:", e);
    }
  }

  // Si tiene variante, aplicamos el comportamiento
  const vPrice = Number(item.variantPrice || 0);
  if (item.variantId) {
    if (item.variantBehavior === 'replace') {
      return vPrice;
    } else {
      return base + vPrice;
    }
  }

  return base;
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
          const newQty = existingItem.quantity + item.quantity;
          const newUnitPrice = calculateUnitPrice(newQty, existingItem);
          
          return {
            items: state.items.map((i) => {
              const existingKey = getItemKey(i.id, i.variantId, i.notes)
              return existingKey === itemKey 
                ? { ...i, quantity: newQty, price: newUnitPrice }
                : i
            })
          }
        }

        // Para nuevos items, nos aseguramos de que el precio inicial esté bien calculado
        const initialUnitPrice = calculateUnitPrice(item.quantity, item);
        return { items: [...state.items, { ...item, price: initialUnitPrice }] }
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
            if (existingKey === itemKey) {
               const newUnitPrice = calculateUnitPrice(quantity, i);
               return { ...i, quantity, price: newUnitPrice };
            }
            return i;
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
