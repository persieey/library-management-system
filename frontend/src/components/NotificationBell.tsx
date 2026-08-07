import { useMemo, useState } from 'react'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { usePR } from '../context/PRContext'
import PRPreviewDialog from '../pages/employees/pr/PRPreviewDialog'
import { fonts, colors } from '../theme'

// กระดิ่งแจ้งเตือนข่าวประชาสัมพันธ์ — แสดงให้ทุกคนเห็น ไม่ต้องล็อกอิน
// เพราะประกาศของหอสมุดมีไว้สำหรับนักศึกษาและอาจารย์ทั่วไป
function NotificationBell() {
  const { items, unseenCount, markSeen, incrementView } = usePR()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const open = Boolean(anchorEl)

  const published = useMemo(
    () =>
      items
        .filter((item) => item.status === 'เผยแพร่' && item.publishedTimestamp !== null)
        .sort((a, b) => (b.publishedTimestamp ?? 0) - (a.publishedTimestamp ?? 0)),
    [items],
  )

  const previewItem = useMemo(() => items.find((i) => i.id === previewId) ?? null, [items, previewId])

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
    markSeen()
  }

  const handleSelect = (id: number) => {
    setAnchorEl(null)
    setPreviewId(id)
    incrementView(id)
  }

  return (
    <>
      <IconButton onClick={handleOpen} aria-label="การแจ้งเตือนข่าวประชาสัมพันธ์" sx={{ color: 'white' }}>
        <Badge badgeContent={unseenCount} color="error">
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 600, color: colors.brandGreen }}>
            ข่าวประชาสัมพันธ์ล่าสุด
          </Typography>
        </Box>
        <Divider />

        {published.length === 0 ? (
          <MenuItem disabled sx={{ fontFamily: fonts.thai }}>
            ยังไม่มีข่าวประกาศ
          </MenuItem>
        ) : (
          published.map((item) => (
            <MenuItem key={item.id} onClick={() => handleSelect(item.id)} sx={{ whiteSpace: 'normal', py: 1.2 }}>
              <Box>
                <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, fontWeight: 600, color: colors.ink }}>
                  {item.title}
                </Typography>
                <Typography sx={{ fontFamily: fonts.thai, fontSize: 12, color: colors.inkMuted }}>
                  {item.publishedAt}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      <PRPreviewDialog item={previewItem} onClose={() => setPreviewId(null)} />
    </>
  )
}

export default NotificationBell
