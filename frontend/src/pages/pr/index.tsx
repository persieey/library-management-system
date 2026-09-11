import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import FeedbackButton from '../../components/FeedbackButton'
import CategoryCard from '../../components/CategoryCard'
import Reveal from '../../components/Reveal'
import EventAnnouncementCard from '../../components/EventAnnouncementCard'
import BookCard from '../../components/BookCard'
import { colors, fonts } from '../../theme'
import { useEvents } from '../../context/EventContext'
import { usePublicBooks } from '../../hooks/usePublicBooks'
import { useLoginPrompt } from '../../context/LoginPrompt'

import imgBg from '../../assets/hero-bg.jpg'

import iconSearch from '../../assets/icons/search.svg'
import iconBook from '../../assets/icons/quick-book.svg'
import iconBookFill from '../../assets/icons/quick-book-fill.svg'
import iconRoom from '../../assets/icons/quick-room.svg'

import iconFiction from '../../assets/icons/cat-fiction.svg'
import iconNonFiction from '../../assets/icons/cat-nonfiction.svg'
import iconScience from '../../assets/icons/cat-science.svg'
import iconHistory from '../../assets/icons/cat-history.svg'
import iconChildren from '../../assets/icons/cat-children.svg'
import iconRomance from '../../assets/icons/cat-romance.svg'
import iconMystery from '../../assets/icons/cat-mystery.svg'
import iconBiography from '../../assets/icons/cat-biography.svg'

// left = ตำแหน่ง x ใน Figma ลบขอบซ้ายของแถบ (220) — ดีไซน์วางมือ ระยะจึงไม่เท่ากัน
// guard: true = ต้องล็อกอินก่อน ถ้ายังไม่ล็อกอินให้เด้งหน้าต่างล็อกอินแล้วค่อยพาไปต่อ
const quickLinks = [
  { icon: iconBook, label: 'Books', to: '/books', left: 112 },
  { icon: iconBookFill, label: 'eBooks', to: '/ebooks', left: 351 },
  { icon: iconRoom, label: 'Recording Room', to: '/booking', left: 601, guard: true },
  { icon: iconBookFill, label: 'borrow', to: '/borrow', left: 856 },
]

// จับคู่ชื่อหมวดหมู่จริงในระบบ (ภาษาไทย มาจาก books.category) กับไอคอนที่มีอยู่แล้ว
// หมวดที่ไม่ตรงกับชื่อในตารางนี้จะได้ไอคอน DEFAULT_CATEGORY_ICON แทน กันพังตอนมีหมวดใหม่
const CATEGORY_ICONS: Record<string, string> = {
  นวนิยาย: iconFiction,
  วิชาการ: iconNonFiction,
  วิทยาศาสตร์: iconScience,
  จิตวิทยา: iconScience,
  ประวัติศาสตร์: iconHistory,
  การ์ตูน: iconChildren,
  เด็ก: iconChildren,
  โรแมนซ์: iconRomance,
  สืบสวน: iconMystery,
  ชีวประวัติ: iconBiography,
}
const DEFAULT_CATEGORY_ICON = iconNonFiction

function HeroSection() {
  const { requireLogin } = useLoginPrompt()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  // เดิมช่องนี้เป็นแค่กล่องตกแต่ง (Typography เขียนคำว่า "Search" ไม่มี input จริง)
  // กดพิมพ์อะไรไม่ได้เลย ทั้งที่เป็นองค์ประกอบเด่นสุดของหน้าแรก เปลี่ยนเป็น input จริง
  // ที่พาไปหน้า /search ซึ่งค้นหารวมหนังสือ/E-Book/อุปกรณ์/ห้องพร้อมกันในที่เดียว
  // (แนวทางเดียวกับช่องค้นหา "Find all" ของเว็บห้องสมุด มธ.)
  const submitSearch = () => {
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const fadeSx = (delayMs: number) => ({
    transition: 'opacity 900ms ease-out',
    transitionDelay: `${delayMs}ms`,
    opacity: ready ? 1 : 0,
  })

  return (
    <Box sx={{ position: 'relative', height: 960, width: '100%', overflow: 'hidden' }}>
      <Box
        component="img"
        src={imgBg}
        alt=""
        sx={{ position: 'absolute', inset: 0, height: '100%', width: '100%', objectFit: 'cover' }}
      />
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: colors.brandGreen, opacity: 0.6 }} />

      <Box sx={{ position: 'relative', mx: 'auto', height: '100%', maxWidth: 1440 }}>
        <Typography
          sx={{
            position: 'absolute',
            left: '50%',
            top: 270,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontFamily: fonts.inter,
            fontSize: 40,
            color: 'white',
            ...fadeSx(0),
          }}
        >
          How can we help?
        </Typography>

        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault()
            submitSearch()
          }}
          sx={{
            position: 'absolute',
            left: '50%',
            top: 332,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 40,
            width: 600,
            borderRadius: '50px',
            bgcolor: colors.surfaceMuted,
            pl: '20px',
            pr: '21px',
            ...fadeSx(150),
          }}
        >
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            inputProps={{ 'aria-label': 'ค้นหาหนังสือ' }}
            sx={{
              flex: 1,
              fontFamily: fonts.inter,
              fontSize: 14,
              color: colors.ink,
              '& input::placeholder': { color: colors.placeholder, opacity: 1 },
            }}
          />
          <IconButton type="submit" size="small" aria-label="ค้นหา" sx={{ p: 0 }}>
            <Box component="img" src={iconSearch} alt="" sx={{ height: 17, width: 17 }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: 220,
            top: 479,
            height: 150,
            width: 1000,
            bgcolor: `${colors.brandGreen}f2`,
            ...fadeSx(300),
          }}
        >
          {quickLinks.map((link) => (
            <Box
              key={link.label}
              {...(link.guard
                ? { component: 'button' as const, type: 'button' as const, onClick: () => requireLogin(link.to) }
                : { component: Link, to: link.to })}
              sx={{
                border: 'none',
                background: 'transparent',
                p: 0,
                cursor: 'pointer',
                position: 'absolute',
                top: '36px',
                left: `${link.left}px`,
                display: 'flex',
                width: 50,
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Box component="img" src={link.icon} alt="" sx={{ height: 50, width: 50 }} />
              <Typography
                sx={{
                  position: 'absolute',
                  top: '59px',
                  whiteSpace: 'nowrap',
                  fontFamily: fonts.kanit,
                  fontSize: 11,
                  color: 'white',
                }}
              >
                {link.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function CategorySection() {
  // นับหมวดหมู่จริงจากหนังสือในระบบ (books.category) แทนเลขที่ hardcode ไว้เดิม
  // เรียงหมวดที่มีเล่มเยอะสุดขึ้นก่อน ให้หมวดที่ใช้งานจริงเด่นกว่าหมวดที่แทบไม่มีเล่ม
  const { books } = usePublicBooks()

  const categories = (() => {
    const counts = new Map<string, number>()
    for (const b of books) {
      const name = b.category?.trim()
      if (!name) continue
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        icon: CATEGORY_ICONS[name] ?? DEFAULT_CATEGORY_ICON,
        name,
        titles: `${count.toLocaleString('th-TH')} เล่ม`,
        to: `/books?category=${encodeURIComponent(name)}`,
      }))
  })()

  // ยังไม่มีหนังสือ/หมวดหมู่ในระบบก็ไม่ต้องโชว์หัวข้อว่างๆ เหมือน RecommendedBooks ด้านล่าง
  if (categories.length === 0) return null

  return (
    <Box component="section" sx={{ width: '100%', bgcolor: colors.cream50 }}>
      <Box
        sx={{
          mx: 'auto',
          maxWidth: 1440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          px: '64px',
          py: '80px',
        }}
      >
        <Reveal>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Typography sx={{ fontFamily: fonts.inter, fontSize: 32, fontWeight: 600, color: colors.brown900 }}>
              Browse by Category
            </Typography>
            <Typography sx={{ fontFamily: fonts.inter, fontSize: 16, color: colors.brown700 }}>
              Find your favorite genre and explore curated collections
            </Typography>
          </Box>
        </Reveal>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            width: '100%',
          }}
        >
          {categories.map((category, i) => (
            <Reveal key={category.name} delay={i * 70}>
              <CategoryCard {...category} />
            </Reveal>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

const EVENT_CARD_WIDTH = 384
const EVENT_CARD_GAP = 24

function EventSection() {
  const { items: events } = useEvents()
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollByCard = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * (EVENT_CARD_WIDTH + EVENT_CARD_GAP), behavior: 'smooth' })
  }

  return (
    <Box component="section" sx={{ width: '100%', bgcolor: 'white' }}>
      <Box sx={{ mx: 'auto', maxWidth: 1440, display: 'flex', flexDirection: 'column', gap: '40px', px: '64px', py: '88px' }}>
        <Reveal>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography
                sx={{ fontFamily: fonts.kanit, fontSize: 36, fontWeight: 700, lineHeight: 1.25, color: colors.ink }}
              >
                Event Announcements
              </Typography>
              <Typography
                sx={{ fontFamily: fonts.inter, fontSize: 16, lineHeight: 1.6, color: colors.inkMuted }}
              >
                Upcoming events and training workshops from the library
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {events.length > 3 && (
                <Box sx={{ display: 'flex', gap: '8px' }}>
                  <IconButton
                    aria-label="เลื่อนไปทางซ้าย"
                    onClick={() => scrollByCard(-1)}
                    sx={{ border: `1px solid ${colors.border}`, '&:hover': { bgcolor: colors.accentGreenLight } }}
                  >
                    <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    aria-label="เลื่อนไปทางขวา"
                    onClick={() => scrollByCard(1)}
                    sx={{ border: `1px solid ${colors.border}`, '&:hover': { bgcolor: colors.accentGreenLight } }}
                  >
                    <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}
              <Typography
                component={Link}
                to="/events"
                sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 600, color: colors.accentGreen, whiteSpace: 'nowrap' }}
              >
                View All →
              </Typography>
            </Box>
          </Box>
        </Reveal>

        <Box
          ref={scrollerRef}
          sx={{
            display: 'flex',
            gap: `${EVENT_CARD_GAP}px`,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            pb: 1,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {events.map((event, i) => (
            <Box key={event.id} sx={{ flex: `0 0 ${EVENT_CARD_WIDTH}px`, scrollSnapAlign: 'start' }}>
              <Reveal delay={i * 90}>
                <EventAnnouncementCard event={event} />
              </Reveal>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function RecommendedBooks() {
  // โชว์เฉพาะเล่มที่เจ้าหน้าที่ติดดาวแนะนำไว้จากหน้าประชาสัมพันธ์ (book.recommended)
  //
  // เดิม fallback ไปโชว์ 5 เล่มใหม่สุดตอนยังไม่มีใครติดดาวเลย แต่ทำให้ถอนดาวออกแล้ว
  // เล่มนั้นยังโผล่อยู่ดี (เพราะบังเอิญติดอยู่ใน 5 เล่มใหม่สุดพอดี) ดูเหมือนถอนดาวไม่ทำงาน
  // ตัดออกให้ตรงไปตรงมา: มีคนติดดาวจริงถึงโชว์ ไม่มีก็ซ่อนทั้ง section ไปเลย
  const { books } = usePublicBooks()
  const featured = books.filter((b) => b.recommended).slice(0, 5)

  // ยังไม่มีเล่มไหนถูกติดดาวแนะนำเลยก็ไม่ต้องโชว์หัวข้อว่างๆ
  if (featured.length === 0) return null

  return (
    <Box component="section" sx={{ width: '100%', bgcolor: 'white' }}>
      <Box sx={{ mx: 'auto', maxWidth: 1440, display: 'flex', flexDirection: 'column', gap: '40px', px: '64px', py: '80px' }}>
        <Reveal>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 48, fontWeight: 600, color: colors.brown900 }}>
                Recommended for You
              </Typography>
              <Typography sx={{ fontFamily: fonts.inter, fontSize: 16, color: colors.brown700 }}>
                Handpicked titles based on what readers love this month
              </Typography>
            </Box>
            <Typography
              component={Link}
              to="/books?recommended=true"
              sx={{ fontFamily: fonts.inter, fontSize: 14, fontWeight: 600, color: colors.terracotta600 }}
            >
              View All
            </Typography>
          </Box>
        </Reveal>

        <Box sx={{ display: 'flex', gap: '24px' }}>
          {featured.map((book, i) => (
            <Box key={book.book_id} sx={{ flex: 1 }}>
              <Reveal delay={i * 70}>
                <BookCard book={book} />
              </Reveal>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function PRPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      <Header />
      <HeroSection />
      <CategorySection />
      <EventSection />
      <RecommendedBooks />
      <Footer />
      {/* ปุ่มลอยมุมล่างซ้าย — แจ้งปัญหา/ข้อเสนอแนะ ลอยตามตอนเลื่อนหน้า */}
      <FeedbackButton />
    </Box>
  )
}

export default PRPage
