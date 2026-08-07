import { create } from 'zustand'

// Access token stored in memory only (not localStorage — XSS safe)
// Refresh token lives in httpOnly cookie managed by the backend
export const useAuthStore = create((set) => ({
  accessToken: null,
  authReady: false,
  setAccessToken: (token) => set({ accessToken: token }),
  clearToken: () => set({ accessToken: null }),
  setAuthReady: () => set({ authReady: true }),
}))
