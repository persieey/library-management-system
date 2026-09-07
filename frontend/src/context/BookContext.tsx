import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Book,
  BookCopy,
  BookCopyDraft,
  BookDraft,
  BookInspection,
  InspectionDraft,
} from '../interface/IBookInterface'
import * as booksApi from '../services/https/books'
import { useAuth } from '../auth/useAuth'

interface BookContextValue {
  books: Book[]
  copies: BookCopy[]
  inspections: BookInspection[]
  isLoading: boolean
  error: string
  reload: () => Promise<void>

  createBook: (draft: BookDraft, cover: File | null) => Promise<void>
  updateBook: (id: number, draft: BookDraft, cover: File | null) => Promise<void>
  removeBook: (id: number) => Promise<void>

  createCopy: (bookId: number, draft: BookCopyDraft) => Promise<void>
  updateCopy: (id: number, patch: Partial<BookCopyDraft>) => Promise<void>
  removeCopy: (id: number) => Promise<void>

  createInspection: (draft: InspectionDraft) => Promise<void>
  toggleResolved: (id: number, resolved: boolean) => Promise<void>
  removeInspection: (id: number) => Promise<void>

  toast: string
  clearToast: () => void
}

const BookContext = createContext<BookContextValue | null>(null)

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

export function BookProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { token } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [copies, setCopies] = useState<BookCopy[]>([])
  const [inspections, setInspections] = useState<BookInspection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const reload = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const [b, c, i] = await Promise.all([
        booksApi.listBooks(token),
        booksApi.listCopies(token),
        booksApi.listInspections(token),
      ])
      setBooks(b)
      setCopies(c)
      setInspections(i)
      setError('')
    } catch (err) {
      setError(messageOf(err, 'โหลดข้อมูลหนังสือไม่สำเร็จ'))
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void reload()
  }, [reload])

  const withToken = useCallback(
    async (action: (token: string) => Promise<void>, failMessage: string) => {
      if (!token) {
        setToast('ต้องเข้าสู่ระบบก่อน')
        return
      }
      try {
        await action(token)
      } catch (err) {
        setToast(messageOf(err, failMessage))
      }
    },
    [token],
  )

  // ---------- หนังสือ ----------

  const createBook = useCallback(
    (draft: BookDraft, cover: File | null) =>
      withToken(async (t) => {
        const created = await booksApi.createBook(t, draft)
        if (cover) {
          const path = await booksApi.uploadBookCover(t, cover)
          await booksApi.updateBook(t, created.book_id, { cover_path: path })
        }
        await reload()
        setToast('เพิ่มหนังสือแล้ว')
      }, 'เพิ่มหนังสือไม่สำเร็จ'),
    [withToken, reload],
  )

  const updateBook = useCallback(
    (id: number, draft: BookDraft, cover: File | null) =>
      withToken(async (t) => {
        const patch: Partial<BookDraft & { cover_path: string }> = { ...draft }
        if (cover) {
          patch.cover_path = await booksApi.uploadBookCover(t, cover)
        }
        await booksApi.updateBook(t, id, patch)
        await reload()
        setToast('บันทึกการแก้ไขแล้ว')
      }, 'บันทึกการแก้ไขไม่สำเร็จ'),
    [withToken, reload],
  )

  const removeBook = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await booksApi.deleteBook(t, id)
        await reload()
        setToast('ลบหนังสือแล้ว')
      }, 'ลบหนังสือไม่สำเร็จ'),
    [withToken, reload],
  )

  // ---------- เล่ม ----------

  const createCopy = useCallback(
    (bookId: number, draft: BookCopyDraft) =>
      withToken(async (t) => {
        await booksApi.createCopy(t, bookId, draft)
        await reload()
        setToast('เพิ่มเล่มแล้ว')
      }, 'เพิ่มเล่มไม่สำเร็จ'),
    [withToken, reload],
  )

  const updateCopy = useCallback(
    (id: number, patch: Partial<BookCopyDraft>) =>
      withToken(async (t) => {
        await booksApi.updateCopy(t, id, patch)
        await reload()
        setToast('บันทึกการแก้ไขแล้ว')
      }, 'บันทึกการแก้ไขไม่สำเร็จ'),
    [withToken, reload],
  )

  const removeCopy = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await booksApi.deleteCopy(t, id)
        await reload()
        setToast('ลบเล่มแล้ว')
      }, 'ลบเล่มไม่สำเร็จ'),
    [withToken, reload],
  )

  // ---------- การตรวจสอบ ----------

  const createInspection = useCallback(
    (draft: InspectionDraft) =>
      withToken(async (t) => {
        await booksApi.createInspection(t, draft)
        await reload()
        setToast('บันทึกการตรวจแล้ว')
      }, 'บันทึกการตรวจไม่สำเร็จ'),
    [withToken, reload],
  )

  const toggleResolved = useCallback(
    (id: number, resolved: boolean) =>
      withToken(async (t) => {
        await booksApi.updateInspection(t, id, { resolved })
        await reload()
        setToast(resolved ? 'ทำเครื่องหมายว่าจัดการแล้ว' : 'เปลี่ยนเป็นยังไม่จัดการ')
      }, 'เปลี่ยนสถานะไม่สำเร็จ'),
    [withToken, reload],
  )

  const removeInspection = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await booksApi.deleteInspection(t, id)
        await reload()
        setToast('ลบรายการตรวจแล้ว')
      }, 'ลบรายการตรวจไม่สำเร็จ'),
    [withToken, reload],
  )

  const value = useMemo<BookContextValue>(
    () => ({
      books,
      copies,
      inspections,
      isLoading,
      error,
      reload,
      createBook,
      updateBook,
      removeBook,
      createCopy,
      updateCopy,
      removeCopy,
      createInspection,
      toggleResolved,
      removeInspection,
      toast,
      clearToast: () => setToast(''),
    }),
    [
      books,
      copies,
      inspections,
      isLoading,
      error,
      reload,
      createBook,
      updateBook,
      removeBook,
      createCopy,
      updateCopy,
      removeCopy,
      createInspection,
      toggleResolved,
      removeInspection,
      toast,
    ],
  )

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>
}

export function useBooks(): BookContextValue {
  const context = useContext(BookContext)
  if (!context) throw new Error('useBooks ต้องอยู่ภายใน <BookProvider>')
  return context
}