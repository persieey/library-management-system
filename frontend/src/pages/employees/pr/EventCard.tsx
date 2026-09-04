import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import type { EventItem } from '../../../interface/IEventInterface'
import { formatEventDate } from './eventDateFormat'
import editIcon from '../../../assets/icons/pr-edit.svg'
import { colors, fonts } from '../../../theme'

interface EventCardProps {
  item: EventItem
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

function EventCard({ item, onEdit, onDelete }: EventCardProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '16px',
        width: '100%',
        borderRadius: '20px',
        bgcolor: 'white',
        border: `1px solid ${colors.border}`,
        p: '16px',
      }}
    >
      {item.image ? (
        <Box
          component="img"
          src={item.image}
          alt=""
          sx={{ height: 100, width: 140, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <Box
          sx={{
            height: 100,
            width: 140,
            borderRadius: '10px',
            bgcolor: colors.accentGreenLight,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: 28 }}>🖼️</Typography>
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        <Box sx={{ width: 'fit-content', borderRadius: '20px', bgcolor: colors.accentGreenLight, px: '12px', py: '4px' }}>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, fontWeight: 500, color: colors.accentGreen }}>
            {formatEventDate(item.date, item.allDay)}
          </Typography>
        </Box>
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 18, color: colors.ink }}>{item.title}</Typography>
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted }}>
          📍 {item.location}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
        <IconButton size="small" aria-label="แก้ไข" onClick={() => onEdit(item.id)}>
          <Box component="img" src={editIcon} alt="" sx={{ height: 20, width: 20 }} />
        </IconButton>
        <IconButton size="small" aria-label="ลบ" onClick={() => onDelete(item.id)}>
          🗑️
        </IconButton>
      </Box>
    </Box>
  )
}

export default EventCard
