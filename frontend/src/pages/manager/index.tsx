import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { mgr } from '../../theme'
import { fonts } from '../../theme'

const STATS = [
  { label: 'เจ้าหน้าที่เข้าเวรวันนี้', value: 6, color: mgr.ink },
  { label: 'คำขอลาที่รออนุมัติ', value: 3, color: mgr.warning },
  { label: 'กิจกรรมที่กำลังจะถึง', value: 4, color: mgr.ink },
  { label: 'เรื่องร้องเรียนที่ยังไม่ปิด', value: 2, color: mgr.danger },
]

const MODULES = [
  { icon: '🗓️', label: 'ตารางเวร', desc: 'จัดการเวรประจำวันและหัวหน้าเวร', to: '/manager/schedules' },
  { icon: '📝', label: 'คำขอลา', desc: 'ตรวจสอบและอนุมัติการลาของเจ้าหน้าที่', to: '/manager/leave' },
  { icon: '📣', label: 'กิจกรรมและประชาสัมพันธ์', desc: 'เผยแพร่กิจกรรมและข่าวประชาสัมพันธ์', to: '/manager/activities' },
  { icon: '💬', label: 'เรื่องร้องเรียน', desc: 'ติดตามและแก้ไขข้อเสนอแนะจากผู้ใช้', to: '/manager/complaints' },
]

const RECENT = [
  { text: 'คำขอลาของ Kanya P. ได้รับการอนุมัติแล้ว', time: '10 นาทีที่แล้ว' },
  { text: 'เผยแพร่กิจกรรมใหม่ "Database Research Workshop" แล้ว', time: '1 ชั่วโมงที่แล้ว' },
  { text: 'ปิดเรื่องร้องเรียน #204 แล้ว', time: '3 ชั่วโมงที่แล้ว' },
  { text: 'อัปเดตตารางเวรสัปดาห์หน้าแล้ว', time: 'เมื่อวาน' },
]

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{ flex: 1, p: '22px', borderRadius: '12px', borderColor: mgr.border, display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      <Typography sx={{ fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted }}>
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
      <Typography sx={{ fontFamily: fonts.thai, fontWeight: 600, fontSize: 15, lineHeight: 1.35, color: mgr.ink }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fonts.thai, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted, flex: 1 }}>
        {desc}
      </Typography>
      <Typography sx={{ fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, lineHeight: 1, color: mgr.accentGreen }}>
        เปิด →
      </Typography>
    </Paper>
  )
}

export default function ManagerDashboard() {
  return (
    <BackOfficeLayout title="ภาพรวม">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <Typography sx={{ fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.inkMuted }}>
          ยินดีต้อนรับกลับ นี่คือสิ่งที่เกิดขึ้นในห้องสมุดวันนี้
        </Typography>

        <Box sx={{ display: 'flex', gap: '20px' }}>
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </Box>

        <Box>
          <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink, mb: '20px' }}>
            จัดการ
          </Typography>
          <Box sx={{ display: 'flex', gap: '20px' }}>
            {MODULES.map((m) => <ModuleCard key={m.to} {...m} />)}
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink, mb: '16px' }}>
            กิจกรรมล่าสุด
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
                <Typography sx={{ fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }}>
                  {item.text}
                </Typography>
                <Typography sx={{ fontFamily: fonts.thai, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted, ml: 2, flexShrink: 0 }}>
                  {item.time}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </BackOfficeLayout>
  )
}
