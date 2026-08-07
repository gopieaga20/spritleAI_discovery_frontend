import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuthStore } from '../stores/authStore.js'

export function useLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ username, password }) => {
      const { data } = await api.post('/auth/login/', { username, password })
      return data
    },
    onSuccess: (data) => {
      setAccessToken(data.access)
      navigate('/admin')
    },
  })
}

export function useLogout() {
  const clearToken = useAuthStore((s) => s.clearToken)
  const navigate = useNavigate()
  return {
    mutate: () => {
      clearToken()
      navigate('/admin/login')
    },
  }
}
