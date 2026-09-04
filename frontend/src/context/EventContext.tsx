import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { EventItem, EventDraft } from '../interface/IEventInterface'
import * as eventApi from '../services/https/events'
import { useAuth } from '../auth/useAuth'

interface EventContextValue {
  items: EventItem[]
  isLoading: boolean
  error: string
  reload: () => Promise<void>
  create: (draft: EventDraft) => Promise<void>
  update: (id: number, draft: EventDraft) => Promise<void>
  remove: (id: number) => Promise<void>
  toast: string
  clearToast: () => void
}

const EventContext = createContext<EventContextValue | null>(null)

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

export function EventProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { token } = useAuth()
  const [items, setItems] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const reload = useCallback(async () => {
    try {
      setItems(await eventApi.listEvents())
      setError('')
    } catch (err) {
      setError(messageOf(err, 'โหลดข้อมูลกิจกรรมไม่สำเร็จ'))
    } finally {
      setIsLoading(false)
    }
  }, [])

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

  const create = useCallback(
    (draft: EventDraft) =>
      withToken(async (t) => {
        await eventApi.createEvent(t, draft)
        await reload()
        setToast('เพิ่มกิจกรรมแล้ว')
      }, 'เพิ่มกิจกรรมไม่สำเร็จ'),
    [withToken, reload],
  )

  const update = useCallback(
    (id: number, draft: EventDraft) =>
      withToken(async (t) => {
        await eventApi.updateEvent(t, id, draft)
        await reload()
        setToast('บันทึกการแก้ไขแล้ว')
      }, 'บันทึกการแก้ไขไม่สำเร็จ'),
    [withToken, reload],
  )

  const remove = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await eventApi.deleteEvent(t, id)
        await reload()
        setToast('ลบกิจกรรมแล้ว')
      }, 'ลบกิจกรรมไม่สำเร็จ'),
    [withToken, reload],
  )

  const value = useMemo<EventContextValue>(
    () => ({
      items,
      isLoading,
      error,
      reload,
      create,
      update,
      remove,
      toast,
      clearToast: () => setToast(''),
    }),
    [items, isLoading, error, reload, create, update, remove, toast],
  )

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

export function useEvents(): EventContextValue {
  const context = useContext(EventContext)
  if (!context) throw new Error('useEvents ต้องอยู่ภายใน <EventProvider>')
  return context
}
