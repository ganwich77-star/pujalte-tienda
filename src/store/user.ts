import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UserState {
  isLoggedIn: boolean
  user: {
    email: string
    name?: string
  } | null
  login: (email: string, name?: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (email, name) => set({ 
        isLoggedIn: true, 
        user: { email, name } 
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
