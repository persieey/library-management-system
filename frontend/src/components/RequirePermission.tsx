import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useAuth } from '../auth/useAuth'
import { fonts, colors } from '../theme'
import type { Permission } from '../config/roles'

interface RequirePermissionProps {
  permission: Permission
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

// กั้นหน้าฝั่ง client เพื่อไม่ให้เห็นหน้าที่ไม่มีสิทธิ์ — ความสะดวก ไม่ใช่ความปลอดภัย
// ข้อมูลจริงถูกกั้นที่ backend อีกชั้นเสมอ
function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { user, isLoading, can } = useAuth()

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, color: colors.inkMuted }}>
          กำลังตรวจสอบสิทธิ์...
        </Typography>
      </Box>
    )
  }

  if (!user) {
    return <Notice title="ต้องเข้าสู่ระบบก่อน" detail="กลับไปหน้าแรกแล้วกด Sign in เพื่อเข้าสู่ระบบ" />
  }

  if (!can(permission)) {
    return (
      <Notice
        title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
        detail={`บัญชี ${user.name} เป็นสิทธิ์ระดับ ${user.role} ซึ่งเข้าส่วนนี้ไม่ได้`}
      />
    )
  }

  return <>{children}</>
}

export default RequirePermission
