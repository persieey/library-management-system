import type { ReactNode } from 'react'
import BackOfficeLayout from './BackOfficeLayout'
import type { Crumb } from './PageHeader'

export interface SystemLayoutProps {
  title: string
  children: ReactNode
  trail?: Crumb[]
}

/**
 * เลย์เอาต์หลังบ้านสำหรับหน้าจัดซื้อ/ตรวจนับของ B6710248
 *
 * ของเดิมสร้างแถบเมนูของตัวเองที่มีแค่สองระบบนั้น พอเข้าหน้า /procurement
 * ระบบอื่นทั้งหมดจะหายไปจากแถบซ้าย เหมือนหลุดออกไปอยู่คนละเว็บ
 *
 * ตอนนี้ส่งต่อให้ BackOfficeLayout ซึ่งใช้เมนูรวมจาก config/roles.ts
 * ตัวเดียวกับหน้าหลังบ้านอื่นทุกหน้า แถบซ้ายจึงเหมือนกันหมดทั้งระบบ
 * และเมนูถูกกรองตามสิทธิ์ที่เดียว
 *
 * props เหมือนเดิมทุกตัว หน้าของเจ้าของงานจึงไม่ต้องแก้
 */
function SystemLayout({ title, children, trail }: SystemLayoutProps) {
  return (
    <BackOfficeLayout title={title} trail={trail}>
      {children}
    </BackOfficeLayout>
  )
}

export default SystemLayout
