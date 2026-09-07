import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import AssetAuditLayout from '../AssetAuditLayout'
import { auditApi, activeSession, type AuditSession } from '../../../services/https/audit'
import { colors, fonts } from '../../../theme'

const AUDIT_BG = '#1a3d2e'

const CHECKLIST = [
  { id: 'physical', label: 'ตรวจนับจริงครบทุกรายการแล้ว' },
  { id: 'discrepancy', label: 'บันทึกความคลาดเคลื่อนทั้งหมดแล้ว' },
  { id: 'report', label: 'สร้างรายงานผลการตรวจนับแล้ว' },
  { id: 'review', label: 'ตรวจสอบความถูกต้องของข้อมูลแล้ว' },
]

export default function SubmitReport() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuditSession | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [noSession, setNoSession] = useState(false)

  useEffect(() => {
    const sid = activeSession.get()
    if (!sid) { setNoSession(true); return }
    auditApi.getSession(sid).then((s) => {
      setSession(s)
      if (s.status === 'submitted') setSubmitted(true)
    }).catch(() => setNoSession(true))
  }, [])

  const allChecked = CHECKLIST.every((c) => checked[c.id])
  const toggle = (id: string) => setChecked((p) => ({ ...p, [id]: !p[id] }))

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false)
    const sid = activeSession.get()
    if (!sid) return
    setSubmitting(true)
    try {
      await auditApi.submitReport(sid, note)
      activeSession.clear()
      setSubmitted(true)
    } catch (e: any) {
      alert(e?.message ?? 'ส่งรายงานไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  if (noSession) {
    return (
      <AssetAuditLayout title="Submit Report to Manager">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '16px' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, color: colors.inkMuted }}>กรุณาเริ่มการตรวจนับก่อน</Typography>
          <Button onClick={() => navigate('/asset-audit/physical')} variant="contained"
            sx={{ bgcolor: AUDIT_BG, fontFamily: fonts.kanit, borderRadius: '8px', '&:hover': { bgcolor: '#0d2318' } }}>
            ไปหน้า Physical Audit
          </Button>
        </Box>
      </AssetAuditLayout>
    )
  }

  if (!session && !submitted) {
    return (
      <AssetAuditLayout title="Submit Report to Manager">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '60px' }}>
          <CircularProgress sx={{ color: AUDIT_BG }} />
        </Box>
      </AssetAuditLayout>
    )
  }

  if (submitted) {
    const reportCode = session ? `RPT-${String(session.id).padStart(4, '0')}` : 'RPT-0000'
    return (
      <AssetAuditLayout title="Submit Report to Manager">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: '24px' }}>
          <Box sx={{ fontSize: 64 }}>✅</Box>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 24, fontWeight: 700, color: '#166534' }}>
            ส่งรายงานเรียบร้อยแล้ว
          </Typography>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, color: colors.inkMuted, textAlign: 'center' }}>
            รายงาน {reportCode} ถูกส่งให้ Manager เรียบร้อยแล้ว<br />
            Manager จะตรวจสอบและแจ้งผลภายใน 3 วันทำการ
          </Typography>
          <Box sx={{ p: '16px', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', maxWidth: 400, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: '#166534' }}>
              เลขติดตาม: <strong>{reportCode}</strong><br />
              สถานะ: รอ Manager ตรวจสอบ
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/asset-audit')}
            variant="outlined"
            sx={{ fontFamily: fonts.kanit, fontSize: 14, borderColor: AUDIT_BG, color: AUDIT_BG, borderRadius: '8px', px: '24px' }}
          >
            กลับหน้าหลัก Asset Audit
          </Button>
        </Box>
      </AssetAuditLayout>
    )
  }

  const reportCode = `RPT-${String(session!.id).padStart(4, '0')}`
  const auditDate = new Date(session!.audit_date)
  const rows = session!.rows ?? []
  const discs = session!.discrepancies ?? []

  return (
    <AssetAuditLayout title="Submit Report to Manager">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 720 }}>
        <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '24px', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 17, fontWeight: 600, color: AUDIT_BG }}>รายงานที่จะส่ง</Typography>
            <Box component="span" sx={{ px: '12px', py: '4px', borderRadius: '999px', fontSize: 12, fontFamily: fonts.kanit, color: '#b45309', bgcolor: '#fef3c7' }}>ร่าง</Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', mb: '20px' }}>
            {[
              { label: 'รหัสรายงาน', value: reportCode },
              { label: 'พื้นที่ตรวจนับ', value: session!.location },
              { label: 'ผู้จัดทำ', value: session!.auditor_name },
              { label: 'วันที่ตรวจนับ', value: isNaN(auditDate.getTime()) ? '-' : auditDate.toLocaleDateString('th-TH') },
              { label: 'จำนวนสินทรัพย์ที่ตรวจ', value: `${rows.length} รายการ` },
              { label: 'ความคลาดเคลื่อนที่พบ', value: `${discs.length} รายการ` },
            ].map((row) => (
              <Box key={row.label} sx={{ display: 'flex', gap: '12px' }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, width: 200, flexShrink: 0 }}>{row.label}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink, fontWeight: 500 }}>{row.value}</Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ mb: '16px' }} />
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.inkMuted }}>
            ส่งถึง Manager: <strong style={{ color: AUDIT_BG }}>manager</strong>
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '24px', bgcolor: 'white' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 600, color: AUDIT_BG, mb: '16px' }}>
            รายการตรวจสอบก่อนส่ง
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CHECKLIST.map((c) => (
              <Box
                key={c.id}
                onClick={() => toggle(c.id)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  p: '12px', borderRadius: '8px', cursor: 'pointer',
                  border: '1px solid', borderColor: checked[c.id] ? '#bbf7d0' : '#e2e7e2',
                  bgcolor: checked[c.id] ? '#f0fdf4' : '#fafafa',
                  transition: 'all 150ms',
                }}
              >
                <Box sx={{ width: 20, height: 20, borderRadius: '4px', flexShrink: 0, border: '2px solid', borderColor: checked[c.id] ? '#166534' : '#cbd5e1', bgcolor: checked[c.id] ? '#166534' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {checked[c.id] && <Typography sx={{ fontSize: 12, color: 'white', lineHeight: 1, fontWeight: 700 }}>✓</Typography>}
                </Box>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: checked[c.id] ? '#166534' : colors.ink }}>
                  {c.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '24px', bgcolor: 'white' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: AUDIT_BG, mb: '12px' }}>
            หมายเหตุถึง Manager (ไม่บังคับ)
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            placeholder="ข้อมูลเพิ่มเติมที่ต้องการแจ้ง Manager..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily: fonts.kanit, fontSize: 14, borderRadius: '8px', '& fieldset': { borderColor: '#e2e7e2' }, '&.Mui-focused fieldset': { borderColor: AUDIT_BG } } }}
          />
        </Paper>

        <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!allChecked || submitting}
            variant="contained"
            sx={{ bgcolor: AUDIT_BG, fontFamily: fonts.kanit, fontSize: 15, px: '32px', py: '12px', borderRadius: '8px', '&:hover': { bgcolor: '#0d2318' }, '&.Mui-disabled': { bgcolor: '#d1d5db', color: '#9ca3af' } }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'ส่งรายงานให้ Manager'}
          </Button>
          {!allChecked && (
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: '#b91c1c' }}>
              กรุณาทำเครื่องหมายรายการตรวจสอบให้ครบก่อนส่ง
            </Typography>
          )}
        </Box>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} sx={{ '& .MuiPaper-root': { borderRadius: '14px' } }}>
        <DialogTitle sx={{ fontFamily: fonts.kanit, fontSize: 18, color: AUDIT_BG }}>ยืนยันการส่งรายงาน</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>
            คุณต้องการส่งรายงาน <strong>{reportCode}</strong> ให้ Manager ใช่หรือไม่?<br />
            หลังจากส่งแล้วจะไม่สามารถแก้ไขได้จนกว่า Manager จะส่งคืน
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: '24px', pb: '16px', gap: '8px' }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ fontFamily: fonts.kanit, color: colors.inkMuted }}>ยกเลิก</Button>
          <Button onClick={handleConfirmSubmit} variant="contained"
            sx={{ fontFamily: fonts.kanit, bgcolor: AUDIT_BG, '&:hover': { bgcolor: '#0d2318' } }}>
            ยืนยันส่ง
          </Button>
        </DialogActions>
      </Dialog>
    </AssetAuditLayout>
  )
}
