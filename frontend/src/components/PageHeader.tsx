import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import { fonts, sidebar as s } from '../theme'

/**
 * แถบหัวของหน้า — ชื่อหน้าอยู่ซ้าย เส้นทางที่มา (breadcrumb) อยู่ขวา
 *
 *   <PageHeader title="จัดการกิจกรรม" />
 *   <PageHeader title="จัดการกิจกรรม" trail={[{ label: 'ประชาสัมพันธ์', to: '/employees/pr' }]} />
 *
 * ไม่ส่ง trail มาจะได้ "หน้าแรก › ชื่อหน้า" ให้อัตโนมัติ
 */

export interface Crumb {
  label: string
  to?: string
}

interface PageHeaderProps {
  title: string
  /** ขั้นกลางระหว่างหน้าแรกกับหน้านี้ ไม่ใส่ก็ได้ */
  trail?: Crumb[]
}

const crumbSx = {
  fontFamily: fonts.thai,
  fontSize: 13.5,
  lineHeight: 1.5,
  whiteSpace: 'nowrap',
} as const

export default function PageHeader({ title, trail = [] }: PageHeaderProps) {
  const crumbs: Crumb[] = [{ label: 'หน้าแรก', to: '/' }, ...trail, { label: title }]

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        pb: '24px',
      }}
    >
      <Typography
        component="h1"
        sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 20, lineHeight: 1.3, color: s.itemHoverInk }}
      >
        {title}
      </Typography>

      <Box component="nav" aria-label="เส้นทาง" sx={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {crumb.to && !last ? (
                <Box
                  component={Link}
                  to={crumb.to}
                  sx={{ ...crumbSx, color: s.item, textDecoration: 'none', '&:hover': { color: s.itemHoverInk } }}
                >
                  {crumb.label}
                </Box>
              ) : (
                <Typography
                  component="span"
                  aria-current={last ? 'page' : undefined}
                  sx={{ ...crumbSx, color: last ? s.itemHoverInk : s.item }}
                >
                  {crumb.label}
                </Typography>
              )}
              {!last && <ChevronRightRounded sx={{ fontSize: 16, color: s.item, flexShrink: 0 }} />}
            </Fragment>
          )
        })}
      </Box>
    </Box>
  )
}
