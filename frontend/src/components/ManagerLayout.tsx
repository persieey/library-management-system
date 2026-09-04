import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import { useAuth } from '../auth/useAuth'
import Sidebar, { type SidebarItem } from './Sidebar'
import BrandLogo from './BrandLogo'
import UserMenu from './UserMenu'
import PageHeader, { type Crumb } from './PageHeader'
import { navIcon } from './navIcons'
import { MANAGER_MENU } from '../config/roles'
import { sidebar as sidebarStyle } from '../theme'

// Design tokens — manager admin panel (Figma: hQfNBMFGPo3PDYXhDIFTeX)
export const mgr = {
  sidebar: '#12372f',
  sidebarMuted: '#9fb3a4',
  accentGreen: '#2f5d3a',
  accentLight: '#e4ece1',
  ink: '#181d19',
  inkMuted: '#667066',
  border: '#e2e7e2',
  bg: '#f4f6f4',
  warning: '#b45309',
  danger: '#b91c1c',
} as const

// บล็อกโลโก้บน header กว้างเท่าแถบเมนู เส้นแบ่งจะได้ตรงกันพอดี
const SIDEBAR_WIDTH = sidebarStyle.width

// ความสูงแถบบน — ให้เท่ากับ BackOfficeLayout จะได้ต่อกันสนิทเวลาสลับหน้า
const HEADER_HEIGHT = 72

// รายการเมนูมาจาก config/roles.ts ที่เดียว แค่แปลงคีย์ไอคอนเป็นไอคอนจริง
const SIDEBAR_NAV: SidebarItem[] = MANAGER_MENU.map((item) => ({
  id: item.to ?? item.label,
  label: item.label,
  icon: navIcon(item.icon),
  to: item.to,
}))

interface Props {
  title: string
  children: React.ReactNode
  /** ขั้นกลางของ breadcrumb เช่น [{ label: 'บุคลากร', to: '/manager/personnel' }] */
  trail?: Crumb[]
}

export default function ManagerLayout({ title, children, trail }: Props) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* BackOffice-style header */}
      <Box
        component="header"
        sx={{ display: 'flex', height: HEADER_HEIGHT, bgcolor: 'white', flexShrink: 0 }}
      >
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex', width: SIDEBAR_WIDTH, flexShrink: 0,
            alignItems: 'center', px: '16px', textDecoration: 'none',
            // เส้นแบ่งตั้ง ต่อกับขอบขวาของ sidebar ให้เป็นเส้นเดียวยาวตลอดจอ
            borderRight: `1px solid ${mgr.border}`,
          }}
        >
          <BrandLogo sealHeight={56} wordmarkHeight={32} />
        </Box>
        {/* เส้นล่างอยู่เฉพาะฝั่งเนื้อหา คอลัมน์ sidebar จะได้เป็นแถบขาวยาวต่อเนื่อง
            ปุ่มออกจากระบบอยู่ท้าย sidebar ที่เดียว ไม่ต้องมีซ้ำบน header */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: '32px',
            borderBottom: `1px solid ${mgr.border}`,
          }}
        >
          <UserMenu compact />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar
          items={SIDEBAR_NAV}
          bottomItems={[{ id: 'logout', icon: navIcon('logout'), label: 'ออกจากระบบ', onClick: handleLogout }]}
        />

        {/* Content area */}
        <Box sx={{ flex: 1, bgcolor: mgr.bg, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box component="main" sx={{ flex: 1, minWidth: 0, px: '32px', py: '28px' }}>
            <PageHeader title={title} trail={trail} />
            {children}
          </Box>
        </Box>
      </Box>

    </Box>
  )
}
