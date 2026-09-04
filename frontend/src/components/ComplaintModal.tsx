import { useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import CloseRounded from '@mui/icons-material/CloseRounded'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import { useAuth } from '../auth/useAuth'
import { createComplaint } from '../services/https/complaints'
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  type ComplaintDraft,
} from '../interface/IComplaintInterface'
import { colors, fonts, sidebar as s } from '../theme'

/**
 * หน้าต่างแจ้งปัญหาและข้อเสนอแนะ
 *
 * ฟอร์มและตัวเลือกทั้งหมดยกมาจาก ComplaintModal ของ B6707590 (ธนกร) เจ้าของระบบร้องเรียน
 * แต่เขียนใหม่ด้วย MUI + ธีมของโปรเจคนี้ แทนการนำไฟล์ CSS ของเขามาปน
 */

const EMPTY: ComplaintDraft = {
  topic: '',
  category: COMPLAINT_CATEGORIES[0].value,
  priority: COMPLAINT_PRIORITIES[0].value,
  description: '',
  location: '',
  attachedImage: '',
}

// ขนาดรูปแนบสูงสุด — รูปถูกแปลงเป็น data URI ฝังไปกับคำขอ ใหญ่เกินไปจะส่งไม่ผ่าน
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const fieldSx = {
  '& .MuiInputBase-input, & .MuiInputBase-root, & label': { fontFamily: fonts.thai, fontSize: 14 },
} as const

interface ComplaintModalProps {
  open: boolean
  onClose: () => void
}

export default function ComplaintModal({ open, onClose }: ComplaintModalProps) {
  const { user, token } = useAuth()
  const [draft, setDraft] = useState<ComplaintDraft>(EMPTY)
  const [imageName, setImageName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof ComplaintDraft>(key: K, value: ComplaintDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const handleClose = () => {
    setDraft(EMPTY)
    setImageName('')
    setError('')
    setSubmitted(false)
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setError('รูปใหญ่เกิน 2 MB กรุณาเลือกรูปที่เล็กกว่านี้')
      e.target.value = ''
      return
    }
    setError('')
    setImageName(file.name)
    const reader = new FileReader()
    reader.onloadend = () => set('attachedImage', String(reader.result))
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    set('attachedImage', '')
    setImageName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createComplaint(draft, token, user?.user_id)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'ส่งเรื่องไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
    >
      {submitted ? (
        <Box sx={{ p: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <CheckCircleRounded sx={{ fontSize: 64, color: '#16a34a' }} />
          <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 22, color: s.itemHoverInk }}>
            ส่งเรื่องเรียบร้อยแล้ว
          </Typography>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14.5, color: s.item, maxWidth: 380, lineHeight: 1.7 }}>
            เรื่องของคุณถูกบันทึกเข้าระบบแล้ว เจ้าหน้าที่หอสมุดจะตรวจสอบและดำเนินการโดยเร็วที่สุด
          </Typography>
          <Button
            onClick={handleClose}
            variant="contained"
            disableElevation
            sx={{ mt: '8px', bgcolor: colors.brandGreen, fontFamily: fonts.thai, borderRadius: '8px', px: '28px', textTransform: 'none', '&:hover': { bgcolor: colors.accentGreen } }}
          >
            ปิด
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', p: '24px 24px 8px' }}>
            <Box>
              <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 20, color: s.itemHoverInk }}>
                แจ้งปัญหาและข้อเสนอแนะ
              </Typography>
              <Typography sx={{ mt: '4px', fontFamily: fonts.thai, fontSize: 13.5, color: s.item }}>
                กรอกรายละเอียดปัญหาหรือข้อเสนอแนะ เพื่อให้เจ้าหน้าที่ตรวจสอบ
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small" aria-label="ปิด">
              <CloseRounded />
            </IconButton>
          </Box>

          <Box sx={{ px: '24px', pb: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <Alert severity="error" sx={{ fontFamily: fonts.thai, fontSize: 14 }}>{error}</Alert>}

            <TextField select required size="small" label="หมวดปัญหา" value={draft.category}
              onChange={(e) => set('category', e.target.value)} sx={fieldSx}>
              {COMPLAINT_CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value} sx={{ fontFamily: fonts.thai, fontSize: 14 }}>{c.label}</MenuItem>
              ))}
            </TextField>

            <TextField select required size="small" label="ระดับความเร่งด่วน" value={draft.priority}
              onChange={(e) => set('priority', e.target.value)} sx={fieldSx}>
              {COMPLAINT_PRIORITIES.map((p) => (
                <MenuItem key={p.value} value={p.value} sx={{ fontFamily: fonts.thai, fontSize: 14, display: 'flex', gap: '10px' }}>
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: p.dot, flexShrink: 0 }} />
                  {p.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField required size="small" label="หัวข้อเรื่อง" value={draft.topic}
              placeholder="เช่น แอร์มีน้ำหยด ปลั๊กไฟใช้ไม่ได้"
              onChange={(e) => set('topic', e.target.value)} sx={fieldSx} />

            <TextField required size="small" label="จุดที่พบปัญหา" value={draft.location}
              placeholder="เช่น ชั้น 2 โซนอ่านเงียบ ฝั่งเหนือ"
              onChange={(e) => set('location', e.target.value)} sx={fieldSx} />

            <TextField required multiline rows={4} size="small" label="รายละเอียด" value={draft.description}
              placeholder="อธิบายอาการที่พบ หรือข้อเสนอแนะ"
              onChange={(e) => set('description', e.target.value)} sx={fieldSx} />

            <Box>
              <Typography sx={{ fontFamily: fonts.thai, fontSize: 13.5, color: s.item, mb: '6px' }}>
                แนบรูป (ไม่บังคับ)
              </Typography>
              <input type="file" ref={fileRef} accept="image/*" hidden onChange={handleImage} />
              {draft.attachedImage ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', border: `1px solid ${s.border}`, borderRadius: '10px', p: '10px 12px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Box component="img" src={draft.attachedImage} alt="" sx={{ width: 42, height: 42, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                    <Typography sx={{ fontFamily: fonts.thai, fontSize: 13.5, color: s.itemHoverInk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {imageName}
                    </Typography>
                  </Box>
                  <Button onClick={removeImage} size="small" sx={{ flexShrink: 0, color: '#dc2626', fontFamily: fonts.thai, fontSize: 13, textTransform: 'none' }}>
                    เอาออก
                  </Button>
                </Box>
              ) : (
                <Box
                  component="button"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  sx={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    border: `1px dashed ${s.border}`, borderRadius: '10px', bgcolor: 'transparent',
                    p: '18px', cursor: 'pointer', color: s.item, fontFamily: fonts.thai, fontSize: 13.5,
                    '&:hover': { bgcolor: s.itemHoverBg },
                  }}
                >
                  <ImageOutlined sx={{ fontSize: 22 }} />
                  กดเพื่อเลือกรูป (PNG, JPG ไม่เกิน 2 MB)
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', p: '16px 24px 24px' }}>
            <Button onClick={handleClose} sx={{ fontFamily: fonts.thai, color: s.item, textTransform: 'none' }}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={submitting}
              sx={{ bgcolor: colors.brandGreen, fontFamily: fonts.thai, borderRadius: '8px', px: '24px', textTransform: 'none', '&:hover': { bgcolor: colors.accentGreen } }}
            >
              {submitting ? 'กำลังส่ง...' : 'ส่งเรื่อง'}
            </Button>
          </Box>
        </Box>
      )}
    </Dialog>
  )
}
