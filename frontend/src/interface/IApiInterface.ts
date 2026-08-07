// รูปแบบ response ที่ backend ห่อมาให้ ตามตัวอย่างของวิชา
export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; detail?: string } }
