import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { EventItem } from '../interface/IEventInterface'
import { formatEventDate } from '../pages/employees/pr/eventDateFormat'
import { colors, fonts } from '../theme'

interface EventAnnouncementCardProps {
  event: EventItem
  showDescription?: boolean
}

// การ์ดกิจกรรมที่ใช้ร่วมกันระหว่างหน้าแรก (แสดงตัวอย่าง แบบไม่มีรายละเอียด) และหน้า /events (แสดงทั้งหมดพร้อมรายละเอียด)
function EventAnnouncementCard({ event, showDescription = false }: EventAnnouncementCardProps) {
  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        width: '100%',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        bgcolor: 'white',
        px: '24px',
        py: '28px',
        transition: 'box-shadow 300ms',
        '&:hover': { boxShadow: '0 6px 18px rgba(26,26,23,0.12)' },
      }}
    >
      {event.image ? (
        <Box
          component="img"
          src={event.image}
          alt=""
          sx={{ height: 140, width: '100%', borderRadius: '10px', objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            height: 140,
            width: '100%',
            borderRadius: '10px',
            bgcolor: colors.accentGreenLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: 32 }}>🖼️</Typography>
        </Box>
      )}
      <Box sx={{ width: 'fit-content', borderRadius: '20px', bgcolor: colors.accentGreenLight, px: '12px', py: '5px' }}>
        <Typography
          sx={{ fontFamily: fonts.thai, fontSize: 13, fontWeight: 500, letterSpacing: '2px', color: colors.accentGreen }}
        >
          {formatEventDate(event.date, event.allDay)}
        </Typography>
      </Box>
      <Typography sx={{ fontFamily: fonts.thai, fontSize: 18, fontWeight: 600, lineHeight: 1.35, color: colors.ink }}>
        {event.title}
      </Typography>
      <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: colors.inkMuted }}>
        📍 {event.location}
      </Typography>
      {showDescription && event.description && (
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, lineHeight: 1.5, color: colors.inkMuted }}>
          {event.description}
        </Typography>
      )}
      <Typography
        component={Link}
        to={`/events/${event.id}`}
        sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 600, color: colors.accentGreen, mt: 'auto' }}
      >
        View Details →
      </Typography>
    </Box>
  )
}

export default EventAnnouncementCard
