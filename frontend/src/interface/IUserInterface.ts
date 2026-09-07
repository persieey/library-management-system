// รูปข้อมูลผู้ใช้ ตรงกับ backend ของทีม (SA-1-69/T09)
//
// สิทธิ์แบ่งสองชั้น:
//   role     บอกว่าเป็นพนักงานหรือสมาชิก
//   position บอกตำแหน่งของพนักงาน ใช้ตัดสินว่าเข้าหน้าไหนได้

export type Role = 'employee' | 'member' | 'none'

export type Position = 'manager' | 'librarian' | 'staff' | ''

export interface User {
  user_id: number
  name: string
  email: string
  phone: string
  status: string
}

/** ผู้ใช้ที่ล็อกอินอยู่ พร้อมสิทธิ์ที่ backend บอกมา */
export interface CurrentUser extends User {
  role: Role
  position: Position
  /**
   * รหัสพนักงานของคนนี้ — null ถ้าไม่ใช่พนักงาน
   *
   * คนละตัวกับ user_id ระบบจัดซื้อผูกใบขอซื้อไว้กับรหัสนี้
   * หน้าเว็บจึงต้องใช้ค่านี้เทียบว่าใบไหนเป็นของตัวเอง
   */
  employee_id: number | null
}
