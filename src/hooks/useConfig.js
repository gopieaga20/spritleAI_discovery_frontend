import { useQuery } from '@tanstack/react-query'
import api from '../api/client.js'

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const { data } = await api.get('/config/')
      return data
    },
    staleTime: Infinity, // config rarely changes mid-session
  })
}
