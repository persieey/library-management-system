// รูปข้อมูลตารางเวร ตรงกับ models.DutyShift ฝั่ง Go

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

export interface DutyShift {
  id: number
  /** YYYY-MM-DD */
  date: string
  period: DutyPeriod
  lead_id: number
  assistant_id?: number
  note: string
  /** ชื่อคน เซิร์ฟเวอร์เติมมาให้ ไม่ได้เก็บในตาราง */
  lead_name: string
  assistant_name: string
}

/** ส่งไป POST /duties และ PUT /duties/:id */
export interface DutyDraft {
  date: string
  period: DutyPeriod
  lead_id: number
  assistant_id?: number
  note: string
}
