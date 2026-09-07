import { useEffect, useState } from 'react'
import type { Book } from '../interface/IBookInterface'
import { listPublicBooks } from '../services/https/books'

interface PublicBooksState {
  books: Book[]
  isLoading: boolean
  error: string
}

/**
 * รายการหนังสือสำหรับหน้าสาธารณะ — หน้าแรก, /books และ /books/:id
 *
 * ไม่ใช้ BookContext ของระบบจัดการหนังสือ เพราะตัวนั้นต้องมี token
 * และโหลดเล่มกับรายการตรวจสอบมาด้วย ซึ่งหน้าสาธารณะไม่ได้ใช้และเรียกไม่ได้
 */
export function usePublicBooks(): PublicBooksState {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    listPublicBooks(controller.signal)
      .then((data) => {
        setBooks(data)
        setError('')
      })
      .catch((err: unknown) => {
        // ยกเลิกเพราะ component ถูกถอดออก ไม่ใช่ความผิดพลาดจริง
        if (controller.signal.aborted) return
        setError(err instanceof Error && err.message ? err.message : 'โหลดรายการหนังสือไม่สำเร็จ')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { books, isLoading, error }
}
