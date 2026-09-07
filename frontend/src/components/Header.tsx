import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import seal from '../assets/logo.png'
import wordmark from '../assets/logo-wordmark.png'
import { useAuth } from '../auth/useAuth'
import { actionsFor, positionDisplayName, type NavAction } from '../config/roles'
import { useLoginPrompt } from '../context/LoginPrompt'
import UserMenu from './UserMenu'
import NotificationBell from './NotificationBell'
import { colors, fonts } from '../theme'

// ขนาดของแถบ header — ตัวเลขชุดนี้อ้างจาก HomeUI.css ของสาขา B6715588
// เพื่อให้หน้าแรกของทุกคนในทีมหน้าตาเหมือนกัน
const HEADER_HEIGHT = 70
const NAV_GAP = '32px'
const NAV_FONT_SIZE = 14

// ขนาดโลโก้ — ปรับสามค่านี้ได้อิสระ ตราประทับกับตัวอักษรเป็นคนละไฟล์กัน
// อย่าให้ SEAL_HEIGHT เกิน HEADER_HEIGHT ลบระยะหายใจบนล่างสักข้างละ 8px
const SEAL_HEIGHT = 65
const WORDMARK_HEIGHT = 40
const LOGO_GAP = '8px'

// สไตล์ร่วมของลิงก์ข้อความบน nav — ขาวล้วน จางลงตอนชี้
const navTextSx = {
  minWidth: 'auto',
  p: 0,
  fontFamily: fonts.kanit,
  fontSize: NAV_FONT_SIZE,
  fontWeight: 400,
  color: 'white',
  textTransform: 'none',
  '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
} as const

// สไตล์ปุ่มแคปซูลสีอ่อน ใช้กับปุ่มสิทธิ์พิเศษอย่าง Employees
const pillSx = {
  bgcolor: colors.headerPill,
  color: colors.brandGreen,
  borderRadius: '999px',
  px: '18px',
  py: '8px',
  minWidth: 'auto',
  fontFamily: fonts.kanit,
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.2,
  textTransform: 'none',
  '&:hover': { bgcolor: colors.headerPillHover },
} as const

type DropdownItem = { label: string; to?: string; onSelect?: () => void }

// เมนูแบบดรอปดาวน์ที่ใช้ซ้ำทั้ง Resources และปุ่มสิทธิ์พิเศษที่มีเมนูย่อย
function DropdownMenu({
  anchorEl,
  onClose,
  items,
}: {
  anchorEl: HTMLElement | null
  onClose: () => void
  items: DropdownItem[]
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      slotProps={{ paper: { sx: { bgcolor: `${colors.brandGreen}f2`, minWidth: 200, mt: 1 } } }}
    >
      {items.map((item) =>
        item.onSelect ? (
          // รายการที่ต้องเช็คสิทธิ์ก่อน (เช่นจองห้อง) — ไม่ใช่ลิงก์ตรงๆ
          <MenuItem
            key={item.label}
            onClick={() => {
              onClose()
              item.onSelect!()
            }}
            sx={{ fontFamily: fonts.kanit, fontSize: NAV_FONT_SIZE, color: 'white' }}
          >
            {item.label}
          </MenuItem>
        ) : (
          <MenuItem
            key={item.to ?? item.label}
            component={Link}
            to={item.to ?? '/'}
            onClick={onClose}
            sx={{ fontFamily: fonts.kanit, fontSize: NAV_FONT_SIZE, color: 'white' }}
          >
            {item.label}
          </MenuItem>
        ),
      )}
    </Menu>
  )
}

function ResourcesMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  const { requireLogin } = useLoginPrompt()

  // ปุ่ม "Room Booking" ทำงานแบบเดียวกับปุ่มจองห้องบนหน้าแรก
  // ยังไม่ล็อกอิน → เด้งหน้าต่างล็อกอินก่อน แล้วค่อยพาไป /booking
  const resourceLinks: DropdownItem[] = [
    { label: 'Books', to: '/books' },
    { label: 'eBooks', to: '/ebooks' },
    { label: 'Online Databases', to: '/online-databases' },
    { label: 'BU Research', to: '/bu-research' },
    { label: 'Theses', to: '/theses' },
    { label: 'Online Resource', to: '/online-resource' },
    { label: 'Room Booking', onSelect: () => requireLogin('/booking') },
  ]

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{
              fontSize: '18px !important',
              color: 'white',
              transition: 'transform 200ms',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        }
        sx={{ ...navTextSx, gap: '2px' }}
      >
        Resources
      </Button>
      <DropdownMenu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} items={resourceLinks} />
    </>
  )
}

// ปุ่มสิทธิ์พิเศษบน header — ถ้ามีเมนูย่อยจะกลายเป็นดรอปดาวน์
// รายการมาจาก permission จริงของผู้ใช้ ไม่ได้เช็ค role ตรงๆ
function HeaderAction({ action }: { action: NavAction }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  const children = action.children ?? []

  if (children.length === 0) {
    return (
      <Button component={Link} to={action.to ?? '/'} sx={pillSx}>
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
            sx={{
              fontSize: '18px !important',
              color: `${colors.brandGreen} !important`,
              transition: 'transform 200ms',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        }
        sx={{ ...pillSx, gap: '2px' }}
      >
        {action.label}
      </Button>
      <DropdownMenu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} items={children} />
    </>
  )
}

function Header() {
  const { user, isLoading, allows } = useAuth()
  const { openLogin } = useLoginPrompt()
  const [scrolled, setScrolled] = useState(false)

  // ไม่ย่อขนาดตอนเลื่อนแล้ว เพราะแถบเตี้ยอยู่แล้ว เหลือแค่เงาบอกว่าหน้าถูกเลื่อนลงมา
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ปุ่มหลักบน header โชว์ชื่อสิทธิ์ของผู้ใช้ เช่น "Librarian" แทนคำกลางๆ ว่า Employees
  // ผู้ใช้จะได้รู้ทันทีว่ากำลังเข้าด้วยสิทธิ์ระดับไหน
  const actions = (user ? actionsFor(allows) : []).map((action) =>
    user && action.label === 'Employees' ? { ...action, label: positionDisplayName(user.position) } : action,
  )

  return (
    <>
      {/* กันที่ให้ header ที่ลอยอยู่ เนื้อหาข้างล่างจะได้ไม่ถูกทับ */}
      <Box sx={{ height: HEADER_HEIGHT }} aria-hidden />
      <Box
        component="header"
        sx={{
          position: 'fixed',
          insetInline: 0,
          top: 0,
          zIndex: (t) => t.zIndex.appBar,
          height: HEADER_HEIGHT,
          bgcolor: colors.brandGreen,
          px: { xs: '20px', md: '40px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.25)' : 'none',
          transition: 'box-shadow 300ms ease-out',
        }}
      >
        {/* ประกอบตราประทับกับตัวอักษรเองแทนการใช้ logo-full.png
            เพราะสองไฟล์นี้ความละเอียดสูงกว่ามาก (229px และ 221px เทียบกับ 100px)
            และปรับขนาดแต่ละชิ้นแยกกันได้ ไม่ติดสัดส่วนที่ถูกรวมมาแล้วในไฟล์เดียว */}
        <Box
          component={Link}
          to="/"
          sx={{ display: 'flex', alignItems: 'center', gap: LOGO_GAP, flex: 'none' }}
        >
          <Box
            component="img"
            src={seal}
            alt=""
            sx={{ height: SEAL_HEIGHT, width: 'auto', display: 'block' }}
          />
          <Box
            component="img"
            src={wordmark}
            alt="Udompanya University"
            sx={{ height: WORDMARK_HEIGHT, width: 'auto', display: 'block' }}
          />
        </Box>

        <Box
          component="nav"
          sx={{ display: 'flex', alignItems: 'center', gap: NAV_GAP }}
        >
          {actions.map((action) => (
            <HeaderAction key={action.label} action={action} />
          ))}

          <Button component={Link} to="/" sx={navTextSx}>
            Home
          </Button>

          <ResourcesMenu />

          <NotificationBell />

          {/* กันตำแหน่งไว้ตอนยังไม่รู้ว่าล็อกอินอยู่ไหม เมนูจะได้ไม่กระตุก */}
          <Box sx={{ minWidth: 56, display: 'flex', justifyContent: 'flex-end' }}>
            {!isLoading &&
              (user ? (
                <UserMenu compact onDark />
              ) : (
                <Button onClick={openLogin} sx={navTextSx}>
                  Sign in
                </Button>
              ))}
          </Box>
        </Box>
      </Box>

    </>
  )
}

export default Header
