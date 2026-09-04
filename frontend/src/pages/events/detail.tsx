import { useParams, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useEvents } from '../../context/EventContext'
import { formatEventDate } from '../employees/pr/eventDateFormat'
import { colors, fonts } from '../../theme'

// ปลายทางของปุ่ม "View Details" — แสดงกิจกรรมทีละรายการแบบเต็ม
function EventDetailPage() {
  const { id } = useParams()
  const { items: events } = useEvents()
  const event = events.find((item) => item.id === Number(id))

  if (!event) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
        <Header />
        <Box sx={{ mx: 'auto', maxWidth: 1440, px: '64px', py: '88px', textAlign: 'center' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 24, color: colors.ink, mb: 2 }}>
            ไม่พบกิจกรรมนี้
          </Typography>
          <Typography
            component={Link}
            to="/events"
            sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 600, color: colors.accentGreen }}
          >
            ← กลับไปหน้ากิจกรรมทั้งหมด
          </Typography>
        </Box>
        <Footer />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      <Header />
      <Box component="section" sx={{ mx: 'auto', maxWidth: 900, px: '64px', py: '88px' }}>
        <Typography
          component={Link}
          to="/events"
          sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 600, color: colors.accentGreen, mb: '32px', display: 'inline-block' }}
        >
          ← กลับไปหน้ากิจกรรมทั้งหมด
        </Typography>

        {event.image ? (
          <Box
            component="img"
            src={event.image}
            alt=""
            sx={{ height: 360, width: '100%', borderRadius: '16px', objectFit: 'cover', mb: '32px' }}
          />
        ) : (
          <Box
            sx={{
              height: 360,
              width: '100%',
              borderRadius: '16px',
              bgcolor: colors.accentGreenLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: '32px',
            }}
          >
            <Typography sx={{ fontSize: 48 }}>🖼️</Typography>
          </Box>
        )}

        <Box sx={{ width: 'fit-content', borderRadius: '20px', bgcolor: colors.accentGreenLight, px: '14px', py: '6px', mb: '16px' }}>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, fontWeight: 500, letterSpacing: '2px', color: colors.accentGreen }}>
            {formatEventDate(event.date, event.allDay)}
          </Typography>
        </Box>

        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, fontWeight: 700, lineHeight: 1.3, color: colors.ink, mb: '16px' }}>
          {event.title}
        </Typography>

        <Typography sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 500, color: colors.inkMuted, mb: '32px' }}>
          📍 {event.location}
        </Typography>

        <Typography sx={{ fontFamily: fonts.thai, fontSize: 16, lineHeight: 1.7, color: colors.ink, whiteSpace: 'pre-wrap' }}>
          {event.description || 'ยังไม่มีรายละเอียดเพิ่มเติมสำหรับกิจกรรมนี้'}
        </Typography>
      </Box>
      <Footer />
    </Box>
  )
}

export default EventDetailPage
