import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UserState {
  isLoggedIn: boolean
  user: {
    email: string
    name?: string
    cashEnabled?: boolean
  } | null
  login: (email: string, name?: string, cashEnabled?: boolean) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (email, name, cashEnabled) => set({ 
        isLoggedIn: true, 
        user: { email, name, cashEnabled } 
      }),
      logout: () => set({ 
        isLoggedIn: false, 
        user: null 
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
