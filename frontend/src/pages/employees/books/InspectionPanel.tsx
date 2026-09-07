import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import { useBooks } from '../../../context/BookContext'
import { useAuth } from '../../../auth/useAuth'
import { colors, fonts } from '../../../theme'

type Filter = 'all' | 'open' | 'done'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'open', label: 'ยังไม่จัดการ' },
  { key: 'done', label: 'จัดการแล้ว' },
]

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InspectionPanel() {
  const { books, copies, inspections, createInspection, toggleResolved, removeInspection } = useBooks()
  const { user } = useAuth()

  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState(false)
  const [copyId, setCopyId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')
    const [bookId, setBookId] = useState<number | ''>('')

  const items = useMemo(() => {
    if (filter === 'open') return inspections.filter((i) => !i.resolved)
    if (filter === 'done') return inspections.filter((i) => i.resolved)
    return inspections
  }, [inspections, filter])

    const copiesOfBook = useMemo(
    () => (bookId === '' ? [] : copies.filter((c) => c.book_id === bookId)),
    [copies, bookId],
  )

  /** ชื่อเรื่อง + เล่มที่ ของ copy นั้น เอาไว้แสดงในตารางและ dropdown */
  const labelOf = (id: number): string => {
    const copy = copies.find((c) => c.copy_id === id)
    if (!copy) return `เล่ม #${id}`
    const book = copy.book ?? books.find((b) => b.book_id === copy.book_id)
    return `${book?.title ?? 'ไม่ทราบชื่อ'} — เล่มที่ ${copy.copy_number}`
  }

  const handleSubmit = () => {
    if (copyId === '') {
      setFormError('กรุณาเลือกเล่มที่ตรวจ')
      return
    }
    if (!description.trim()) {
      setFormError('กรุณากรอกรายละเอียด')
      return
    }
    void createInspection({ copy_id: copyId, description: description.trim() })
    setOpen(false)
    setCopyId('')
    setDescription('')
    setFormError('')
  }

  const handleDelete = (id: number) => {
    if (!window.confirm('ต้องการลบรายการตรวจนี้ใช่หรือไม่?')) return
    void removeInspection(id)
  }

  return (
    <Box sx={{ flex: 1, py: '32px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '24px' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen }}>
          การตรวจสอบ
        </Typography>
        <Button
          onClick={() => setOpen(true)}
          startIcon={<AddRoundedIcon />}
          sx={{
            bgcolor: 'rgba(0,0,0,0.67)',
            color: 'white',
            borderRadius: '30px',
            px: '20px',
            py: '10px',
            fontFamily: fonts.kanit,
            fontSize: 16,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          }}
        >
          บันทึกการตรวจ
        </Button>
      </Box>

      <Box sx={{ display: 'flex', bgcolor: '#d6d6d6', borderRadius: '30px', p: '6px', mb: '20px', width: 'fit-content' }}>
        {FILTERS.map((f) => (
          <Box
            key={f.key}
            component="button"
            onClick={() => setFilter(f.key)}
            sx={{
              border: 'none',
              cursor: 'pointer',
              borderRadius: '30px',
              px: '18px',
              py: '8px',
              fontFamily: fonts.kanit,
              fontSize: 15,
              bgcolor: filter === f.key ? 'white' : 'transparent',
              color: '#676767',
            }}
          >
            {f.label}
          </Box>
        ))}
      </Box>

      <Box sx={{ bgcolor: 'white', borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: colors.accentGreenLight }}>
              <TableCell sx={{ fontFamily: fonts.kanit }}>เล่มที่ตรวจ</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>รายละเอียด</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>ผู้ตรวจ</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>วันที่ตรวจ</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }} align="center">สถานะ</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }} align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>
                  ไม่มีรายการตรวจ
                </TableCell>
              </TableRow>
            )}

            {items.map((item) => (
              <TableRow key={item.inspection_id} hover>
                <TableCell sx={{ fontFamily: fonts.thai }}>{labelOf(item.copy_id)}</TableCell>
                <TableCell sx={{ fontFamily: fonts.thai }}>{item.description}</TableCell>
                <TableCell sx={{ fontFamily: fonts.thai }}>
                  {item.employee?.user?.name ?? '—'}
                </TableCell>
                <TableCell sx={{ fontFamily: fonts.thai }}>{formatDate(item.inspection_date)}</TableCell>

                <TableCell align="center">
                  <Chip
                    label={item.resolved ? 'จัดการแล้ว' : 'ยังไม่จัดการ'}
                    size="small"
                    color={item.resolved ? 'success' : 'warning'}
                    sx={{ fontFamily: fonts.thai }}
                  />
                </TableCell>

                <TableCell align="right">
                  <IconButton
                    onClick={() => void toggleResolved(item.inspection_id, !item.resolved)}
                    title={item.resolved ? 'เปลี่ยนเป็นยังไม่จัดการ' : 'ทำเครื่องหมายว่าจัดการแล้ว'}
                  >
                    {item.resolved ? <UndoRoundedIcon fontSize="small" /> : <CheckCircleRoundedIcon fontSize="small" />}
                  </IconButton>

                  {user?.position === 'manager' && (
                    <IconButton onClick={() => handleDelete(item.inspection_id)} title="ลบ">
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: fonts.kanit, fontSize: 24, color: colors.brandGreen }}>
          บันทึกการตรวจ
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px', pt: '8px !important' }}>
                    <TextField
            select
            label="หนังสือ"
            value={bookId}
            onChange={(e) => {
              setBookId(Number(e.target.value))
              setCopyId('')          // เปลี่ยนเรื่องแล้ว เล่มที่เลือกไว้ใช้ไม่ได้
            }}
            fullWidth
          >
            {books.length === 0 && (
              <MenuItem disabled value="">ยังไม่มีหนังสือในระบบ</MenuItem>
            )}
            {books.map((b) => (
              <MenuItem key={b.book_id} value={b.book_id} sx={{ fontFamily: fonts.thai }}>
                {b.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="เล่มที่"
            value={copyId}
            onChange={(e) => setCopyId(Number(e.target.value))}
            disabled={bookId === ''}
            helperText={bookId === '' ? 'เลือกหนังสือก่อน' : ''}
            fullWidth
          >
            {copiesOfBook.length === 0 && (
              <MenuItem disabled value="">หนังสือเรื่องนี้ยังไม่มีเล่ม</MenuItem>
            )}
            {copiesOfBook
              .slice()
              .sort((a, b) => a.copy_number - b.copy_number)
              .map((c) => (
                <MenuItem key={c.copy_id} value={c.copy_id} sx={{ fontFamily: fonts.thai }}>
                  เล่มที่ {c.copy_number}
                  {c.building ? ` — ${c.building}` : ''}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            label="รายละเอียดที่พบ"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />

          {formError && (
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: 'error.main' }}>
              {formError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: '24px', pb: '16px' }}>
          <Button onClick={() => setOpen(false)} sx={{ fontFamily: fonts.thai, color: colors.inkMuted }}>
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
    </Box>
  )
}

export default InspectionPanel