// ตัวเชื่อม (adapter) สำหรับหน้าเว็บที่ยกมาจากสาขา B6715588
// (ระบบอุปกรณ์ / จองห้อง / แจ้งซ่อม)
//
// ของเดิมหน้าพวกนั้นใช้ AuthContext เวอร์ชันของตัวเอง ที่มี user รูปแบบ
// { id, name, email, role, position }, ธง loading, และ authFetch()
// ไฟล์นี้แปลง auth จริงของโปรเจค (src/auth/*) ให้มีหน้าตาแบบเดิม
// หน้าเว็บพวกนั้นจึง import { useAuth } from "../../context/AuthContext" ได้เลย
// โดยไม่ต้องแก้ตัวหน้า

import { useMemo } from 'react'
import { useAuth as useRealAuth } from '../auth/useAuth'
import type { LoginRequest } from '../interface/IAuthInterface'
import { API_BASE } from '../types'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  position: string
}

export type LoginResult = { ok: true } | { ok: false; error: string }

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  isLoggedIn: boolean
  isEmployee: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  authFetch: (path: string, options?: RequestInit) => Promise<Response>
}

export function useAuth(): AuthContextValue {
  const { user, token, isLoading, login, logout } = useRealAuth()

  return useMemo<AuthContextValue>(() => {
    const authFetch = (path: string, options: RequestInit = {}) =>
      fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

    const adaptedLogin = async (email: string, password: string): Promise<LoginResult> => {
      try {
        await login({ email, password } as LoginRequest)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e instanceof Error && e.message ? e.message : 'Login failed' }
      }
    }

    return {
      user: user
        ? {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position,
          }
        : null,
      token: token ?? null,
      loading: isLoading,
      isLoggedIn: !!user,
      isEmployee: user?.role === 'employee',
      login: adaptedLogin,
      logout,
      authFetch,
    }
  }, [user, token, isLoading, login, logout])
}
