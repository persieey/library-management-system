import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined'
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined'
import PaidOutlined from '@mui/icons-material/PaidOutlined'
import CampaignOutlined from '@mui/icons-material/CampaignOutlined'
import StatCard, { StatCardGrid } from '../../../components/StatCard'
import ManagerLayout, { mgr } from '../../../components/ManagerLayout'
import { fonts } from '../../../theme'

const STATS = [
  { icon: <MenuBookOutlined />, label: 'หนังสือที่ยืม (เดือนนี้)', value: '1,248' },
  { icon: <ReportProblemOutlined />, label: 'รายการเกินกำหนด', value: '37' },
  { icon: <PaidOutlined />, label: 'ค่าปรับที่เก็บได้', value: '฿4,260' },
  { icon: <CampaignOutlined />, label: 'กิจกรรมที่จัดแล้ว (ปีนี้)', value: '18' },
]

// bar height as a fraction of max (Students = 1.0)
const BARS = [
  { label: 'นักศึกษา', fraction: 1.0 },
  { label: 'อาจารย์',  fraction: 0.583 },
  { label: 'เจ้าหน้าที่', fraction: 0.333 },
  { label: 'บัณฑิตศึกษา', fraction: 0.75 },
]

const MAX_BAR_H = 120

export default function ManagerReports() {
  return (
    <ManagerLayout title="รายงาน">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            disableElevation
            sx={{ fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, borderColor: mgr.border, color: mgr.inkMuted, borderRadius: '8px', px: '18px', py: '10px', '&:hover': { borderColor: mgr.border, bgcolor: '#fafafa' }, textTransform: 'none' }}
          >
            ส่งออก CSV
          </Button>
        </Box>

        {/* Stat cards */}
        <StatCardGrid>
          {STATS.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </StatCardGrid>

        {/* Bar chart */}
        <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, p: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 15, lineHeight: 1.35, color: mgr.ink }}>
            การใช้งานตามประเภทสมาชิก
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
                  <Typography sx={{ fontFamily: fonts.thai, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted, whiteSpace: 'nowrap' }}>
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
