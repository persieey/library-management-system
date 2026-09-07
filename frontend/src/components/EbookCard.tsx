import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import type { Ebook } from '../interface/IEbookInterface'
import { ebookCoverUrl, openEbookFile } from '../services/https/ebooks'
import { useAuth } from '../auth/useAuth'
import CoverImage from './catalog/CoverImage'
import { colors, fonts } from '../theme'

interface EbookCardProps {
  ebook: Ebook
}

// การ์ด E-Book บนหน้า /ebooks
//
// ข้อมูลบรรณานุกรมกับรูปปกเปิดให้ทุกคนดู แต่ตัวไฟล์ต้องล็อกอินก่อน
// (GET /ebooks/:id/file อยู่ใต้ JWTAuthMiddleware) ปุ่มจึงถูกปิดไว้ถ้ายังไม่ได้เข้าระบบ
function EbookCard({ ebook }: EbookCardProps) {
  const { token } = useAuth()
  const [isOpening, setIsOpening] = useState(false)
  const [failed, setFailed] = useState('')

  const hasFile = Boolean(ebook.file_path)

  const handleOpen = async () => {
    if (!token) return
    setIsOpening(true)
    setFailed('')
    try {
      await openEbookFile(token, ebook.ebook_id)
    } catch (err) {
      setFailed(err instanceof Error && err.message ? err.message : 'เปิดไฟล์ไม่สำเร็จ')
    } finally {
      setIsOpening(false)
    }
  }

  let buttonLabel = 'อ่าน E-Book'
  if (!hasFile) buttonLabel = 'ยังไม่มีไฟล์'
  else if (!token) buttonLabel = 'เข้าสู่ระบบเพื่ออ่าน'

  const button = (
    <Box component="span" sx={{ display: 'inline-flex', width: '100%' }}>
      <Button
        onClick={handleOpen}
        disabled={!hasFile || !token || isOpening}
        fullWidth
        startIcon={isOpening ? <CircularProgress size={14} color="inherit" /> : null}
        sx={{
          borderRadius: '8px',
          bgcolor: colors.brandGreen,
          color: 'white',
          py: '8px',
          fontFamily: fonts.thai,
          fontSize: 13,
          fontWeight: 600,
          textTransform: 'none',
          '&:hover': { bgcolor: colors.accentGreen },
          '&.Mui-disabled': { bgcolor: colors.surfaceMuted, color: 'white' },
        }}
      >
        {buttonLabel}
      </Button>
    </Box>
  )

  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        gap: '12px',
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
      <CoverImage
        src={ebook.cover_path ? ebookCoverUrl(ebook.ebook_id, ebook.updated_at) : ''}
        title={ebook.title}
        height={280}
        badge={ebook.file_type ? ebook.file_type.replace('.', '').toUpperCase() : undefined}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: 18 }}>
        {ebook.category && (
          <Typography
            sx={{
              fontFamily: fonts.thai,
              fontSize: 11,
              fontWeight: 600,
              color: colors.brown700,
              bgcolor: colors.cream50,
              borderRadius: '999px',
              px: '10px',
              py: '3px',
            }}
          >
            {ebook.category}
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          fontFamily: fonts.display,
          fontSize: 17,
          fontWeight: 600,
          lineHeight: '22px',
          color: colors.brown900,
        }}
      >
        {ebook.title}
      </Typography>
      <Typography sx={{ fontFamily: fonts.inter, fontSize: 13, color: colors.brown500 }}>
        {ebook.author}
      </Typography>
      {ebook.publisher && (
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 12, color: colors.brown500 }}>
          {ebook.publisher}
        </Typography>
      )}

      {failed && (
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 12, color: colors.terracotta600 }}>
          {failed}
        </Typography>
      )}

      <Box sx={{ mt: 'auto', pt: '8px' }}>
        {!token && hasFile ? (
          <Tooltip title="ต้องเข้าสู่ระบบก่อนจึงจะเปิดไฟล์ได้">{button}</Tooltip>
        ) : (
          button
        )}
      </Box>
    </Box>
  )
}

export default EbookCard
