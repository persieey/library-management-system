import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LoginModal from '../components/LoginModal'

/**
 * ตัวคุมหน้าต่างล็อกอินส่วนกลาง — มีตัวเดียวทั้งแอป
 *
 * ปุ่มที่ต้องล็อกอินก่อนถึงจะไปต่อได้ (เช่นปุ่ม "จองห้อง" ที่หน้าหลักและในเมนู Resources)
 * เรียก requireLogin('/booking') ได้เลย:
 *   - ถ้าล็อกอินอยู่แล้ว → พาไป /booking ทันที
 *   - ถ้ายัง → เด้งหน้าต่างล็อกอิน พอล็อกอินเสร็จค่อยพาไป /booking
 */
interface LoginPromptValue {
  requireLogin: (redirectTo?: string) => void
  /** เปิดหน้าต่างล็อกอินเฉย ๆ ไม่ต้องพาไปไหนต่อ (ใช้กับปุ่ม Sign in) */
  openLogin: () => void
}

const LoginPromptContext = createContext<LoginPromptValue | null>(null)

export function LoginPromptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  const requireLogin = useCallback(
    (to?: string) => {
      if (user) {
        if (to) navigate(to)
        return
      }
      setRedirectTo(to ?? null)
      setOpen(true)
    },
    [user, navigate],
  )

  const openLogin = useCallback(() => {
    setRedirectTo(null)
    setOpen(true)
  }, [])

  const handleClose = useCallback(
    (didLogin?: boolean) => {
      setOpen(false)
      if (didLogin && redirectTo) navigate(redirectTo)
      setRedirectTo(null)
    },
    [redirectTo, navigate],
  )

  return (
    <LoginPromptContext.Provider value={{ requireLogin, openLogin }}>
      {children}
      <LoginModal open={open} onClose={handleClose} />
    </LoginPromptContext.Provider>
  )
}

export function useLoginPrompt(): LoginPromptValue {
  const ctx = useContext(LoginPromptContext)
  if (!ctx) throw new Error('useLoginPrompt ต้องอยู่ภายใน <LoginPromptProvider>')
  return ctx
}
