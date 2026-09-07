import { useState, useEffect } from 'react'
import { api } from '../../../services/api'
import { useSearchParams, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography' 
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import ProcurementLayout from '../ProcurementLayout'
import { useAuth } from '../../../auth/useAuth'
import { PERMISSIONS } from '../../../config/roles'
import { colors, fonts } from '../../../theme'

interface RequestDetail {
  id: string
  request_date: string
  status: string
  employee_id: string
  title: string
  category: string
  quantity: number
  unit_price: number
  total_price: number
  priority: string
  vendor: string
  purpose: string
  notes: string
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, minWidth: 160 }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink, flex: 1 }}>
        {value}
      </Typography>
    </Box>
  )
}

const TIMELINE = [
  { label: 'สร้างคำขอ', done: true },
  { label: 'รอการตรวจสอบ', done: true },
  { label: 'รอการอนุมัติ', done: false },
  { label: 'อนุมัติ / ปฏิเสธ', done: false },
  { label: 'จัดซื้อและลงทะเบียน', done: false },
]

export default function CheckDetails() {
  const [params] = useSearchParams()
  const { can } = useAuth()
  const isManager = can(PERMISSIONS.PROCUREMENT_APPROVE)
  const id = params.get('id') ?? ''
  const [req, setReq] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      const data = await api.requests.getById(id)
      setReq(data)
      setLoading(false)
    }
    if (id) fetchDetail()
  }, [id])

  if (loading) return <ProcurementLayout title="Check Details"><Typography sx={{ fontFamily: fonts.kanit }}>กำลังโหลด...</Typography></ProcurementLayout>
if (!req) return <ProcurementLayout title="Check Details"><Typography sx={{ fontFamily: fonts.kanit }}>ไม่พบข้อมูล</Typography></ProcurementLayout>

  const style = STATUS_STYLE[req.status] ?? { color: '#64748b', bg: '#f1f5f9' }

  const timelineWithStatus = TIMELINE.map((t, i) => {
    if (req.status === 'approved') return { ...t, done: i <= 3 }
    if (req.status === 'rejected') return { ...t, done: i <= 3 }
    if (req.status === 'pending') return { ...t, done: i <= 1 }
    return t
  })

  return (
    <ProcurementLayout title="Check Details">
      <Box sx={{ display: 'flex', gap: '24px', maxWidth: 1100 }}>
        {/* Main detail card */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '28px', bgcolor: 'white' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: '20px' }}>
              <Box>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 20, fontWeight: 700, color: colors.brandGreen }}>
                  {req.title}
                </Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mt: '4px' }}>
                  #{req.id} · ยื่นเมื่อ {new Date(req.request_date).toLocaleDateString('th-TH')}
                </Typography>
              </Box>
              <Box
                component="span"
                sx={{
                  px: '14px', py: '5px', borderRadius: '999px',
                  fontSize: 13, fontFamily: fonts.kanit,
                  color: style.color, bgcolor: style.bg,
                }}
              >
                {STATUS_LABEL[req.status] ?? req.status}
              </Box>
            </Box>

            <Divider sx={{ mb: '20px' }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <InfoRow label="หมวดหมู่" value={req.category} />
              <InfoRow label="จำนวน" value={`${req.quantity} ชิ้น`} />
              <InfoRow label="ราคาต่อหน่วย" value={`${req.unit_price.toLocaleString('th-TH')} บาท`} />
              <InfoRow
                label="วงเงินรวม"
                value={
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 700, color: colors.brandGreen }}>
                    {req.total_price.toLocaleString('th-TH')} บาท
                  </Typography>
                }
              />
              <InfoRow label="ระดับความเร่งด่วน" value={req.priority} />
              {req.vendor && <InfoRow label="ผู้จำหน่าย" value={req.vendor} />}
              <InfoRow label="ผู้ยื่นคำขอ" value={String(req.employee_id)} />
              <InfoRow label="วัตถุประสงค์" value={req.purpose} />
              {req.notes && <InfoRow label="หมายเหตุ" value={req.notes} />}
            </Box>
          </Paper>

          {/* Manager action buttons */}
          {isManager && req.status === 'pending' && (
            <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '20px', bgcolor: 'white' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: colors.ink, mb: '14px' }}>
                การดำเนินการ (Manager)
              </Typography>
              <Box sx={{ display: 'flex', gap: '12px' }}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#166534', fontFamily: fonts.kanit, fontSize: 14, px: '24px',
                    '&:hover': { bgcolor: '#14532d' },
                  }}
                >
                  ✓ อนุมัติคำขอ
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#b91c1c', color: '#b91c1c', fontFamily: fonts.kanit, fontSize: 14, px: '24px',
                    '&:hover': { borderColor: '#991b1b', bgcolor: '#fee2e2' },
                  }}
                >
                  ✕ ปฏิเสธคำขอ
                </Button>
              </Box>
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: '12px' }}>
            <Link
              to="/procurement/requests"
              style={{
                fontFamily: fonts.kanit, fontSize: 14, color: colors.brandGreen,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              ← กลับไปรายการคำขอ
            </Link>
          </Box>
        </Box>

        {/* Timeline sidebar */}
        <Box sx={{ width: 220, flexShrink: 0 }}>
          <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '20px', bgcolor: 'white' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, fontWeight: 600, color: colors.brandGreen, mb: '16px' }}>
              สถานะความคืบหน้า
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {timelineWithStatus.map((t, i) => (
                <Box key={t.label} sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        bgcolor: t.done ? colors.brandGreen : '#e2e7e2',
                        border: `2px solid ${t.done ? colors.brandGreen : '#e2e7e2'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: 'white',
                      }}
                    >
                      {t.done ? '✓' : ''}
                    </Box>
                    {i < timelineWithStatus.length - 1 && (
                      <Box sx={{ width: 2, height: 28, bgcolor: t.done ? colors.brandGreen : '#e2e7e2' }} />
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: fonts.kanit, fontSize: 13,
                      color: t.done ? colors.brandGreen : colors.inkMuted,
                      fontWeight: t.done ? 600 : 400,
                      pt: '1px', pb: '16px',
                    }}
                  >
                    {t.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </ProcurementLayout>
  )
}
