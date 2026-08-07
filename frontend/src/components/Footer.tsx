import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import seal from '../assets/logo.png'
import iconFacebook from '../assets/icons/social-facebook.svg'
import iconInstagram from '../assets/icons/social-instagram.svg'
import iconYoutube from '../assets/icons/social-youtube.svg'
import iconLine from '../assets/icons/social-line.svg'
import { colors, fonts } from '../theme'

const SOCIALS = [
  { label: 'Facebook', icon: iconFacebook },
  { label: 'Instagram', icon: iconInstagram },
  { label: 'YouTube', icon: iconYoutube },
  { label: 'Line', icon: iconLine },
]

function Divider() {
  return <Box sx={{ mt: '4px', height: 200, width: '2px', flexShrink: 0, bgcolor: 'white' }} />
}

function Footer() {
  return (
    <Box component="footer" sx={{ width: '100%', bgcolor: colors.brandGreen }}>
      <Box sx={{ mx: 'auto', maxWidth: 1440, height: 252, display: 'flex', alignItems: 'flex-start', px: '83px', pt: '25px' }}>
        <Box component="img" src={seal} alt="" sx={{ height: 160, width: 160, flexShrink: 0, objectFit: 'contain' }} />

        <Box sx={{ ml: '94px', width: 247, flexShrink: 0, pt: '25px', fontFamily: fonts.kanit, fontSize: 18, lineHeight: '33px', color: 'white' }}>
          <Typography component="p" sx={{ font: 'inherit' }}>Library Opening Hours</Typography>
          <Typography component="p" sx={{ font: 'inherit' }}>Mon. - Sat. : 8:00 - 20:00</Typography>
          <Typography component="p" sx={{ font: 'inherit' }}>Public Holidays : Closed</Typography>
          <Typography component="p" sx={{ font: 'inherit' }}>Sun. : Closed</Typography>
        </Box>

        <Box sx={{ ml: '42px' }}>
          <Divider />
        </Box>

        <Box sx={{ ml: '59px', width: 359, flexShrink: 0, pt: '25px', fontFamily: fonts.kanit, fontSize: 18, lineHeight: '33px', color: 'white' }}>
          <Typography component="p" sx={{ font: 'inherit' }}>Contact Us :</Typography>
          <Typography component="p" sx={{ font: 'inherit' }}>&nbsp;</Typography>
          <Typography component="p" sx={{ font: 'inherit' }}>Phone : 02 875 9874&nbsp;&nbsp;&nbsp;&nbsp;ext. 9999</Typography>
          <Typography component="p" sx={{ font: 'inherit' }}>E-mail : library@uu.ac.th</Typography>
        </Box>

        <Box sx={{ ml: '18px' }}>
          <Divider />
        </Box>

        <Box sx={{ ml: '87px', display: 'flex', flexDirection: 'column', gap: '14px', pt: '30px' }}>
          {SOCIALS.map((social) => (
            <Box key={social.label} component="a" href="/" sx={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <Box component="img" src={social.icon} alt="" sx={{ height: 18, width: 18 }} />
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, lineHeight: 1, color: 'white' }}>
                {social.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ height: 48, width: '100%', bgcolor: 'black' }}>
        <Box sx={{ mx: 'auto', maxWidth: 1440, height: '100%', display: 'flex', alignItems: 'center', px: '321px' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, color: 'white' }}>
            © 2026 UU Library and Learning Space. All rights reserved. | All Rights Reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default Footer
