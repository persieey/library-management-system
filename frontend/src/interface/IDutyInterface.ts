// รูปข้อมูลตารางเวร ตรงกับ models.DutyShift และ models.ServicePoint ฝั่ง Go
//
// หอสมุดจริงจัดเวรตามจุดบริการ หนึ่งช่วงเวรของจุดหนึ่งมีเจ้าหน้าที่ได้หลายคน
// ข้อมูลจึงเป็นหนึ่งแถวต่อหนึ่งคน ไม่ใช่หนึ่งแถวต่อหนึ่งช่วงเวร

export type DutyPeriod = 'morning' | 'afternoon' | 'evening'

export const PERIOD_LABEL: Record<DutyPeriod, string> = {
  morning: 'เช้า',
  afternoon: 'บ่าย',
  evening: 'เย็น',
}

/** เวลาทำการของแต่ละช่วง ใช้แสดงผลอย่างเดียว ไม่ได้เก็บในฐานข้อมูล */
export const PERIOD_TIME: Record<DutyPeriod, string> = {
  morning: '08:00 – 13:00',
  afternoon: '13:00 – 18:00',
  evening: '18:00 – 21:00',
}

export const PERIODS: DutyPeriod[] = ['morning', 'afternoon', 'evening']

export interface ServicePoint {
  id: number
  name: string
  location: string
  /** จำนวนคนขั้นต่ำที่จุดนี้ต้องมีในหนึ่งช่วงเวร ใช้เตือนเมื่อจัดคนไม่ครบ */
  min_staff: number
  sort_order: number
  active: boolean
}

export interface DutyShift {
  id: number
  /** YYYY-MM-DD */
  date: string
  period: DutyPeriod
  service_point_id: number
  personnel_id: number
  /** ผู้รับผิดชอบหลักของจุดนั้นในช่วงนั้น */
  lead: boolean
  note: string
  /** ข้อมูลแสดงผล เซิร์ฟเวอร์เติมมาให้ ไม่ได้เก็บในตาราง */
  personnel_name: string
  department: string
  service_point_name: string
  /** คนนี้ยื่นลาและได้รับอนุมัติในวันนั้นแล้ว */
  on_leave: boolean
}

/** ส่งไป POST /duties */
export interface DutyDraft {
  date: string
  period: DutyPeriod
  service_point_id: number
  personnel_id: number
  lead: boolean
  note: string
}
