import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import seal from '../assets/logo.png'
import iconFacebook from '../assets/icons/social-facebook.svg'
import iconInstagram from '../assets/icons/social-instagram.svg'
import iconYoutube from '../assets/icons/social-youtube.svg'
import iconLine from '../assets/icons/social-line.svg'
import { colors, fonts } from '../theme'

// สัดส่วนและขนาดอ้างจาก HomeUI.css ของสาขา B6715588 เพื่อให้ footer ของทีมหน้าตาเหมือนกัน
const MAX_WIDTH = 1200
const COLUMN_GAP = '28px'
const SEAL_HEIGHT = 120
const HEADING_SIZE = 14
const BODY_SIZE = 13
const COPY_SIZE = 12

// เส้นคั่นระหว่างคอลัมน์ — จางมากตั้งใจ ให้เห็นว่าแยกส่วนโดยไม่ดึงสายตา
const RULE = '1px solid rgba(255, 255, 255, 0.18)'
const COPY_RULE = '1px solid rgba(255, 255, 255, 0.1)'

const SOCIALS = [
  { label: 'Facebook', icon: iconFacebook },
  { label: 'Instagram', icon: iconInstagram },
  { label: 'YouTube', icon: iconYoutube },
  { label: 'Line', icon: iconLine },
]

const OPENING_HOURS = ['Mon. – Sat. : 8:00 – 20:00', 'Public Holidays : Closed', 'Sun. : Closed']

const CONTACT = ['Phone : 02 875 9874   ext. 9999', 'E-mail : library@uu.ac.th']

// คอลัมน์ใน footer — จอกว้างคั่นด้วยเส้นทางซ้าย จอแคบสลับไปคั่นด้านบนแทน
// เพราะพอเรียงเป็นแถวเดียวแล้วเส้นทางซ้ายจะไม่สื่อความหมายอะไร
function FooterColumn({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        pl: { xs: 0, md: COLUMN_GAP },
        borderLeft: { xs: 'none', md: RULE },
        pt: { xs: '16px', md: 0 },
        borderTop: { xs: RULE, md: 'none' },
      }}
    >
      {title && (
        <Typography
          component="h3"
          sx={{
            fontFamily: fonts.kanit,
            fontWeight: 600,
            fontSize: HEADING_SIZE,
            color: 'white',
            mb: '12px',
          }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Box>
  )
}

function FooterLine({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        fontFamily: fonts.kanit,
        fontSize: BODY_SIZE,
        lineHeight: 1.7,
        color: colors.footerText,
        mb: '6px',
      }}
    >
      {children}
    </Typography>
  )
}

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        bgcolor: colors.brandGreen,
        px: { xs: '20px', md: '40px' },
        pt: '40px',
        pb: '20px',
      }}
    >
      <Box
        sx={{
          maxWidth: MAX_WIDTH,
          mx: 'auto',
          display: 'grid',
          // จอกว้าง: ตราประทับกว้างตามเนื้อหา อีกสามคอลัมน์แบ่งเท่ากัน
          gridTemplateColumns: { xs: '1fr', md: 'auto 1fr 1fr 1fr' },
          gap: COLUMN_GAP,
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: '8px',
            maxWidth: { xs: 'none', md: 90 },
          }}
        >
          <Box
            component="img"
            src={seal}
            alt="Udompanya University"
            sx={{ height: SEAL_HEIGHT, width: 'auto', display: 'block' }}
          />
        </Box>

        <FooterColumn title="Library Opening Hours">
          {OPENING_HOURS.map((line) => (
            <FooterLine key={line}>{line}</FooterLine>
          ))}
        </FooterColumn>

        <FooterColumn title="Contact Us :">
          {CONTACT.map((line) => (
            <FooterLine key={line}>{line}</FooterLine>
          ))}
        </FooterColumn>

        <FooterColumn>
          {SOCIALS.map((social) => (
            <Box
              key={social.label}
              component="a"
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                mb: '6px',
                color: colors.footerText,
                '&:hover': { color: 'white' },
              }}
            >
              <Box component="img" src={social.icon} alt="" sx={{ height: 16, width: 16, flexShrink: 0 }} />
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: BODY_SIZE, lineHeight: 1.7, color: 'inherit' }}>
                {social.label}
              </Typography>
            </Box>
          ))}
        </FooterColumn>
      </Box>

      <Box
        sx={{
          maxWidth: MAX_WIDTH,
          mx: 'auto',
          mt: '60px',
          pt: '16px',
          borderTop: COPY_RULE,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: COPY_SIZE, color: colors.footerCopy }}>
          © 2026 UU Library and Learning Space. All rights reserved.&nbsp;&nbsp;|&nbsp;&nbsp;All Rights Reserved.
        </Typography>
      </Box>
    </Box>
  )
}

export default Footer
