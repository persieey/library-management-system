
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import ProcurementLayout from '../ProcurementLayout'
import { useAuth } from '../../../auth/useAuth'
import { PERMISSIONS } from '../../../config/roles'
import { api } from '../../../services/api'
import { colors, fonts } from '../../../theme'

interface Request {
  id: string
  request_date: string
  status: string
  employee_id: string
  title: string
  category: string
  quantity: number
  total_price: number
  priority: string
}

type StatusFilter = 'ทั้งหมด' | 'รอการอนุมัติ' | 'อนุมัติแล้ว' | 'ถูกปฏิเสธ' | 'ร่าง'

const STATUS_TABS: StatusFilter[] = ['ทั้งหมด', 'รอการอนุมัติ', 'อนุมัติแล้ว', 'ถูกปฏิเสธ']

const STATUS_LABEL: Record<string, string> = {
  pending: 'รอการอนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ถูกปฏิเสธ',
  draft: 'ร่าง',
  'รอการอนุมัติ': 'รอการอนุมัติ',
  'อนุมัติแล้ว': 'อนุมัติแล้ว',
  'ถูกปฏิเสธ': 'ถูกปฏิเสธ',
  'ร่าง': 'ร่าง',
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending: { color: '#b45309', bg: '#fef3c7' },
  approved: { color: '#166534', bg: '#dcfce7' },
  rejected: { color: '#b91c1c', bg: '#fee2e2' },
  draft: { color: '#64748b', bg: '#f1f5f9' },
  'รอการอนุมัติ': { color: '#b45309', bg: '#fef3c7' },
  'อนุมัติแล้ว': { color: '#166534', bg: '#dcfce7' },
  'ถูกปฏิเสธ': { color: '#b91c1c', bg: '#fee2e2' },
  'ร่าง': { color: '#64748b', bg: '#f1f5f9' },
}

const HEADERS = ['เลขที่คำขอ', 'รายการ', 'หมวดหมู่', 'วงเงิน (บาท)', 'สถานะ', 'วันที่', '']

export default function RequestList() {
  const { user, can } = useAuth()
  const isManager = can(PERMISSIONS.PROCUREMENT_APPROVE)

  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('ทั้งหมด')
  const [query, setQuery] = useState('')


  useEffect(() => {
    const fetchRequests = async () => {
      const data = await api.requests.getAll()
      const result = can(PERMISSIONS.PROCUREMENT_APPROVE)
        ? data
        : data.filter((r: any) => r.employee_id === user?.user_id)
      setRequests(result ?? [])
      setLoading(false)
    }
    fetchRequests()
}, [])


  const FILTER_TO_DB: Record<string, string> = {
    'รอการอนุมัติ': 'pending',
    'อนุมัติแล้ว': 'approved',
    'ถูกปฏิเสธ': 'rejected',
    'ร่าง': 'draft',
  }

  const filtered = useMemo(() => {
    const dbStatus = FILTER_TO_DB[filter]
    return requests
      .filter((r) => filter === 'ทั้งหมด' || r.status === dbStatus || r.status === filter)
      .filter((r) => r.title?.includes(query) || String(r.id)?.includes(query))
  }, [filter, query, requests])

  return (
    <ProcurementLayout title="Request List">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Filter + search bar */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            p: '12px 16px',
            borderRadius: '12px',
            borderColor: '#e2e7e2',
            bgcolor: 'white',
          }}
        >
          <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUS_TABS.map((tab) => (
              <Box
                key={tab}
                component="button"
                onClick={() => setFilter(tab)}
                sx={{
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '20px',
                  px: '14px',
                  py: '6px',
                  fontFamily: fonts.kanit,
                  fontSize: 13,
                  bgcolor: filter === tab ? colors.brandGreen : '#f0f0f0',
                  color: filter === tab ? 'white' : colors.inkMuted,
                  transition: 'all 150ms',
                }}
              >
                {tab}
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #e2e7e2',
              borderRadius: '8px',
              px: '12px',
              py: '6px',
            }}
          >
            
            <InputBase
              placeholder="ค้นหาเลขที่หรือชื่อรายการ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ flex: 1, fontFamily: fonts.kanit, fontSize: 13 }}
            />
          </Box>

          <Link
            to="/procurement/create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: colors.brandGreen,
              color: 'white',
              fontFamily: fonts.kanit,
              fontSize: 14,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            + สร้างคำขอใหม่
          </Link>
        </Paper>

        {/* Table */}
        <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e7e2', overflow: 'hidden' }}>
          {/* Table header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 2fr 1.5fr 1.2fr 1.2fr 1fr 80px',
              bgcolor: '#f8f5ee',
              px: '20px',
              py: '12px',
              borderBottom: '1px solid #e2e7e2',
            }}
          >
            {HEADERS.map((h) => (
              <Typography key={h} sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {h}
              </Typography>
            ))}
          </Box>

          {loading ? (
            <Box sx={{ py: '40px', textAlign: 'center' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, color: colors.inkMuted }}>
                กำลังโหลด...
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: '40px', textAlign: 'center' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, color: colors.inkMuted }}>
                ไม่พบรายการที่ตรงกับเงื่อนไข
              </Typography>
            </Box>
          ) : (
            filtered.map((r, i) => {
              const style = STATUS_STYLE[r.status] ?? { color: '#64748b', bg: '#f1f5f9' }
              const statusLabel = STATUS_LABEL[r.status] ?? r.status
              const dateStr = r.request_date
                ? new Date(r.request_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
                : '-'
              return (
                <Box
                  key={r.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 2fr 1.5fr 1.2fr 1.2fr 1fr 80px',
                    px: '20px',
                    py: '14px',
                    borderTop: i === 0 ? '1px solid #e2e7e2' : '1px solid #f0f0f0',
                    alignItems: 'center',
                    transition: 'background-color 150ms',
                    '&:hover': { bgcolor: '#fafafa' },
                  }}
                >
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.brandGreen, fontWeight: 500 }}>
                    #{r.id}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>
                    {r.title}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
                    {r.category}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>
                    {r.total_price?.toLocaleString('th-TH')}
                  </Typography>
                  <Box>
                    <Box
                      component="span"
                      sx={{
                        px: '10px', py: '3px', borderRadius: '999px',
                        fontSize: 12, fontFamily: fonts.kanit,
                        color: style.color, bgcolor: style.bg,
                      }}
                    >
                      {statusLabel}
                    </Box>
                  </Box>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
                    {dateStr}
                  </Typography>
                  <Link
                    to={`/procurement/details?id=${r.id}`}
                    style={{
                      fontFamily: fonts.kanit,
                      fontSize: 13,
                      color: colors.brandGreen,
                      textDecoration: 'none',
                    }}
                  >
                    ดูรายละเอียด
                  </Link>
                </Box>
              )
            })
          )}
        </Paper>

        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
          แสดง {filtered.length} รายการ {isManager ? '(ทุกคำขอในระบบ)' : '(เฉพาะคำขอของคุณ)'}
        </Typography>
      </Box>
    </ProcurementLayout>
  )
}
