import { createContext } from 'react'
import type { LoginRequest } from '../interface/IAuthInterface'
import type { User } from '../interface/IUserInterface'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  logout: () => void
  can: (permission: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
