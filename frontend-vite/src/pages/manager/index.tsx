import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../components/ManagerLayout'
import { fonts } from '../../theme'

const STATS = [
  { label: 'STAFF ON SHIFT TODAY', value: 6, color: mgr.ink },
  { label: 'PENDING LEAVE REQUESTS', value: 3, color: mgr.warning },
  { label: 'UPCOMING ACTIVITIES', value: 4, color: mgr.ink },
  { label: 'OPEN COMPLAINTS', value: 2, color: mgr.danger },
]

const MODULES = [
  { icon: '🗓️', label: 'Staff Schedule', desc: 'Manage daily shifts and shift leads', to: '/manager/schedules' },
  { icon: '📝', label: 'Leave Requests', desc: 'Review and approve staff leave', to: '/manager/leave' },
  { icon: '📣', label: 'Activities & PR', desc: 'Publish activities and announcements', to: '/manager/activities' },
  { icon: '💬', label: 'Complaints', desc: 'Track and resolve user feedback', to: '/manager/complaints' },
]

const RECENT = [
  { text: 'Leave request from Kanya P. was approved', time: '10 min ago' },
  { text: 'New activity "Database Research Workshop" was published', time: '1 hour ago' },
  { text: 'Complaint #204 marked as resolved', time: '3 hours ago' },
  { text: 'Shift schedule for next week was updated', time: 'Yesterday' },
]

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{ flex: 1, p: '22px', borderRadius: '12px', borderColor: mgr.border, display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      <Typography sx={{ fontFamily: fonts.inter, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fonts.inter, fontWeight: 700, fontSize: 30, lineHeight: 1.1, color }}>
        {value}
      </Typography>
    </Paper>
  )
}

function ModuleCard({ icon, label, desc, to }: { icon: string; label: string; desc: string; to: string }) {
  return (
    <Paper
      component={Link}
      to={to}
      variant="outlined"
      sx={{
        flex: 1,
        p: '24px',
        borderRadius: '12px',
        borderColor: mgr.border,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        textDecoration: 'none',
        transition: 'box-shadow 200ms',
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
      }}
    >
      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: mgr.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        {icon}
      </Box>
      <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 15, lineHeight: 1.35, color: mgr.ink }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fonts.inter, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted, flex: 1 }}>
        {desc}
      </Typography>
      <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 14, lineHeight: 1, color: mgr.accentGreen }}>
        Open →
      </Typography>
    </Paper>
  )
}

export default function ManagerDashboard() {
  return (
    <ManagerLayout title="Dashboard">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <Typography sx={{ fontFamily: fonts.inter, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.inkMuted }}>
          Welcome back. Here's what's happening in the library today.
        </Typography>

        <Box sx={{ display: 'flex', gap: '20px' }}>
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </Box>

        <Box>
          <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink, mb: '20px' }}>
            Manage
          </Typography>
          <Box sx={{ display: 'flex', gap: '20px' }}>
            {MODULES.map((m) => <ModuleCard key={m.to} {...m} />)}
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink, mb: '16px' }}>
            Recent Activity
          </Typography>
          <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
            {RECENT.map((item, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: '20px',
                  py: '16px',
                  borderTop: i > 0 ? `1px solid ${mgr.border}` : 'none',
                }}
              >
                <Typography sx={{ fontFamily: fonts.inter, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }}>
                  {item.text}
                </Typography>
                <Typography sx={{ fontFamily: fonts.inter, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted, ml: 2, flexShrink: 0 }}>
                  {item.time}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </ManagerLayout>
  )
}
