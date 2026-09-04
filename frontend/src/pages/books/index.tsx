import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import BookCard from '../../components/BookCard'
import { BOOKS } from '../../data/books'
import { colors, fonts } from '../../theme'

// ปลายทางของปุ่ม "View All" ในส่วน Recommended for You
function BooksPage() {
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

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '24px',
            }}
          >
            {BOOKS.map((book, i) => (
              <Reveal key={book.id} delay={i * 70}>
                <BookCard book={book} />
              </Reveal>
            ))}
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

export default BooksPage
