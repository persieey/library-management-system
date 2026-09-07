import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import AssetAuditLayout from './AssetAuditLayout'
import { auditApi, activeSession, type AuditStats, type AuditSession } from '../../services/https/audit'
import { colors, fonts } from '../../theme'

const AUDIT_BG = '#1a3d2e'

const STEPS = [
  { label: 'Assets to Audit', desc: 'ดูรายการสินทรัพย์ที่ต้องตรวจนับ', to: '/asset-audit' },
  { label: 'Physical Audit', desc: 'บันทึกผลการตรวจนับจริง', to: '/asset-audit/physical' },
  { label: 'Record Discrepancies', desc: 'บันทึกรายการที่ไม่ตรง', to: '/asset-audit/discrepancies' },
  { label: 'Create Audit Report', desc: 'สร้างรายงานผลการตรวจนับ', to: '/asset-audit/report' },
  { label: 'Submit Report', desc: 'ส่งรายงานให้ Manager', to: '/asset-audit/submit' },
]

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  draft: { color: '#b45309', bg: '#fef3c7' },
  submitted: { color: '#166534', bg: '#dcfce7' },
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'กำลังดำเนินการ',
  submitted: 'เสร็จสิ้น',
}

export default function AssetsToAudit() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [sessions, setSessions] = useState<AuditSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([auditApi.getStats(), auditApi.listSessions()])
      .then(([s, sess]) => { setStats(s); setSessions(sess ?? []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleNewAudit = () => {
    activeSession.clear()
    navigate('/asset-audit/physical')
  }

  const handleContinue = (id: number) => {
    activeSession.set(id)
    navigate('/asset-audit/physical')
  }

  const statCards = stats
    ? [
        { label: 'สินทรัพย์ทั้งหมด', value: stats.total_assets, color: AUDIT_BG },
        { label: 'รอตรวจนับ (ร่าง)', value: stats.pending_audit, color: '#b45309' },
        { label: 'ตรวจแล้ว', value: stats.audited, color: '#166534' },
        { label: 'พบความคลาดเคลื่อน', value: stats.discrepancies, color: '#b91c1c' },
      ]
    : []

  return (
    <AssetAuditLayout title="Assets to Audit">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, color: colors.inkMuted }}>
            ภาพรวมการตรวจนับสินทรัพย์ — ระบบจัดการสินทรัพย์
          </Typography>
          <Button
            onClick={handleNewAudit}
            variant="contained"
            sx={{ bgcolor: AUDIT_BG, fontFamily: fonts.kanit, fontSize: 14, px: '20px', borderRadius: '8px', '&:hover': { bgcolor: '#0d2318' } }}
          >
            + เริ่มตรวจนับใหม่
          </Button>
        </Box>

        {/* Stats */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '32px' }}>
            <CircularProgress sx={{ color: AUDIT_BG }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: '16px' }}>
            {statCards.map((s) => (
              <Paper key={s.label} variant="outlined" sx={{ flex: 1, p: '20px', borderRadius: '12px', borderColor: '#e2e7e2' }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>{s.label}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Workflow steps */}
        <Box>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 17, fontWeight: 600, color: AUDIT_BG, mb: '14px' }}>
            ขั้นตอนการตรวจนับ
          </Typography>
          <Box sx={{ display: 'flex', gap: '12px' }}>
            {STEPS.map((s, i) => (
              <Paper
                key={s.to}
                component={Link}
                to={s.to}
                variant="outlined"
                sx={{
                  flex: 1, p: '16px', borderRadius: '12px', borderColor: '#e2e7e2',
                  textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '8px',
                  transition: 'box-shadow 200ms, border-color 200ms',
                  '&:hover': { boxShadow: '0 4px 14px rgba(26,61,46,0.12)', borderColor: AUDIT_BG },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: AUDIT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: 'white', fontWeight: 700 }}>{i + 1}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, fontWeight: 600, color: AUDIT_BG, lineHeight: 1.3 }}>{s.label}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, lineHeight: 1.4 }}>{s.desc}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Sessions table */}
        <Box>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 17, fontWeight: 600, color: AUDIT_BG, mb: '14px' }}>
            ประวัติการตรวจนับ
          </Typography>
          <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e7e2', overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '0.7fr 2fr 1.5fr 1fr 1fr 1fr', bgcolor: '#f8f5ee', px: '20px', py: '12px', borderBottom: '1px solid #e2e7e2' }}>
              {['รหัส', 'พื้นที่', 'ผู้ตรวจ', 'วันที่', 'สถานะ', ''].map((h) => (
                <Typography key={h} sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</Typography>
              ))}
            </Box>
            {sessions.length === 0 ? (
              <Box sx={{ px: '20px', py: '32px', textAlign: 'center' }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.inkMuted }}>
                  ยังไม่มีการตรวจนับ กด "เริ่มตรวจนับใหม่" เพื่อเริ่มต้น
                </Typography>
              </Box>
            ) : (
              sessions.map((s, i) => {
                const st = STATUS_COLOR[s.status] ?? { color: '#64748b', bg: '#f1f5f9' }
                const d = new Date(s.audit_date)
                return (
                  <Box
                    key={s.id}
                    sx={{ display: 'grid', gridTemplateColumns: '0.7fr 2fr 1.5fr 1fr 1fr 1fr', px: '20px', py: '14px', alignItems: 'center', borderTop: i === 0 ? '1px solid #e2e7e2' : '1px solid #f0f0f0' }}
                  >
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: AUDIT_BG, fontWeight: 500 }}>#{s.id}</Typography>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>{s.location}</Typography>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>{s.auditor_name}</Typography>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>{isNaN(d.getTime()) ? '-' : d.toLocaleDateString('th-TH')}</Typography>
                    <Box>
                      <Box component="span" sx={{ px: '10px', py: '3px', borderRadius: '999px', fontSize: 12, fontFamily: fonts.kanit, color: st.color, bgcolor: st.bg }}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </Box>
                    </Box>
                    {s.status === 'draft' ? (
                      <Button
                        onClick={() => handleContinue(s.id)}
                        size="small"
                        sx={{ fontFamily: fonts.kanit, fontSize: 12, color: AUDIT_BG, border: `1px solid ${AUDIT_BG}`, borderRadius: '6px', px: '10px', minWidth: 0 }}
                      >
                        ดำเนินการต่อ
                      </Button>
                    ) : (
                      <Box />
                    )}
                  </Box>
                )
              })
            )}
          </Paper>
        </Box>
      </Box>
    </AssetAuditLayout>
  )
}
