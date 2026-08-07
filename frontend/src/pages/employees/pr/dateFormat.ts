import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.extend(buddhistEra)
dayjs.locale('th')

// รูปแบบที่ใช้กับ DatePicker — ตัว field ของ MUI ไม่รองรับ token ปี พ.ศ. (BBBB) ในการพิมพ์แก้ไขสด
// จึงโชว์เดือนไทยแต่ปี ค.ศ. ระหว่างเลือก ส่วนค่าที่บันทึกจริง (การ์ด/สถิติ) ใช้ formatThaiDate ที่เป็น พ.ศ. เสมอ
export const THAI_DATE_PICKER_FORMAT = 'D MMM YYYY'
export const THAI_DATETIME_PICKER_FORMAT = 'D MMM YYYY HH:mm'

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// แปลงวันที่จากปฏิทิน (ปี ค.ศ.) เป็นข้อความไทย พ.ศ. เช่น "22 ก.ค. 2569"
export function formatThaiDate(date: Dayjs | null): string {
  if (!date) return '—'
  const buddhistYear = date.year() + 543
  return `${date.date()} ${THAI_MONTHS[date.month()]} ${buddhistYear}`
}

// แปลงกลับจากข้อความไทยเป็นวันที่ปฏิทิน — ใช้ตอนเปิดฟอร์มแก้ไขข่าวเดิม
export function parseThaiDate(text: string): Dayjs | null {
  const parts = text.trim().split(/\s+/)
  if (parts.length !== 3) return null

  const [dayText, monthAbbr, yearText] = parts
  const day = Number(dayText)
  const monthIndex = THAI_MONTHS.indexOf(monthAbbr)
  const buddhistYear = Number(yearText)
  if (Number.isNaN(day) || monthIndex === -1 || Number.isNaN(buddhistYear)) return null

  return dayjs(new Date(buddhistYear - 543, monthIndex, day))
}

// วันเวลาที่ "จะ" เผยแพร่ — โชว์ให้เจ้าหน้าที่เห็นบนการ์ดตอนสถานะเป็นตั้งเวลา เช่น "20 ส.ค. 2569 14:30 น."
export function formatThaiDateTime(date: Dayjs | null): string {
  if (!date) return '—'
  const buddhistYear = date.year() + 543
  const hh = String(date.hour()).padStart(2, '0')
  const mm = String(date.minute()).padStart(2, '0')
  return `${date.date()} ${THAI_MONTHS[date.month()]} ${buddhistYear} ${hh}:${mm} น.`
}
