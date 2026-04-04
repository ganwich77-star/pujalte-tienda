import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  email: string
  name?: string
  phone?: string
  dni?: string
  address?: string
  cashEnabled?: boolean
}

interface UserState {
  isLoggedIn: boolean
  user: User | null
  isLoginModalOpen: boolean
  setIsLoginModalOpen: (open: boolean) => void
  login: (userData: User) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      isLoginModalOpen: false,
      setIsLoginModalOpen: (open) => set({ isLoginModalOpen: open }),
      login: (userData) => set({ 
        isLoggedIn: true, 
        user: userData 
      }),
      logout: () => set({ 
        isLoggedIn: false, 
        user: null 
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      // No persistimos el estado del modal
      partialize: (state) => ({ 
        isLoggedIn: state.isLoggedIn, 
        user: state.user 
      }),
    }
  )
)
