import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import AssetAuditLayout from '../AssetAuditLayout'
import { auditApi, type AuditSession } from '../../../services/https/audit'
import { colors, fonts } from '../../../theme'

const AUDIT_BG = '#1a3d2e'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'ร่าง', color: '#b45309', bg: '#fef3c7' },
  submitted: { label: 'รอตรวจสอบ', color: '#b45309', bg: '#fef3c7' },
  approved: { label: 'อนุมัติแล้ว', color: '#166534', bg: '#dcfce7' },
  rejected: { label: 'ส่งกลับแก้ไข', color: '#b91c1c', bg: '#fee2e2' },
}

function reportCode(id: number) {
  return `RPT-${String(id).padStart(4, '0')}`
}

function fmtDate(v?: string | null) {
  if (!v) return '-'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('th-TH')
}

export default function ReviewAuditReports() {
  const [sessions, setSessions] = useState<AuditSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AuditSession | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null)

  useEffect(() => {
    auditApi.listSessions()
      .then((s) => setSessions(s ?? []))
      .catch((e) => setToast({ msg: e?.message ?? 'ดึงข้อมูลไม่สำเร็จ', sev: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedId == null) { setDetail(null); return }
    setDetailLoading(true)
    setNote('')
    auditApi.getSession(selectedId)
      .then(setDetail)
      .catch((e) => setToast({ msg: e?.message ?? 'โหลดรายงานไม่สำเร็จ', sev: 'error' }))
      .finally(() => setDetailLoading(false))
  }, [selectedId])

  const pending = useMemo(() => sessions.filter((s) => s.status === 'submitted'), [sessions])
  const reviewed = useMemo(
    () => sessions.filter((s) => s.status === 'approved' || s.status === 'rejected'),
    [sessions],
  )

  const applyResult = (updated: AuditSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)))
    setDetail(updated)
  }

  const doReview = async (action: 'approve' | 'reject') => {
    if (selectedId == null) return
    if (action === 'reject' && !note.trim()) {
      setToast({ msg: 'กรุณาระบุเหตุผลที่ส่งกลับแก้ไข', sev: 'error' })
      return
    }
    setActing(true)
    try {
      const updated = await auditApi.reviewReport(selectedId, action, note.trim())
      applyResult(updated)
      setRejectOpen(false)
      setToast({
        msg: action === 'approve'
          ? `อนุมัติรายงาน ${reportCode(selectedId)} แล้ว`
          : `ส่งรายงาน ${reportCode(selectedId)} กลับให้แก้ไขแล้ว`,
        sev: action === 'approve' ? 'success' : 'error',
      })
    } catch (e: any) {
      setToast({ msg: e?.message ?? 'ดำเนินการไม่สำเร็จ', sev: 'error' })
    } finally {
      setActing(false)
    }
  }

  const renderRow = (s: AuditSession, onClick: () => void, active: boolean) => {
    const meta = STATUS_META[s.status] ?? { label: s.status, color: '#64748b', bg: '#f1f5f9' }
    return (
      <Box
        key={s.id}
        onClick={onClick}
        sx={{
          display: 'grid', gridTemplateColumns: '0.8fr 2fr 1.4fr 1fr 1.1fr', gap: '8px',
          px: '16px', py: '13px', alignItems: 'center', cursor: 'pointer',
          borderLeft: '3px solid', borderLeftColor: active ? AUDIT_BG : 'transparent',
          bgcolor: active ? '#f0f5f2' : 'transparent',
          borderTop: '1px solid #f0f0f0',
          '&:hover': { bgcolor: '#f6f9f7' },
        }}
      >
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: AUDIT_BG, fontWeight: 600 }}>{reportCode(s.id)}</Typography>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>{s.location || '-'}</Typography>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>{s.auditor_name || '-'}</Typography>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>{fmtDate(s.submitted_at ?? s.audit_date)}</Typography>
        <Box>
          <Box component="span" sx={{ px: '10px', py: '3px', borderRadius: '999px', fontSize: 12, fontFamily: fonts.kanit, color: meta.color, bgcolor: meta.bg }}>
            {meta.label}
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <AssetAuditLayout title="Approver Report">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, color: colors.inkMuted }}>
          รายงานที่พนักงานส่งเข้ามา — ตรวจสอบความถูกต้องแล้วอนุมัติ หรือส่งกลับให้แก้ไข
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '48px' }}>
            <CircularProgress sx={{ color: AUDIT_BG }} />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: detail || detailLoading ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
            {/* LEFT: lists */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 600, color: AUDIT_BG, mb: '10px' }}>
                  รอตรวจสอบ ({pending.length})
                </Typography>
                <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e7e2', overflow: 'hidden' }}>
                  {pending.length === 0 ? (
                    <Box sx={{ px: '16px', py: '28px', textAlign: 'center' }}>
                      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.inkMuted }}>ไม่มีรายงานรอตรวจสอบ</Typography>
                    </Box>
                  ) : (
                    pending.map((s) => renderRow(s, () => setSelectedId(s.id), s.id === selectedId))
                  )}
                </Paper>
              </Box>

              {reviewed.length > 0 && (
                <Box>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 600, color: colors.inkMuted, mb: '10px' }}>
                    ตรวจสอบแล้ว ({reviewed.length})
                  </Typography>
                  <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e7e2', overflow: 'hidden' }}>
                    {reviewed.map((s) => renderRow(s, () => setSelectedId(s.id), s.id === selectedId))}
                  </Paper>
                </Box>
              )}
            </Box>

            {/* RIGHT: detail */}
            {(detail || detailLoading) && (
              <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '22px', bgcolor: 'white', position: 'sticky', top: 16 }}>
                {detailLoading || !detail ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: '60px' }}>
                    <CircularProgress sx={{ color: AUDIT_BG }} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 17, fontWeight: 700, color: AUDIT_BG }}>
                        {reportCode(detail.id)}
                      </Typography>
                      <Box component="span" sx={{ px: '12px', py: '4px', borderRadius: '999px', fontSize: 12, fontFamily: fonts.kanit, ...(() => { const m = STATUS_META[detail.status] ?? { color: '#64748b', bg: '#f1f5f9' }; return { color: m.color, bgcolor: m.bg } })() }}>
                        {STATUS_META[detail.status]?.label ?? detail.status}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        ['พื้นที่ตรวจนับ', detail.location || '-'],
                        ['ผู้จัดทำ', detail.auditor_name || '-'],
                        ['วันที่ตรวจนับ', fmtDate(detail.audit_date)],
                        ['ส่งเมื่อ', fmtDate(detail.submitted_at)],
                        ['จำนวนสินทรัพย์ที่ตรวจ', `${detail.rows?.length ?? 0} รายการ`],
                        ['ความคลาดเคลื่อนที่พบ', `${detail.discrepancies?.length ?? 0} รายการ`],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ display: 'flex', gap: '12px' }}>
                          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, width: 170, flexShrink: 0 }}>{label}</Typography>
                          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink, fontWeight: 500 }}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>

                    {(detail.summary || detail.recommendation) && (
                      <>
                        <Divider />
                        {detail.summary && (
                          <Box>
                            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, fontWeight: 600, color: AUDIT_BG, mb: '4px' }}>สรุปผล</Typography>
                            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink, whiteSpace: 'pre-wrap' }}>{detail.summary}</Typography>
                          </Box>
                        )}
                        {detail.recommendation && (
                          <Box>
                            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, fontWeight: 600, color: AUDIT_BG, mb: '4px' }}>ข้อเสนอแนะ</Typography>
                            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink, whiteSpace: 'pre-wrap' }}>{detail.recommendation}</Typography>
                          </Box>
                        )}
                      </>
                    )}

                    {detail.rows && detail.rows.length > 0 && (
                      <>
                        <Divider />
                        <Box>
                          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, fontWeight: 600, color: AUDIT_BG, mb: '8px' }}>รายการตรวจนับ</Typography>
                          <Box sx={{ border: '1px solid #eef2ef', borderRadius: '8px', overflow: 'hidden' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 2fr 0.7fr 0.7fr 1.2fr', bgcolor: '#f8f5ee', px: '12px', py: '8px' }}>
                              {['รหัส', 'ชื่อสินทรัพย์', 'คาดว่า', 'นับได้', 'สภาพ'].map((h) => (
                                <Typography key={h} sx={{ fontFamily: fonts.kanit, fontSize: 11, color: colors.inkMuted, fontWeight: 600 }}>{h}</Typography>
                              ))}
                            </Box>
                            {detail.rows.map((r) => (
                              <Box key={r.inspect_id} sx={{ display: 'grid', gridTemplateColumns: '1.4fr 2fr 0.7fr 0.7fr 1.2fr', px: '12px', py: '8px', borderTop: '1px solid #f0f0f0' }}>
                                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.ink }}>{r.asset_code}</Typography>
                                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.ink }}>{r.asset_name}</Typography>
                                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted }}>{r.expected}</Typography>
                                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: r.found !== r.expected ? '#b91c1c' : colors.ink, fontWeight: r.found !== r.expected ? 700 : 400 }}>{r.found}</Typography>
                                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted }}>{r.condition || '-'}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </>
                    )}

                    {detail.discrepancies && detail.discrepancies.length > 0 && (
                      <Box>
                        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, fontWeight: 600, color: '#b91c1c', mb: '8px' }}>
                          ความคลาดเคลื่อน ({detail.discrepancies.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {detail.discrepancies.map((d) => (
                            <Box key={d.id} sx={{ p: '10px', bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                                {d.asset_code} · {d.asset_name} · {d.type}
                              </Typography>
                              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted }}>
                                คาดว่า {d.expected || '-'} / พบจริง {d.actual || '-'}
                                {d.cause ? ` · สาเหตุ: ${d.cause}` : ''}
                                {d.action ? ` · แนวทาง: ${d.action}` : ''}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {detail.status === 'submitted' ? (
                      <>
                        <Divider />
                        <TextField
                          fullWidth multiline rows={2}
                          placeholder="หมายเหตุถึงผู้จัดทำ (บังคับเมื่อส่งกลับแก้ไข)"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { fontFamily: fonts.kanit, fontSize: 13, borderRadius: '8px' } }}
                        />
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <Button
                            onClick={() => doReview('approve')}
                            disabled={acting}
                            variant="contained"
                            sx={{ bgcolor: '#166534', fontFamily: fonts.kanit, fontSize: 14, px: '20px', borderRadius: '8px', '&:hover': { bgcolor: '#14532d' } }}
                          >
                            {acting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : '✓ อนุมัติ'}
                          </Button>
                          <Button
                            onClick={() => setRejectOpen(true)}
                            disabled={acting}
                            variant="outlined"
                            sx={{ borderColor: '#b91c1c', color: '#b91c1c', fontFamily: fonts.kanit, fontSize: 14, px: '20px', borderRadius: '8px', '&:hover': { bgcolor: '#fee2e2' } }}
                          >
                            ✕ ส่งกลับแก้ไข
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Divider />
                        <Box sx={{ p: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted }}>
                            ตรวจสอบโดย {detail.reviewer_name || '-'} เมื่อ {fmtDate(detail.reviewed_at)}
                          </Typography>
                          {detail.review_note && (
                            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink, mt: '4px', whiteSpace: 'pre-wrap' }}>
                              “{detail.review_note}”
                            </Typography>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}
      </Box>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: '14px' } }}>
        <DialogTitle sx={{ fontFamily: fonts.kanit, fontSize: 18, color: '#b91c1c' }}>
          ส่งรายงาน {selectedId ? reportCode(selectedId) : ''} กลับให้แก้ไข
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '10px' }}>
            ผู้จัดทำจะเห็นหมายเหตุนี้และแก้ไขรายงานใหม่
          </Typography>
          <TextField
            autoFocus fullWidth multiline rows={3}
            label="เหตุผล / สิ่งที่ต้องแก้"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ '& .MuiInputLabel-root': { fontFamily: fonts.kanit }, '& .MuiOutlinedInput-root': { fontFamily: fonts.kanit } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: '24px', pb: '16px', gap: '8px' }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ fontFamily: fonts.kanit, color: colors.inkMuted }}>ยกเลิก</Button>
          <Button
            onClick={() => doReview('reject')}
            disabled={acting || !note.trim()}
            variant="contained"
            sx={{ bgcolor: '#b91c1c', fontFamily: fonts.kanit, '&:hover': { bgcolor: '#991b1b' } }}
          >
            {acting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'ยืนยันส่งกลับ'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={2800} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev} onClose={() => setToast(null)} sx={{ fontFamily: fonts.kanit }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </AssetAuditLayout>
  )
}
