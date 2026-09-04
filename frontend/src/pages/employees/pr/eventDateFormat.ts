import dayjs from 'dayjs'

// การ์ดกิจกรรมโชว์เป็นภาษาอังกฤษบนหน้าแรก (ต่างจากข่าวประชาสัมพันธ์ที่เป็น พ.ศ. ไทย)
// ล็อก locale เป็น 'en' ต่ออินสแตนซ์ เพราะ dateFormat.ts ของ PR ตั้ง dayjs.locale('th') ไว้ทั้งแอป
export function formatEventDate(dateIso: string, allDay: boolean): string {
  if (!dateIso) return '—'
  const d = dayjs(dateIso).locale('en')
  const datePart = d.format('D MMM YYYY')
  return allDay ? `${datePart} · All Day` : `${datePart} · ${d.format('h:mm A')}`
}
