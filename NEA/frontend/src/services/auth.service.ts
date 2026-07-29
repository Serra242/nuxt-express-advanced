import type { AxiosInstance } from 'axios'
import type {
  AuthUser,
  LoginInput,
  LoginResponse,
} from '~/types/auth'

export function createAuthService(
  api: AxiosInstance,
) {
  async function login(
    input: LoginInput,
  ): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      '/auth/login',
      input,
    )

    return response.data
  }

  async function me(): Promise<AuthUser> {
    const response = await api.get<AuthUser>(
      '/auth/me',
    )

    return response.data
  }

  return {
    login,
    me,
  }
}