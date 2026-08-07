import axios from 'axios'
import { useAuthStore } from '../stores/authStore.js'

// In dev: Vite proxies /api → localhost:8000 (vite.config.js)
// In production: set VITE_API_URL=https://your-backend.vercel.app
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'

const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // sends httpOnly refresh cookie automatically
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401: attempt refresh, then retry once
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post('/api/v1/auth/refresh/', {}, { withCredentials: true })
        useAuthStore.getState().setAccessToken(data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        useAuthStore.getState().clearToken()
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
