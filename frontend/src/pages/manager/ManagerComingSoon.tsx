import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../components/ManagerLayout'
import { fonts } from '../../theme'

interface Props {
  title: string
  icon?: string
}

export default function ManagerComingSoon({ title, icon = '🚧' }: Props) {
  return (
    <ManagerLayout title={title}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 320,
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 48 }}>{icon}</Typography>
        <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 20, color: mgr.ink }}>
          เร็วๆ นี้
        </Typography>
        <Typography sx={{ fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, color: mgr.inkMuted, textAlign: 'center', maxWidth: 380 }}>
          ส่วนนี้กำลังอยู่ระหว่างการพัฒนา แวะกลับมาดูใหม่เร็วๆ นี้
        </Typography>
      </Box>
    </ManagerLayout>
  )
}
