import { api } from '../../../services/api'
import { useAuth } from '../../../auth/useAuth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import ProcurementLayout from '../ProcurementLayout'
import { colors, fonts } from '../../../theme'

const CATEGORIES = ['หนังสือและสื่อการเรียน', 'ครุภัณฑ์', 'อุปกรณ์สำนักงาน', 'เทคโนโลยีสารสนเทศ', 'อื่นๆ']
const PRIORITIES = ['ปกติ', 'เร่งด่วน', 'เร่งด่วนมาก']


interface FormState {
  title: string
  category: string
  quantity: string
  unitPrice: string
  purpose: string
  priority: string
  vendor: string
  notes: string
}

const EMPTY: FormState = {
  title: '',
  category: '',
  quantity: '',
  unitPrice: '',
  purpose: '',
  priority: 'ปกติ',
  vendor: '',
  notes: '',
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink, mb: '6px' }}>
      {children}
      {required && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
    </Typography>
  )
}

export default function CreatePurchaseRequest() {
  const navigate = useNavigate()
  useAuth()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Partial<FormState>>({})

  const total = (parseFloat(form.quantity || '0') * parseFloat(form.unitPrice || '0')).toFixed(2)

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Partial<FormState> = {}
    if (!form.title) errs.title = 'กรุณาระบุชื่อรายการ'
    if (!form.category) errs.category = 'กรุณาเลือกหมวดหมู่'
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = 'กรุณาระบุจำนวน'
    if (!form.unitPrice || Number(form.unitPrice) <= 0) errs.unitPrice = 'กรุณาระบุราคาต่อหน่วย'
    if (!form.purpose) errs.purpose = 'กรุณาระบุวัตถุประสงค์'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const result = await api.requests.create({
      title: form.title,
      category: form.category,
      quantity: Number(form.quantity),
      unit_price: Number(form.unitPrice),
      total_price: Number(total),
      priority: form.priority,
      vendor: form.vendor,
      purpose: form.purpose,
      notes: form.notes,
    })

    if (!result) {
      console.error('create failed')
      return
    }

    setSaved(true)
    setTimeout(() => navigate('/procurement/requests'), 1800)
  }
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontFamily: fonts.kanit,
      fontSize: 14,
      borderRadius: '8px',
      '& fieldset': { borderColor: '#e2e7e2' },
      '&:hover fieldset': { borderColor: colors.brandGreen },
      '&.Mui-focused fieldset': { borderColor: colors.brandGreen },
    },
    '& .MuiInputLabel-root': { fontFamily: fonts.kanit, fontSize: 14 },
  }

  return (
    <ProcurementLayout title="Create Purchase Request">
      <Paper
        variant="outlined"
        sx={{ borderRadius: '16px', borderColor: '#e2e7e2', p: '36px', maxWidth: 860, bgcolor: 'white' }}
      >
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 20, fontWeight: 600, color: colors.brandGreen, mb: '28px' }}>
          แบบฟอร์มคำขอจัดซื้อ
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Row 1: title */}
          <Box>
            <FieldLabel required>ชื่อรายการ / สินค้า</FieldLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="เช่น หนังสือเรียนวิทยาศาสตร์ ม.4"
              value={form.title}
              onChange={set('title')}
              error={Boolean(errors.title)}
              helperText={errors.title}
              sx={inputSx}
            />
          </Box>

          {/* Row 2: category + priority */}
          <Box sx={{ display: 'flex', gap: '20px' }}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>หมวดหมู่</FieldLabel>
              <TextField
                select fullWidth size="small"
                value={form.category}
                onChange={set('category')}
                error={Boolean(errors.category)}
                helperText={errors.category}
                sx={inputSx}
              >
                <MenuItem value="" disabled sx={{ fontFamily: fonts.kanit }}>เลือกหมวดหมู่</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c} sx={{ fontFamily: fonts.kanit }}>{c}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel>ระดับความเร่งด่วน</FieldLabel>
              <TextField
                select fullWidth size="small"
                value={form.priority}
                onChange={set('priority')}
                sx={inputSx}
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p} value={p} sx={{ fontFamily: fonts.kanit }}>{p}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          {/* Row 3: qty + unitPrice + total */}
          <Box sx={{ display: 'flex', gap: '20px' }}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>จำนวน</FieldLabel>
              <TextField
                fullWidth size="small" type="number"
                placeholder="0"
                value={form.quantity}
                onChange={set('quantity')}
                error={Boolean(errors.quantity)}
                helperText={errors.quantity}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>ราคาต่อหน่วย (บาท)</FieldLabel>
              <TextField
                fullWidth size="small" type="number"
                placeholder="0.00"
                value={form.unitPrice}
                onChange={set('unitPrice')}
                error={Boolean(errors.unitPrice)}
                helperText={errors.unitPrice}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel>รวมทั้งสิ้น (บาท)</FieldLabel>
              <Box
                sx={{
                  height: 40,
                  borderRadius: '8px',
                  border: '1px solid #e2e7e2',
                  bgcolor: '#f8f5ee',
                  display: 'flex',
                  alignItems: 'center',
                  px: '14px',
                  fontFamily: fonts.kanit,
                  fontSize: 14,
                  color: colors.brandGreen,
                  fontWeight: 600,
                }}
              >
                {Number(total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </Box>
            </Box>
          </Box>

          {/* vendor */}
          <Box>
            <FieldLabel>ผู้จำหน่าย / ร้านค้า (ถ้ามี)</FieldLabel>
            <TextField
              fullWidth size="small"
              placeholder="ชื่อร้านหรือบริษัท"
              value={form.vendor}
              onChange={set('vendor')}
              sx={inputSx}
            />
          </Box>

          {/* purpose */}
          <Box>
            <FieldLabel required>วัตถุประสงค์การจัดซื้อ</FieldLabel>
            <TextField
              fullWidth multiline rows={3}
              placeholder="อธิบายความจำเป็นและวัตถุประสงค์ในการจัดซื้อ..."
              value={form.purpose}
              onChange={set('purpose')}
              error={Boolean(errors.purpose)}
              helperText={errors.purpose}
              sx={inputSx}
            />
          </Box>

          {/* notes */}
          <Box>
            <FieldLabel>หมายเหตุเพิ่มเติม</FieldLabel>
            <TextField
              fullWidth multiline rows={2}
              placeholder="ข้อมูลอื่นๆ ที่เกี่ยวข้อง..."
              value={form.notes}
              onChange={set('notes')}
              sx={inputSx}
            />
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: '12px', pt: '8px' }}>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                bgcolor: colors.brandGreen,
                fontFamily: fonts.kanit,
                fontSize: 15,
                px: '28px',
                py: '10px',
                borderRadius: '8px',
                '&:hover': { bgcolor: '#0d2720' },
              }}
            >
              ส่งคำขอจัดซื้อ
            </Button>
            <Button
              onClick={() => setForm(EMPTY)}
              variant="outlined"
              sx={{
                fontFamily: fonts.kanit,
                fontSize: 15,
                px: '24px',
                borderColor: '#e2e7e2',
                color: colors.inkMuted,
                borderRadius: '8px',
                '&:hover': { borderColor: colors.brandGreen, color: colors.brandGreen },
              }}
            >
              ล้างข้อมูล
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar open={saved} autoHideDuration={1800}>
        <Alert severity="success" sx={{ fontFamily: fonts.kanit }}>
          ส่งคำขอจัดซื้อเรียบร้อยแล้ว — กำลังนำทางไปยังรายการคำขอ...
        </Alert>
      </Snackbar>
    </ProcurementLayout>
  )
}
