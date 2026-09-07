import { useNavigate, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import { useAuth } from '../auth/useAuth'
import { PERMISSIONS } from '../config/roles'
import Sidebar, { type SidebarItem } from './Sidebar'
import BrandLogo from './BrandLogo'
import UserMenu from './UserMenu'
import PageHeader, { type Crumb } from './PageHeader'
import { navIcon } from './navIcons'
import { sidebar as sidebarStyle } from '../theme'

const HEADER_HEIGHT = 72
const pageBg = '#f7f9f7'

const PROCUREMENT_BASE: SidebarItem[] = [
  { id: '/procurement', icon: navIcon('home'), label: 'Homepage', to: '/procurement' },
  { id: '/procurement/create', icon: navIcon('procurement'), label: 'Create Purchase Request', to: '/procurement/create' },
  { id: '/procurement/requests', icon: navIcon('reports'), label: 'Request List', to: '/procurement/requests' },
  { id: '/procurement/details', icon: navIcon('overview'), label: 'Check Details', to: '/procurement/details' },
  { id: '/procurement/register-asset', icon: navIcon('audit'), label: 'Register Asset', to: '/procurement/register-asset' },
]

const PROCUREMENT_MGR: SidebarItem[] = [
  { id: '/procurement/approve', icon: navIcon('leave'), label: 'Approve Requests', to: '/procurement/approve' },
  { id: '/procurement/overview', icon: navIcon('overview'), label: 'Overview', to: '/procurement/overview' },
]

const AUDIT_ITEMS: SidebarItem[] = [
  { id: '/asset-audit', icon: navIcon('audit'), label: 'Assets to Audit', to: '/asset-audit' },
  { id: '/asset-audit/physical', icon: navIcon('repairTrack'), label: 'Physical Audit', to: '/asset-audit/physical' },
  { id: '/asset-audit/discrepancies', icon: navIcon('reports'), label: 'Record Discrepancies', to: '/asset-audit/discrepancies' },
  { id: '/asset-audit/report', icon: navIcon('overview'), label: 'Create Audit Report', to: '/asset-audit/report' },
  { id: '/asset-audit/submit', icon: navIcon('leave'), label: 'Submit Report to Manager', to: '/asset-audit/submit' },
]

const AUDIT_MGR: SidebarItem[] = [
  { id: '/asset-audit/review', icon: navIcon('reports'), label: 'Approver Report', to: '/asset-audit/review' },
]

export interface SystemLayoutProps {
  title: string
  children: React.ReactNode
  trail?: Crumb[]
}

export default function SystemLayout({ title, children, trail }: SystemLayoutProps) {
  const { logout, can } = useAuth()
  const navigate = useNavigate()

  const navItems: SidebarItem[] = [
    ...(can(PERMISSIONS.PROCUREMENT_ACCESS) ? [{
      id: 'procurement-group',
      label: 'ระบบจัดซื้อ',
      icon: navIcon('procurement'),
      children: can(PERMISSIONS.PROCUREMENT_APPROVE)
        ? [...PROCUREMENT_BASE, ...PROCUREMENT_MGR]
        : PROCUREMENT_BASE,
    }] : []),
    ...(can(PERMISSIONS.AUDIT_ACCESS) ? [{
      id: 'audit-group',
      label: 'ระบบตรวจนับสินทรัพย์',
      icon: navIcon('audit'),
      children: can(PERMISSIONS.AUDIT_APPROVE)
        ? [...AUDIT_ITEMS, ...AUDIT_MGR]
        : AUDIT_ITEMS,
    }] : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'white' }}>
      <Box component="header" sx={{ display: 'flex', height: HEADER_HEIGHT, flexShrink: 0 }}>
        <Box
          component={Link}
          to="/home"
          sx={{ display: 'flex', width: sidebarStyle.width, flexShrink: 0, alignItems: 'center', px: '16px', textDecoration: 'none', borderRight: `1px solid ${sidebarStyle.border}` }}
        >
          <BrandLogo sealHeight={44} wordmarkHeight={28} />
        </Box>
        <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', px: '35px', minWidth: 0, borderBottom: `1px solid ${sidebarStyle.border}` }}>
          <Box sx={{ flex: 1 }} />
          <UserMenu compact />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          items={navItems}
          bottomItems={[
            { id: 'back', icon: navIcon('home'), label: 'กลับหน้าแรก', to: '/' },
            { id: 'logout', icon: navIcon('logout'), label: 'ออกจากระบบ', onClick: handleLogout },
          ]}
        />
        <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: pageBg, px: '32px', py: '28px' }}>
          <PageHeader title={title} trail={trail} />
          {children}
        </Box>
      </Box>
    </Box>
  )
}
