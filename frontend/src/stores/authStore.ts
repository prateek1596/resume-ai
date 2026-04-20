import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  email: string | null
  token: string | null
  isAuthenticated: boolean
  setSession: (email: string, token: string) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      email: null,
      token: null,
      isAuthenticated: false,
      setSession: (email, token) => set({ email, token, isAuthenticated: true }),
      clearSession: () => set({ email: null, token: null, isAuthenticated: false }),
    }),
    { name: 'resumeai-auth', version: 1 }
  )
)