import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Personnel, PersonnelFormData } from '../interface/IPersonnelInterface'
import * as personnelApi from '../services/https/personnel'
import { useAuth } from '../auth/useAuth'

export const DEPARTMENTS = [
  'งานบริการยืม-คืน',
  'งานประชาสัมพันธ์',
  'งานพัฒนาทรัพยากร',
  'งานบริการสารสนเทศ',
  'งานเทคโนโลยีสารสนเทศ',
  'งานธุรการ',
]

interface PersonnelContextValue {
  personnel: Personnel[]
  isLoading: boolean
  error: string
  reload: () => Promise<void>
  add: (data: PersonnelFormData) => Promise<void>
  update: (id: number, data: PersonnelFormData) => Promise<void>
  remove: (id: number) => Promise<void>
  toggleStatus: (id: number) => Promise<void>
  toast: string
  clearToast: () => void
}

const PersonnelContext = createContext<PersonnelContextValue | null>(null)

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

export function PersonnelProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { token } = useAuth()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const reload = useCallback(async () => {
    if (!token) {
      setPersonnel([])
      setIsLoading(false)
      return
    }
    try {
      setPersonnel(await personnelApi.listPersonnel(token))
      setError('')
    } catch (err) {
      setError(messageOf(err, 'โหลดข้อมูลบุคลากรไม่สำเร็จ'))
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

  const add = useCallback(
    (data: PersonnelFormData) =>
      withToken(async (t) => {
        await personnelApi.createPersonnel(t, data)
        await reload()
        setToast('เพิ่มข้อมูลบุคลากรแล้ว')
      }, 'เพิ่มข้อมูลบุคลากรไม่สำเร็จ'),
    [withToken, reload],
  )

  const update = useCallback(
    (id: number, data: PersonnelFormData) =>
      withToken(async (t) => {
        await personnelApi.updatePersonnel(t, id, data)
        await reload()
        setToast('บันทึกการแก้ไขแล้ว')
      }, 'บันทึกการแก้ไขไม่สำเร็จ'),
    [withToken, reload],
  )

  const remove = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await personnelApi.deletePersonnel(t, id)
        await reload()
        setToast('ลบข้อมูลบุคลากรแล้ว')
      }, 'ลบข้อมูลบุคลากรไม่สำเร็จ'),
    [withToken, reload],
  )

  const toggleStatus = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await personnelApi.togglePersonnelStatus(t, id)
        await reload()
        setToast('เปลี่ยนสถานะแล้ว')
      }, 'เปลี่ยนสถานะไม่สำเร็จ'),
    [withToken, reload],
  )

  const value = useMemo<PersonnelContextValue>(
    () => ({
      personnel,
      isLoading,
      error,
      reload,
      add,
      update,
      remove,
      toggleStatus,
      toast,
      clearToast: () => setToast(''),
    }),
    [personnel, isLoading, error, reload, add, update, remove, toggleStatus, toast],
  )

  return <PersonnelContext.Provider value={value}>{children}</PersonnelContext.Provider>
}

export function usePersonnel(): PersonnelContextValue {
  const ctx = useContext(PersonnelContext)
  if (!ctx) throw new Error('usePersonnel ต้องอยู่ภายใน <PersonnelProvider>')
  return ctx
}
