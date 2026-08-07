import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import type { PRItem, PRDraft, PRStatus } from '../interface/IPRInterface'
import { formatThaiDate } from '../pages/employees/pr/dateFormat'

const SEEN_STORAGE_KEY = 'pr_notifications_last_seen'

// ข้อมูลตัวอย่าง — ยังไม่ได้ต่อ backend จริง เก็บอยู่ใน state ของแอปเท่านั้น
// รีเฟรชหน้าแล้วข้อมูลที่แก้จะหายกลับไปเป็นชุดนี้
const SAMPLE_ITEMS: PRItem[] = [
  {
    id: 1,
    pinned: true,
    status: 'เผยแพร่',
    title: 'ปิดปรับปรุงระบบยืม-คืน วันที่ 30 ก.ค. 2569',
    content: 'หอสมุดจะปิดปรับปรุงระบบยืม-คืนชั่วคราว ในวันที่ 30 กรกฎาคม 2569 ขออภัยในความไม่สะดวก',
    channel: 'website',
    publishedAt: '22 ก.ค. 2569',
    expiresAt: '31 ก.ค. 2569',
    views: 1240,
    scheduledAt: null,
    publishedTimestamp: dayjs('2026-07-22').valueOf(),
  },
  {
    id: 2,
    pinned: false,
    status: 'ร่าง',
    title: 'หอสมุดเปิดให้บริการยืมระหว่างห้องสมุดกับมหาวิทยาลัยเครือข่าย',
    content: 'นักศึกษาและอาจารย์สามารถยืมทรัพยากรจากห้องสมุดเครือข่ายได้โดยไม่มีค่าใช้จ่ายเพิ่มเติม',
    channel: 'website',
    publishedAt: '—',
    expiresAt: '—',
    views: 0,
    scheduledAt: null,
    publishedTimestamp: null,
  },
  {
    id: 3,
    pinned: false,
    status: 'ตั้งเวลา',
    title: 'เปิดตัวฐานข้อมูลวิจัยอิเล็กทรอนิกส์ใหม่ 3 ฐานข้อมูล',
    content: 'เพิ่มการเข้าถึงงานวิจัยและวารสารวิชาการนานาชาติ พร้อมจัดอบรมการใช้งาน',
    channel: 'website',
    publishedAt: '—',
    expiresAt: '30 ส.ค. 2569',
    views: 0,
    // ตัวอย่าง: ตั้งไว้ 1 นาทีหลังเปิดหน้า จะได้เห็นระบบเผยแพร่อัตโนมัติทำงานจริงโดยไม่ต้องรอนาน
    scheduledAt: dayjs().add(1, 'minute').toISOString(),
    publishedTimestamp: null,
  },
]

interface PRContextValue {
  items: PRItem[]
  create: (draft: PRDraft) => void
  update: (id: number, draft: PRDraft) => void
  remove: (id: number) => void
  togglePause: (id: number) => void
  copyItem: (id: number) => void
  incrementView: (id: number) => void
  toast: string
  clearToast: () => void
  unseenCount: number
  markSeen: () => void
}

const PRContext = createContext<PRContextValue | null>(null)

export function PRProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [items, setItems] = useState<PRItem[]>(SAMPLE_ITEMS)
  const [toast, setToast] = useState('')
  const [lastSeenAt, setLastSeenAt] = useState<number>(() => {
    const stored = localStorage.getItem(SEEN_STORAGE_KEY)
    return stored ? Number(stored) : 0
  })
  const nextId = useRef(SAMPLE_ITEMS.length + 1)

  const create = useCallback((draft: PRDraft) => {
    const isPublishedNow = draft.status === 'เผยแพร่'
    const item: PRItem = {
      id: nextId.current++,
      views: 0,
      publishedTimestamp: isPublishedNow ? Date.now() : null,
      ...draft,
    }
    setItems((prev) => [item, ...prev])
    setToast('สร้างข่าวประชาสัมพันธ์แล้ว')
  }, [])

  const update = useCallback((id: number, draft: PRDraft) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const becamePublished = draft.status === 'เผยแพร่' && item.status !== 'เผยแพร่'
        return {
          ...item,
          ...draft,
          publishedTimestamp: becamePublished ? Date.now() : item.publishedTimestamp,
        }
      }),
    )
    setToast('บันทึกการแก้ไขแล้ว')
  }, [])

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setToast('ลบข่าวแล้ว')
  }, [])

  const togglePause = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextStatus: PRStatus = item.status === 'เผยแพร่' ? 'ร่าง' : 'เผยแพร่'
        const becamePublished = nextStatus === 'เผยแพร่'
        return { ...item, status: nextStatus, publishedTimestamp: becamePublished ? Date.now() : item.publishedTimestamp }
      }),
    )
    setToast('เปลี่ยนสถานะการเผยแพร่แล้ว')
  }, [])

  const copyItem = useCallback((id: number) => {
    setItems((prev) => {
      const source = prev.find((item) => item.id === id)
      if (!source) return prev
      const copy: PRItem = {
        ...source,
        id: nextId.current++,
        title: `${source.title} (สำเนา)`,
        status: 'ร่าง',
        views: 0,
        scheduledAt: null,
        publishedTimestamp: null,
      }
      return [copy, ...prev]
    })
    setToast('คัดลอกข่าวแล้ว')
  }, [])

  const incrementView = useCallback((id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, views: item.views + 1 } : item)))
  }, [])

  // เช็คทุก 5 วินาทีว่ามีข่าว "ตั้งเวลา" ที่ถึงกำหนดแล้วหรือยัง ถ้าถึง เปลี่ยนเป็น "เผยแพร่" ให้อัตโนมัติ
  // อยู่ระดับแอปไม่ใช่แค่หน้า Manage PR เพื่อให้ทำงานแม้เจ้าหน้าที่ไม่ได้เปิดหน้านั้นค้างไว้
  useEffect(() => {
    const timer = setInterval(() => {
      setItems((prev) => {
        const now = Date.now()
        let publishedTitle: string | null = null

        const next = prev.map((item) => {
          if (item.status !== 'ตั้งเวลา' || !item.scheduledAt) return item
          if (new Date(item.scheduledAt).getTime() > now) return item

          publishedTitle = item.title
          return {
            ...item,
            status: 'เผยแพร่' as PRStatus,
            publishedAt: formatThaiDate(dayjs()),
            scheduledAt: null,
            publishedTimestamp: now,
          }
        })

        if (publishedTitle) setToast(`เผยแพร่ข่าวอัตโนมัติแล้ว: ${publishedTitle}`)
        return next
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const unseenCount = useMemo(
    () =>
      items.filter(
        (item) => item.status === 'เผยแพร่' && item.publishedTimestamp !== null && item.publishedTimestamp > lastSeenAt,
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
    [items, create, update, remove, togglePause, copyItem, incrementView, toast, unseenCount, markSeen],
  )

  return <PRContext.Provider value={value}>{children}</PRContext.Provider>
}

export function usePR(): PRContextValue {
  const context = useContext(PRContext)
  if (!context) throw new Error('usePR ต้องอยู่ภายใน <PRProvider>')
  return context
}
