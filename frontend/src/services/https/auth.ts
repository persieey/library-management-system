import { apiFetch } from './index'
import type { LoginRequest, LoginResponse, ProfileResponse } from '../../interface/IAuthInterface'

export function login(payload: LoginRequest) {
  return apiFetch<LoginResponse>('/api/v1/auth/login', { method: 'POST', body: payload })
}

export function getProfile(token: string) {
  return apiFetch<ProfileResponse>('/api/v1/users/profile', { token })
}
