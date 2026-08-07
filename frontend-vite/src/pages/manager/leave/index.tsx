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
  { id: 1, staff: 'Somchai Wong',     type: 'Sick Leave',     dates: 'Aug 6',        reason: "Fever, doctor's note attached",  status: 'pending' },
  { id: 2, staff: 'Thanawat Chai',    type: 'Personal Leave', dates: 'Aug 8 – Aug 9', reason: 'Family event out of town',        status: 'pending' },
  { id: 3, staff: 'Araya Suksawat',   type: 'Sick Leave',     dates: 'Aug 5',        reason: 'Migraine',                       status: 'approved' },
  { id: 4, staff: 'Kanya Pattanakul', type: 'Personal Leave', dates: 'Jul 30',       reason: 'University errand',              status: 'approved' },
  { id: 5, staff: 'Nattapong Ruen',   type: 'Sick Leave',     dates: 'Jul 28',       reason: 'Insufficient documentation',     status: 'rejected' },
]

const label = { fontFamily: fonts.inter, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted, textTransform: 'uppercase' as const }
const body  = { fontFamily: fonts.inter, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const action = { fontFamily: fonts.inter, fontWeight: 600, fontSize: 14, lineHeight: 1, cursor: 'pointer' }

const COLS = [
  { key: 'staff',  label: 'STAFF',   w: 220 },
  { key: 'type',   label: 'TYPE',    w: 140 },
  { key: 'dates',  label: 'DATES',   w: 220 },
  { key: 'reason', label: 'REASON',  w: 260 },
  { key: 'status', label: 'STATUS',  w: 120 },
  { key: 'action', label: 'ACTIONS', w: 160 },
]

export default function ManagerLeave() {
  const [rows, setRows] = useState<LeaveRow[]>(INITIAL)
  const pending = rows.filter((r) => r.status === 'pending').length

  const approve = (id: number) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r))
  const reject  = (id: number) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r))

  return (
    <ManagerLayout title="Leave Requests">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {pending > 0 && (
          <Box sx={{ alignSelf: 'flex-end' }}>
            <StatusBadge label={`${pending} PENDING`} variant="pending" />
          </Box>
        )}

        <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink }}>
          All Requests
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', bgcolor: '#f6f8f6', px: '20px', py: '14px' }}>
            {COLS.map((c) => (
              <Typography key={c.key} sx={{ ...label, width: c.w, flexShrink: 0 }}>{c.label}</Typography>
            ))}
          </Box>

          {rows.map((r, i) => (
            <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', px: '20px', py: '14px', borderTop: `1px solid ${mgr.border}` }}>
              <Typography sx={{ ...body, width: 220, flexShrink: 0 }}>{r.staff}</Typography>
              <Typography sx={{ ...body, width: 140, flexShrink: 0 }}>{r.type}</Typography>
              <Typography sx={{ ...body, width: 220, flexShrink: 0 }}>{r.dates}</Typography>
              <Typography sx={{ ...body, width: 260, flexShrink: 0 }}>{r.reason}</Typography>
              <Box sx={{ width: 120, flexShrink: 0 }}>
                <StatusBadge
                  label={r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Approved' : 'Rejected'}
                  variant={r.status}
                />
              </Box>
              <Box sx={{ width: 160, flexShrink: 0, display: 'flex', gap: '12px' }}>
                {r.status === 'pending' ? (
                  <>
                    <Typography sx={{ ...action, color: mgr.accentGreen }} onClick={() => approve(r.id)}>Approve</Typography>
                    <Typography sx={{ ...action, color: mgr.danger }} onClick={() => reject(r.id)}>Reject</Typography>
                  </>
                ) : (
                  <Typography sx={{ ...action, color: mgr.inkMuted }}>View</Typography>
                )}
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>
    </ManagerLayout>
  )
}
