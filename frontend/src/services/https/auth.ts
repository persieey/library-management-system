import { apiFetch } from './index'
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  UpdateProfileRequest,
} from '../../interface/IAuthInterface'

export function login(payload: LoginRequest) {
  return apiFetch<LoginResponse>('/api/v1/auth/login', { method: 'POST', body: payload })
}

export function getProfile(token: string) {
  return apiFetch<ProfileResponse>('/api/v1/users/profile', { token })
}

/** แค่บันทึกสถิติ "ออกจากระบบ" ฝั่งเซิร์ฟเวอร์ — JWT ไม่มี state ให้เพิกถอน ลบ token ออกจากเครื่องเป็นคนล็อกเอาต์จริง */
export function logout(token: string) {
  return apiFetch<{ message: string }>('/api/v1/auth/logout', { method: 'POST', token })
}

/** แก้ชื่อ อีเมล เบอร์โทรของตัวเอง ตอบกลับรูปเดียวกับ getProfile */
export function updateProfile(token: string, body: UpdateProfileRequest) {
  return apiFetch<ProfileResponse>('/api/v1/users/profile', { method: 'PUT', token, body })
}

/** เปลี่ยนรหัสผ่านตัวเอง ต้องกรอกรหัสเดิมให้ถูกก่อน */
export function changePassword(token: string, body: ChangePasswordRequest) {
  return apiFetch<{ message: string }>('/api/v1/users/password', { method: 'PUT', token, body })
}
