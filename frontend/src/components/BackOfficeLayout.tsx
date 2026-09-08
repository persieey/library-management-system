import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import { useAuth } from '../auth/useAuth'
import { backOfficeMenuFor, type NavAction } from '../config/roles'
import Sidebar, { type SidebarItem } from './Sidebar'
import BrandLogo from './BrandLogo'
import UserMenu from './UserMenu'
import PageHeader, { type Crumb } from './PageHeader'
import { navIcon } from './navIcons'
import { sidebar as sidebarStyle } from '../theme'

// บล็อกโลโก้บน header กว้างเท่าแถบเมนู เส้นแบ่งจะได้ตรงกันพอดี
const HEADER_HEIGHT = 72

// แปลงเมนูจาก config/roles.ts ให้เป็นรูปที่ <Sidebar> รับ
// ใช้ path เป็น id เพราะไม่ซ้ำกันอยู่แล้ว ส่วนกลุ่มที่ไม่มี path ใช้ชื่อแทน
function toSidebarItems(menu: NavAction[]): SidebarItem[] {
  return menu.map((item) => ({
    id: item.to ?? item.label,
    label: item.label,
    icon: navIcon(item.icon),
    to: item.to,
    children: item.children ? toSidebarItems(item.children) : undefined,
  }))
}

// พื้นหลังพื้นที่เนื้อหา อ่อนกว่าการ์ดขาวนิดหน่อย ให้การ์ดลอยขึ้นมา
const pageBg = '#f7f9f7'

interface Props {
  title: string
  children: React.ReactNode
  /** ขั้นกลางของ breadcrumb เช่น [{ label: 'ประชาสัมพันธ์', to: '/employees/pr' }] */
  trail?: Crumb[]
}

function BackOfficeLayout({ title, children, trail }: Props) {
  const { logout, allows } = useAuth()
  const navigate = useNavigate()

  // เมนูถูกกรองตามสิทธิ์จริงของผู้ใช้ก่อนถึงมือ Sidebar
  const menu = toSidebarItems(backOfficeMenuFor(allows))

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'white' }}>
      <Box
        component="header"
        sx={{
          display: 'flex',
          height: HEADER_HEIGHT,
          flexShrink: 0,
        }}
      >
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            width: sidebarStyle.width,
            flexShrink: 0,
            alignItems: 'center',
            px: '16px',
            textDecoration: 'none',
            // เส้นแบ่งตั้ง ต่อกับขอบขวาของ sidebar ให้เป็นเส้นเดียวยาวตลอดจอ
            borderRight: `1px solid ${sidebarStyle.border}`,
          }}
        >
          <BrandLogo sealHeight={56} wordmarkHeight={32} />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            px: '35px',
            minWidth: 0,
            // เส้นล่างอยู่เฉพาะฝั่งเนื้อหา คอลัมน์ sidebar จะได้เป็นแถบขาวยาวต่อเนื่อง
            borderBottom: `1px solid ${sidebarStyle.border}`,
          }}
        >
          <Box sx={{ flex: 1 }} />
          <UserMenu compact />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          items={menu}
          bottomItems={[{ id: 'logout', icon: navIcon('logout'), label: 'ออกจากระบบ', onClick: handleLogout }]}
        />

        <Box
          component="main"
          sx={{ flex: 1, minWidth: 0, overflowY: 'auto', bgcolor: pageBg, px: '32px', py: '28px' }}
        >
          <PageHeader title={title} trail={trail} />
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default BackOfficeLayout
