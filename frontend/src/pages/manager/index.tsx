import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { useAuth } from '../../auth/useAuth'
import * as leaveApi from '../../services/https/leaves'
import * as eventApi from '../../services/https/events'
import { complaintService } from '../../services/complaintService'
import type { Complaint } from '../../interface/complaint'
import { fonts, mgr } from '../../theme'

const MODULES = [
  { icon: '🗓️', label: 'ตารางเวร', desc: 'จัดการเวรประจำวันและหัวหน้าเวร', to: '/employees/schedules' },
  { icon: '📝', label: 'คำขอลา', desc: 'ตรวจสอบและอนุมัติการลาของเจ้าหน้าที่', to: '/manager/leave' },
  { icon: '📣', label: 'กิจกรรมและประชาสัมพันธ์', desc: 'เผยแพร่กิจกรรมและข่าวประชาสัมพันธ์', to: '/employees/pr' },
  { icon: '💬', label: 'เรื่องร้องเรียน', desc: 'ติดตามและแก้ไขข้อเสนอแนะจากผู้ใช้', to: '/employees/complaints' },
]

/** สถานะเรื่องร้องเรียนที่ถือว่ายังไม่จบ ต้องตรงกับ constants/complaintConstants ของ B6707590 */
const OPEN_COMPLAINT = ['รอตรวจสอบ', 'รอหัวหน้าพิจารณา', 'อยู่ระหว่างประสานงาน', 'กำลังดำเนินงาน']

interface Counts {
  pendingLeave: number | null
  upcomingEvents: number | null
  openComplaints: number | null
}

function StatCard({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{ flex: 1, p: '22px', borderRadius: '12px', borderColor: mgr.border, display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      <Typography sx={{ fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fonts.inter, fontWeight: 700, fontSize: 30, lineHeight: 1.1, color: value === null ? mgr.inkMuted : color }}>
        {/* ขีดกลางระหว่างรอข้อมูล ดีกว่าโชว์ 0 ซึ่งอ่านเหมือนไม่มีงานค้าง */}
        {value === null ? '—' : value}
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
  const { token } = useAuth()
  const [counts, setCounts] = useState<Counts>({ pendingLeave: null, upcomingEvents: null, openComplaints: null })

  useEffect(() => {
    if (!token) return
    let cancelled = false

    // ยิงสามเส้นพร้อมกัน เส้นไหนล้มก็ปล่อยการ์ดนั้นเป็นขีดกลาง ไม่ทำให้ทั้งหน้าพัง
    const num = <T,>(p: Promise<T[]>, count: (rows: T[]) => number) =>
      p.then(count).catch(() => null)

    const today = new Date().toISOString().slice(0, 10)

    Promise.all([
      num(leaveApi.listAllLeaves(token), (rows) => rows.filter((r) => r.status === 'pending').length),
      num(eventApi.listEvents(), (rows) => rows.filter((e) => (e.date ?? '').slice(0, 10) >= today).length),
      // ระบบร้องเรียนเป็นของ B6707590 ใช้ service ของเขา ซึ่งอ่าน token จาก localStorage เอง
      num<Complaint>(complaintService.getAll(), (rows) => rows.filter((c) => OPEN_COMPLAINT.includes(c.status)).length),
    ]).then(([pendingLeave, upcomingEvents, openComplaints]) => {
      if (!cancelled) setCounts({ pendingLeave, upcomingEvents, openComplaints })
    })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <BackOfficeLayout title="ภาพรวม">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <Typography sx={{ fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.inkMuted }}>
          ยินดีต้อนรับกลับ นี่คือสิ่งที่เกิดขึ้นในห้องสมุดวันนี้
        </Typography>

        <Box sx={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <StatCard label="คำขอลาที่รออนุมัติ" value={counts.pendingLeave} color={mgr.warning} />
          <StatCard label="กิจกรรมที่กำลังจะถึง" value={counts.upcomingEvents} color={mgr.ink} />
          <StatCard label="เรื่องร้องเรียนที่ยังไม่ปิด" value={counts.openComplaints} color={mgr.danger} />
        </Box>

        <Box>
          <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink, mb: '20px' }}>
            จัดการ
          </Typography>
          <Box sx={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {MODULES.map((m) => (
              <ModuleCard key={m.to} {...m} />
            ))}
          </Box>
        </Box>
      </Box>
    </BackOfficeLayout>
  )
}
