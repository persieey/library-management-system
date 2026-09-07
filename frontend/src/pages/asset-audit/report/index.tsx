import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import AssetAuditLayout from '../AssetAuditLayout'
import { auditApi, activeSession, type AuditSession } from '../../../services/https/audit'
import { colors, fonts } from '../../../theme'

const AUDIT_BG = '#1a3d2e'

export default function CreateAuditReport() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuditSession | null>(null)
  const [summary, setSummary] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [noSession, setNoSession] = useState(false)

  useEffect(() => {
    const sid = activeSession.get()
    if (!sid) { setNoSession(true); return }
    auditApi.getSession(sid).then((s) => {
      setSession(s)
      setSummary(s.summary ?? '')
      setRecommendation(s.recommendation ?? '')
    }).catch(() => setNoSession(true))
  }, [])

  const handleSave = async () => {
    const sid = activeSession.get()
    if (!sid) return
    setSaving(true)
    try {
      await auditApi.updateSession(sid, { summary, recommendation })
      setSaved(true)
    } catch {}
    setSaving(false)
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontFamily: fonts.kanit, fontSize: 14, borderRadius: '8px',
      '& fieldset': { borderColor: '#e2e7e2' },
      '&.Mui-focused fieldset': { borderColor: AUDIT_BG },
    },
  }

  if (noSession) {
    return (
      <AssetAuditLayout title="Create Audit Report">
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

  if (!session) {
    return (
      <AssetAuditLayout title="Create Audit Report">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '60px' }}>
          <CircularProgress sx={{ color: AUDIT_BG }} />
        </Box>
      </AssetAuditLayout>
    )
  }

  const rows = session.rows ?? []
  const discs = session.discrepancies ?? []
  const totalRows = rows.length
  const discCount = discs.length
  const okCount = totalRows - discCount
  const accuracy = totalRows > 0 ? ((okCount / totalRows) * 100).toFixed(1) : '–'

  const SUMMARY_STATS = [
    { label: 'สินทรัพย์ที่ตรวจนับทั้งหมด', value: `${totalRows} รายการ` },
    { label: 'ตรงตามทะเบียน', value: `${Math.max(0, okCount)} รายการ`, color: '#166534' },
    { label: 'พบความคลาดเคลื่อน', value: `${discCount} รายการ`, color: '#b91c1c' },
    { label: 'อัตราความถูกต้อง', value: `${accuracy}%`, color: '#166534' },
  ]

  const auditDate = new Date(session.audit_date)

  return (
    <AssetAuditLayout title="Create Audit Report">
      <style>{`
        @media print {
          header, nav { display: none !important; }
          .no-print { display: none !important; }
          main { padding: 0 !important; width: 100% !important; }
          body { background: white !important; }
          .MuiSnackbar-root { display: none !important; }
        }
      `}</style>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 900 }}>
        <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '28px', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: '20px' }}>
            <Box>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 20, fontWeight: 700, color: AUDIT_BG }}>
                รายงานผลการตรวจนับสินทรัพย์
              </Typography>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mt: '4px' }}>
                รหัสรายงาน: RPT-{String(session.id).padStart(4, '0')} · วันที่: {isNaN(auditDate.getTime()) ? '-' : auditDate.toLocaleDateString('th-TH')} · ผู้ตรวจ: {session.auditor_name}
              </Typography>
            </Box>
            <Box component="span" sx={{ px: '12px', py: '4px', borderRadius: '999px', fontSize: 12, fontFamily: fonts.kanit, color: '#b45309', bgcolor: '#fef3c7' }}>
              {session.status === 'submitted' ? 'ส่งแล้ว' : 'ร่าง'}
            </Box>
          </Box>

          <Divider sx={{ mb: '20px' }} />

          <Box sx={{ display: 'flex', gap: '16px', mb: '24px' }}>
            {SUMMARY_STATS.map((s) => (
              <Box key={s.label} sx={{ flex: 1, p: '14px', borderRadius: '10px', border: '1px solid #e2e7e2', bgcolor: '#fafafa' }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, mb: '4px' }}>{s.label}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, fontWeight: 700, color: s.color ?? AUDIT_BG }}>{s.value}</Typography>
              </Box>
            ))}
          </Box>

          {discs.length > 0 && (
            <>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: AUDIT_BG, mb: '12px' }}>
                รายการที่พบความคลาดเคลื่อน
              </Typography>
              <Box sx={{ border: '1px solid #e2e7e2', borderRadius: '10px', overflow: 'hidden', mb: '24px' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 1.5fr 2fr', bgcolor: '#f8f5ee', px: '16px', py: '10px' }}>
                  {['รหัส', 'ชื่อสินทรัพย์', 'ประเภท', 'รายละเอียด'].map((h) => (
                    <Typography key={h} sx={{ fontFamily: fonts.kanit, fontSize: 11, color: colors.inkMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</Typography>
                  ))}
                </Box>
                {discs.map((d, i) => (
                  <Box key={d.id} sx={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 1.5fr 2fr', px: '16px', py: '12px', alignItems: 'center', borderTop: i === 0 ? '1px solid #e2e7e2' : '1px solid #f0f0f0', bgcolor: '#fff7ed' }}>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: AUDIT_BG, fontWeight: 500 }}>{d.asset_code}</Typography>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink }}>{d.asset_name}</Typography>
                    <Box component="span" sx={{ px: '8px', py: '3px', borderRadius: '999px', fontSize: 11, fontFamily: fonts.kanit, color: '#b45309', bgcolor: '#fef3c7', width: 'fit-content' }}>{d.type}</Box>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: '#b91c1c' }}>{d.actual}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Box>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink, mb: '8px' }}>สรุปผลการตรวจนับ (เพิ่มเติม)</Typography>
              <TextField
                fullWidth multiline rows={3}
                placeholder="อธิบายภาพรวมผลการตรวจนับ สาเหตุที่เป็นไปได้ และผลกระทบ..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                sx={inputSx}
              />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink, mb: '8px' }}>ข้อเสนอแนะ</Typography>
              <TextField
                fullWidth multiline rows={3}
                placeholder="แนวทางแก้ไขและป้องกันไม่ให้เกิดซ้ำในอนาคต..."
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                sx={inputSx}
              />
            </Box>
          </Box>
        </Paper>

        <Box className="no-print" sx={{ display: 'flex', gap: '12px' }}>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            sx={{ bgcolor: AUDIT_BG, fontFamily: fonts.kanit, fontSize: 15, px: '28px', py: '10px', borderRadius: '8px', '&:hover': { bgcolor: '#0d2318' } }}
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกรายงาน'}
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/asset-audit/submit')}
            sx={{ bgcolor: '#166534', fontFamily: fonts.kanit, fontSize: 15, px: '28px', py: '10px', borderRadius: '8px', '&:hover': { bgcolor: '#14532d' } }}
          >
            ส่งให้ Manager →
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.print()}
            sx={{ fontFamily: fonts.kanit, fontSize: 15, px: '20px', borderColor: '#e2e7e2', color: colors.inkMuted, borderRadius: '8px' }}
          >
            พิมพ์รายงาน
          </Button>
        </Box>
      </Box>

      <Snackbar open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert severity="success" onClose={() => setSaved(false)} sx={{ fontFamily: fonts.kanit }}>
          บันทึกรายงานเรียบร้อยแล้ว
        </Alert>
      </Snackbar>
    </AssetAuditLayout>
  )
}
