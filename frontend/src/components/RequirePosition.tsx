import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useAuth } from '../auth/useAuth'
import { POSITION_LABELS } from '../config/roles'
import type { Position } from '../interface/IUserInterface'
import { fonts, colors } from '../theme'

interface RequirePositionProps {
  /** ตำแหน่งที่เข้าหน้านี้ได้ ต้องตรงกับ RequirePosition ฝั่ง backend */
  positions: Position[]
  children: ReactNode
}

function Notice({ title, detail }: { title: string; detail: string }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        px: 3,
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 28, fontWeight: 600, color: colors.brandGreen }}>
        {title}
      </Typography>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, color: colors.inkMuted }}>{detail}</Typography>
      <Button
        component={Link}
        to="/"
        sx={{ mt: 1, bgcolor: colors.brandGreen, color: 'white', px: '20px', py: '10px', fontFamily: fonts.kanit, fontSize: 16, '&:hover': { bgcolor: colors.brandGreen } }}
      >
        กลับหน้าแรก
      </Button>
    </Box>
  )
}

/**
 * กั้นหน้าที่แค่ต้องล็อกอิน ไม่สนตำแหน่ง เช่นหน้าโปรไฟล์ของตัวเอง
 * สมาชิกหอสมุดก็ต้องเข้าได้ ไม่ใช่เฉพาะพนักงาน
 */
export function RequireLogin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <Checking />
  if (!user) return <Notice title="ต้องเข้าสู่ระบบก่อน" detail="กลับไปหน้าแรกแล้วกด Sign in เพื่อเข้าสู่ระบบ" />
  return <>{children}</>
}

function Checking() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, color: colors.inkMuted }}>
        กำลังตรวจสอบสิทธิ์...
      </Typography>
    </Box>
  )
}

// กั้นหน้าฝั่ง client เพื่อไม่ให้เห็นหน้าที่ไม่มีสิทธิ์ — ความสะดวก ไม่ใช่ความปลอดภัย
// ข้อมูลจริงถูกกั้นที่ backend อีกชั้นเสมอ
function RequirePosition({ positions, children }: RequirePositionProps) {
  const { user, isLoading, allows } = useAuth()

  if (isLoading) return <Checking />

  if (!user) {
    return <Notice title="ต้องเข้าสู่ระบบก่อน" detail="กลับไปหน้าแรกแล้วกด Sign in เพื่อเข้าสู่ระบบ" />
  }

  if (!allows(...positions)) {
    return (
      <Notice
        title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
        detail={`บัญชี ${user.name} เป็น${POSITION_LABELS[user.position]} ซึ่งเข้าส่วนนี้ไม่ได้`}
      />
    )
  }

  return <>{children}</>
}

export default RequirePosition
