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
import type { Ebook, EbookDraft } from '../../../interface/IEbookInterface'
import { ebookCoverUrl } from '../../../services/https/ebooks'
import { colors, fonts } from '../../../theme'

export const EBOOK_CATEGORIES = ['นวนิยาย', 'วิชาการ', 'การ์ตูน', 'จิตวิทยา', 'ประวัติศาสตร์', 'อื่นๆ']

const EMPTY: EbookDraft = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  category: '',
  description: '',
}

interface Props {
  open: boolean
  editingItem: Ebook | null
  onClose: () => void
  onSubmit: (draft: EbookDraft, file: File | null, cover: File | null) => void
}

function EbookEditorDialog({ open, editingItem, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<EbookDraft>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setFile(null)
    setCover(null)
    setError('')
    if (editingItem) {
      setDraft({
        isbn: editingItem.isbn,
        title: editingItem.title,
        author: editingItem.author,
        publisher: editingItem.publisher,
        category: editingItem.category,
        description:editingItem.description,
      })
    } else {
      setDraft(EMPTY)
    }
  }, [open, editingItem])

  const set = (key: keyof EbookDraft) => (e: { target: { value: string } }) =>
    setDraft((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = () => {
    if (!draft.title.trim() || !draft.author.trim()) {
      setError('กรุณากรอกชื่อหนังสือและผู้แต่ง')
      return
    }
    onSubmit(draft, file, cover,)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: fonts.kanit, fontSize: 24, color: colors.brandGreen }}>
        {editingItem ? 'แก้ไข E-Book' : 'เพิ่ม E-Book'}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px', pt: '8px !important' }}>
        <TextField label="ชื่อหนังสือ" value={draft.title} onChange={set('title')} required fullWidth />
        <TextField label="ผู้แต่ง" value={draft.author} onChange={set('author')} required fullWidth />

        <Box sx={{ display: 'flex', gap: '16px' }}>
          <TextField label="ISBN" value={draft.isbn} onChange={set('isbn')} fullWidth />
          <TextField label="สำนักพิมพ์" value={draft.publisher} onChange={set('publisher')} fullWidth />
        </Box>

        <TextField select label="หมวดหมู่" value={draft.category} onChange={set('category')} fullWidth>
          <MenuItem value="">ไม่ระบุ</MenuItem>
          {EBOOK_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c} sx={{ fontFamily: fonts.thai }}>
              {c}
            </MenuItem>
          ))}
        </TextField>

        {/* ไฟล์ตัวเนื้อหา แนบได้เฉพาะตอนสร้างใหม่ */}
                <Box>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted, mb: '8px' }}>
            ไฟล์ E-Book (PDF / EPUB)
          </Typography>

          {editingItem?.file_name && !file && (
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted, mb: '8px' }}>
              ไฟล์ปัจจุบัน: {editingItem.file_name}
            </Typography>
          )}

          <Button component="label" variant="outlined" sx={{ fontFamily: fonts.thai }}>
            {file ? file.name : editingItem ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
            <input
              type="file"
              accept=".pdf,.epub"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Button>
        </Box>
          <TextField
          label="คำบรรยาย"
          value={draft.description}
          onChange={set('description')}
          multiline
          rows={2}
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
                src={ebookCoverUrl(editingItem.ebook_id, editingItem.updated_at)}
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

export default EbookEditorDialog