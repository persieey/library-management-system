import Box from '@mui/material/Box'
import seal from '../assets/logo.png'
import wordmark from '../assets/logo-wordmark.png'
import { colors } from '../theme'

/**
 * โลโก้มหาวิทยาลัย ย้อมสีได้ตามพื้นหลังที่วางอยู่
 *
 *   <BrandLogo />                          // เขียว สำหรับแถบสีขาว
 *   <BrandLogo color="#ffffff" />          // ขาว สำหรับแถบสีเขียว
 *   <BrandLogo showSeal={false} />         // เอาเฉพาะตัวอักษร
 *
 * ไฟล์ต้นฉบับที่มีอยู่เป็นเวอร์ชันสำหรับพื้นเข้ม (ตัวอักษรสีขาว ตราประทับไล่เฉดเทา)
 * จึงย้อมสีด้วย CSS แทนการเก็บไฟล์หลายเวอร์ชัน:
 *   - ตัวอักษรเป็นสีขาวล้วน ใช้ mask ตัดรูปทรงแล้วเทสีทับ ได้สีตรงเป๊ะ
 *   - ตราประทับไล่เฉดเทา 5 ระดับ ใช้ multiply เพื่อคงมิติเงาไว้ ไม่ให้แบนเป็นสีเดียว
 * ถ้ามีไฟล์โลโก้สีเขียวจริง ให้เปลี่ยนมาใช้ <img> ตรงๆ ได้เลย ไม่ต้องย้อมอีก
 */

interface BrandLogoProps {
  /** สีของโลโก้ ค่าเริ่มต้นเป็นเขียวสำหรับพื้นขาว */
  color?: string
  sealHeight?: number
  wordmarkHeight?: number
  gap?: string
  showSeal?: boolean
}

export default function BrandLogo({
  color = colors.accentGreen,
  sealHeight = 56,
  wordmarkHeight = 38,
  gap = '10px',
  showSeal = true,
}: BrandLogoProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap, flexShrink: 0 }}>
      {showSeal && (
        <Box
          aria-hidden
          sx={{
            height: sealHeight,
            width: sealHeight,
            flexShrink: 0,
            // ย้อมสีแต่คงเฉดเดิม: เทาเข้ม -> เขียวเข้ม, เทาอ่อน -> เขียวอ่อน
            bgcolor: color,
            backgroundImage: `url(${seal})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundBlendMode: 'multiply',
            // ตัดกรอบสี่เหลี่ยมทิ้ง ให้เหลือเฉพาะรูปทรงตราประทับ
            maskImage: `url(${seal})`,
            WebkitMaskImage: `url(${seal})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
      )}
      <Box
        role="img"
        aria-label="Udompanya University"
        sx={{
          height: wordmarkHeight,
          // ตัวอักษรกว้าง 730x221 คิดสัดส่วนตามความสูงที่ตั้งไว้
          width: (wordmarkHeight * 730) / 221,
          flexShrink: 0,
          bgcolor: color,
          maskImage: `url(${wordmark})`,
          WebkitMaskImage: `url(${wordmark})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
    </Box>
  )
}
