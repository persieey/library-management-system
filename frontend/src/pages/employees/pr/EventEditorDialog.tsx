import { useEffect, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import dayjs, { type Dayjs } from 'dayjs'
import type { EventItem, EventDraft } from '../../../interface/IEventInterface'
import { colors, fonts } from '../../../theme'

const EMPTY_DRAFT: EventDraft = {
  image: '',
  date: dayjs().toISOString(),
  allDay: false,
  title: '',
  location: '',
  description: '',
}

interface EventEditorDialogProps {
  open: boolean
  editingItem: EventItem | null
  onClose: () => void
  onSubmit: (draft: EventDraft) => void
}

// ฟอร์มสร้าง/แก้ไขกิจกรรม — ยังไม่ได้ต่อ backend จริง เก็บแค่ใน state ของหน้า
// รูปที่อัปโหลดถูกแปลงเป็น data URL ไว้ใน state เท่านั้น ไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์
function EventEditorDialog({ open, editingItem, onClose, onSubmit }: EventEditorDialogProps) {
  const [draft, setDraft] = useState<EventDraft>(EMPTY_DRAFT)
  const [dateValue, setDateValue] = useState<Dayjs | null>(dayjs())
  const [timeValue, setTimeValue] = useState<Dayjs | null>(dayjs())
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setError('')
    const next = editingItem
      ? {
          image: editingItem.image,
          date: editingItem.date,
          allDay: editingItem.allDay,
          title: editingItem.title,
          location: editingItem.location,
          description: editingItem.description,
        }
      : EMPTY_DRAFT
    setDraft(next)
    const parsed = dayjs(next.date)
    setDateValue(parsed)
    setTimeValue(parsed)
  }, [open, editingItem])

  const combineDateTime = (date: Dayjs | null, time: Dayjs | null, allDay: boolean) => {
    const base = date ?? dayjs()
    if (allDay) return base.startOf('day').toISOString()
    const t = time ?? dayjs()
    return base.hour(t.hour()).minute(t.minute()).second(0).millisecond(0).toISOString()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDraft((d) => ({ ...d, image: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!draft.title.trim()) {
      setError('กรุณากรอกชื่อกิจกรรม')
      return
    }
    if (!draft.location.trim()) {
      setError('กรุณากรอกสถานที่')
      return
    }
    onSubmit({ ...draft, date: combineDateTime(dateValue, timeValue, draft.allDay) })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: fonts.kanit, color: colors.brandGreen }}>
        {editingItem ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรม'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            id="event-title"
            label="ชื่อกิจกรรม"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            error={Boolean(error)}
            helperText={error}
            autoFocus
            fullWidth
          />
          <TextField
            id="event-location"
            label="สถานที่"
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            fullWidth
          />
          <TextField
            id="event-description"
            label="รายละเอียด"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            multiline
            minRows={3}
            fullWidth
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <DatePicker
                label="วันที่จัดกิจกรรม"
                value={dateValue}
                onChange={setDateValue}
                slotProps={{ textField: { id: 'event-date', fullWidth: true } }}
              />
              {!draft.allDay && (
                <TimePicker
                  label="เวลา"
                  value={timeValue}
                  onChange={setTimeValue}
                  slotProps={{ textField: { id: 'event-time', fullWidth: true } }}
                />
              )}
            </Stack>
          </LocalizationProvider>

          <FormControlLabel
            control={
              <Checkbox
                checked={draft.allDay}
                onChange={(e) => setDraft({ ...draft, allDay: e.target.checked })}
              />
            }
            label="ทั้งวัน (All Day)"
          />

          <Box>
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              sx={{ fontFamily: fonts.kanit, borderColor: colors.border, color: colors.ink }}
            >
              เลือกรูปภาพ
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
            {draft.image && (
              <Box
                component="img"
                src={draft.image}
                alt=""
                sx={{ mt: 1.5, height: 100, width: 160, borderRadius: '10px', objectFit: 'cover', display: 'block' }}
              />
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: fonts.kanit }}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ fontFamily: fonts.kanit, bgcolor: colors.brandGreen, '&:hover': { bgcolor: colors.brandGreen } }}
        >
          {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มกิจกรรม'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EventEditorDialog
