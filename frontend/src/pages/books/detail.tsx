import { useParams, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { usePublicBooks } from '../../hooks/usePublicBooks'
import { bookCoverUrl } from '../../services/https/books'
import CoverImage from '../../components/catalog/CoverImage'
import { colors, fonts } from '../../theme'

// ปลายทางของปุ่ม "View" บนการ์ดหนังสือ
// ข้อมูลมาจากระบบจัดการหนังสือจริง (GET /api/v1/books) ไม่ใช่ข้อมูลตัวอย่างแล้ว
function BookDetailPage() {
  const { id } = useParams()
  const { books, isLoading, error } = usePublicBooks()
  const book = books.find((item) => item.book_id === Number(id))

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
        <Header />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '160px' }}>
          <CircularProgress size={32} />
        </Box>
        <Footer />
      </Box>
    )
  }

  if (!book) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
        <Header />
        <Box sx={{ mx: 'auto', maxWidth: 1440, px: '64px', py: '88px', textAlign: 'center' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 24, color: colors.ink, mb: 2 }}>
            {error || 'ไม่พบหนังสือเล่มนี้'}
          </Typography>
          <Typography
            component={Link}
            to="/books"
            sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 600, color: colors.accentGreen }}
          >
            ← กลับไปหน้าหนังสือทั้งหมด
          </Typography>
        </Box>
        <Footer />
      </Box>
    )
  }

  // เอาเฉพาะช่องที่มีค่าจริง หนังสือบางเล่มบรรณารักษ์ยังกรอกไม่ครบ
  const facts: Array<[string, string]> = [
    ['ผู้แต่ง', book.author],
    ['สำนักพิมพ์', book.publisher],
    ['หมวดหมู่', book.category],
    ['เลขเรียกหนังสือ', book.call_number],
    ['ISBN', book.isbn],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      <Header />
      <Box component="section" sx={{ mx: 'auto', maxWidth: 900, px: '64px', py: '88px' }}>
        <Typography
          component={Link}
          to="/books"
          sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 600, color: colors.accentGreen, mb: '32px', display: 'inline-block' }}
        >
          ← กลับไปหน้าหนังสือทั้งหมด
        </Typography>

        <Box sx={{ display: 'flex', gap: '40px' }}>
          <Box sx={{ width: 280, flexShrink: 0 }}>
            <CoverImage
              src={book.cover_path ? bookCoverUrl(book.book_id, book.updated_at) : ''}
              title={book.title}
              height={420}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography sx={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.brown900 }}>
              {book.title}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', mt: '8px' }}>
              {facts.map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', gap: '10px' }}>
                  <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.brown500, minWidth: 120 }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.inter, fontSize: 14, color: colors.ink }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            {book.description && (
              <Typography sx={{ fontFamily: fonts.inter, fontSize: 15, lineHeight: 1.7, color: colors.ink, mt: '16px' }}>
                {book.description}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

export default BookDetailPage
