import { useAuth } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(
  (to) => {
    const requiredPermission =
      to.meta.permission as string | undefined

    if (!requiredPermission) {
      return
    }

    const auth = useAuth()

    if (!auth.hasPermission(requiredPermission)) {
      return navigateTo('/')
    }
  },
)