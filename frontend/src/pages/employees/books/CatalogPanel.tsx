import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded'
import BookEditorDialog from './BookEditorDialog'
import type { Book, BookDraft } from '../../../interface/IBookInterface'
import { useBooks } from '../../../context/BookContext'
import { bookCoverUrl } from '../../../services/https/books'
import { colors, fonts } from '../../../theme'

interface Props {
  /** เปิดหน้าจัดการเล่มของหนังสือเรื่องนี้ */
  onManageCopies: (book: Book) => void
}

function CatalogPanel({ onManageCopies }: Props) {
  const { books, copies, createBook, updateBook, removeBook } = useBooks()
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (!editParam) return

    const id = Number(editParam)
    if (books.some((e) => e.book_id === id)) {
      setEditingId(id)
      setEditorOpen(true)
    }

    setSearchParams({}, { replace: true })
  }, [searchParams, books, setSearchParams])
  const editingItem = useMemo(
    () => books.find((b) => b.book_id === editingId) ?? null,
    [books, editingId],
  )

  const items = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return books
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(keyword) ||
        b.author.toLowerCase().includes(keyword) ||
        b.isbn.toLowerCase().includes(keyword),
    )
  }, [books, query])

  /** นับว่าหนังสือเรื่องนี้มีกี่เล่ม และว่างกี่เล่ม */
  const countOf = (bookId: number) => {
    const own = copies.filter((c) => c.book_id === bookId)
    return {
      total: own.length,
      available: own.filter((c) => c.availability_status === 'available').length,
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setEditorOpen(true)
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setEditorOpen(true)
  }

  const handleSubmit = (draft: BookDraft, cover: File | null) => {
    if (editingId === null) void createBook(draft, cover)
    else void updateBook(editingId, draft, cover)
    setEditorOpen(false)
  }

  const handleDelete = (book: Book) => {
    const { total } = countOf(book.book_id)
    if (total > 0) {
      window.alert(`ลบไม่ได้ เพราะยังมี ${total} เล่มอยู่ในระบบ กรุณาลบเล่มทั้งหมดก่อน`)
      return
    }
    if (!window.confirm(`ต้องการลบ "${book.title}" ใช่หรือไม่?`)) return
    void removeBook(book.book_id)
  }

  return (
    <Box sx={{ flex: 1, py: '32px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '24px' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen }}>
          รายการหนังสือ
        </Typography>
        <Button
          onClick={openCreate}
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
          เพิ่มหนังสือ
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          bgcolor: 'white',
          border: `1px solid ${colors.border}`,
          borderRadius: '30px',
          px: '18px',
          py: '10px',
          mb: '20px',
        }}
      >
        <InputBase
          placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, ISBN . . ."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1, fontFamily: fonts.thai, fontSize: 15 }}
        />
      </Box>

      <Box sx={{ bgcolor: 'white', borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: colors.accentGreenLight }}>
              <TableCell sx={{ fontFamily: fonts.kanit, width: 70 }}>ปก</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>ชื่อหนังสือ</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>ผู้แต่ง</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>หมวดหมู่</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }}>เลขเรียก</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }} align="center">จำนวนเล่ม</TableCell>
              <TableCell sx={{ fontFamily: fonts.kanit }} align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>
                  {books.length === 0 ? 'ยังไม่มีหนังสือในระบบ' : 'ไม่พบหนังสือที่ตรงกับคำค้น'}
                </TableCell>
              </TableRow>
            )}

            {items.map((book) => {
              const { total, available } = countOf(book.book_id)
              return (
                <TableRow key={book.book_id} hover>
                  <TableCell>
                    {book.cover_path ? (
                      <Box
                        component="img"
                        src={bookCoverUrl(book.book_id, book.updated_at)}
                        alt=""
                        sx={{ width: 40, height: 56, objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : (
                      <Box sx={{ width: 40, height: 56, bgcolor: colors.surfaceMuted, borderRadius: '4px' }} />
                    )}
                  </TableCell>

                  <TableCell sx={{ fontFamily: fonts.thai }}>
                    <Typography sx={{ fontFamily: fonts.thai, fontSize: 15, color: colors.ink }}>
                      {book.title}
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                      {book.isbn || '—'}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ fontFamily: fonts.thai }}>{book.author}</TableCell>
                  <TableCell sx={{ fontFamily: fonts.thai }}>{book.category || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: fonts.thai }}>{book.call_number || '—'}</TableCell>

                  <TableCell align="center">
                    <Chip
                      label={`${available} / ${total}`}
                      size="small"
                      sx={{ fontFamily: fonts.thai, bgcolor: colors.accentGreenLight, color: colors.accentGreen }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <IconButton onClick={() => onManageCopies(book)} title="จัดการเล่ม">
                      <LibraryBooksRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => openEdit(book.book_id)} title="แก้ไข">
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(book)} title="ลบ">
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>

      <BookEditorDialog
        open={editorOpen}
        editingItem={editingItem}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}

export default CatalogPanel