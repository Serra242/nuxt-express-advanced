import { useAuth } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(
  async () => {
    const auth = useAuth()

    if (!auth.initialized.value) {
      await auth.restore()
    }

    if (!auth.isAuthenticated.value) {
      return navigateTo('/login')
    }
  },
)