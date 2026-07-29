import type { LoginInput } from '~/types/auth'
import { createAuthService } from '~/services/auth.service'

const TOKEN_KEY = 'tasks_access_token'

export function useAuth() {
  const { $api } = useNuxtApp()
  const authService = createAuthService($api)

  const user = useState<
    Awaited<ReturnType<typeof authService.me>> | null
  >('auth-user', () => null)

  const initialized = useState(
    'auth-initialized',
    () => false,
  )

  const loading = useState(
    'auth-loading',
    () => false,
  )

  const isAuthenticated = computed(
    () => Boolean(user.value),
  )

  function hasPermission(permission: string) {
    return Boolean(
      user.value?.permissions.includes(permission),
    )
  }

  async function login(input: LoginInput) {
    loading.value = true

    try {
      const response = await authService.login(input)

      localStorage.setItem(
        TOKEN_KEY,
        response.token,
      )

      user.value = response.user
      initialized.value = true
      return true
    } catch (error) {
      console.error(error)
      return false
    } finally {
      loading.value = false
    }
  }

  async function restore() {
    if (initialized.value || !import.meta.client) {
      return
    }

    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      initialized.value = true
      return
    }

    try {
      user.value = await authService.me()
    } catch (error) {
      console.error(error)
      localStorage.removeItem(TOKEN_KEY)
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  function logout() {
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
    }

    user.value = null
    initialized.value = true
  }

  return {
    user,
    initialized,
    loading,
    isAuthenticated,
    hasPermission,
    login,
    restore,
    logout,
  }
}