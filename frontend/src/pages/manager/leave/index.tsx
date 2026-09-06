import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'
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
  type LeaveRequest,
} from '../../../interface/ILeaveInterface'
import { fonts, mgr } from '../../../theme'

const label = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', color: mgr.inkMuted }
const body = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const action = { fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }

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

const COLS = ['ผู้ขอลา', 'ประเภท', 'ช่วงวันที่', 'เหตุผล', 'สถานะ', 'จัดการ']

export default function ManagerLeavePage() {
  const { token } = useAuth()
  const [rows, setRows] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    try {
      setRows(await leaveApi.listAllLeaves(token))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อ่านข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (id: number, status: 'approved' | 'rejected') => {
    if (!token) return
    setBusyId(id)
    setError('')
    try {
      await leaveApi.decideLeave(token, id, { status })
      setToast(status === 'approved' ? 'อนุมัติคำขอแล้ว' : 'บันทึกว่าไม่อนุมัติแล้ว')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setBusyId(null)
    }
  }

  const pending = rows.filter((r) => r.status === 'pending').length

  return (
    <BackOfficeLayout title="คำขอลา" trail={[{ label: 'งานหัวหน้าหอสมุด', to: '/manager' }]}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17, color: mgr.ink }}>
            คำขอทั้งหมด
          </Typography>
          <StatusBadge label={`รออนุมัติ ${pending} รายการ`} variant="pending" />
        </Box>

        {error && (
          <Alert severity="error" sx={{ fontFamily: fonts.thai, fontSize: 13, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        <Card noPadding>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <Box component="thead">
                <Box component="tr">
                  {COLS.map((h) => (
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
                      ยังไม่มีคำขอลา
                    </Box>
                  </Box>
                )}
                {rows.map((r) => (
                  <Box component="tr" key={r.id}>
                    <Box component="td" sx={{ ...body, p: '12px 20px', borderBottom: `1px solid ${mgr.border}`, whiteSpace: 'nowrap' }}>
                      {r.user_name}
                    </Box>
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
                    <Box component="td" sx={{ p: '12px 20px', borderBottom: `1px solid ${mgr.border}` }}>
                      {/* ตัดสินได้ครั้งเดียว ที่พิจารณาไปแล้วโชว์ชื่อคนตัดสินแทนปุ่ม */}
                      {r.status === 'pending' ? (
                        <Box sx={{ display: 'flex', gap: '16px' }}>
                          <Typography
                            onClick={() => busyId === null && decide(r.id, 'approved')}
                            sx={{ ...action, color: mgr.accentGreen, opacity: busyId === r.id ? 0.5 : 1 }}
                          >
                            อนุมัติ
                          </Typography>
                          <Typography
                            onClick={() => busyId === null && decide(r.id, 'rejected')}
                            sx={{ ...action, color: mgr.danger, opacity: busyId === r.id ? 0.5 : 1 }}
                          >
                            ไม่อนุมัติ
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ ...body, fontSize: 13, color: mgr.inkMuted, whiteSpace: 'nowrap' }}>
                          {r.approver_name ? `โดย ${r.approver_name}` : '—'}
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
