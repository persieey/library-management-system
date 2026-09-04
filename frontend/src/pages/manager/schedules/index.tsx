import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../../components/ManagerLayout'
import { fonts } from '../../../theme'

const COLS = [
  { label: 'วัน', w: 200 },
  { label: 'กะ', w: 200 },
  { label: 'หัวหน้าเวร', w: 300 },
  { label: 'ผู้ช่วย', w: 300 },
]

const ROWS = [
  { day: 'วันจันทร์',   shift: 'เช้า (08:00–13:00)',  lead: 'Kanya Pattanakul', assistant: 'Somchai Wong' },
  { day: 'วันจันทร์',   shift: 'บ่าย (13:00–18:00)',  lead: 'Araya Suksawat',   assistant: 'Thanawat Chai' },
  { day: 'วันอังคาร',   shift: 'เช้า (08:00–13:00)',  lead: 'Somchai Wong',     assistant: 'Kanya Pattanakul' },
  { day: 'วันอังคาร',   shift: 'บ่าย (13:00–18:00)',  lead: 'Thanawat Chai',    assistant: 'Araya Suksawat' },
  { day: 'วันพุธ',      shift: 'เช้า (08:00–13:00)',  lead: 'Araya Suksawat',   assistant: 'Somchai Wong' },
  { day: 'วันพุธ',      shift: 'เย็น (18:00–21:00)',  lead: 'Kanya Pattanakul', assistant: '— (ยังไม่มอบหมาย)' },
]

const label = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted }
const body  = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }

export default function ManagerSchedules() {
  return (
    <ManagerLayout title="ตารางเวรเจ้าหน้าที่">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink }}>
              สัปดาห์นี้
            </Typography>
            <Typography sx={{ fontFamily: fonts.thai, fontWeight: 400, fontSize: 13, color: mgr.inkMuted }}>
              4 – 10 ส.ค. 2569
            </Typography>
          </Box>
          <Button
            variant="contained"
            disableElevation
            sx={{ fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, bgcolor: mgr.accentGreen, borderRadius: '8px', px: '18px', py: '10px', '&:hover': { bgcolor: '#1e4028' }, textTransform: 'none' }}
          >
            + ขอลา
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
