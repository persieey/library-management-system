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
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import EbookEditorDialog from './EbookEditorDialog'
import type { Ebook, EbookDraft } from '../../../interface/IEbookInterface'
import { useEbooks } from '../../../context/EbookContext'
import { ebookCoverUrl } from '../../../services/https/ebooks'
import { colors, fonts } from '../../../theme'

function ManageEbooks() {
  const { ebooks, isLoading, error, create, update, remove, openFile, toast, clearToast } = useEbooks()

  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
    const [searchParams, setSearchParams] = useSearchParams()

  // เปิด dialog อัตโนมัติเมื่อถูกส่งมาจากปุ่มแก้ไขที่อื่น เช่น /employees/books/catalog?edit=5
  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (!editParam) return

    const id = Number(editParam)
    if (ebooks.some((b) => b.ebook_id === id)) {
      setEditingId(id)
      setEditorOpen(true)
    }

    // ล้าง query ทิ้งหลังใช้แล้ว จะได้ไม่เปิดซ้ำตอนกดปุ่มย้อนกลับ
    setSearchParams({}, { replace: true })
  }, [searchParams, ebooks, setSearchParams])

  const editingItem = useMemo(
    () => ebooks.find((e) => e.ebook_id === editingId) ?? null,
    [ebooks, editingId],
  )

  const items = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return ebooks
    return ebooks.filter(
      (e) =>
        e.title.toLowerCase().includes(keyword) ||
        e.author.toLowerCase().includes(keyword) ||
        e.isbn.toLowerCase().includes(keyword),
    )
  }, [ebooks, query])

  const openCreate = () => {
    setEditingId(null)
    setEditorOpen(true)
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setEditorOpen(true)
  }

  const handleSubmit = (draft: EbookDraft, file: File | null, cover: File | null) => {
    if (editingId === null) void create(draft, file, cover)
    else void update(editingId, draft, file, cover)
    setEditorOpen(false)
  }


  const handleDelete = (item: Ebook) => {
    if (!window.confirm(`ต้องการลบ "${item.title}" ใช่หรือไม่?`)) return
    void remove(item.ebook_id)
  }

  return (
    <BackOfficeLayout title="จัดการ E-Book">
      {isLoading && (
        <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>
          กำลังโหลด...
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ fontFamily: fonts.thai, mt: '16px' }}>
          {error}
        </Alert>
      )}

      {!isLoading && (
        <Box sx={{ flex: 1, py: '32px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '24px' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen }}>
              รายการ E-Book
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
              เพิ่ม E-Book
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
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
                  <TableCell sx={{ fontFamily: fonts.kanit }} align="center">ไฟล์</TableCell>
                  <TableCell sx={{ fontFamily: fonts.kanit }} align="right">จัดการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>
                      {ebooks.length === 0 ? 'ยังไม่มี E-Book ในระบบ' : 'ไม่พบรายการที่ตรงกับคำค้น'}
                    </TableCell>
                  </TableRow>
                )}

                {items.map((item) => (
                  <TableRow key={item.ebook_id} hover>
                    <TableCell>
                      {item.cover_path ? (
                        <Box
                          component="img"
                          src={ebookCoverUrl(item.ebook_id, item.updated_at)}
                          alt=""
                          sx={{ width: 40, height: 56, objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <Box sx={{ width: 40, height: 56, bgcolor: colors.surfaceMuted, borderRadius: '4px' }} />
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontFamily: fonts.thai, fontSize: 15, color: colors.ink }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                        {item.isbn || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ fontFamily: fonts.thai }}>{item.author}</TableCell>
                    <TableCell sx={{ fontFamily: fonts.thai }}>{item.category || '—'}</TableCell>

                    <TableCell align="center">
                      {item.file_path ? (
                        <Chip
                          label={item.file_type || 'ไฟล์'}
                          size="small"
                          sx={{ fontFamily: fonts.thai, bgcolor: colors.accentGreenLight, color: colors.accentGreen }}
                        />
                      ) : (
                        <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                          ไม่มีไฟล์
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {item.file_path && (
                        <IconButton onClick={() => void openFile(item.ebook_id)} title="เปิดอ่าน">
                          <OpenInNewRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton onClick={() => openEdit(item.ebook_id)} title="แก้ไข">
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item)} title="ลบ">
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      <EbookEditorDialog
        open={editorOpen}
        editingItem={editingItem}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={clearToast}>
        <Alert severity="success" onClose={clearToast} sx={{ fontFamily: fonts.thai }}>
          {toast}
        </Alert>
      </Snackbar>
    </BackOfficeLayout>
  )
}

export default ManageEbooks