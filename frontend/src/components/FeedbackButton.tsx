import { useState } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Zoom from '@mui/material/Zoom'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import ComplaintModal from './ComplaintModal'
import { colors, fonts } from '../theme'

/**
 * ปุ่มลอยมุมล่างซ้าย สำหรับแจ้งปัญหาและข้อเสนอแนะ
 *
 * ลอยอยู่กับที่ตอนเลื่อนหน้า (position: fixed) กดแล้วเปิดฟอร์มในหน้าเดิม ไม่พาไปหน้าอื่น
 * วางไว้หน้าไหนก็ได้ด้วยการใส่ <FeedbackButton /> ไว้ท้ายหน้านั้น
 */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip title="แจ้งปัญหา / ข้อเสนอแนะ" placement="right" arrow slots={{ transition: Zoom }}>
        <Box
          component="button"
          type="button"
          aria-label="แจ้งปัญหาและข้อเสนอแนะ"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            left: { xs: 16, md: 24 },
            bottom: { xs: 16, md: 24 },
            // ต่ำกว่า dialog แต่สูงกว่าเนื้อหาหน้า ปุ่มจะได้ไม่ทับ modal ตอนเปิด
            zIndex: (t) => t.zIndex.appBar - 1,
            height: 52,
            width: 52,
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: colors.brandGreen,
            color: 'white',
            boxShadow: '0 6px 20px rgba(18, 55, 47, 0.35)',
            transition: 'transform 180ms ease-out, background-color 180ms',
            fontFamily: fonts.thai,
            '& svg': { fontSize: 28 },
            '&:hover': { bgcolor: colors.accentGreen, transform: 'translateY(-2px)' },
            '&:active': { transform: 'translateY(0)' },
            // เครื่องที่ตั้งค่าลดการเคลื่อนไหวไว้ ไม่ต้องขยับ
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'background-color 180ms',
              '&:hover': { bgcolor: colors.accentGreen, transform: 'none' },
            },
          }}
        >
          <HelpOutlineRounded />
        </Box>
      </Tooltip>

      <ComplaintModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
