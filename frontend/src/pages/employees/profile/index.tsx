import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import PageHeader from '../../../components/PageHeader'
import Card from '../../../components/Card'
import { useAuth } from '../../../auth/useAuth'
import { POSITION_LABELS } from '../../../config/roles'
import * as authApi from '../../../services/https/auth'
import { fonts, mgr } from '../../../theme'

/**
 * หน้าเดียวใช้ได้สองทาง พนักงานเข้าจากหลังบ้านจึงห่อด้วย BackOfficeLayout
 * ส่วนสมาชิกไม่มีเมนูหลังบ้านให้แสดง จึงห่อด้วย header กับ footer ของหน้าสาธารณะแทน
 */
function Frame({ isEmployee, children }: { isEmployee: boolean; children: React.ReactNode }) {
  if (isEmployee) return <BackOfficeLayout title="แก้ไขโปรไฟล์">{children}</BackOfficeLayout>
  return (
    <>
      <Header />
      <Box sx={{ bgcolor: '#f7f9f7', minHeight: '70vh', px: { xs: 2, md: 6 }, py: 4 }}>
        <Box sx={{ maxWidth: 1160, mx: 'auto' }}>
          <PageHeader title="แก้ไขโปรไฟล์" />
          <Box sx={{ mt: 3 }}>{children}</Box>
        </Box>
      </Box>
      <Footer />
    </>
  )
}

// ข้อความ error จาก backend เป็นภาษาไทยอยู่แล้ว ยกมาแสดงตรงๆ ได้เลย
// ที่ต้องดักคือกรณี fetch ล้มเพราะเซิร์ฟเวอร์ไม่ได้รัน ซึ่งไม่มีข้อความให้
function errorText(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message.trim() : ''
  if (!message) return fallback
  // Gin ส่งข้อความของ validator มาดิบๆ เช่น "Key: 'UpdateProfileRequest.Email' Error:..."
  // ไม่เหมาะให้ผู้ใช้อ่าน จึงแทนด้วยข้อความของเราเอง
  if (message.includes('Field validation')) return fallback
  return message
}

const labelSx = {
  fontFamily: fonts.thai,
  fontWeight: 500,
  fontSize: 12,
  letterSpacing: '0.4px',
  color: mgr.inkMuted,
} as const

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '8px', fontFamily: fonts.thai, fontSize: 14 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: mgr.border },
} as const

// ช่องที่แก้เองไม่ได้ ทำให้ดูต่างจากช่องกรอกชัดๆ จะได้ไม่กดแล้วงงว่าทำไมพิมพ์ไม่ได้
const readOnlyFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontFamily: fonts.thai,
    fontSize: 14,
    bgcolor: '#f4f6f4',
    color: mgr.inkMuted,
  },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: mgr.border, borderStyle: 'dashed' },
  '& input': { cursor: 'default' },
} as const

/** ช่องกรอกหนึ่งช่องพร้อมป้ายกำกับด้านบน ใช้ซ้ำทั้งสองฟอร์ม */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  helperText,
  readOnly = false,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  autoComplete?: string
  helperText?: string
  readOnly?: boolean
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Typography sx={labelSx}>{label}</Typography>
      <TextField
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        type={type}
        autoComplete={autoComplete}
        helperText={helperText}
        size="small"
        fullWidth
        sx={readOnly ? readOnlyFieldSx : fieldSx}
        slotProps={{
          input: { readOnly },
          formHelperText: { sx: { fontFamily: fonts.thai, fontSize: 12, color: mgr.inkMuted, mx: 0 } },
        }}
      />
    </Box>
  )
}

const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' }

export default function ProfilePage() {
  const { user, token, applyProfile, isEmployee } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [toast, setToast] = useState('')

  // เติมค่าเริ่มต้นเมื่อรู้จักผู้ใช้แล้ว ตอนรีเฟรชหน้า user ยังเป็น null อยู่ครู่หนึ่ง
  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, phone: user.phone ?? '' })
  }, [user])

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setProfileError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setPassword = (key: keyof typeof passwords, value: string) => {
    setPasswordError('')
    setPasswords((prev) => ({ ...prev, [key]: value }))
  }

  const saveProfile = async () => {
    if (!token) return
    setProfileError('')
    setSavingProfile(true)
    try {
      const res = await authApi.updateProfile(token, form)
      // อัปเดตชื่อที่มุมขวาบนทันที ไม่ต้องรีเฟรชหน้า
      applyProfile(res)
      setToast('บันทึกข้อมูลเรียบร้อย')
    } catch (err) {
      setProfileError(errorText(err, 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง'))
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async () => {
    if (!token) return
    setPasswordError('')
    // เช็คสองช่องตรงกันที่ฝั่งนี้ก่อน backend ไม่รู้เรื่องช่องยืนยัน
    if (passwords.next !== passwords.confirm) {
      setPasswordError('รหัสผ่านใหม่กับช่องยืนยันไม่ตรงกัน')
      return
    }
    setSavingPassword(true)
    try {
      await authApi.changePassword(token, {
        current_password: passwords.current,
        new_password: passwords.next,
      })
      setPasswords(EMPTY_PASSWORDS)
      setToast('เปลี่ยนรหัสผ่านเรียบร้อย')
    } catch (err) {
      setPasswordError(errorText(err, 'เปลี่ยนรหัสผ่านไม่สำเร็จ'))
    } finally {
      setSavingPassword(false)
    }
  }

  // ชื่อแก้ไม่ได้แล้ว เหลือแค่สองช่องนี้ที่ทำให้ปุ่มบันทึกทำงาน
  const profileDirty =
    !!user && (form.email !== user.email || form.phone !== (user.phone ?? ''))
  const passwordReady =
    passwords.current.length > 0 && passwords.next.length >= 6 && passwords.confirm.length > 0

  return (
    <Frame isEmployee={isEmployee}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: 620 }}>
        <Card title="ข้อมูลส่วนตัว" subtitle={`ตำแหน่ง ${POSITION_LABELS[user?.position ?? '']}`}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field
              label="ชื่อ-นามสกุล"
              value={form.name}
              readOnly
              helperText={
                isEmployee
                  ? 'ชื่อในทะเบียนบุคลากร แก้ไขเองไม่ได้ ต้องแจ้งหัวหน้าหอสมุด'
                  : 'ชื่อตามทะเบียนสมาชิก แก้ไขเองไม่ได้ ต้องแจ้งเจ้าหน้าที่'
              }
            />
            <Field
              label="อีเมล"
              value={form.email}
              onChange={(v) => set('email', v)}
              type="email"
              autoComplete="email"
              helperText="ใช้อีเมลนี้เข้าสู่ระบบ เปลี่ยนแล้วต้องใช้อันใหม่ล็อกอินครั้งต่อไป"
            />
            <Field
              label="เบอร์โทรศัพท์"
              value={form.phone}
              onChange={(v) => set('phone', v)}
              autoComplete="tel"
            />

            {profileError && (
              <Alert severity="error" sx={{ fontFamily: fonts.thai, fontSize: 13, borderRadius: '8px' }}>
                {profileError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={saveProfile}
                disabled={!profileDirty || savingProfile}
                sx={{ fontFamily: fonts.thai, fontSize: 14, px: 3, borderRadius: '8px', bgcolor: mgr.sidebar }}
              >
                {savingProfile ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </Box>
          </Box>
        </Card>

        <Card title="เปลี่ยนรหัสผ่าน" subtitle="ต้องกรอกรหัสผ่านเดิมให้ถูกก่อน">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field
              label="รหัสผ่านเดิม"
              value={passwords.current}
              onChange={(v) => setPassword('current', v)}
              type="password"
              autoComplete="off"
              helperText="ต้องพิมพ์เอง เพื่อยืนยันว่าเป็นเจ้าของบัญชีจริง"
            />
            <Field
              label="รหัสผ่านใหม่"
              value={passwords.next}
              onChange={(v) => setPassword('next', v)}
              type="password"
              autoComplete="new-password"
              helperText="อย่างน้อย 6 ตัวอักษร"
            />
            <Field
              label="ยืนยันรหัสผ่านใหม่"
              value={passwords.confirm}
              onChange={(v) => setPassword('confirm', v)}
              type="password"
              autoComplete="new-password"
            />

            {passwordError && (
              <Alert severity="error" sx={{ fontFamily: fonts.thai, fontSize: 13, borderRadius: '8px' }}>
                {passwordError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={savePassword}
                disabled={!passwordReady || savingPassword}
                sx={{ fontFamily: fonts.thai, fontSize: 14, px: 3, borderRadius: '8px', bgcolor: mgr.sidebar }}
              >
                {savingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ fontFamily: fonts.thai, fontSize: 14, borderRadius: '8px' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Frame>
  )
}
