import { useParams, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { BOOKS } from '../../data/books'
import { colors, fonts } from '../../theme'

// ปลายทางของปุ่ม "View" บนการ์ดหนังสือ
function BookDetailPage() {
  const { id } = useParams()
  const book = BOOKS.find((item) => item.id === Number(id))

  if (!book) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
        <Header />
        <Box sx={{ mx: 'auto', maxWidth: 1440, px: '64px', py: '88px', textAlign: 'center' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 24, color: colors.ink, mb: 2 }}>
            ไม่พบหนังสือเล่มนี้
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
          <Box
            component="img"
            src={book.image}
            alt=""
            sx={{ height: 420, width: 280, flexShrink: 0, borderRadius: '10px', objectFit: 'cover' }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography sx={{ fontFamily: fonts.inter, fontSize: 14, color: colors.brown700 }}>
              ⭐ {book.rating}
            </Typography>
            <Typography sx={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.brown900 }}>
              {book.title}
            </Typography>
            <Typography sx={{ fontFamily: fonts.inter, fontSize: 15, color: colors.brown500 }}>
              {book.author}
            </Typography>
            <Typography sx={{ fontFamily: fonts.inter, fontSize: 15, lineHeight: 1.7, color: colors.ink, mt: '16px' }}>
              {book.description}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

export default BookDetailPage
