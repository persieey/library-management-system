import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import wordmark from '../assets/logo-wordmark.png'
import { useAuth } from '../auth/useAuth'
import { actionsFor, type NavAction } from '../config/roles'
import LoginModal from './LoginModal'
import NotificationBell from './NotificationBell'
import { colors, fonts } from '../theme'

const RESOURCE_LINKS = [
  { label: 'Books', to: '/books' },
  { label: 'eBooks', to: '/ebooks' },
  { label: 'Online Databases', to: '/online-databases' },
  { label: 'BU Research', to: '/bu-research' },
  { label: 'Theses', to: '/theses' },
  { label: 'Online Resource', to: '/online-resource' },
]

function ResourcesMenu({ compact }: { compact: boolean }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon sx={{ color: 'white !important', transition: 'transform 300ms', transform: open ? 'rotate(180deg)' : 'none' }} />}
        sx={{
          fontFamily: fonts.kanit,
          fontSize: compact ? 18 : 22,
          color: 'white',
          transition: 'font-size 300ms',
        }}
      >
        Resources
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { bgcolor: `${colors.brandGreen}cc`, minWidth: 209 } } }}
      >
        {RESOURCE_LINKS.map((item) => (
          <MenuItem
            key={item.to}
            component={Link}
            to={item.to}
            onClick={() => setAnchorEl(null)}
            sx={{ fontFamily: fonts.kanit, fontSize: 16, color: 'white' }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// ปุ่มสิทธิ์พิเศษบน header — ถ้ามี children (เช่น "Employees") จะเป็น dropdown
// ตาม Figma: hearder_when employee use (1:699) ปุ่ม Employees มี chevron ของตัวเอง
function HeaderAction({ action, fontSize }: { action: NavAction; fontSize: number }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  const children = action.children ?? []

  if (children.length === 0) {
    return (
      <Button
        component={Link}
        to={action.to ?? '/'}
        sx={{
          mr: '72px',
          height: 35,
          bgcolor: colors.surfaceMuted,
          color: colors.brandGreen,
          fontFamily: fonts.kanit,
          fontSize,
          borderRadius: '10px',
          '&:hover': { bgcolor: colors.surfaceMuted },
        }}
      >
        {action.label}
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{ color: `${colors.brandGreen} !important`, transition: 'transform 300ms', transform: open ? 'rotate(180deg)' : 'none' }}
          />
        }
        sx={{
          mr: '72px',
          height: 35,
          bgcolor: colors.surfaceMuted,
          color: colors.brandGreen,
          fontFamily: fonts.kanit,
          fontSize,
          borderRadius: '10px',
          '&:hover': { bgcolor: colors.surfaceMuted },
        }}
      >
        {action.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { bgcolor: `${colors.brandGreen}cc`, minWidth: 209 } } }}
      >
        {children.map((child) => (
          <MenuItem
            key={child.to}
            component={Link}
            to={child.to ?? '/'}
            onClick={() => setAnchorEl(null)}
            sx={{ fontFamily: fonts.kanit, fontSize: 16, color: 'white' }}
          >
            {child.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

function Header() {
  const { user, isLoading, logout, can } = useAuth()
  const [compact, setCompact] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const actions = user ? actionsFor(can) : []
  const navFontSize = compact ? 18 : 22

  return (
    <>
      {/* กันที่ให้ header ที่ลอยอยู่ ความสูงคงที่ เนื้อหาข้างล่างจะได้ไม่กระตุกตอนหด */}
      <Box sx={{ height: 110 }} aria-hidden />
      <Box
        component="header"
        sx={{
          position: 'fixed',
          insetInline: 0,
          top: 0,
          zIndex: (t) => t.zIndex.appBar,
          bgcolor: colors.brandGreen,
          height: compact ? 72 : 110,
          transition: 'height 300ms ease-out, box-shadow 300ms ease-out',
          boxShadow: compact ? '0 4px 20px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        <Box
          sx={{
            mx: 'auto',
            maxWidth: 1440,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: '83px',
          }}
        >
          <Link to="/">
            <Box
              component="img"
              src={wordmark}
              alt="Udompanya University"
              sx={{
                height: compact ? 42 : 65,
                width: compact ? 139 : 215,
                objectFit: 'contain',
                transition: 'height 300ms, width 300ms',
              }}
            />
          </Link>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {actions.map((action) => (
              <HeaderAction key={action.label} action={action} fontSize={navFontSize} />
            ))}

            <Button component={Link} to="/" sx={{ fontFamily: fonts.kanit, fontSize: navFontSize, color: 'white' }}>
              Home
            </Button>

            <Box sx={{ ml: '75px' }}>
              <ResourcesMenu compact={compact} />
            </Box>

            <Box sx={{ ml: '20px' }}>
              <NotificationBell />
            </Box>

            <Box sx={{ ml: '27px', minWidth: 80 }}>
              {!isLoading &&
                (user ? (
                  <Button onClick={logout} sx={{ fontFamily: fonts.kanit, fontSize: navFontSize, color: 'white' }}>
                    Log out
                  </Button>
                ) : (
                  <Button
                    onClick={() => setLoginOpen(true)}
                    sx={{ fontFamily: fonts.kanit, fontSize: navFontSize, color: 'white' }}
                  >
                    Sign in
                  </Button>
                ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

export default Header
