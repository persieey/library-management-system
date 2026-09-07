import { useState, useEffect } from 'react'
import { api } from '../../../services/api'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ProcurementLayout from '../ProcurementLayout'
import { colors, fonts } from '../../../theme'

interface Stats {
  total: number
  approved: number
  totalAmount: number
  approvalRate: string
}

interface CategoryStat {
  cat: string
  count: number
  amount: number
  pct: number
}

interface RequesterStat {
  name: string
  requests: number
  amount: number
}




export default function ProcurementOverview() {
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, totalAmount: 0, approvalRate: '0%' })
  const [byCategory, setByCategory] = useState<CategoryStat[]>([])
  const [topRequesters, setTopRequesters] = useState<RequesterStat[]>([])
  useEffect(() => {
  const fetchData = async () => {
    const data = await api.requests.getAll()
    if (!data) return

    const total = data.length
    const approved = data.filter((r) => r.status === 'approved').length
    const totalAmount = data.reduce((s, r) => s + (r.total_price ?? 0), 0)
    const approvalRate = total > 0 ? `${((approved / total) * 100).toFixed(1)}%` : '0%'
    setStats({ total, approved, totalAmount, approvalRate })

    const catMap: Record<string, { count: number; amount: number }> = {}
    data.forEach((r) => {
      const cat = r.category ?? 'อื่นๆ'
      if (!catMap[cat]) catMap[cat] = { count: 0, amount: 0 }
      catMap[cat].count++
      catMap[cat].amount += r.total_price ?? 0
    })
    const catArr = Object.entries(catMap).map(([cat, v]) => ({
      cat, count: v.count, amount: v.amount,
      pct: Math.round((v.count / total) * 100),
    })).sort((a, b) => b.amount - a.amount)
    setByCategory(catArr)

    const reqMap: Record<string, { requests: number; amount: number }> = {}
    data.forEach((r) => {
      const emp = String((r as any).requester_name || r.employee_id || 'unknown')
      if (!reqMap[emp]) reqMap[emp] = { requests: 0, amount: 0 }
      reqMap[emp].requests++
      reqMap[emp].amount += r.total_price ?? 0
    })
    const reqArr = Object.entries(reqMap).map(([name, v]) => ({
      name, requests: v.requests, amount: v.amount,
    })).sort((a, b) => b.requests - a.requests).slice(0, 5)
    setTopRequesters(reqArr)
  }
  fetchData()
}, [])
  return (
    <ProcurementLayout title="Overview">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, color: colors.inkMuted }}>
          ภาพรวมระบบจัดซื้อ — ปีงบประมาณ 2569
        </Typography>

        {/* Summary stats */}
        <Box sx={{ display: 'flex', gap: '16px' }}>
          {[
            { label: 'คำขอทั้งหมด', value: String(stats.total), color: colors.brandGreen },
            { label: 'อนุมัติแล้ว', value: String(stats.approved), color: '#166534' },
            { label: 'วงเงินรวม (บาท)', value: stats.totalAmount.toLocaleString('th-TH'), color: colors.brandGreen },
            { label: 'อัตราการอนุมัติ', value: stats.approvalRate, color: '#166534' },
          ].map((s) => (
            <Paper key={s.label} variant="outlined" sx={{ flex: 1, p: '20px', borderRadius: '12px', borderColor: '#e2e7e2' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, mb: '6px' }}>{s.label}</Typography>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: '20px' }}>
          {/* Monthly chart */}
          <Paper variant="outlined" sx={{ flex: 2, borderRadius: '14px', borderColor: '#e2e7e2', p: '24px' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: colors.brandGreen, mb: '20px' }}>
              วงเงินจัดซื้อรายเดือน (6 เดือนล่าสุด)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', height: 140 }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
                (กราฟรายเดือนจะแสดงเมื่อมีข้อมูลเพียงพอ)
              </Typography>
            </Box>
          </Paper>

          {/* By category */}
          <Paper variant="outlined" sx={{ flex: 1, borderRadius: '14px', borderColor: '#e2e7e2', p: '24px' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: colors.brandGreen, mb: '16px' }}>
              แบ่งตามหมวดหมู่
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {byCategory.map((c) => (
                <Box key={c.cat}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '4px' }}>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.ink }}>{c.cat}</Typography>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted }}>{c.pct}%</Typography>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: '3px', bgcolor: '#e4ece1', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${c.pct}%`, bgcolor: colors.brandGreen, borderRadius: '3px' }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Top requesters */}
        <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '24px' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: colors.brandGreen, mb: '16px' }}>
            ผู้ยื่นคำขอสูงสุด
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {topRequesters.map((r, i) => (
              <Box
                key={r.name}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  py: '14px', borderBottom: i < topRequesters.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: '50%', bgcolor: '#e4ece1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: fonts.kanit, fontSize: 13, color: colors.brandGreen, fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>{r.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '32px' }}>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.inkMuted }}>
                    {r.requests} คำขอ
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, fontWeight: 600, color: colors.brandGreen }}>
                    {r.amount.toLocaleString('th-TH')} บาท
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </ProcurementLayout>
  )
}
