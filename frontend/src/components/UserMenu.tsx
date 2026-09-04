import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import { useAuth } from '../auth/useAuth'
import { POSITION_LABELS } from '../config/roles'
import { colors, fonts, sidebar as s } from '../theme'

/**
 * ชื่อผู้ใช้มุมขวาบนของหน้าหลังบ้าน กดแล้วกางเมนูบัญชี
 *
 * ใช้ร่วมกันทั้ง BackOfficeLayout และ ManagerLayout จะได้ไม่ต้องเขียนซ้ำสองที่
 * และไม่ว่าใครล็อกอินเข้ามา ชื่อกับสิทธิ์จะขึ้นตามจริงเสมอ
 *
 *   <UserMenu />                 ขนาดปกติ
 *   <UserMenu compact />         ย่อลง ใช้กับแถบที่เตี้ยกว่า
 */

const MENU_LINKS = [
  { label: 'แก้ไขโปรไฟล์', to: '/employees/profile', icon: <PersonOutlineRounded /> },
  { label: 'ตั้งค่าบัญชี', to: '/employees/settings', icon: <SettingsOutlined /> },
]

export default function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  if (!user) return null

  const size = compact ? 36 : 44
  const initials = user.name.slice(0, 2).toUpperCase()
  const roleLabel = POSITION_LABELS[user.position]

  const handleLogout = () => {
    setAnchorEl(null)
    logout()
    navigate('/')
  }

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: 'none',
          bgcolor: 'transparent',
          borderRadius: '999px',
          p: '4px 10px 4px 4px',
          cursor: 'pointer',
          transition: 'background-color 180ms',
          '&:hover': { bgcolor: s.itemHoverBg },
        }}
      >
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            bgcolor: colors.brandGreen,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontFamily: fonts.kanit,
            fontSize: compact ? 14 : 17,
          }}
        >
          {initials}
        </Box>

        <Box sx={{ textAlign: 'left', minWidth: 0 }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: compact ? 13 : 15, lineHeight: 1.4, color: s.itemHoverInk }}>
            {user.name}
          </Typography>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: compact ? 12 : 13, lineHeight: 1.4, color: s.item }}>
            {roleLabel}
          </Typography>
        </Box>

        <KeyboardArrowDownRounded
          sx={{
            fontSize: 20,
            color: s.item,
            flexShrink: 0,
            transition: 'transform 200ms',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: '12px',
              border: `1px solid ${s.border}`,
              boxShadow: '0 12px 32px rgba(18, 55, 47, 0.14)',
            },
          },
        }}
      >
        {/* หัวเมนูบอกว่ากำลังใช้บัญชีไหนอยู่ ไม่ใช่ตัวเลือก จึงกดไม่ได้ */}
        <Box sx={{ px: '16px', py: '10px' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 15, color: s.itemHoverInk }}>
            {user.name}
          </Typography>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: s.item }}>
            สิทธิ์ระดับ{roleLabel}
          </Typography>
        </Box>

        <Divider sx={{ my: '4px' }} />

        {MENU_LINKS.map((link) => (
          <MenuItem
            key={link.to}
            component={Link}
            to={link.to}
            onClick={() => setAnchorEl(null)}
            sx={{
              gap: '12px',
              px: '16px',
              py: '10px',
              fontFamily: fonts.thai,
              fontSize: 14,
              color: s.item,
              '& svg': { fontSize: 20 },
              '&:hover': { bgcolor: s.itemHoverBg, color: s.itemHoverInk },
            }}
          >
            {link.icon}
            {link.label}
          </MenuItem>
        ))}

        <Divider sx={{ my: '4px' }} />

        <MenuItem
          onClick={handleLogout}
          sx={{
            gap: '12px',
            px: '16px',
            py: '10px',
            fontFamily: fonts.thai,
            fontSize: 14,
            color: s.item,
            '& svg': { fontSize: 20 },
            '&:hover': { bgcolor: s.itemHoverBg, color: s.itemHoverInk },
          }}
        >
          <LogoutOutlined />
          ออกจากระบบ
        </MenuItem>
      </Menu>
    </>
  )
}
