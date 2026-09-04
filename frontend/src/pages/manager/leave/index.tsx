import { useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../../components/ManagerLayout'
import StatusBadge from '../../../components/StatusBadge'
import { fonts } from '../../../theme'

type LeaveStatus = 'pending' | 'approved' | 'rejected'

interface LeaveRow {
  id: number
  staff: string
  type: string
  dates: string
  reason: string
  status: LeaveStatus
}

const INITIAL: LeaveRow[] = [
  { id: 1, staff: 'Somchai Wong',     type: 'Sick Leave',     dates: '6 ส.ค.',        reason: 'ไข้ แนบใบรับรองแพทย์แล้ว',  status: 'pending' },
  { id: 2, staff: 'Thanawat Chai',    type: 'Personal Leave', dates: '8 – 9 ส.ค.',     reason: 'มีธุระครอบครัวต่างจังหวัด',   status: 'pending' },
  { id: 3, staff: 'Araya Suksawat',   type: 'Sick Leave',     dates: '5 ส.ค.',        reason: 'ปวดหัวไมเกรน',                status: 'approved' },
  { id: 4, staff: 'Kanya Pattanakul', type: 'Personal Leave', dates: '30 ก.ค.',       reason: 'ธุระที่มหาวิทยาลัย',           status: 'approved' },
  { id: 5, staff: 'Nattapong Ruen',   type: 'Sick Leave',     dates: '28 ก.ค.',       reason: 'เอกสารประกอบไม่ครบ',          status: 'rejected' },
]

const LEAVE_TYPE_LABEL: Record<string, string> = {
  'Sick Leave': 'ลาป่วย',
  'Personal Leave': 'ลากิจ',
}

const label = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted }
const body  = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const action = { fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, lineHeight: 1, cursor: 'pointer' }

const COLS = [
  { key: 'staff',  label: 'เจ้าหน้าที่', w: 220 },
  { key: 'type',   label: 'ประเภท',    w: 140 },
  { key: 'dates',  label: 'วันที่',     w: 220 },
  { key: 'reason', label: 'เหตุผล',    w: 260 },
  { key: 'status', label: 'สถานะ',    w: 120 },
  { key: 'action', label: 'การจัดการ', w: 160 },
]

export default function ManagerLeave() {
  const [rows, setRows] = useState<LeaveRow[]>(INITIAL)
  const pending = rows.filter((r) => r.status === 'pending').length

  const approve = (id: number) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r))
  const reject  = (id: number) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r))

  return (
    <ManagerLayout title="คำขอลา">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {pending > 0 && (
          <Box sx={{ alignSelf: 'flex-end' }}>
            <StatusBadge label={`รออนุมัติ ${pending} รายการ`} variant="pending" />
          </Box>
        )}

        <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink }}>
          คำขอทั้งหมด
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', bgcolor: '#f6f8f6', px: '20px', py: '14px' }}>
            {COLS.map((c) => (
              <Typography key={c.key} sx={{ ...label, width: c.w, flexShrink: 0 }}>{c.label}</Typography>
            ))}
          </Box>

          {rows.map((r) => (
            <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', px: '20px', py: '14px', borderTop: `1px solid ${mgr.border}` }}>
              <Typography sx={{ ...body, width: 220, flexShrink: 0 }}>{r.staff}</Typography>
              <Typography sx={{ ...body, width: 140, flexShrink: 0 }}>{LEAVE_TYPE_LABEL[r.type] ?? r.type}</Typography>
              <Typography sx={{ ...body, width: 220, flexShrink: 0 }}>{r.dates}</Typography>
              <Typography sx={{ ...body, width: 260, flexShrink: 0 }}>{r.reason}</Typography>
              <Box sx={{ width: 120, flexShrink: 0 }}>
                <StatusBadge
                  label={r.status === 'pending' ? 'รออนุมัติ' : r.status === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
                  variant={r.status}
                />
              </Box>
              <Box sx={{ width: 160, flexShrink: 0, display: 'flex', gap: '12px' }}>
                {r.status === 'pending' ? (
                  <>
                    <Typography sx={{ ...action, color: mgr.accentGreen }} onClick={() => approve(r.id)}>อนุมัติ</Typography>
                    <Typography sx={{ ...action, color: mgr.danger }} onClick={() => reject(r.id)}>ไม่อนุมัติ</Typography>
                  </>
                ) : (
                  <Typography sx={{ ...action, color: mgr.inkMuted }}>ดู</Typography>
                )}
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>
    </ManagerLayout>
  )
}
