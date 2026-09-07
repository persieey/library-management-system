import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
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
  { icon: iconBook, label: 'Recording Room', to: '/booking', left: 601, guard: true },
  { icon: iconBookFill, label: 'borrow', to: '/borrow', left: 856 },
]

const categories = [
  { icon: iconFiction, name: 'Fiction', titles: '2,400 titles', to: '/category/fiction' },
  { icon: iconNonFiction, name: 'Non-Fiction', titles: '1,850 titles', to: '/category/non-fiction' },
  { icon: iconScience, name: 'Science', titles: '980 titles', to: '/category/science' },
  { icon: iconHistory, name: 'History', titles: '1,120 titles', to: '/category/history' },
  { icon: iconChildren, name: 'Children', titles: '1,560 titles', to: '/category/children' },
  { icon: iconRomance, name: 'Romance', titles: '2,010 titles', to: '/category/romance' },
  { icon: iconMystery, name: 'Mystery', titles: '1,340 titles', to: '/category/mystery' },
  { icon: iconBiography, name: 'Biography', titles: '760 titles', to: '/category/biography' },
]

function HeroSection() {
  const { requireLogin } = useLoginPrompt()

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
          <Typography sx={{ fontFamily: fonts.inter, fontSize: 14, color: colors.placeholder }}>
            Search
          </Typography>
          <Box component="img" src={iconSearch} alt="" sx={{ height: 17, width: 17 }} />
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

        <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column', gap: '20px' }}>
          <Box sx={{ display: 'flex', gap: '20px' }}>
            {categories.slice(0, 4).map((category, i) => (
              <Box key={category.name} sx={{ flex: 1 }}>
                <Reveal delay={i * 70}>
                  <CategoryCard {...category} />
                </Reveal>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: '20px' }}>
            {categories.slice(4).map((category, i) => (
              <Box key={category.name} sx={{ flex: 1 }}>
                <Reveal delay={i * 70}>
                  <CategoryCard {...category} />
                </Reveal>
              </Box>
            ))}
          </Box>
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
  // เอาหนังสือจริงจากระบบจัดการหนังสือมาโชว์ 5 เล่มล่าสุด (backend เรียงใหม่สุดมาก่อนอยู่แล้ว)
  const { books } = usePublicBooks()
  const featured = books.slice(0, 5)

  // ยังไม่มีหนังสือในระบบก็ไม่ต้องโชว์หัวข้อว่างๆ
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
              to="/books"
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
