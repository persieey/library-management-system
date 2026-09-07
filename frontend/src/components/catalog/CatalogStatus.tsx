import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { colors, fonts } from '../../theme'

interface CatalogStatusProps {
  isLoading: boolean
  error: string
  /** ไม่มีข้อมูลเลยในระบบ */
  isEmpty: boolean
  emptyText: string
  /** มีข้อมูล แต่ตัวกรองไม่เข้าสักรายการ */
  isNoMatch: boolean
}

// สถานะระหว่างโหลด / ผิดพลาด / ไม่มีข้อมูล ของหน้ารายการ
// คืน null เมื่อมีผลลัพธ์ให้แสดง หน้าเรียกใช้จะได้เรนเดอร์ตารางต่อได้เลย
function CatalogStatus({ isLoading, error, isEmpty, emptyText, isNoMatch }: CatalogStatusProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: '64px' }}>
        <CircularProgress size={32} sx={{ color: colors.accentGreen }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ fontFamily: fonts.thai, borderRadius: '12px' }}>
        {error}
      </Alert>
    )
  }

  if (isEmpty || isNoMatch) {
    return (
      <Box sx={{ textAlign: 'center', py: '64px' }}>
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 16, color: colors.inkMuted }}>
          {isEmpty ? emptyText : 'ไม่พบรายการที่ตรงกับที่ค้นหา'}
        </Typography>
        {isNoMatch && (
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.brown500, mt: '6px' }}>
            ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
          </Typography>
        )}
      </Box>
    )
  }

  return null
}

export default CatalogStatus
