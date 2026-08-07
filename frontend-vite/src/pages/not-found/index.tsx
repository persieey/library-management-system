import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { colors, fonts } from '../../theme'

function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 48, fontWeight: 700, color: colors.brandGreen }}>
        404
      </Typography>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, color: colors.inkMuted }}>
        ไม่พบหน้าที่คุณต้องการ
      </Typography>
      <Button
        component={Link}
        to="/"
        sx={{ mt: 1, bgcolor: colors.brandGreen, color: 'white', px: '20px', py: '10px', fontFamily: fonts.kanit, '&:hover': { bgcolor: colors.brandGreen } }}
      >
        กลับหน้าแรก
      </Button>
    </Box>
  )
}

export default NotFound
