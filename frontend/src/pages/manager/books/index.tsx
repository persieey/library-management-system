import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../../components/ManagerLayout'
import StatusBadge from '../../../components/StatusBadge'
import { fonts } from '../../../theme'

type Category = 'All' | 'Fiction' | 'Reference' | 'Journals' | 'Thesis' | 'E-books'

interface Book {
  title: string
  author: string
  category: Exclude<Category, 'All'>
  avail: number
  total: number
}

const BOOKS: Book[] = [
  { title: 'Introduction to Algorithms',          author: 'T. H. Cormen',    category: 'Reference', avail: 3, total: 5 },
  { title: 'Database System Concepts',             author: 'A. Silberschatz', category: 'Reference', avail: 0, total: 4 },
  { title: 'Clean Code',                           author: 'Robert C. Martin', category: 'Fiction',  avail: 2, total: 3 },
  { title: 'Thesis: AI in Library Systems',        author: 'S. Charoensuk',   category: 'Thesis',   avail: 1, total: 1 },
  { title: 'Journal of Information Science, Vol.12', author: 'Various',       category: 'Journals', avail: 5, total: 5 },
]

const CATS: Category[] = ['All', 'Fiction', 'Reference', 'Journals', 'Thesis', 'E-books']

const CAT_LABEL: Record<Category, string> = {
  All: 'ทั้งหมด',
  Fiction: 'นวนิยาย',
  Reference: 'อ้างอิง',
  Journals: 'วารสาร',
  Thesis: 'วิทยานิพนธ์',
  'E-books': 'อีบุ๊ก',
}

const label = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted }
const body  = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }

const COLS = [
  { label: 'ชื่อเรื่อง',                w: 320 },
  { label: 'ผู้แต่ง',                  w: 200 },
  { label: 'หมวดหมู่',                w: 150 },
  { label: 'จำนวน (ว่าง/ทั้งหมด)',    w: 160 },
  { label: 'สถานะ',                  w: 130 },
  { label: 'การจัดการ',               w: 100 },
]

export default function ManagerBooks() {
  const [cat, setCat] = useState<Category>('All')

  const filtered = cat === 'All' ? BOOKS : BOOKS.filter((b) => b.category === cat)

  return (
    <ManagerLayout title="จัดการหนังสือ">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            disableElevation
            sx={{ fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, bgcolor: mgr.accentGreen, borderRadius: '8px', px: '18px', py: '10px', '&:hover': { bgcolor: '#1e4028' }, textTransform: 'none' }}
          >
            + เพิ่มหนังสือ
          </Button>
        </Box>

        {/* Category tabs */}
        <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {CATS.map((c) => {
            const active = c === cat
            return (
              <Box
                key={c}
                onClick={() => setCat(c)}
                sx={{
                  px: '16px', py: '8px',
                  borderRadius: '20px',
                  border: active ? 'none' : `1px solid ${mgr.border}`,
                  bgcolor: active ? mgr.accentGreen : 'white',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: active ? mgr.accentGreen : '#fafafa' },
                }}
              >
                <Typography sx={{ fontFamily: fonts.thai, fontWeight: 500, fontSize: 13, lineHeight: 1.4, color: active ? 'white' : mgr.inkMuted, whiteSpace: 'nowrap' }}>
                  {CAT_LABEL[c]}
                </Typography>
              </Box>
            )
          })}
        </Box>

        <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink }}>
          รายการหนังสือ
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', bgcolor: '#f6f8f6', px: '20px', py: '14px' }}>
            {COLS.map((c) => (
              <Typography key={c.label} sx={{ ...label, width: c.w, flexShrink: 0 }}>{c.label}</Typography>
            ))}
          </Box>

          {filtered.map((b, i) => {
            const allBorrowed = b.avail === 0
            return (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', px: '20px', py: '14px', borderTop: `1px solid ${mgr.border}` }}>
                <Typography sx={{ ...body, width: 320, flexShrink: 0 }}>{b.title}</Typography>
                <Typography sx={{ ...body, width: 200, flexShrink: 0 }}>{b.author}</Typography>
                <Typography sx={{ ...body, width: 150, flexShrink: 0 }}>{CAT_LABEL[b.category]}</Typography>
                <Typography sx={{ ...body, width: 160, flexShrink: 0 }}>{b.avail} / {b.total}</Typography>
                <Box sx={{ width: 130, flexShrink: 0 }}>
                  <StatusBadge
                    label={allBorrowed ? 'ถูกยืมหมด' : 'พร้อมให้ยืม'}
                    variant={allBorrowed ? 'borrowed' : 'available'}
                  />
                </Box>
                <Box sx={{ width: 100, flexShrink: 0 }}>
                  <Typography sx={{ fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, lineHeight: 1, color: mgr.accentGreen, cursor: 'pointer' }}>แก้ไข</Typography>
                </Box>
              </Box>
            )
          })}
        </Paper>
      </Box>
    </ManagerLayout>
  )
}
