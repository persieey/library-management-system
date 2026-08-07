import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { colors, fonts } from '../theme'

interface CategoryCardProps {
  icon: string
  name: string
  titles: string
  to: string
}

// Figma CategoryCard (90:457): "A single browsable book category with icon, name, and title count."
function CategoryCard({ icon, name, titles, to }: CategoryCardProps) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        height: '100%',
        width: '100%',
        borderRadius: '16px',
        border: `1px solid ${colors.borderSubtle}`,
        bgcolor: 'white',
        px: '16px',
        pb: '24px',
        pt: '28px',
        transition: 'box-shadow 300ms',
        '&:hover': { boxShadow: '0 6px 18px rgba(59,42,30,0.12)' },
      }}
    >
      <Box
        sx={{
          height: 52,
          width: 52,
          borderRadius: '50%',
          bgcolor: colors.gold200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box component="img" src={icon} alt="" sx={{ height: 24, width: 24 }} />
      </Box>
      <Typography sx={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, color: colors.brown900 }}>
        {name}
      </Typography>
      <Typography sx={{ fontFamily: fonts.inter, fontSize: 13, color: colors.brown700 }}>{titles}</Typography>
    </Box>
  )
}

export default CategoryCard
