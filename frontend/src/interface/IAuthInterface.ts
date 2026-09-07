import type { Position, Role, User } from './IUserInterface'

/** backend ของทีมล็อกอินด้วยอีเมล ไม่ใช่ username */
export interface LoginRequest {
  email: string
  password: string
}

/** รูปที่ POST /auth/login ตอบกลับ */
export interface LoginResponse {
  message: string
  token: string
  role: Role
  position: Position
  employee_id: number | null
  user: User
}

/** รูปที่ GET /users/profile ตอบกลับ */
export interface ProfileResponse {
  user: User
  role: Role
  position: Position
  employee_id: number | null
}

/** ส่งไป PUT /users/profile — ตรงกับ dto.UpdateProfileRequest ฝั่ง Go */
export interface UpdateProfileRequest {
  name: string
  email: string
  phone: string
}

/** ส่งไป PUT /users/password — ตรงกับ dto.ChangePasswordRequest ฝั่ง Go */
export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}
