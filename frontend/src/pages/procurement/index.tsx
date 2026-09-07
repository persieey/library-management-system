import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ProcurementLayout from './ProcurementLayout'
import { useAuth } from '../../auth/useAuth'
import { PERMISSIONS } from '../../config/roles'
import { colors, fonts } from '../../theme'

interface RecentRequest {
  id: string
  title: string
  total_price: number
  status: string
  request_date: string
}

const QUICK_ACTIONS = [
  { label: 'สร้างคำขอจัดซื้อ', desc: 'ยื่นคำขอจัดซื้อสินค้าหรืออุปกรณ์ใหม่', to: '/procurement/create', icon: '📝' },
  { label: 'รายการคำขอ', desc: 'ดูรายการคำขอจัดซื้อทั้งหมด', to: '/procurement/requests', icon: '📋' },
  { label: 'ลงทะเบียนสินทรัพย์', desc: 'บันทึกสินทรัพย์ที่ได้รับเข้าระบบ', to: '/procurement/register-asset', icon: '🏷️' },
]

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

export default function ProcurementHome() {
  const { can } = useAuth()
  const isManager = can(PERMISSIONS.PROCUREMENT_APPROVE)
  const [statCards, setStatCards] = useState([
    { label: 'คำขอทั้งหมด', value: 0, color: colors.brandGreen },
    { label: 'รอการอนุมัติ', value: 0, color: '#b45309' },
    { label: 'อนุมัติแล้ว', value: 0, color: '#166534' },
    { label: 'ถูกปฏิเสธ', value: 0, color: '#b91c1c' },
  ])
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const data = await api.requests.getAll()
      if (!data) return

      const total = data.length
      const pending = data.filter((r: any) => r.status === 'pending').length
      const approved = data.filter((r: any) => r.status === 'approved').length
      const rejected = data.filter((r: any) => r.status === 'rejected').length

      setStatCards([
        { label: 'คำขอทั้งหมด', value: total, color: colors.brandGreen },
        { label: 'รอการอนุมัติ', value: pending, color: '#b45309' },
        { label: 'อนุมัติแล้ว', value: approved, color: '#166534' },
        { label: 'ถูกปฏิเสธ', value: rejected, color: '#b91c1c' },
      ])
      setRecentRequests(data.slice(0, 5))
    }
    fetchData()
  }, [])
  return (
    <ProcurementLayout title="Homepage">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, color: colors.inkMuted }}>
          {isManager
            ? 'ภาพรวมระบบจัดซื้อทั้งหมด — คุณมีสิทธิ์อนุมัติคำขอ'
            : 'ยินดีต้อนรับ — คุณสามารถสร้างคำขอจัดซื้อและติดตามสถานะได้ที่นี่'}
        </Typography>

        {/* Stat cards */}
        <Box sx={{ display: 'flex', gap: '16px' }}>
          {statCards.map((s) => (
            <Paper
              key={s.label}
              variant="outlined"
              sx={{
                flex: 1,
                p: '20px',
                borderRadius: '12px',
                borderColor: '#e2e7e2',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, fontWeight: 700, color: s.color }}>
                {s.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Quick actions */}
        <Box>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, color: colors.brandGreen, mb: '14px', fontWeight: 600 }}>
            การดำเนินการด่วน
          </Typography>
          <Box sx={{ display: 'flex', gap: '16px' }}>
            {QUICK_ACTIONS.map((a) => (
              <Paper
                key={a.to}
                component={Link}
                to={a.to}
                variant="outlined"
                sx={{
                  flex: 1,
                  p: '20px',
                  borderRadius: '12px',
                  borderColor: '#e2e7e2',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'box-shadow 200ms',
                  '&:hover': { boxShadow: '0 4px 14px rgba(18,55,47,0.12)', borderColor: colors.brandGreen },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    bgcolor: '#e4ece1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {a.icon}
                </Box>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: colors.brandGreen }}>
                  {a.label}
                </Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
                  {a.desc}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Recent requests */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '14px' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, color: colors.brandGreen, fontWeight: 600 }}>
              คำขอล่าสุด
            </Typography>
            <Link
              to="/procurement/requests"
              style={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.brandGreen, textDecoration: 'none' }}
            >
              ดูทั้งหมด →
            </Link>
          </Box>

          <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e7e2', overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', bgcolor: '#f8f5ee', px: '20px', py: '10px' }}>
              {['เลขที่', 'รายการ', 'วงเงิน (บาท)', 'สถานะ', 'วันที่'].map((h) => (
                <Typography key={h} sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </Typography>
              ))}
            </Box>
            {recentRequests.map((r, i) => (
              <Box
                key={r.id}
                component={Link}
                to={`/procurement/details?id=${r.id}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                  px: '20px',
                  py: '14px',
                  borderTop: i === 0 ? '1px solid #e2e7e2' : '1px solid #f0f0f0',
                  textDecoration: 'none',
                  transition: 'background-color 150ms',
                  '&:hover': { bgcolor: '#f8f5ee' },
                }}
              >
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.brandGreen, fontWeight: 500 }}>
                  #{r.id}
                </Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>
                  {r.title}
                </Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>
                  {r.total_price.toLocaleString('th-TH')}
                </Typography>
                <Box>
                  <Box
                    component="span"
                    sx={{
                      px: '10px', py: '3px', borderRadius: '999px',
                      fontSize: 12, fontFamily: fonts.kanit,
                      color: STATUS_STYLE[r.status]?.color, bgcolor: STATUS_STYLE[r.status]?.bg,
                    }}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Box>
                </Box>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.inkMuted }}>
                  {new Date(r.request_date).toLocaleDateString('th-TH')}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </ProcurementLayout>
  )
}
