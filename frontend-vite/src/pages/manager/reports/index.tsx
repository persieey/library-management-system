import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../../components/ManagerLayout'
import { fonts } from '../../../theme'

const STATS = [
  { label: 'BOOKS BORROWED (THIS MONTH)', value: '1,248' },
  { label: 'OVERDUE ITEMS',               value: '37' },
  { label: 'FINES COLLECTED',             value: '฿4,260' },
  { label: 'ACTIVITIES HELD (YTD)',        value: '18' },
]

// bar height as a fraction of max (Students = 1.0)
const BARS = [
  { label: 'Students', fraction: 1.0 },
  { label: 'Faculty',  fraction: 0.583 },
  { label: 'Staff',    fraction: 0.333 },
  { label: 'Grad',     fraction: 0.75 },
]

const MAX_BAR_H = 120

export default function ManagerReports() {
  return (
    <ManagerLayout title="Reports">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            disableElevation
            sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 14, borderColor: mgr.border, color: mgr.inkMuted, borderRadius: '8px', px: '18px', py: '10px', '&:hover': { borderColor: mgr.border, bgcolor: '#fafafa' }, textTransform: 'none' }}
          >
            Export CSV
          </Button>
        </Box>

        {/* Stat cards */}
        <Box sx={{ display: 'flex', gap: '20px' }}>
          {STATS.map((s) => (
            <Paper key={s.label} variant="outlined" sx={{ flex: 1, p: '22px', borderRadius: '12px', borderColor: mgr.border, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Typography sx={{ fontFamily: fonts.inter, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted, textTransform: 'uppercase' }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontFamily: fonts.inter, fontWeight: 700, fontSize: 30, lineHeight: 1.1, color: mgr.ink }}>
                {s.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Bar chart */}
        <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, p: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 15, lineHeight: 1.35, color: mgr.ink }}>
            Usage by Member Type
          </Typography>
          <Box sx={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
            {BARS.map((b) => {
              const filled = Math.round(b.fraction * MAX_BAR_H)
              const empty  = MAX_BAR_H - filled
              return (
                <Box key={b.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: 90 }}>
                  <Box sx={{ width: 48, height: MAX_BAR_H, borderRadius: '6px', bgcolor: mgr.accentLight, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {empty > 0 && <Box sx={{ height: empty, bgcolor: mgr.accentLight }} />}
                    <Box sx={{ flex: 1, bgcolor: mgr.accentGreen, borderRadius: '6px' }} />
                  </Box>
                  <Typography sx={{ fontFamily: fonts.inter, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted, whiteSpace: 'nowrap' }}>
                    {b.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Paper>
      </Box>
    </ManagerLayout>
  )
}
