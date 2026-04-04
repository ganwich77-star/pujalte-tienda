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
  isDigital?: boolean
  hasIndividualPrice?: boolean
}

interface CartStore {
  allCarts: Record<string, CartItem[]> // Almacena carritos por slug: { "julia": [...], "nora": [...] }
  currentSlug: string | null
  items: CartItem[] // Siempre contiene los items del slug actual para compatibilidad
  
  setSlug: (slug: string) => void
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
      allCarts: {},
      currentSlug: null,
      items: [],
      
      setSlug: (slug: string) => set((state) => {
        const lowerSlug = slug.toLowerCase();
        // Si ya estamos en este slug, no hacemos nada
        if (state.currentSlug === lowerSlug) return {};

        // Cargamos el carrito de este slug desde allCarts o creamos uno nuevo
        return {
          currentSlug: lowerSlug,
          items: state.allCarts[lowerSlug] || []
        };
      }),

      addItem: (item) => set((state) => {
        if (!state.currentSlug) return {}; // No debería pasar si setSlug se llama en la página
        
        const currentItems = [...(state.allCarts[state.currentSlug] || [])];
        const itemKey = getItemKey(item.id, item.variantId, item.notes);
        
        const existingItemIndex = currentItems.findIndex((i) => {
          const existingKey = getItemKey(i.id, i.variantId, i.notes)
          return existingKey === itemKey
        });

        let newItems;
        if (existingItemIndex > -1) {
          const existingItem = currentItems[existingItemIndex];
          const newQty = existingItem.quantity + item.quantity;
          const newUnitPrice = calculateUnitPrice(newQty, existingItem);
          
          newItems = currentItems.map((i, idx) => 
            idx === existingItemIndex 
              ? { ...i, quantity: newQty, price: newUnitPrice }
              : i
          );
        } else {
          const initialUnitPrice = calculateUnitPrice(item.quantity, item);
          newItems = [...currentItems, { ...item, price: initialUnitPrice }];
        }

        return {
          items: newItems,
          allCarts: { ...state.allCarts, [state.currentSlug]: newItems }
        };
      }),
      
      removeItem: (id, variantId, notes) => set((state) => {
        if (!state.currentSlug) return {};
        const currentItems = state.allCarts[state.currentSlug] || [];
        const itemKey = getItemKey(id, variantId, notes);
        
        const newItems = currentItems.filter((i) => {
          const existingKey = getItemKey(i.id, i.variantId, i.notes)
          return existingKey !== itemKey
        });

        return {
          items: newItems,
          allCarts: { ...state.allCarts, [state.currentSlug]: newItems }
        };
      }),
      
      updateQuantity: (id, quantity, variantId, notes) => set((state) => {
        if (!state.currentSlug) return {};
        const currentItems = state.allCarts[state.currentSlug] || [];
        const itemKey = getItemKey(id, variantId, notes);
        
        let newItems;
        if (quantity <= 0) {
          newItems = currentItems.filter((i) => {
            const existingKey = getItemKey(i.id, i.variantId, i.notes)
            return existingKey !== itemKey
          });
        } else {
          newItems = currentItems.map((i) => {
            const existingKey = getItemKey(i.id, i.variantId, i.notes)
            if (existingKey === itemKey) {
               const newUnitPrice = calculateUnitPrice(quantity, i);
               return { ...i, quantity, price: newUnitPrice };
            }
            return i;
          });
        }

        return {
          items: newItems,
          allCarts: { ...state.allCarts, [state.currentSlug]: newItems }
        };
      }),
      
      updateItem: (id, variantId, oldNotes, updates) => set((state) => {
        if (!state.currentSlug) return {};
        const currentItems = state.allCarts[state.currentSlug] || [];
        const oldKey = getItemKey(id, variantId, oldNotes);
        
        const newItems = currentItems.map((i) => {
          const existingKey = getItemKey(i.id, i.variantId, i.notes)
          return existingKey === oldKey ? { ...i, ...updates } : i
        });

        return {
          items: newItems,
          allCarts: { ...state.allCarts, [state.currentSlug]: newItems }
        };
      }),
      
      clearCart: () => set((state) => {
        if (!state.currentSlug) return { items: [] };
        return {
          items: [],
          allCarts: { ...state.allCarts, [state.currentSlug]: [] }
        };
      }),
      
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
      name: 'cart-storage-v2' // Cambiamos el nombre para invalidar la caché antigua mezclada
    }
  )
)
