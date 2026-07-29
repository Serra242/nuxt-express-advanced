import type { AxiosInstance } from 'axios'
import type { AuthUser } from '~/types/auth'

export function createUserService(
  api: AxiosInstance,
) {
  async function getAll(): Promise<AuthUser[]> {
    const response = await api.get<AuthUser[]>(
      '/users',
    )

    return response.data
  }

  return {
    getAll,
  }
}