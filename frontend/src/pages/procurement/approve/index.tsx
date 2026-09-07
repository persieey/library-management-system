
import { useState, useEffect } from 'react'
import { api } from '../../../services/api'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import ProcurementLayout from '../ProcurementLayout'
import { colors, fonts } from '../../../theme'

interface Request {
  id: string
  title: string
  category: string
  total_price: number
  employee_id: string
  request_date: string
  priority: string
  status: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'รอการอนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ถูกปฏิเสธ',
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending: { color: '#b45309', bg: '#fef3c7' },
  approved: { color: '#166534', bg: '#dcfce7' },
  rejected: { color: '#b91c1c', bg: '#fee2e2' },
}

const PRIORITY_COLOR: Record<string, string> = {
  'เร่งด่วนมาก': '#b91c1c',
  'เร่งด่วน': '#b45309',
  'ปกติ': '#64748b',
}

export default function ApproveRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ id: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const fetchRequests = async () => {
      const data = await api.requests.getAll()
      setRequests(data ?? [])
    }
    fetchRequests()
  }, [])

  const pending = requests.filter((r) => r.status === 'pending')
  const done = requests.filter((r) => r.status !== 'pending')

  const approve = async (id: string) => {
    await api.requests.updateStatus(id, 'approved')
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r))
    setToast({ msg: `อนุมัติคำขอ #${id} เรียบร้อยแล้ว`, sev: 'success' })
  }
  const openReject = (id: string) => { setRejectDialog({ id }); setRejectReason('') }

  const confirmReject = async () => {
    if (!rejectDialog) return
    await api.requests.updateStatus(rejectDialog.id, 'rejected')
    setRequests((prev) => prev.map((r) => r.id === rejectDialog.id ? { ...r, status: 'rejected' } : r))
    setToast({ msg: `ปฏิเสธคำขอ #${rejectDialog.id} เรียบร้อยแล้ว`, sev: 'error' })
    setRejectDialog(null)
  }

  const stats = [
    { label: 'รอการอนุมัติ', value: pending.length, color: '#b45309', bg: '#fef3c7' },
    { label: 'อนุมัติแล้ว', value: requests.filter((r) => r.status === 'approved').length, color: '#166534', bg: '#dcfce7' },
    { label: 'ถูกปฏิเสธ', value: requests.filter((r) => r.status === 'rejected').length, color: '#b91c1c', bg: '#fee2e2' },
    { label: 'วงเงินรอ (บาท)', value: pending.reduce((s, r) => s + r.total_price, 0).toLocaleString('th-TH'), color: colors.brandGreen, bg: '#e4ece1' },
  ]

  return (
    <ProcurementLayout title="Approve Requests">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: '16px' }}>
          {stats.map((s) => (
            <Paper key={s.label} variant="outlined" sx={{ flex: 1, p: '18px', borderRadius: '12px', borderColor: '#e2e7e2' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, mb: '6px' }}>{s.label}</Typography>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Pending */}
        {pending.length > 0 && (
          <Box>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 600, color: colors.brandGreen, mb: '12px' }}>
              รอการอนุมัติ ({pending.length} รายการ)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pending.map((r) => (
                <Paper
                  key={r.id}
                  variant="outlined"
                  sx={{ borderRadius: '12px', borderColor: '#e2e7e2', p: '20px', bgcolor: 'white' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '6px' }}>
                        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: colors.brandGreen }}>
                          {r.title}
                        </Typography>
                        <Box
                          component="span"
                          sx={{ px: '8px', py: '2px', borderRadius: '999px', fontSize: 11, fontFamily: fonts.kanit, color: PRIORITY_COLOR[r.priority] ?? '#64748b', bgcolor: '#f1f5f9' }}
                        >
                          {r.priority}
                        </Box>
                      </Box>
                      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
                        #{r.id} · {r.category} · ผู้ขอ: {r.employee_id} · วันที่: {new Date(r.request_date).toLocaleDateString('th-TH')}
                      </Typography>
                      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 700, color: colors.brandGreen, mt: '8px' }}>
                        {r.total_price.toLocaleString('th-TH')} บาท
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      <Button
                        onClick={() => approve(r.id)}
                        variant="contained"
                        size="small"
                        sx={{ bgcolor: '#166534', fontFamily: fonts.kanit, fontSize: 13, px: '16px', '&:hover': { bgcolor: '#14532d' } }}
                      >
                        ✓ อนุมัติ
                      </Button>
                      <Button
                        onClick={() => openReject(r.id)}
                        variant="outlined"
                        size="small"
                        sx={{ borderColor: '#b91c1c', color: '#b91c1c', fontFamily: fonts.kanit, fontSize: 13, px: '16px', '&:hover': { bgcolor: '#fee2e2' } }}
                      >
                        ✕ ปฏิเสธ
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Done */}
        {done.length > 0 && (
          <Box>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 600, color: colors.inkMuted, mb: '12px' }}>
              ดำเนินการแล้ว
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e7e2', overflow: 'hidden' }}>
              {done.map((r, i) => {
                const style = STATUS_STYLE[r.status] ?? { color: '#64748b', bg: '#f1f5f9' }
                return (
                  <Box
                    key={r.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: '20px', py: '14px',
                      borderTop: i > 0 ? '1px solid #f0f0f0' : '1px solid #e2e7e2',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>{r.title}</Typography>
                      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted }}>
                        #{r.id} · {r.employee_id} · {new Date(r.request_date).toLocaleDateString('th-TH')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.brandGreen, fontWeight: 600 }}>
                        {r.total_price.toLocaleString('th-TH')} บาท
                      </Typography>
                      <Box component="span" sx={{ px: '10px', py: '3px', borderRadius: '999px', fontSize: 12, fontFamily: fonts.kanit, color: style.color, bgcolor: style.bg }}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Paper>
          </Box>
        )}
      </Box>

      {/* Reject dialog */}
      <Dialog open={Boolean(rejectDialog)} onClose={() => setRejectDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: fonts.kanit }}>ปฏิเสธคำขอ {rejectDialog?.id}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="เหตุผลการปฏิเสธ"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: '8px', '& .MuiInputLabel-root': { fontFamily: fonts.kanit }, '& .MuiOutlinedInput-root': { fontFamily: fonts.kanit } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: '24px', pb: '16px' }}>
          <Button onClick={() => setRejectDialog(null)} sx={{ fontFamily: fonts.kanit, color: colors.inkMuted }}>ยกเลิก</Button>
          <Button
            onClick={confirmReject}
            variant="contained"
            sx={{ bgcolor: '#b91c1c', fontFamily: fonts.kanit, '&:hover': { bgcolor: '#991b1b' } }}
          >
            ยืนยันการปฏิเสธ
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={() => setToast(null)}>
        <Alert severity={toast?.sev} onClose={() => setToast(null)} sx={{ fontFamily: fonts.kanit }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </ProcurementLayout>
  )
}
