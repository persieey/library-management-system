import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import { colors, fonts, sidebar as s } from '../theme'

/**
 * การ์ดตัวเลขสรุป — ไอคอนในกล่องมน ป้ายกำกับ ตัวเลขใหญ่ และป้ายเปอร์เซ็นต์ (ถ้ามี)
 *
 *   <StatCard icon={<PeopleAltOutlined />} label="บุคลากรทั้งหมด" value={6} />
 *   <StatCard icon={...} label="Active" value={5} valueColor="#2E7D32" />
 *   <StatCard icon={...} label="ยอดยืม" value="1,248" delta={{ text: '11.01%', direction: 'up' }} />
 *
 * วางเรียงกันด้วย <StatCardGrid> จะได้ระยะห่างและการตัดบรรทัดเหมือนกันทุกหน้า
 */

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  /** สีของตัวเลข ไม่ใส่ = สีตัวอักษรปกติ */
  valueColor?: string
  /** ป้ายเปอร์เซ็นต์มุมขวาล่าง ขึ้น = เขียว ลง = แดง */
  delta?: { text: string; direction: 'up' | 'down' }
}

// สีของป้ายเปอร์เซ็นต์ เป็นสีบอกสถานะ แยกจากสีแบรนด์
const DELTA = {
  up: { bg: '#ecfdf3', fg: '#039855' },
  down: { bg: '#fef3f2', fg: '#d92d20' },
} as const

export default function StatCard({ icon, label, value, valueColor, delta }: StatCardProps) {
  const tone = delta ? DELTA[delta.direction] : null
  const Arrow = delta?.direction === 'down' ? ArrowDownwardRounded : ArrowUpwardRounded

  return (
    <Box
      sx={{
        bgcolor: s.surface,
        border: `1px solid ${s.border}`,
        borderRadius: '16px',
        p: '24px',
        minWidth: 0,
      }}
    >
      {/* กล่องไอคอนมุมบนซ้าย */}
      <Box
        sx={{
          height: 48,
          width: 48,
          borderRadius: '12px',
          bgcolor: s.itemHoverBg,
          color: colors.brandGreen,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& svg': { fontSize: 24 },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ mt: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: s.item, lineHeight: 1.5 }}>
            {label}
          </Typography>
          <Typography
            sx={{
              mt: '6px',
              fontFamily: fonts.kanit,
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1.2,
              color: valueColor ?? s.itemHoverInk,
            }}
          >
            {value}
          </Typography>
        </Box>

        {delta && tone && (
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              borderRadius: '999px',
              bgcolor: tone.bg,
              color: tone.fg,
              pl: '8px',
              pr: '10px',
              py: '2px',
              fontFamily: fonts.inter,
              fontSize: 14,
              fontWeight: 500,
              '& svg': { fontSize: 16 },
            }}
          >
            <Arrow />
            {delta.text}
          </Box>
        )}
      </Box>
    </Box>
  )
}

/** วางการ์ดเรียงกัน จอกว้างเรียงแถวเดียว จอแคบตัดลงมาเอง */
export function StatCardGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        // auto-fit วัดจากความกว้างของพื้นที่ที่เหลือจริง ไม่ใช่ความกว้างจอ
        // จึงไม่เพี้ยนเวลามี sidebar กินที่ไป 280px
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '20px',
      }}
    >
      {children}
    </Box>
  )
}
