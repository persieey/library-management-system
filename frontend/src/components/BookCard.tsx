import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import type { BookItem } from '../interface/IBookInterface'
import starFull from '../assets/icons/star-full.svg'
import starHalf from '../assets/icons/star-half.svg'
import { colors, fonts } from '../theme'

function Stars() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} component="img" src={starFull} alt="" sx={{ height: 14, width: 14 }} />
      ))}
      <Box component="img" src={starHalf} alt="" sx={{ height: 14, width: 14 }} />
    </Box>
  )
}

interface BookCardProps {
  book: BookItem
}

// การ์ดหนังสือที่ใช้ร่วมกันระหว่างส่วน "Recommended for You" บนหน้าแรก และหน้า /books
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
      <Box
        component="img"
        src={book.image}
        alt=""
        sx={{ height: 300, width: '100%', borderRadius: '10px', objectFit: 'cover' }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Stars />
        <Typography sx={{ fontFamily: fonts.inter, fontSize: 12, color: colors.brown700 }}>
          {book.rating}
        </Typography>
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
          to={`/books/${book.id}`}
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
