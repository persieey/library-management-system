import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import EventAnnouncementCard from '../../components/EventAnnouncementCard'
import { useEvents } from '../../context/EventContext'
import { colors, fonts } from '../../theme'

// รายการกิจกรรมทั้งหมด — ปลายทางของปุ่ม "View All" / "View Details" จากหน้าแรก
function EventsPage() {
  const { items: events } = useEvents()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      <Header />
      <Box component="section" sx={{ width: '100%', bgcolor: 'white' }}>
        <Box sx={{ mx: 'auto', maxWidth: 1440, display: 'flex', flexDirection: 'column', gap: '40px', px: '64px', py: '88px' }}>
          <Reveal>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography
                sx={{ fontFamily: fonts.kanit, fontSize: 36, fontWeight: 700, lineHeight: 1.25, color: colors.ink }}
              >
                Event Announcements
              </Typography>
              <Typography sx={{ fontFamily: fonts.inter, fontSize: 16, lineHeight: 1.6, color: colors.inkMuted }}>
                Upcoming events and training workshops from the library
              </Typography>
            </Box>
          </Reveal>

          {events.length === 0 ? (
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 16, color: colors.inkMuted }}>
              ยังไม่มีกิจกรรมในขณะนี้
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {events.map((event, i) => (
                <Reveal key={event.id} delay={i * 90}>
                  <EventAnnouncementCard event={event} showDescription />
                </Reveal>
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

export default EventsPage
