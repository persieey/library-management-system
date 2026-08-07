import { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import type { Personnel, PersonnelFormData } from '../../../interface/IPersonnelInterface'
import { DEPARTMENTS } from '../../../context/PersonnelContext'
import { fonts } from '../../../theme'

const POSITIONS = ['บรรณารักษ์', 'เจ้าหน้าที่', 'นักวิชาการ', 'ผู้ช่วยบรรณารักษ์', 'พนักงานทั่วไป']

const EMPTY: PersonnelFormData = {
  staffId: '',
  firstName: '',
  lastName: '',
  department: '',
  position: '',
  email: '',
  phone: '',
  startDate: '',
  status: 'active',
}

const fieldSx = {
  '& .MuiInputBase-input': { fontFamily: fonts.kanit },
  '& .MuiInputLabel-root': { fontFamily: fonts.kanit },
  '& .MuiFormHelperText-root': { fontFamily: fonts.kanit },
}

interface Props {
  open: boolean
  editing: Personnel | null
  onClose: () => void
  onSave: (data: PersonnelFormData) => void
}

export default function PersonnelFormDialog({ open, editing, onClose, onSave }: Props) {
  const [form, setForm] = useState<PersonnelFormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof PersonnelFormData, string>>>({})

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...editing } : EMPTY)
      setErrors({})
    }
  }, [open, editing])

  const set = (field: keyof PersonnelFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.staffId.trim()) errs.staffId = 'กรุณากรอกรหัสพนักงาน'
    if (!form.firstName.trim()) errs.firstName = 'กรุณากรอกชื่อ'
    if (!form.lastName.trim()) errs.lastName = 'กรุณากรอกนามสกุล'
    if (!form.department) errs.department = 'กรุณาเลือกแผนก'
    if (!form.position) errs.position = 'กรุณาเลือกตำแหน่ง'
    if (!form.email.trim()) errs.email = 'กรุณากรอกอีเมล'
    if (!form.startDate) errs.startDate = 'กรุณาระบุวันที่เริ่มงาน'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (validate()) onSave(form)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 20, color: '#1B5E20' }}>
        {editing ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="รหัสพนักงาน *" size="small" fullWidth sx={fieldSx}
              value={form.staffId} onChange={set('staffId')}
              error={!!errors.staffId} helperText={errors.staffId} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="ชื่อ *" size="small" fullWidth sx={fieldSx}
              value={form.firstName} onChange={set('firstName')}
              error={!!errors.firstName} helperText={errors.firstName} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="นามสกุล *" size="small" fullWidth sx={fieldSx}
              value={form.lastName} onChange={set('lastName')}
              error={!!errors.lastName} helperText={errors.lastName} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="แผนก/ส่วนงาน *" size="small" fullWidth sx={fieldSx}
              value={form.department} onChange={set('department')}
              error={!!errors.department} helperText={errors.department}>
              {DEPARTMENTS.map((d) => <MenuItem key={d} value={d} sx={{ fontFamily: fonts.kanit }}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="ตำแหน่ง *" size="small" fullWidth sx={fieldSx}
              value={form.position} onChange={set('position')}
              error={!!errors.position} helperText={errors.position}>
              {POSITIONS.map((p) => <MenuItem key={p} value={p} sx={{ fontFamily: fonts.kanit }}>{p}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="อีเมล *" type="email" size="small" fullWidth sx={fieldSx}
              value={form.email} onChange={set('email')}
              error={!!errors.email} helperText={errors.email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="เบอร์โทรศัพท์" size="small" fullWidth sx={fieldSx}
              value={form.phone} onChange={set('phone')} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="วันที่เริ่มงาน *" type="date" size="small" fullWidth sx={fieldSx}
              value={form.startDate} onChange={set('startDate')}
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.startDate} helperText={errors.startDate} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="สถานะ" size="small" fullWidth sx={fieldSx}
              value={form.status} onChange={set('status')}>
              <MenuItem value="active" sx={{ fontFamily: fonts.kanit }}>Active</MenuItem>
              <MenuItem value="inactive" sx={{ fontFamily: fonts.kanit }}>Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: fonts.kanit, color: 'text.secondary' }}>ยกเลิก</Button>
        <Button onClick={handleSave} variant="contained"
          sx={{ fontFamily: fonts.kanit, bgcolor: '#1B5E20', '&:hover': { bgcolor: '#2E7D32' } }}>
          {editing ? 'บันทึกการแก้ไข' : 'เพิ่มบุคลากร'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
