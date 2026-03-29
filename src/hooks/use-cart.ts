import { useCartStore } from '@/store/cart'

export const useCart = () => {
  const store = useCartStore()
  
  return {
    items: store.items,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    updateItem: store.updateItem,
    clearCart: store.clearCart,
    getTotal: store.getTotal,
    getItemCount: store.getItemCount,
  }
}
