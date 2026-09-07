import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import BookCard from '../../components/BookCard'
import { usePublicBooks } from '../../hooks/usePublicBooks'
import { colors, fonts } from '../../theme'

// ปลายทางของปุ่ม "View All" ในส่วน Recommended for You
// ข้อมูลมาจากระบบจัดการหนังสือจริง (GET /api/v1/books) ไม่ใช่ข้อมูลตัวอย่างแล้ว
function BooksPage() {
  const { books, isLoading, error } = usePublicBooks()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      <Header />
      <Box component="section" sx={{ width: '100%', bgcolor: 'white' }}>
        <Box sx={{ mx: 'auto', maxWidth: 1440, display: 'flex', flexDirection: 'column', gap: '40px', px: '64px', py: '88px' }}>
          <Reveal>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 48, fontWeight: 600, color: colors.brown900 }}>
                Recommended for You
              </Typography>
              <Typography sx={{ fontFamily: fonts.inter, fontSize: 16, color: colors.brown700 }}>
                Handpicked titles based on what readers love this month
              </Typography>
            </Box>
          </Reveal>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: '48px' }}>
              <CircularProgress size={32} />
            </Box>
          )}

          {!isLoading && error && (
            <Alert severity="error" sx={{ fontFamily: fonts.thai }}>
              {error}
            </Alert>
          )}

          {!isLoading && !error && books.length === 0 && (
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 16, color: colors.brown500, py: '48px', textAlign: 'center' }}>
              ยังไม่มีหนังสือในระบบ
            </Typography>
          )}

          {!isLoading && !error && books.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '24px',
              }}
            >
              {books.map((book, i) => (
                <Reveal key={book.book_id} delay={i * 70}>
                  <BookCard book={book} />
                </Reveal>
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

export default BooksPage
