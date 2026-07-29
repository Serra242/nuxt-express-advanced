export interface AuthUser {
  id: number
  email: string
  role: string
  isActive: boolean
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}