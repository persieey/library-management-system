import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../services/https/auth'
import type { LoginRequest } from '../interface/IAuthInterface'
import type { User } from '../interface/IUserInterface'
import { AuthContext, type AuthContextValue } from './AuthContext'

const TOKEN_STORAGE_KEY = 'auth_token'

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await authApi.login(payload)
    localStorage.setItem(TOKEN_STORAGE_KEY, res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  // กู้สถานะล็อกอินคืนหลังรีเฟรช โดยเอา token ที่เก็บไว้ไปถามเซิร์ฟเวอร์
  useEffect(() => {
    let cancelled = false

    if (!token) {
      setIsLoading(false)
      return
    }

    authApi
      .getProfile(token)
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch(() => {
        // token หมดอายุหรือ backend ไม่ได้รัน
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const can = useCallback(
    (permission: string) => Boolean(user?.permissions?.includes(permission)),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, logout, can }),
    [user, token, isLoading, login, logout, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
