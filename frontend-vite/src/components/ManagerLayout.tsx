import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import seal from '../assets/logo.png'
import wordmark from '../assets/logo-wordmark.png'
import { useAuth } from '../auth/useAuth'
import { fonts } from '../theme'

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

const SIDEBAR_NAV = [
  { icon: '🏠', label: 'Dashboard', to: '/manager' },
  { icon: '🗓️', label: 'Schedules', to: '/manager/schedules' },
  { icon: '📝', label: 'Leave', to: '/manager/leave' },
  { icon: '👥', label: 'Personnel', to: '/manager/personnel' },
  { icon: '📚', label: 'Books', to: '/manager/books' },
  { icon: '📣', label: 'Activities', to: '/manager/activities' },
  { icon: '💬', label: 'Complaints', to: '/manager/complaints' },
  { icon: '📊', label: 'Reports', to: '/manager/reports' },
]

function NavItem({ icon, label, to, active }: { icon: string; label: string; to: string; active: boolean }) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: 32,
        px: '12px',
        borderRadius: '8px',
        bgcolor: active ? 'white' : 'transparent',
        textDecoration: 'none',
        transition: 'background-color 150ms',
        '&:hover': { bgcolor: active ? 'white' : 'rgba(255,255,255,0.1)' },
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
      <Typography
        sx={{
          fontFamily: fonts.inter,
          fontWeight: 500,
          fontSize: 14,
          lineHeight: 1,
          color: active ? mgr.accentGreen : mgr.sidebarMuted,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

interface Props {
  title: string
  children: React.ReactNode
}

export default function ManagerLayout({ title, children }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const initials = useMemo(() => {
    const name = user?.username ?? 'HL'
    return name
      .split(/\s+/)
      .map((p: string) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'HL'
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* BackOffice-style header */}
      <Box
        component="header"
        sx={{ display: 'flex', height: 100, borderBottom: '1px solid #e5e5e5', flexShrink: 0 }}
      >
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex', width: 250, flexShrink: 0,
            alignItems: 'center', gap: '10px',
            bgcolor: '#12372f', px: '10px', textDecoration: 'none',
          }}
        >
          <Box component="img" src={seal} alt="" sx={{ height: 80, width: 80, objectFit: 'contain', flexShrink: 0 }} />
          <Box component="img" src={wordmark} alt="Udompanya University" sx={{ height: 40, width: 132, objectFit: 'contain', flexShrink: 0 }} />
        </Box>
        <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end', px: '35px' }}>
          <Box
            component="button"
            onClick={handleLogout}
            sx={{
              height: 40, width: 120, borderRadius: '5px',
              bgcolor: '#12372f', border: 'none', cursor: 'pointer',
              fontFamily: fonts.kanit, fontSize: 22, color: 'white',
              '&:hover': { bgcolor: '#0d2720' },
            }}
          >
            Log out
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Box
          component="nav"
          sx={{
            width: 250,
            flexShrink: 0,
            bgcolor: mgr.sidebar,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            pt: '20px',
            px: '8px',
            pb: '20px',
          }}
        >
          {SIDEBAR_NAV.map((item) => {
            const active =
              item.to === '/manager'
                ? pathname === '/manager'
                : pathname.startsWith(item.to)
            return <NavItem key={item.to} {...item} active={active} />
          })}

          <Box sx={{ flex: 1 }} />

          <Box
            onClick={handleLogout}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              height: 32,
              px: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 150ms',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>🚪</span>
            <Typography sx={{ fontFamily: fonts.inter, fontWeight: 500, fontSize: 14, color: mgr.sidebarMuted }}>
              Logout
            </Typography>
          </Box>
        </Box>

        {/* Content area */}
        <Box sx={{ flex: 1, bgcolor: mgr.bg, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Page topbar */}
          <Box
            sx={{
              bgcolor: 'white',
              borderBottom: `1px solid ${mgr.border}`,
              px: '32px',
              py: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              sx={{ fontFamily: fonts.inter, fontWeight: 700, fontSize: 26, lineHeight: 1.25, color: mgr.ink }}
            >
              {title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: mgr.accentLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 13, color: mgr.accentGreen }}>
                  {initials}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 13, lineHeight: 1.4, color: mgr.ink }}>
                  Head Librarian
                </Typography>
                <Typography sx={{ fontFamily: fonts.inter, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted }}>
                  Central Library
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: '32px', flex: 1 }}>{children}</Box>
        </Box>
      </Box>

    </Box>
  )
}
