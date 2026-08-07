import dayjs from 'dayjs'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { formatThaiDateTime } from './dateFormat'
import type { PRItem, PRStatus } from '../../../interface/IPRInterface'
import pinIcon from '../../../assets/icons/pr-pin.svg'
import pauseIcon from '../../../assets/icons/pr-pause.svg'
import eyeToggleIcon from '../../../assets/icons/pr-eye-outline.svg'
import eyeCountIcon from '../../../assets/icons/pr-eye-count.svg'
import editIcon from '../../../assets/icons/pr-edit.svg'
import copyIcon from '../../../assets/icons/pr-copy.svg'
import printIcon from '../../../assets/icons/pr-print.svg'
import calendarIcon from '../../../assets/icons/pr-calendar.svg'
import { colors, fonts } from '../../../theme'

export type { PRItem, PRStatus }

const STATUS_COLORS: Record<PRStatus, { bg: string; border: string; text: string }> = {
  เผยแพร่: { bg: '#def2e8', border: '#a5dbbf', text: colors.accentGreen },
  ร่าง: { bg: '#f0f0f0', border: '#cfcfcf', text: '#676767' },
  ตั้งเวลา: { bg: '#fdf3d6', border: '#f0dd97', text: '#9a7c1c' },
  หมดอายุ: { bg: '#fbe1e1', border: '#f0b4b4', text: '#b83a3a' },
}

interface PRCardProps {
  item: PRItem
  onTogglePause: (id: number) => void
  onEdit: (id: number) => void
  onCopy: (id: number) => void
  onPreview: (id: number) => void
  onPrint: (id: number) => void
  onDelete: (id: number) => void
}

// Figma: Frame 30 (1:52) — การ์ดหนึ่งใบในรายการข่าวประชาสัมพันธ์
function PRCard({ item, onTogglePause, onEdit, onCopy, onPreview, onPrint, onDelete }: PRCardProps) {
  const statusColor = STATUS_COLORS[item.status]
  const isPublished = item.status === 'เผยแพร่'

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        borderRadius: '20px',
        bgcolor: 'white',
        border: `1px solid ${colors.border}`,
        px: '24px',
        py: '20px',
      }}
    >
      <Box sx={{ display: 'flex', gap: '12px', mb: '12px' }}>
        {item.pinned && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: 35,
              px: '14px',
              borderRadius: '30px',
              bgcolor: '#fde5da',
              border: '1px solid #f9bc9e',
            }}
          >
            <Box component="img" src={pinIcon} alt="" sx={{ height: 16, width: 16 }} />
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 16, color: 'black' }}>ปักหมุด</Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 35,
            px: '14px',
            borderRadius: '30px',
            bgcolor: statusColor.bg,
            border: `1px solid ${statusColor.border}`,
          }}
        >
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 16, color: statusColor.text }}>
            {item.status}
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ fontFamily: fonts.thai, fontSize: 24, color: 'black', mb: '16px' }}>
        {item.title}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px', flexWrap: 'wrap' }}>
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: '#5b93cc' }}>ช่องทาง</Typography>
        <Box sx={{ borderRadius: '999px', bgcolor: '#edf3f7', px: '10px', py: '3px' }}>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 12, color: '#5b93cc' }}>
            {item.channel}
          </Typography>
        </Box>

        {item.status === 'ตั้งเวลา' && item.scheduledAt ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', ml: '12px' }}>
            <Box component="img" src={calendarIcon} alt="" sx={{ height: 14, width: 14 }} />
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: '#9a7c1c' }}>
              จะเผยแพร่: {formatThaiDateTime(dayjs(item.scheduledAt))}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', ml: '12px' }}>
            <Box component="img" src={calendarIcon} alt="" sx={{ height: 14, width: 14 }} />
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: '#a8b8c4' }}>
              เผยแพร่: {item.publishedAt}
            </Typography>
          </Box>
        )}
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: '#a8b8c4' }}>
          ปลด: {item.expiresAt}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', ml: 'auto' }}>
          <Box component="img" src={eyeCountIcon} alt="" sx={{ height: 14, width: 14 }} />
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: '#a8b8c4' }}>
            {item.views.toLocaleString('th-TH')} ครั้ง
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Box
          component="button"
          onClick={() => onTogglePause(item.id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: 38,
            px: '14px',
            borderRadius: '15px',
            bgcolor: '#f7fbfd',
            border: '1px solid #dfe6eb',
            cursor: 'pointer',
            fontFamily: fonts.thai,
          }}
        >
          <Box component="img" src={pauseIcon} alt="" sx={{ height: 22, width: 22 }} />
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: 'black' }}>
            {isPublished ? 'พักการเผยแพร่' : 'เผยแพร่ทันที'}
          </Typography>
        </Box>

        <IconButton size="small" aria-label="ดูตัวอย่าง" onClick={() => onPreview(item.id)}>
          <Box component="img" src={eyeToggleIcon} alt="" sx={{ height: 22, width: 22 }} />
        </IconButton>
        <IconButton size="small" aria-label="แก้ไข" onClick={() => onEdit(item.id)}>
          <Box component="img" src={editIcon} alt="" sx={{ height: 20, width: 20 }} />
        </IconButton>
        <IconButton size="small" aria-label="คัดลอก" onClick={() => onCopy(item.id)}>
          <Box component="img" src={copyIcon} alt="" sx={{ height: 20, width: 20 }} />
        </IconButton>
        <IconButton size="small" aria-label="พิมพ์" onClick={() => onPrint(item.id)}>
          <Box component="img" src={printIcon} alt="" sx={{ height: 20, width: 20 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label="ลบ"
          onClick={() => onDelete(item.id)}
          sx={{ ml: 'auto', fontSize: 18 }}
        >
          🗑️
        </IconButton>
      </Box>
    </Box>
  )
}

export default PRCard
