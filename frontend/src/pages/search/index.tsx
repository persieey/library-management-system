import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import BookCard from '../../components/BookCard'
import EbookCard from '../../components/EbookCard'
import { usePublicBooks } from '../../hooks/usePublicBooks'
import { usePublicEbooks } from '../../hooks/usePublicEbooks'
import * as portal from '../../services/https/borrowerPortal'
import { useLoginPrompt } from '../../context/LoginPrompt'
import iconSearch from '../../assets/icons/search.svg'
import { colors, fonts } from '../../theme'

// ค้นหารวมทุกอย่างในระบบพร้อมกัน (หนังสือ/E-Book/อุปกรณ์/ห้อง) — ปลายทางของช่องค้นหา
// ใหญ่บนหน้าแรก แนวคิดยกมาจาก "Find all" ของเว็บห้องสมุด มธ. (library.tu.ac.th) ที่ให้
// ค้นทุกประเภททรัพยากรจากช่องเดียว แต่ปรับให้เหลือเฉพาะทรัพยากรที่ระบบเรามีจริง
function match(q: string, fields: Array<string | null | undefined>) {
  const needle = q.trim().toLowerCase()
  if (!needle) return false
  return fields.some((f) => (f ?? '').toLowerCase().includes(needle))
}

function SectionHeader({ title, count, onViewAll }: { title: string; count: number; onViewAll?: () => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: '16px' }}>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 22, fontWeight: 700, color: colors.brown900 }}>
        {title} <Box component="span" sx={{ color: colors.brown500, fontSize: 16, fontWeight: 400 }}>({count})</Box>
      </Typography>
      {onViewAll && count > 0 && (
        <Button onClick={onViewAll} sx={{ fontFamily: fonts.inter, fontSize: 13, fontWeight: 600, color: colors.terracotta600, textTransform: 'none' }}>
          ดูทั้งหมด →
        </Button>
      )}
    </Box>
  )
}

function SimpleResultRow({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        borderRadius: '12px',
        border: `1px solid ${colors.borderSubtle}`,
        bgcolor: 'white',
        px: '18px',
        py: '14px',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 600, color: colors.brown900 }} noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontFamily: fonts.inter, fontSize: 13, color: colors.brown500 }} noWrap>
            {subtitle}
          </Typography>
        )}
      </Box>
      {badge && (
        <Typography
          sx={{
            flexShrink: 0,
            fontFamily: fonts.inter,
            fontSize: 11,
            fontWeight: 600,
            color: colors.brown700,
            bgcolor: colors.cream50,
            borderRadius: '999px',
            px: '10px',
            py: '4px',
          }}
        >
          {badge}
        </Typography>
      )}
    </Box>
  )
}

function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { requireLogin } = useLoginPrompt()
  const initialQ = searchParams.get('q') ?? ''
  const [input, setInput] = useState(initialQ)
  const q = searchParams.get('q') ?? ''

  useEffect(() => setInput(initialQ), [initialQ])

  const { books, isLoading: booksLoading } = usePublicBooks()
  const { ebooks, isLoading: ebooksLoading } = usePublicEbooks()
  const [equipment, setEquipment] = useState<portal.CatalogEquipment[]>([])
  const [rooms, setRooms] = useState<portal.CatalogRoom[]>([])
  const [otherLoading, setOtherLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setOtherLoading(true)
    Promise.all([portal.getEquipment(), portal.getRooms()])
      .then(([eq, rm]) => {
        if (cancelled) return
        setEquipment(eq)
        setRooms(rm)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setOtherLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const bookResults = useMemo(
    () => books.filter((b) => match(q, [b.title, b.author, b.publisher, b.isbn, b.call_number, b.category])),
    [books, q],
  )
  const ebookResults = useMemo(
    () => ebooks.filter((e) => match(q, [e.title, e.author, e.publisher, e.isbn, e.category])),
    [ebooks, q],
  )
  const equipmentResults = useMemo(
    () => equipment.filter((e) => match(q, [e.name, e.asset_code, e.category])),
    [equipment, q],
  )
  const roomResults = useMemo(
    () => rooms.filter((r) => match(q, [r.room_name, r.room_type, r.building])),
    [rooms, q],
  )

  const loading = booksLoading || ebooksLoading || otherLoading
  const totalCount = bookResults.length + ebookResults.length + equipmentResults.length + roomResults.length
  const hasQuery = q.trim().length > 0

  const submit = () => {
    const value = input.trim()
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Box component="section" sx={{ width: '100%', bgcolor: colors.brandGreen }}>
        <Box sx={{ mx: 'auto', maxWidth: 1440, px: { xs: '24px', md: '64px' }, pt: { xs: '32px', md: '48px' }, pb: { xs: '28px', md: '40px' } }}>
          <Box
            component="button"
            type="button"
            onClick={() => navigate('/')}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              mb: '16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: colors.footerText,
              fontFamily: fonts.thai,
              fontSize: 14,
              fontWeight: 600,
              p: 0,
              '&:hover': { color: 'white' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            กลับหน้าหลัก
          </Box>

          <Typography sx={{ fontFamily: fonts.kanit, fontSize: { xs: 26, md: 36 }, fontWeight: 700, color: 'white', mb: '20px' }}>
            ค้นหาทุกอย่างในห้องสมุด
          </Typography>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: 640,
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ค้นหาหนังสือ, E-Book, อุปกรณ์, ห้อง . . ."
              inputProps={{ 'aria-label': 'ค้นหาทุกอย่างในห้องสมุด' }}
              sx={{ flex: 1, fontFamily: fonts.thai, fontSize: 15, color: colors.ink }}
              autoFocus
            />
            <IconButton type="submit" size="small" aria-label="ค้นหา">
              <Box component="img" src={iconSearch} alt="" sx={{ height: 16, width: 16 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ flex: 1, width: '100%', bgcolor: 'white' }}>
        <Box sx={{ mx: 'auto', maxWidth: 1440, display: 'flex', flexDirection: 'column', gap: '40px', px: { xs: '24px', md: '64px' }, py: { xs: '32px', md: '48px' } }}>
          {!hasQuery ? (
            <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>
              พิมพ์คำค้นหาด้านบนเพื่อค้นหาหนังสือ, E-Book, อุปกรณ์ และห้อง พร้อมกันในที่เดียว
            </Typography>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: '64px' }}>
              <CircularProgress size={32} sx={{ color: colors.accentGreen }} />
            </Box>
          ) : totalCount === 0 ? (
            <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>
              ไม่พบผลลัพธ์ที่ตรงกับ "{q}" ลองใช้คำค้นหาอื่น
            </Typography>
          ) : (
            <>
              <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted }}>
                พบ {totalCount.toLocaleString('th-TH')} ผลลัพธ์สำหรับ "{q}"
              </Typography>

              {bookResults.length > 0 && (
                <Reveal>
                  <Box>
                    <SectionHeader title="หนังสือ" count={bookResults.length} onViewAll={() => navigate(`/books?q=${encodeURIComponent(q)}`)} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                      {bookResults.slice(0, 4).map((book) => (
                        <BookCard key={book.book_id} book={book} />
                      ))}
                    </Box>
                  </Box>
                </Reveal>
              )}

              {ebookResults.length > 0 && (
                <Reveal delay={70}>
                  <Box>
                    <SectionHeader title="E-Book" count={ebookResults.length} onViewAll={() => navigate(`/ebooks?q=${encodeURIComponent(q)}`)} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                      {ebookResults.slice(0, 4).map((ebook) => (
                        <EbookCard key={ebook.ebook_id} ebook={ebook} />
                      ))}
                    </Box>
                  </Box>
                </Reveal>
              )}

              {equipmentResults.length > 0 && (
                <Reveal delay={140}>
                  <Box>
                    <SectionHeader title="อุปกรณ์" count={equipmentResults.length} onViewAll={() => requireLogin('/borrow')} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {equipmentResults.slice(0, 5).map((eq) => (
                        <Box key={eq.ID} onClick={() => requireLogin('/borrow')} sx={{ cursor: 'pointer' }}>
                          <SimpleResultRow
                            title={eq.name}
                            subtitle={[eq.category, eq.location].filter(Boolean).join(' · ')}
                            badge={eq.status === 'available' ? 'ว่าง' : 'ไม่ว่าง'}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Reveal>
              )}

              {roomResults.length > 0 && (
                <Reveal delay={210}>
                  <Box>
                    <SectionHeader title="ห้อง" count={roomResults.length} onViewAll={() => requireLogin('/booking')} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {roomResults.slice(0, 5).map((room) => (
                        <Box key={room.room_id} onClick={() => requireLogin('/booking')} sx={{ cursor: 'pointer' }}>
                          <SimpleResultRow
                            title={room.room_name}
                            subtitle={[room.building, room.floor ? `ชั้น ${room.floor}` : ''].filter(Boolean).join(' · ')}
                            badge={room.room_type === 'group' ? 'ห้องกลุ่ม' : 'ห้องเดี่ยว'}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Reveal>
              )}
            </>
          )}
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}

export default SearchPage
