import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../services/https/auth'
import type { LoginRequest, ProfileResponse } from '../interface/IAuthInterface'
import type { CurrentUser, Position } from '../interface/IUserInterface'
import { AuthContext, type AuthContextValue } from './AuthContext'

const TOKEN_STORAGE_KEY = 'auth_token'

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState<CurrentUser | null>(null)
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
    setUser({ ...res.user, role: res.role, position: res.position })
  }, [])

  const applyProfile = useCallback((res: ProfileResponse) => {
    setUser({ ...res.user, role: res.role, position: res.position })
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
      .then((res) => {
        if (!cancelled) setUser({ ...res.user, role: res.role, position: res.position })
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

  // การกันสิทธิ์จริงอยู่ที่เซิร์ฟเวอร์เสมอ ฝั่งนี้ใช้แค่ตัดสินว่าจะแสดงเมนูอะไร
  const allows = useCallback(
    (...positions: Position[]) =>
      user?.role === 'employee' && positions.includes(user.position),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, logout, applyProfile, allows, isEmployee: user?.role === 'employee' }),
    [user, token, isLoading, login, logout, applyProfile, allows],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
