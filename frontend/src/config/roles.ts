import type { Position } from '../interface/IUserInterface'

// ต้องตรงกับ backend ของทีม — ไฟล์นี้ใช้ตัดสินแค่ว่าจะแสดงเมนูอะไร
// การบังคับสิทธิ์จริงอยู่ที่เซิร์ฟเวอร์เสมอ (middleware.RequirePosition)
export const POSITION_LABELS: Record<Position, string> = {
  manager: 'หัวหน้าหอสมุด',
  librarian: 'บรรณารักษ์',
  staff: 'เจ้าหน้าที่',
  '': 'ผู้ใช้ทั่วไป',
}

/** ตำแหน่งที่ทำงานแต่ละอย่างได้ ตรงกับ RequirePosition ฝั่ง backend */
export const CAN_MANAGE_PR: Position[] = ['librarian', 'manager']
export const CAN_MANAGE_PERSONNEL: Position[] = ['manager']
export const CAN_ACCESS_BACKOFFICE: Position[] = ['staff', 'librarian', 'manager']

// ชื่อที่โชว์บนปุ่ม dropdown ของ header — ใช้ตำแหน่งของผู้ใช้แทนคำว่า Employees
// เช่น librarian -> "Librarian" อยากได้ภาษาไทยให้เปลี่ยนไปคืน POSITION_LABELS[position] แทน
export function positionDisplayName(position: Position): string {
  if (!position) return 'Employees'
  return position.charAt(0).toUpperCase() + position.slice(1)
}

export interface NavAction {
  label: string
  to?: string
  /** ตำแหน่งที่เห็นเมนูนี้ ไม่ใส่ = เห็นได้ทุกคน */
  positions?: Position[]
  /** คีย์ไอคอน แปลงเป็นไอคอนจริงด้วย navIcon() ตอนแสดงใน <Sidebar> */
  icon?: string
  children?: NavAction[]
}

// เมนูของพอร์ทัลหัวหน้าหอสมุด — ประกาศไว้ที่นี่ที่เดียว
// ใช้ทั้งใน ManagerLayout (เป็น sidebar ของ /manager) และใน BACK_OFFICE_MENU (เป็นกลุ่มย่อย)
// จะได้ไม่ต้องแก้สองที่เวลาปรับเมนู
export const MANAGER_MENU: NavAction[] = [
  { icon: 'overview', label: 'ภาพรวม', to: '/manager' },
  { icon: 'leave', label: 'อนุมัติการลา', to: '/manager/leave' },
  { icon: 'personnel', label: 'บุคลากร', to: '/manager/personnel' },
]

// เมนูของหน้าหลังบ้าน — ตอนนี้เหลือเฉพาะระบบที่ทำเสร็จจริง
// ระบบของเพื่อนในทีมค่อยเติมกลับเข้ามาที่นี่ทีละอันตอนที่โค้ดพร้อม
export const BACK_OFFICE_MENU: NavAction[] = [
  {
    // ระบบเดียวที่มีหัวข้อย่อยจริง จึงกางเป็นกลุ่มได้ ระบบอื่นยังเป็นเมนูเดี่ยว
    // กลุ่มไม่ต้องมี to เพราะเมนูย่อยตัวแรกเป็นหน้าหลักของระบบอยู่แล้ว
    icon: 'activities',
    label: 'ประชาสัมพันธ์',
    positions: CAN_MANAGE_PR,
    children: [
      { icon: 'overview', label: 'ภาพรวม', to: '/employees/pr' },
      { icon: 'activities', label: 'กิจกรรม', to: '/employees/pr/events' },
      { icon: 'leave', label: 'ประกาศ', to: '/employees/pr/announcements' },
    ],
  },
  {
    // งานหัวหน้าหอสมุด — เห็นเฉพาะ manager
    icon: 'personnel',
    label: 'งานหัวหน้าหอสมุด',
    positions: CAN_MANAGE_PERSONNEL,
    children: MANAGER_MENU,
  },
  {
    // ตารางเวรทุกตำแหน่งต้องดูได้ เพราะต้องรู้ว่าตัวเองเข้าเวรวันไหน
    // หน้าเดียวกันนี้หัวหน้าจะเห็นปุ่มจัดเวรเพิ่มขึ้นมา
    icon: 'schedules',
    label: 'ตารางเวร',
    to: '/employees/schedules',
    positions: CAN_ACCESS_BACKOFFICE,
  },
  {
    // การลาเป็นงานของพนักงานทุกคน ไม่ใช่เฉพาะหัวหน้า
    // หน้านี้คือฝั่งยื่นคำขอและดูของตัวเอง ส่วนฝั่งอนุมัติอยู่ในกลุ่มงานหัวหน้าหอสมุด
    icon: 'leave',
    label: 'การลาของฉัน',
    to: '/employees/leave',
    positions: CAN_ACCESS_BACKOFFICE,
  },
  {
    // ระบบร้องเรียนและสถิติ เป็นของ B6707590 (ธนกร) เจ้าหน้าที่ทุกตำแหน่งดูได้
    icon: 'complaints',
    label: 'เรื่องร้องเรียน',
    to: '/employees/complaints',
    positions: CAN_ACCESS_BACKOFFICE,
  },
  {
    icon: 'reports',
    label: 'รายงานสถิติ',
    to: '/employees/statistics',
    positions: CAN_ACCESS_BACKOFFICE,
  },
]

type Allows = (...positions: Position[]) => boolean

function visible(item: NavAction, allows: Allows): boolean {
  if (item.positions && !allows(...item.positions)) return false
  if (item.children && !item.children.some((child) => visible(child, allows))) return false
  return true
}

export function backOfficeMenuFor(allows: Allows): NavAction[] {
  return BACK_OFFICE_MENU.filter((item) => visible(item, allows)).map((item) =>
    item.children ? { ...item, children: item.children.filter((child) => visible(child, allows)) } : item,
  )
}

export const HEADER_ACTIONS: NavAction[] = [
  {
    // ปุ่มเดียวพาเข้าหน้ารวมระบบเลย ไม่ต้องกางเมนูให้เลือกอีกชั้น
    // เพราะ sidebar ในหน้านั้นแสดงทุกระบบที่สิทธิ์ของผู้ใช้เข้าถึงได้อยู่แล้ว
    label: 'Employees',
    to: '/employees',
    positions: CAN_ACCESS_BACKOFFICE,
  },
]

export function actionsFor(allows: Allows): NavAction[] {
  return HEADER_ACTIONS.filter((item) => visible(item, allows))
}
