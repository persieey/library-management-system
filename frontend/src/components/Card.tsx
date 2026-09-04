import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { fonts, sidebar as s } from '../theme'

/**
 * กล่องเนื้อหามุมมน ใช้ครอบทุกส่วนของหน้าให้หน้าตาเหมือนกันทั้งแอป
 *
 *   <Card>เนื้อหา</Card>
 *
 *   <Card title="รายการบุคลากร" subtitle="ทั้งหมด 6 คน" actions={<Button>เพิ่ม</Button>}>
 *     <Table />
 *   </Card>
 *
 * ใส่ title เมื่อไหร่จะมีหัวการ์ดคั่นด้วยเส้นให้เอง
 * ถ้าเนื้อหาเป็นตารางที่ต้องชนขอบการ์ด ให้ใส่ noPadding
 */

interface CardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  /** ปุ่มมุมขวาของหัวการ์ด */
  actions?: ReactNode
  /** เอาระยะขอบในตัวการ์ดออก ใช้กับตารางที่ต้องกินเต็มความกว้าง */
  noPadding?: boolean
}

export default function Card({ children, title, subtitle, actions, noPadding = false }: CardProps) {
  return (
    <Box
      sx={{
        bgcolor: s.surface,
        border: `1px solid ${s.border}`,
        borderRadius: '12px',
        // กันมุมของตารางหรือรูปข้างในไม่ให้ทะลุมุมมนของการ์ด
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {(title || actions) && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: '20px',
            px: '20px',
            py: '16px',
            borderBottom: `1px solid ${s.border}`,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title && (
              <Typography
                component="h2"
                sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 18, lineHeight: 1.4, color: s.itemHoverInk }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, lineHeight: 1.5, color: s.item }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {actions && (
            <Box sx={{ display: 'flex', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>{actions}</Box>
          )}
        </Box>
      )}

      <Box sx={{ p: noPadding ? 0 : '20px', minWidth: 0 }}>{children}</Box>
    </Box>
  )
}
