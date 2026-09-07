import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { colors, fonts } from '../../theme'

interface CoverImageProps {
  /** URL รูปปก — ว่างได้ถ้ายังไม่ได้อัปโหลด */
  src: string
  title: string
  height: number
  /** ป้ายมุมขวาบน เช่นชนิดไฟล์ของ E-Book */
  badge?: string
}

/**
 * รูปปกหนังสือ/E-Book พร้อมตัวสำรองเมื่อยังไม่มีปก
 *
 * ไม่ใช้ภาพหนังสือตัวอย่างเป็นตัวสำรอง เพราะจะกลายเป็นว่าโชว์ปกของหนังสือ
 * เล่มอื่นที่ไม่มีอยู่จริง และถ้าหลายเล่มยังไม่มีปกก็จะเห็นรูปเดียวกันซ้ำกันทั้งหน้า
 * ใช้กล่องสีพร้อมอักษรตัวแรกของชื่อเรื่องแทน บอกได้ว่าเป็นคนละเล่ม
 */
function CoverImage({ src, title, height, badge }: CoverImageProps) {
  const [broken, setBroken] = useState(false)
  const showPlaceholder = !src || broken

  return (
    <Box sx={{ position: 'relative' }}>
      {showPlaceholder ? (
        <Box
          sx={{
            height,
            width: '100%',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            px: '16px',
            background: `linear-gradient(160deg, ${colors.cream50} 0%, ${colors.accentGreenLight} 100%)`,
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: fonts.display,
              fontSize: Math.round(height / 5),
              fontWeight: 700,
              lineHeight: 1,
              color: colors.brandGreen,
              opacity: 0.35,
            }}
          >
            {title.trim().charAt(0).toUpperCase() || '?'}
          </Typography>
          <Typography
            sx={{
              fontFamily: fonts.thai,
              fontSize: 11,
              color: colors.brown500,
              textAlign: 'center',
            }}
          >
            ยังไม่มีรูปปก
          </Typography>
        </Box>
      ) : (
        <Box
          component="img"
          src={src}
          alt=""
          // ไฟล์ปกอาจหายไปจากเครื่องแต่ cover_path ยังค้างในฐานข้อมูล
          onError={() => setBroken(true)}
          sx={{ height, width: '100%', borderRadius: '10px', objectFit: 'cover', display: 'block' }}
        />
      )}

      {badge && (
        <Typography
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            fontFamily: fonts.inter,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: 'white',
            bgcolor: 'rgba(18,55,47,0.85)',
            borderRadius: '6px',
            px: '8px',
            py: '3px',
          }}
        >
          {badge}
        </Typography>
      )}
    </Box>
  )
}

export default CoverImage
