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
  user: User
}

/** รูปที่ GET /users/profile ตอบกลับ */
export interface ProfileResponse {
  user: User
  role: Role
  position: Position
}
