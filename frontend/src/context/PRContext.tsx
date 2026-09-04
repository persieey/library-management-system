import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PRItem, PRDraft } from '../interface/IPRInterface'
import * as prApi from '../services/https/pr'
import { useAuth } from '../auth/useAuth'

const SEEN_STORAGE_KEY = 'pr_notifications_last_seen'

// เซิร์ฟเวอร์เป็นคนเลื่อนสถานะข่าวที่ตั้งเวลาไว้ ฝั่งนี้แค่ดึงข้อมูลใหม่มาดูเป็นระยะ
// ถี่พอให้เห็นข่าวที่เพิ่งขึ้นเองโดยไม่ต้องรีเฟรชหน้า
const REFRESH_INTERVAL_MS = 30_000

interface PRContextValue {
  items: PRItem[]
  isLoading: boolean
  error: string
  reload: () => Promise<void>
  create: (draft: PRDraft) => Promise<void>
  update: (id: number, draft: PRDraft) => Promise<void>
  remove: (id: number) => Promise<void>
  togglePause: (id: number) => Promise<void>
  copyItem: (id: number) => Promise<void>
  incrementView: (id: number) => void
  toast: string
  clearToast: () => void
  unseenCount: number
  markSeen: () => void
}

const PRContext = createContext<PRContextValue | null>(null)

// ข้อความบอกความผิดพลาดที่ผู้ใช้อ่านรู้เรื่อง เผื่อ backend ไม่ได้รัน
function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

export function PRProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { token } = useAuth()
  const [items, setItems] = useState<PRItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [lastSeenAt, setLastSeenAt] = useState<number>(() => {
    const stored = localStorage.getItem(SEEN_STORAGE_KEY)
    return stored ? Number(stored) : 0
  })

  const reload = useCallback(async () => {
    try {
      setItems(await prApi.listPR(token))
      setError('')
    } catch (err) {
      setError(messageOf(err, 'โหลดข่าวประชาสัมพันธ์ไม่สำเร็จ'))
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // โหลดใหม่ทุกครั้งที่สถานะล็อกอินเปลี่ยน เพราะเจ้าหน้าที่เห็นข่าวมากกว่าคนทั่วไป
  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const timer = setInterval(() => {
      void reload()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [reload])

  // ทุกคำสั่งที่เปลี่ยนข้อมูลต้องมี token — ถ้าไม่มีแปลว่าหลุดล็อกอินไปแล้ว
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

  const create = useCallback(
    (draft: PRDraft) =>
      withToken(async (t) => {
        await prApi.createPR(t, draft)
        await reload()
        setToast('สร้างข่าวประชาสัมพันธ์แล้ว')
      }, 'สร้างข่าวไม่สำเร็จ'),
    [withToken, reload],
  )

  const update = useCallback(
    (id: number, draft: PRDraft) =>
      withToken(async (t) => {
        await prApi.updatePR(t, id, draft)
        await reload()
        setToast('บันทึกการแก้ไขแล้ว')
      }, 'บันทึกการแก้ไขไม่สำเร็จ'),
    [withToken, reload],
  )

  const remove = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await prApi.deletePR(t, id)
        await reload()
        setToast('ลบข่าวแล้ว')
      }, 'ลบข่าวไม่สำเร็จ'),
    [withToken, reload],
  )

  const togglePause = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await prApi.togglePR(t, id)
        await reload()
        setToast('เปลี่ยนสถานะการเผยแพร่แล้ว')
      }, 'เปลี่ยนสถานะไม่สำเร็จ'),
    [withToken, reload],
  )

  const copyItem = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await prApi.copyPR(t, id)
        await reload()
        setToast('คัดลอกข่าวแล้ว')
      }, 'คัดลอกข่าวไม่สำเร็จ'),
    [withToken, reload],
  )

  // นับยอดเข้าชม — ขยับตัวเลขบนจอทันทีโดยไม่รอเซิร์ฟเวอร์ เพราะเป็นแค่ตัวเลขประกอบ
  // ถ้าเรียกไม่สำเร็จก็ปล่อยผ่าน ไม่ต้องกวนผู้อ่านด้วยข้อความ error
  const incrementView = useCallback((id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, views: item.views + 1 } : item)))
    void prApi.viewPR(id).catch(() => {})
  }, [])

  const unseenCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === 'เผยแพร่' &&
          item.publishedTimestamp !== null &&
          item.publishedTimestamp > lastSeenAt,
      ).length,
    [items, lastSeenAt],
  )

  const markSeen = useCallback(() => {
    const now = Date.now()
    setLastSeenAt(now)
    localStorage.setItem(SEEN_STORAGE_KEY, String(now))
  }, [])

  const value = useMemo<PRContextValue>(
    () => ({
      items,
      isLoading,
      error,
      reload,
      create,
      update,
      remove,
      togglePause,
      copyItem,
      incrementView,
      toast,
      clearToast: () => setToast(''),
      unseenCount,
      markSeen,
    }),
    [
      items,
      isLoading,
      error,
      reload,
      create,
      update,
      remove,
      togglePause,
      copyItem,
      incrementView,
      toast,
      unseenCount,
      markSeen,
    ],
  )

  return <PRContext.Provider value={value}>{children}</PRContext.Provider>
}

export function usePR(): PRContextValue {
  const context = useContext(PRContext)
  if (!context) throw new Error('usePR ต้องอยู่ภายใน <PRProvider>')
  return context
}
