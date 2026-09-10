import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import iconSearch from '../../assets/icons/search.svg'
import { colors, fonts } from '../../theme'

interface CatalogHeroProps {
  title: string
  subtitle: string
  placeholder: string
  query: string
  onQueryChange: (value: string) => void
  /** เรียกตอนออกจากช่องค้นหา (blur) — ใช้กับหน้าที่อยากรู้ "คำค้นหาสุดท้าย" เช่นหน้า E-Book ที่เก็บ log จริง */
  onQueryBlur?: () => void
}

// แถบหัวหน้ารายการหนังสือ/E-Book — พื้นเขียวเข้มกับช่องค้นหาทรงแคปซูล
// ใช้ภาษาออกแบบเดียวกับ hero บนหน้าแรก จะได้รู้สึกเป็นเว็บเดียวกัน
function CatalogHero({ title, subtitle, placeholder, query, onQueryChange, onQueryBlur }: CatalogHeroProps) {
  return (
    <Box component="section" sx={{ width: '100%', bgcolor: colors.brandGreen }}>
      <Box
        sx={{
          mx: 'auto',
          maxWidth: 1440,
          px: { xs: '24px', md: '64px' },
          pt: { xs: '32px', md: '48px' },
          pb: { xs: '36px', md: '56px' },
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            alignSelf: 'flex-start',
            textDecoration: 'none',
            color: colors.footerText,
            fontFamily: fonts.thai,
            fontSize: 14,
            fontWeight: 600,
            transition: 'color 200ms',
            '&:hover': { color: 'white' },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} />
          กลับหน้าหลัก
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Typography
            sx={{
              fontFamily: fonts.kanit,
              fontSize: { xs: 30, md: 42 },
              fontWeight: 700,
              lineHeight: 1.2,
              color: 'white',
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 15, color: colors.footerText }}>
            {subtitle}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: 560,
            width: '100%',
            bgcolor: 'white',
            borderRadius: '999px',
            px: '20px',
            py: '10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
          }}
        >
          <Box component="img" src={iconSearch} alt="" sx={{ height: 18, width: 18, opacity: 0.55 }} />
          <InputBase
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onBlur={onQueryBlur}
            placeholder={placeholder}
            // ค้นหาทันทีที่พิมพ์ ไม่มีปุ่มค้นหาและไม่ต้องกด Enter
            inputProps={{ 'aria-label': placeholder }}
            sx={{
              flex: 1,
              fontFamily: fonts.thai,
              fontSize: 15,
              color: colors.ink,
              '& input::placeholder': { color: colors.placeholder, opacity: 1 },
            }}
          />
          {query && (
            <IconButton size="small" onClick={() => onQueryChange('')} aria-label="ล้างคำค้นหา">
              <CloseIcon sx={{ fontSize: 16, color: colors.inkMuted }} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default CatalogHero
