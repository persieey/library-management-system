import { apiFetch } from './index'
import type { AuthResponse, LoginRequest } from '../../interface/IAuthInterface'
import type { User } from '../../interface/IUserInterface'

export function login(payload: LoginRequest) {
  return apiFetch<AuthResponse>('/api/v1/auth/login', { method: 'POST', body: payload })
}

export function getProfile(token: string) {
  return apiFetch<User>('/api/v1/users/profile', { token })
}
