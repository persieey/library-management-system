import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import Card from '../../../components/Card'
import StatusBadge from '../../../components/StatusBadge'
import { useAuth } from '../../../auth/useAuth'
import * as leaveApi from '../../../services/https/leaves'
import {
  LEAVE_STATUS_LABEL,
  LEAVE_STATUS_VARIANT,
  LEAVE_TYPE_LABEL,
  type LeaveDraft,
  type LeaveRequest,
  type LeaveType,
} from '../../../interface/ILeaveInterface'
import { fonts, mgr } from '../../../theme'

const label = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', color: mgr.inkMuted }
const body = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '8px', fontFamily: fonts.thai, fontSize: 14 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: mgr.border },
} as const

const TYPES: LeaveType[] = ['sick', 'personal', 'vacation']

/** วันนี้ในรูปแบบ YYYY-MM-DD ตามเวลาเครื่อง ไม่ใช้ toISOString เพราะจะเพี้ยนไปวันหนึ่งตอนข้ามโซนเวลา */
function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 2026-09-10 -> 10 ก.ย. 2569 */
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
function thaiDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`
}

function rangeText(leave: LeaveRequest): string {
  const from = thaiDate(leave.start_date)
  return leave.start_date === leave.end_date ? from : `${from} – ${thaiDate(leave.end_date)}`
}

const EMPTY: LeaveDraft = { leave_type: 'sick', start_date: today(), end_date: today(), reason: '' }

export default function MyLeavePage() {
  const { token } = useAuth()
  const [draft, setDraft] = useState<LeaveDraft>(EMPTY)
  const [rows, setRows] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    try {
      setRows(await leaveApi.listMyLeaves(token))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อ่านข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const set = <K extends keyof LeaveDraft>(key: K, value: LeaveDraft[K]) => {
    setError('')
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      // เลื่อนวันเริ่มไปหลังวันสิ้นสุดแล้วให้วันสิ้นสุดตามไปด้วย จะได้ไม่ต้องแก้สองช่อง
      if (key === 'start_date' && next.end_date < next.start_date) next.end_date = next.start_date
      return next
    })
  }

  const submit = async () => {
    if (!token) return
    if (!draft.reason.trim()) {
      setError('กรอกเหตุผลการลาด้วย')
      return
    }
    setSaving(true)
    setError('')
    try {
      await leaveApi.createLeave(token, { ...draft, reason: draft.reason.trim() })
      setDraft(EMPTY)
      setToast('ส่งคำขอลาแล้ว รอหัวหน้าหอสมุดพิจารณา')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ส่งคำขอไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const cancel = async (id: number) => {
    if (!token) return
    try {
      await leaveApi.cancelLeave(token, id)
      setToast('ยกเลิกคำขอแล้ว')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ยกเลิกไม่สำเร็จ')
    }
  }

  return (
    <BackOfficeLayout title="การลาของฉัน">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card title="ยื่นคำขอลา" subtitle="ส่งแล้วหัวหน้าหอสมุดจะเห็นและพิจารณา">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: 620 }}>
            <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 160px' }}>
                <Typography sx={label}>ประเภทการลา</Typography>
                <TextField
                  select
                  size="small"
                  value={draft.leave_type}
                  onChange={(e) => set('leave_type', e.target.value as LeaveType)}
                  sx={fieldSx}
                >
                  {TYPES.map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontFamily: fonts.thai, fontSize: 14 }}>
                      {LEAVE_TYPE_LABEL[t]}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 150px' }}>
                <Typography sx={label}>วันที่เริ่มลา</Typography>
                <TextField
                  type="date"
                  size="small"
                  value={draft.start_date}
                  onChange={(e) => set('start_date', e.target.value)}
                  sx={fieldSx}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 150px' }}>
                <Typography sx={label}>ถึงวันที่</Typography>
                <TextField
                  type="date"
                  size="small"
                  value={draft.end_date}
                  onChange={(e) => set('end_date', e.target.value)}
                  slotProps={{ htmlInput: { min: draft.start_date } }}
                  sx={fieldSx}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Typography sx={label}>เหตุผล</Typography>
              <TextField
                multiline
                minRows={2}
                size="small"
                placeholder="เช่น เป็นไข้ ต้องพักรักษาตัว"
                value={draft.reason}
                onChange={(e) => set('reason', e.target.value)}
                sx={fieldSx}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ fontFamily: fonts.thai, fontSize: 13, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={submit}
                disabled={saving}
                sx={{ fontFamily: fonts.thai, fontSize: 14, px: 3, borderRadius: '8px', bgcolor: mgr.sidebar }}
              >
                {saving ? 'กำลังส่ง...' : 'ส่งคำขอลา'}
              </Button>
            </Box>
          </Box>
        </Card>

        <Card title="คำขอของฉัน" subtitle={`ทั้งหมด ${rows.length} รายการ`} noPadding>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <Box component="thead">
                <Box component="tr">
                  {['ประเภท', 'ช่วงวันที่', 'เหตุผล', 'สถานะ', 'ผู้พิจารณา', ''].map((h) => (
                    <Box
                      key={h}
                      component="th"
                      sx={{ ...label, textAlign: 'left', p: '12px 20px', borderBottom: `1px solid ${mgr.border}` }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {loading && (
                  <Box component="tr">
                    <Box component="td" colSpan={6} sx={{ ...body, p: '20px', textAlign: 'center', color: mgr.inkMuted }}>
                      กำลังโหลด...
                    </Box>
                  </Box>
                )}
                {!loading && rows.length === 0 && (
                  <Box component="tr">
                    <Box component="td" colSpan={6} sx={{ ...body, p: '20px', textAlign: 'center', color: mgr.inkMuted }}>
                      ยังไม่เคยยื่นคำขอลา
                    </Box>
                  </Box>
                )}
                {rows.map((r) => (
                  <Box component="tr" key={r.id}>
                    <Box component="td" sx={{ ...body, p: '12px 20px', borderBottom: `1px solid ${mgr.border}` }}>
                      {LEAVE_TYPE_LABEL[r.leave_type]}
                    </Box>
                    <Box component="td" sx={{ ...body, p: '12px 20px', borderBottom: `1px solid ${mgr.border}`, whiteSpace: 'nowrap' }}>
                      {rangeText(r)}
                    </Box>
                    <Box component="td" sx={{ ...body, p: '12px 20px', borderBottom: `1px solid ${mgr.border}` }}>
                      {r.reason}
                    </Box>
                    <Box component="td" sx={{ p: '12px 20px', borderBottom: `1px solid ${mgr.border}` }}>
                      <StatusBadge label={LEAVE_STATUS_LABEL[r.status]} variant={LEAVE_STATUS_VARIANT[r.status]} />
                    </Box>
                    <Box component="td" sx={{ ...body, p: '12px 20px', borderBottom: `1px solid ${mgr.border}`, color: mgr.inkMuted }}>
                      {r.approver_name || '—'}
                      {r.decision_note && (
                        <Typography sx={{ ...body, fontSize: 12.5, color: mgr.inkMuted }}>{r.decision_note}</Typography>
                      )}
                    </Box>
                    <Box component="td" sx={{ p: '12px 20px', borderBottom: `1px solid ${mgr.border}` }}>
                      {/* ยกเลิกได้เฉพาะตอนยังไม่ถูกพิจารณา ตรงกับที่เซิร์ฟเวอร์บังคับ */}
                      {r.status === 'pending' && (
                        <Typography
                          onClick={() => cancel(r.id)}
                          sx={{ ...body, color: mgr.danger, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                        >
                          ยกเลิก
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ fontFamily: fonts.thai, fontSize: 14, borderRadius: '8px' }}>
          {toast}
        </Alert>
      </Snackbar>
    </BackOfficeLayout>
  )
}
