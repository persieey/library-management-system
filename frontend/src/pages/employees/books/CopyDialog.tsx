import { useEffect, useMemo, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import type { Book } from '../../../interface/IBookInterface'
import { useBooks } from '../../../context/BookContext'
import { colors, fonts } from '../../../theme'

export const CONDITIONS = ['good', 'damaged', 'repairing', 'lost']

const CONDITION_LABELS: Record<string, string> = {
  good: 'สมบูรณ์',
  damaged: 'ชำรุด',
  repairing: 'ส่งซ่อม',
  lost: 'สูญหาย',
}

interface Props {
  book: Book | null
  onClose: () => void
}

function CopyDialog({ book, onClose }: Props) {
  const { copies, createCopy, updateCopy, removeCopy } = useBooks()

  const [copyNumber, setCopyNumber] = useState(1)
  const [building, setBuilding] = useState('')
  const [slot, setSlot] = useState('')

  const own = useMemo(
    () => (book ? copies.filter((c) => c.book_id === book.book_id) : []),
    [copies, book],
  )

  // เดาเลขเล่มถัดไปให้อัตโนมัติ จะได้ไม่ต้องนั่งนับเอง
  useEffect(() => {
    if (!book) return
    const max = own.reduce((m, c) => Math.max(m, c.copy_number), 0)
    setCopyNumber(max + 1)
    setBuilding('')
    setSlot('')
  }, [book, own])

  if (!book) return null

  const handleAdd = () => {
    if (own.some((c) => c.copy_number === copyNumber)) {
      window.alert(`มีเล่มที่ ${copyNumber} อยู่แล้ว`)
      return
    }
    void createCopy(book.book_id, {
      copy_number: copyNumber,
      building,
      slot,
      condition_status: 'good',
    })
  }

  const handleDelete = (copyId: number, num: number) => {
    if (!window.confirm(`ต้องการลบเล่มที่ ${num} ใช่หรือไม่?`)) return
    void removeCopy(copyId)
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: fonts.kanit, fontSize: 24, color: colors.brandGreen }}>
        จัดการเล่ม — {book.title}
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            bgcolor: colors.accentGreenLight,
            borderRadius: '12px',
            p: '16px',
            mb: '20px',
          }}
        >
          {/* <TextField
            label="เล่มที่"
            type="number"
            value={copyNumber}
            onChange={(e) => setCopyNumber(Number(e.target.value))}
            size="small"
            sx={{ width: 200, bgcolor: 'white' }}
          /> */}
          <TextField
            label="อาคาร"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            size="small"
            fullWidth
            sx={{ bgcolor: 'white' }}
          />
          <TextField
            label="ชั้น / ช่องวาง"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            size="small"
            fullWidth
            sx={{ bgcolor: 'white' }}
          />
          <Button
            onClick={handleAdd}
            // startIcon={<AddRoundedIcon />}
            variant="contained"
            size="small"
            sx={{ height: 38, fontFamily: fonts.thai, bgcolor: colors.brandGreen, whiteSpace: 'nowrap' }}
          >
            เพิ่มเล่ม
          </Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontFamily: fonts.kanit }}>เล่มที่</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>อาคาร</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>ชั้น / ช่องวาง</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>สภาพ</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>สถานะยืม</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }} align="right">ลบ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {own.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '24px' }}>
                  ยังไม่มีเล่มของหนังสือเรื่องนี้
                </TableCell>
              </TableRow>
            )}

            {own
              .slice()
              .sort((a, b) => a.copy_number - b.copy_number)
              .map((copy) => (
                <TableRow key={copy.copy_id}>
                  <TableCell sx={{ fontFamily: fonts.thai }}>{copy.copy_number}</TableCell>

                  <TableCell>
                    <TextField
                      value={copy.building}
                      onChange={(e) => void updateCopy(copy.copy_id, { building: e.target.value })}
                      size="small"
                      variant="standard"
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      value={copy.slot}
                      onChange={(e) => void updateCopy(copy.copy_id, { slot: e.target.value })}
                      size="small"
                      variant="standard"
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      value={copy.condition_status}
                      onChange={(e) => void updateCopy(copy.copy_id, { condition_status: e.target.value })}
                      size="small"
                      variant="standard"
                      sx={{ minWidth: 100 }}
                    >
                      {CONDITIONS.map((c) => (
                        <MenuItem key={c} value={c} sx={{ fontFamily: fonts.thai }}>
                          {CONDITION_LABELS[c]}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={copy.availability_status}
                      size="small"
                      sx={{ fontFamily: fonts.thai }}
                      color={copy.availability_status === 'available' ? 'success' : 'default'}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <IconButton onClick={() => handleDelete(copy.copy_id, copy.copy_number)}>
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted, mt: '16px' }}>
          สถานะยืมเป็นของระบบยืม-คืน หน้านี้แก้ไม่ได้
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: '24px', pb: '16px' }}>
        <Button onClick={onClose} sx={{ fontFamily: fonts.thai }}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CopyDialog