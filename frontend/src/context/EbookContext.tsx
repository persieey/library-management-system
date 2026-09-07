import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Ebook, EbookDraft } from '../interface/IEbookInterface'
import * as ebooksApi from '../services/https/ebooks'
import { useAuth } from '../auth/useAuth'

interface EbookContextValue {
  ebooks: Ebook[]
  isLoading: boolean
  error: string
  reload: () => Promise<void>
  create: (draft: EbookDraft, file: File | null, cover: File | null) => Promise<void>
  update: (id: number, draft: EbookDraft, file: File | null, cover: File | null) => Promise<void>
  remove: (id: number) => Promise<void>
  openFile: (id: number) => Promise<void>
  toast: string
  clearToast: () => void
}

const EbookContext = createContext<EbookContextValue | null>(null)

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

export function EbookProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { token } = useAuth()
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const reload = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      setEbooks(await ebooksApi.listEbooks(token))
      setError('')
    } catch (err) {
      setError(messageOf(err, 'โหลดข้อมูล E-Book ไม่สำเร็จ'))
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

  // อัปโหลดไฟล์ก่อน ได้ path แล้วค่อยสร้าง ebook พร้อม path นั้น
  const create = useCallback(
    (draft: EbookDraft, file: File | null, cover: File | null) =>
      withToken(async (t) => {
        const payload: Parameters<typeof ebooksApi.createEbook>[1] = { ...draft }

        if (file) {
          const info = await ebooksApi.uploadEbookFile(t, file)
          payload.file_name = info.file_name
          payload.file_type = info.file_type
          payload.file_path = info.file_path
        }
        if (cover) {
          payload.cover_path = await ebooksApi.uploadEbookCover(t, cover)
        }

        await ebooksApi.createEbook(t, payload)
        await reload()
        setToast('เพิ่ม E-Book แล้ว')
      }, 'เพิ่ม E-Book ไม่สำเร็จ'),
    [withToken, reload],
  )

  // แก้ไขเปลี่ยนได้แค่ข้อมูลกับรูปปก ไฟล์ตัวเนื้อหาเปลี่ยนไม่ได้
  // เพราะ UpdateEbookRequest ฝั่ง backend ไม่รับ file_path
  const update = useCallback(
    (id: number, draft: EbookDraft, file: File | null, cover: File | null) =>
      withToken(async (t) => {
        const patch: Partial<EbookDraft & Pick<Ebook, 'file_name' | 'file_type' | 'file_path' | 'cover_path'>> = {
          ...draft,
        }
        if (file) {
          const info = await ebooksApi.uploadEbookFile(t, file)
          patch.file_name = info.file_name
          patch.file_type = info.file_type
          patch.file_path = info.file_path
        }
        if (cover) {
          patch.cover_path = await ebooksApi.uploadEbookCover(t, cover)
        }
        await ebooksApi.updateEbook(t, id, patch)
        await reload()
        setToast('บันทึกการแก้ไขแล้ว')
      }, 'บันทึกการแก้ไขไม่สำเร็จ'),
    [withToken, reload],
  )

  const remove = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await ebooksApi.deleteEbook(t, id)
        await reload()
        setToast('ลบ E-Book แล้ว')
      }, 'ลบ E-Book ไม่สำเร็จ'),
    [withToken, reload],
  )

  const openFile = useCallback(
    (id: number) =>
      withToken(async (t) => {
        await ebooksApi.openEbookFile(t, id)
      }, 'เปิดไฟล์ไม่สำเร็จ'),
    [withToken],
  )

  const value = useMemo<EbookContextValue>(
    () => ({
      ebooks,
      isLoading,
      error,
      reload,
      create,
      update,
      remove,
      openFile,
      toast,
      clearToast: () => setToast(''),
    }),
    [ebooks, isLoading, error, reload, create, update, remove, openFile, toast],
  )

  return <EbookContext.Provider value={value}>{children}</EbookContext.Provider>
}

export function useEbooks(): EbookContextValue {
  const context = useContext(EbookContext)
  if (!context) throw new Error('useEbooks ต้องอยู่ภายใน <EbookProvider>')
  return context
}