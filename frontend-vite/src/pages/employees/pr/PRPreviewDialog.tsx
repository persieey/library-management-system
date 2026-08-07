import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import type { PRItem } from './PRCard'
import { colors, fonts } from '../../../theme'

interface PRPreviewDialogProps {
  item: PRItem | null
  onClose: () => void
}

// จำลองว่าข่าวนี้จะแสดงบนหน้าเว็บสาธารณะเป็นแบบไหน
function PRPreviewDialog({ item, onClose }: PRPreviewDialogProps) {
  return (
    <Dialog open={Boolean(item)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: fonts.kanit, color: colors.brandGreen }}>ตัวอย่างข่าว</DialogTitle>
      <DialogContent>
        {item && (
          <Box>
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 22, fontWeight: 600, color: colors.ink, mb: 1 }}>
              {item.title}
            </Typography>
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 15, color: colors.inkMuted, whiteSpace: 'pre-wrap' }}>
              {item.content || 'ยังไม่มีเนื้อหา'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: fonts.kanit }}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PRPreviewDialog
