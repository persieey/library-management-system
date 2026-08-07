import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../../components/ManagerLayout'
import { fonts } from '../../../theme'

const COLS = [
  { label: 'DAY', w: 200 },
  { label: 'SHIFT', w: 200 },
  { label: 'LEAD', w: 300 },
  { label: 'ASSISTANT', w: 300 },
]

const ROWS = [
  { day: 'Monday',    shift: 'Morning (08:00–13:00)',   lead: 'Kanya Pattanakul', assistant: 'Somchai Wong' },
  { day: 'Monday',    shift: 'Afternoon (13:00–18:00)', lead: 'Araya Suksawat',   assistant: 'Thanawat Chai' },
  { day: 'Tuesday',   shift: 'Morning (08:00–13:00)',   lead: 'Somchai Wong',     assistant: 'Kanya Pattanakul' },
  { day: 'Tuesday',   shift: 'Afternoon (13:00–18:00)', lead: 'Thanawat Chai',    assistant: 'Araya Suksawat' },
  { day: 'Wednesday', shift: 'Morning (08:00–13:00)',   lead: 'Araya Suksawat',   assistant: 'Somchai Wong' },
  { day: 'Wednesday', shift: 'Evening (18:00–21:00)',   lead: 'Kanya Pattanakul', assistant: '— (unassigned)' },
]

const label = { fontFamily: fonts.inter, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted, textTransform: 'uppercase' as const }
const body  = { fontFamily: fonts.inter, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }

export default function ManagerSchedules() {
  return (
    <ManagerLayout title="Staff Schedule">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink }}>
              This Week
            </Typography>
            <Typography sx={{ fontFamily: fonts.inter, fontWeight: 400, fontSize: 13, color: mgr.inkMuted }}>
              Aug 4 – Aug 10, 2026
            </Typography>
          </Box>
          <Button
            variant="contained"
            disableElevation
            sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 14, bgcolor: mgr.accentGreen, borderRadius: '8px', px: '18px', py: '10px', '&:hover': { bgcolor: '#1e4028' }, textTransform: 'none' }}
          >
            + Request Leave
          </Button>
        </Box>

        <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', bgcolor: '#f6f8f6', px: '20px', py: '14px' }}>
            {COLS.map((c) => (
              <Typography key={c.label} sx={{ ...label, width: c.w, flexShrink: 0 }}>{c.label}</Typography>
            ))}
          </Box>
          {/* Rows */}
          {ROWS.map((r, i) => (
            <Box key={i} sx={{ display: 'flex', px: '20px', py: '14px', borderTop: `1px solid ${mgr.border}` }}>
              <Typography sx={{ ...body, width: 200, flexShrink: 0 }}>{r.day}</Typography>
              <Typography sx={{ ...body, width: 200, flexShrink: 0 }}>{r.shift}</Typography>
              <Typography sx={{ ...body, width: 300, flexShrink: 0 }}>{r.lead}</Typography>
              <Typography sx={{ ...body, width: 300, flexShrink: 0 }}>{r.assistant}</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    </ManagerLayout>
  )
}
