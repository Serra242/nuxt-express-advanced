import axios from 'axios'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = axios.create({
    baseURL: config.public.apiBase,
    timeout: 5000,
  })

  api.interceptors.request.use((request) => {
    if (import.meta.client) {
      const token = localStorage.getItem(
        'tasks_access_token',
      )

      if (token) {
        request.headers.Authorization =
          `Bearer ${token}`
      }
    }

    return request
  })

  return {
    provide: {
      api,
    },
  }
})