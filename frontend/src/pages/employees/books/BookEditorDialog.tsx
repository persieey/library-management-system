import { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import type { Book, BookDraft } from '../../../interface/IBookInterface'
import { bookCoverUrl } from '../../../services/https/books'
import { colors, fonts } from '../../../theme'

export const CATEGORIES = ['นวนิยาย', 'วิชาการ', 'การ์ตูน', 'จิตวิทยา', 'ประวัติศาสตร์', 'อื่นๆ']

const EMPTY: BookDraft = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  category: '',
  call_number: '',
  description: '',
}

interface Props {
  open: boolean
  editingItem: Book | null
  onClose: () => void
  onSubmit: (draft: BookDraft, cover: File | null) => void
}

function BookEditorDialog({ open, editingItem, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<BookDraft>(EMPTY)
  const [cover, setCover] = useState<File | null>(null)
  const [error, setError] = useState('')

  // เติมค่าเดิมตอนเปิดแก้ไข และล้างฟอร์มตอนเปิดสร้างใหม่
  useEffect(() => {
    if (!open) return
    setCover(null)
    setError('')
    if (editingItem) {
      setDraft({
        isbn: editingItem.isbn,
        title: editingItem.title,
        author: editingItem.author,
        publisher: editingItem.publisher,
        category: editingItem.category,
        call_number: editingItem.call_number,
          description: editingItem.description,
      })
    } else {
      setDraft(EMPTY)
    }
  }, [open, editingItem])

  const set = (key: keyof BookDraft) => (e: { target: { value: string } }) =>
    setDraft((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = () => {
    if (!draft.title.trim() || !draft.author.trim()) {
      setError('กรุณากรอกชื่อหนังสือและผู้แต่ง')
      return
    }
    onSubmit(draft, cover)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: fonts.kanit, fontSize: 24, color: colors.brandGreen }}>
        {editingItem ? 'แก้ไขหนังสือ' : 'เพิ่มหนังสือ'}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px', pt: '8px !important' }}>
        <TextField
          label="ชื่อหนังสือ"
          value={draft.title}
          onChange={set('title')}
          required
          fullWidth
        />
        <TextField label="ผู้แต่ง" value={draft.author} onChange={set('author')} required fullWidth />

        <Box sx={{ display: 'flex', gap: '16px' }}>
          <TextField label="ISBN" value={draft.isbn} onChange={set('isbn')} fullWidth />
          <TextField
            label="เลขเรียกหนังสือ"
            value={draft.call_number}
            onChange={set('call_number')}
            fullWidth
          />
        </Box>

        <Box sx={{ display: 'flex', gap: '16px' }}>
          <TextField
            label="สำนักพิมพ์"
            value={draft.publisher}
            onChange={set('publisher')}
            fullWidth
          />
          <TextField select label="หมวดหมู่" value={draft.category} onChange={set('category')} fullWidth>
            <MenuItem value="">ไม่ระบุ</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Box>
          <TextField
          label="คำบรรยาย"
          value={draft.description}
          onChange={set('description')}
          multiline
          rows={3}
          fullWidth
        />

        <Box>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted, mb: '8px' }}>
            รูปปก
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {editingItem?.cover_path && !cover && (
              <Box
                component="img"
                src={bookCoverUrl(editingItem.book_id, editingItem.updated_at)}
                alt=""
                sx={{ width: 60, height: 84, objectFit: 'cover', borderRadius: '6px' }}
              />
            )}

            <Button component="label" variant="outlined" sx={{ fontFamily: fonts.thai }}>
              {cover ? cover.name : 'เลือกไฟล์รูป'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              />
            </Button>
          </Box>
        </Box>

        {error && (
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: 'error.main' }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: '24px', pb: '16px' }}>
        <Button onClick={onClose} sx={{ fontFamily: fonts.thai, color: colors.inkMuted }}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ fontFamily: fonts.thai, bgcolor: colors.brandGreen }}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BookEditorDialog