import { useEffect, useState } from 'react'
import type { Ebook } from '../interface/IEbookInterface'
import { listPublicEbooks } from '../services/https/ebooks'

interface PublicEbooksState {
  ebooks: Ebook[]
  isLoading: boolean
  error: string
}

/**
 * รายชื่อ E-Book สำหรับหน้าสาธารณะ /ebooks
 *
 * คู่กับ usePublicBooks — ไม่ใช้ EbookContext ของหลังบ้าน เพราะตัวนั้นต้องมี token
 */
export function usePublicEbooks(): PublicEbooksState {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    listPublicEbooks(controller.signal)
      .then((data) => {
        setEbooks(data)
        setError('')
      })
      .catch((err: unknown) => {
        // ยกเลิกเพราะ component ถูกถอดออก ไม่ใช่ความผิดพลาดจริง
        if (controller.signal.aborted) return
        setError(err instanceof Error && err.message ? err.message : 'โหลดรายการ E-Book ไม่สำเร็จ')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { ebooks, isLoading, error }
}
