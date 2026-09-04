import { createContext } from 'react'
import type { LoginRequest, ProfileResponse } from '../interface/IAuthInterface'
import type { CurrentUser, Position } from '../interface/IUserInterface'

export interface AuthContextValue {
  user: CurrentUser | null
  token: string | null
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  logout: () => void
  /**
   * เขียนทับข้อมูลผู้ใช้ที่ถืออยู่ ใช้หลังบันทึกหน้าโปรไฟล์
   * รับผลลัพธ์จาก API มาเลย จะได้ไม่ต้องยิง getProfile ซ้ำอีกรอบ
   */
  applyProfile: (res: ProfileResponse) => void
  /** ตำแหน่งของผู้ใช้ตรงกับที่ระบุไหม เช่น allows('librarian', 'manager') */
  allows: (...positions: Position[]) => boolean
  /** เป็นพนักงานหรือไม่ ใช้ตัดสินว่าเห็นเมนูหลังบ้านไหม */
  isEmployee: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
