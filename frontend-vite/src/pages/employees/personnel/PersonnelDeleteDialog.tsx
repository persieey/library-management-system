import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { Personnel } from '../../../interface/IPersonnelInterface'
import { fonts } from '../../../theme'

interface Props {
  target: Personnel | null
  onClose: () => void
  onConfirm: () => void
}

export default function PersonnelDeleteDialog({ target, onClose, onConfirm }: Props) {
  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: fonts.kanit, fontWeight: 600, color: '#c62828' }}>
        ยืนยันการลบ
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontFamily: fonts.kanit }}>
          ต้องการลบข้อมูลของ{' '}
          <strong>{target?.firstName} {target?.lastName}</strong>{' '}
          ({target?.staffId}) ออกจากระบบใช่หรือไม่?
        </Typography>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: 'text.secondary', mt: 1 }}>
          การลบไม่สามารถเรียกคืนได้ หากต้องการเก็บประวัติแนะนำให้เปลี่ยนสถานะเป็น Inactive แทน
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: fonts.kanit, color: 'text.secondary' }}>ยกเลิก</Button>
        <Button onClick={onConfirm} variant="contained" color="error"
          sx={{ fontFamily: fonts.kanit }}>
          ลบ
        </Button>
      </DialogActions>
    </Dialog>
  )
}
