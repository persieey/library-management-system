import type { User } from './IUserInterface'

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
