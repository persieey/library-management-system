import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import type { Book } from '../interface/IBookInterface'
import { bookCoverUrl } from '../services/https/books'
import CoverImage from './catalog/CoverImage'
import { colors, fonts } from '../theme'

interface BookCardProps {
  book: Book
}

// การ์ดหนังสือที่ใช้ร่วมกันระหว่างส่วน "Recommended for You" บนหน้าแรก และหน้า /books
//
// ข้อมูลมาจากระบบจัดการหนังสือจริง (B6729615) จึงไม่มีคะแนนรีวิว
// ช่องที่เคยโชว์ดาวกับ rating ปลอม เปลี่ยนมาโชว์หมวดหมู่กับเลขเรียกหนังสือแทน
function BookCard({ book }: BookCardProps) {
  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        gap: '14px',
        borderRadius: '16px',
        border: `1px solid ${colors.borderSubtle}`,
        bgcolor: 'white',
        px: '16px',
        pb: '20px',
        pt: '16px',
        transition: 'box-shadow 300ms',
        '&:hover': { boxShadow: '0 6px 18px rgba(59,42,30,0.12)' },
      }}
    >
      <CoverImage
        src={book.cover_path ? bookCoverUrl(book.book_id, book.updated_at) : ''}
        title={book.title}
        height={300}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: 18 }}>
        {book.category && (
          <Typography
            sx={{
              fontFamily: fonts.inter,
              fontSize: 11,
              fontWeight: 600,
              color: colors.brown700,
              bgcolor: colors.cream50,
              borderRadius: '999px',
              px: '10px',
              py: '3px',
            }}
          >
            {book.category}
          </Typography>
        )}
        {book.call_number && (
          <Typography sx={{ fontFamily: fonts.inter, fontSize: 12, color: colors.brown500 }}>
            {book.call_number}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, lineHeight: '22px', color: colors.brown900 }}>
        {book.title}
      </Typography>
      <Typography sx={{ fontFamily: fonts.inter, fontSize: 13, color: colors.brown500 }}>
        {book.author}
      </Typography>
      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          component={Link}
          to={`/books/${book.book_id}`}
          sx={{
            borderRadius: '8px',
            bgcolor: colors.cream50,
            color: colors.brown900,
            px: '14px',
            py: '8px',
            fontFamily: fonts.inter,
            fontSize: 12,
            fontWeight: 600,
            '&:hover': { bgcolor: colors.cream50 },
          }}
        >
          View
        </Button>
      </Box>
    </Box>
  )
}

export default BookCard
