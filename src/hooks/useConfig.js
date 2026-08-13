import { useQuery } from '@tanstack/react-query'
import api from '../api/client.js'

export function useConfig(configType = 'pro') {
  return useQuery({
    queryKey: ['config', configType],
    queryFn: async () => {
      const url = configType === 'lite' ? '/config/?config_type=lite' : '/config/'
      const { data } = await api.get(url)
      return data
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: (attempt) => attempt * 1000,
  })
}
