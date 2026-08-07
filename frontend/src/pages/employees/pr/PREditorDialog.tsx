import { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs, { type Dayjs } from 'dayjs'
import type { PRItem, PRStatus, PRDraft } from '../../../interface/IPRInterface'
import { formatThaiDate, parseThaiDate, THAI_DATE_PICKER_FORMAT, THAI_DATETIME_PICKER_FORMAT } from './dateFormat'
import { colors, fonts } from '../../../theme'

export type { PRDraft }

const STATUS_OPTIONS: PRStatus[] = ['ร่าง', 'เผยแพร่', 'ตั้งเวลา', 'หมดอายุ']

const EMPTY_DRAFT: PRDraft = {
  title: '',
  content: '',
  channel: 'website', // ตอนนี้มีแค่ช่องทางเดียวจริง จึงไม่เปิดให้เลือกในฟอร์ม
  status: 'ร่าง',
  pinned: false,
  publishedAt: '—',
  expiresAt: '—',
  scheduledAt: null,
}

interface PREditorDialogProps {
  open: boolean
  editingItem: PRItem | null
  onClose: () => void
  onSubmit: (draft: PRDraft) => void
}

// ฟอร์มสร้าง/แก้ไขข่าวประชาสัมพันธ์ — ยังไม่ได้ต่อ backend จริง เก็บแค่ใน state ของหน้า
function PREditorDialog({ open, editingItem, onClose, onSubmit }: PREditorDialogProps) {
  const [draft, setDraft] = useState<PRDraft>(EMPTY_DRAFT)
  const [publishedDate, setPublishedDate] = useState<Dayjs | null>(null)
  const [expiresDate, setExpiresDate] = useState<Dayjs | null>(null)
  const [scheduledDate, setScheduledDate] = useState<Dayjs | null>(null)
  const [error, setError] = useState('')
  const [scheduleError, setScheduleError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setScheduleError('')
    const next = editingItem
      ? {
          title: editingItem.title,
          content: editingItem.content,
          channel: editingItem.channel,
          status: editingItem.status,
          pinned: editingItem.pinned,
          publishedAt: editingItem.publishedAt,
          expiresAt: editingItem.expiresAt,
          scheduledAt: editingItem.scheduledAt,
        }
      : EMPTY_DRAFT
    setDraft(next)
    setPublishedDate(parseThaiDate(next.publishedAt))
    setExpiresDate(parseThaiDate(next.expiresAt))
    setScheduledDate(next.scheduledAt ? dayjs(next.scheduledAt) : null)
  }, [open, editingItem])

  const isScheduled = draft.status === 'ตั้งเวลา'

  const handleSubmit = () => {
    if (!draft.title.trim()) {
      setError('กรุณากรอกหัวข้อข่าว')
      return
    }
    if (isScheduled && !scheduledDate) {
      setScheduleError('กรุณาเลือกวันเวลาที่จะเผยแพร่')
      return
    }
    onSubmit({ ...draft, scheduledAt: isScheduled && scheduledDate ? scheduledDate.toISOString() : null })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: fonts.kanit, color: colors.brandGreen }}>
        {editingItem ? 'แก้ไขข่าวประชาสัมพันธ์' : 'สร้างข่าวประชาสัมพันธ์'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            id="pr-title"
            label="หัวข้อข่าว"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            error={Boolean(error)}
            helperText={error}
            autoFocus
            fullWidth
          />
          <TextField
            id="pr-content"
            label="เนื้อหา"
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            select
            label="สถานะ"
            value={draft.status}
            onChange={(e) => {
              setScheduleError('')
              setDraft({ ...draft, status: e.target.value as PRStatus })
            }}
            fullWidth
          >
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
            {isScheduled && (
              <DateTimePicker
                label="วันเวลาที่จะเผยแพร่"
                value={scheduledDate}
                format={THAI_DATETIME_PICKER_FORMAT}
                onChange={(value) => {
                  setScheduledDate(value)
                  setScheduleError('')
                }}
                slotProps={{
                  textField: {
                    id: 'pr-scheduled-at',
                    fullWidth: true,
                    error: Boolean(scheduleError),
                    helperText: scheduleError,
                  },
                }}
              />
            )}
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="วันเผยแพร่"
                value={publishedDate}
                format={THAI_DATE_PICKER_FORMAT}
                onChange={(value) => {
                  setPublishedDate(value)
                  setDraft((d) => ({ ...d, publishedAt: formatThaiDate(value) }))
                }}
                slotProps={{ textField: { id: 'pr-published-at', fullWidth: true } }}
              />
              <DatePicker
                label="วันปลด"
                value={expiresDate}
                format={THAI_DATE_PICKER_FORMAT}
                onChange={(value) => {
                  setExpiresDate(value)
                  setDraft((d) => ({ ...d, expiresAt: formatThaiDate(value) }))
                }}
                slotProps={{ textField: { id: 'pr-expires-at', fullWidth: true } }}
              />
            </Stack>
          </LocalizationProvider>

          <FormControlLabel
            control={
              <Checkbox
                checked={draft.pinned}
                onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
              />
            }
            label="ปักหมุดข่าวนี้"
          />
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
          {editingItem ? 'บันทึกการแก้ไข' : 'สร้างข่าว'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PREditorDialog
