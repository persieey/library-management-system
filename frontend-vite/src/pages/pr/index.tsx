import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import CategoryCard from '../../components/CategoryCard'
import Reveal from '../../components/Reveal'
import { colors, fonts } from '../../theme'

import imgBg from '../../assets/hero-bg.jpg'
import imgThumbnail1 from '../../assets/event-1.png'
import imgThumbnail2 from '../../assets/event-2.png'
import imgThumbnail3 from '../../assets/event-3.png'
import imgCover1 from '../../assets/book-1.png'
import imgCover2 from '../../assets/book-2.png'
import imgCover3 from '../../assets/book-3.png'
import imgCover4 from '../../assets/book-4.png'
import imgCover5 from '../../assets/book-5.png'

import iconSearch from '../../assets/icons/search.svg'
import iconBook from '../../assets/icons/quick-book.svg'
import iconBookFill from '../../assets/icons/quick-book-fill.svg'
import starFull from '../../assets/icons/star-full.svg'
import starHalf from '../../assets/icons/star-half.svg'

import iconFiction from '../../assets/icons/cat-fiction.svg'
import iconNonFiction from '../../assets/icons/cat-nonfiction.svg'
import iconScience from '../../assets/icons/cat-science.svg'
import iconHistory from '../../assets/icons/cat-history.svg'
import iconChildren from '../../assets/icons/cat-children.svg'
import iconRomance from '../../assets/icons/cat-romance.svg'
import iconMystery from '../../assets/icons/cat-mystery.svg'
import iconBiography from '../../assets/icons/cat-biography.svg'

// left = ตำแหน่ง x ใน Figma ลบขอบซ้ายของแถบ (220) — ดีไซน์วางมือ ระยะจึงไม่เท่ากัน
const quickLinks = [
  { icon: iconBook, label: 'Books', to: '/books', left: 112 },
  { icon: iconBookFill, label: 'eBooks', to: '/ebooks', left: 351 },
  { icon: iconBook, label: 'Recording Room', to: '/recording-room', left: 601 },
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

const events = [
  {
    img: imgThumbnail1,
    date: '12 Aug 2026 · 1:00 PM',
    title: 'Academic Database Searching Training',
    location: '📍 Training Room, 2nd Floor, Central Library',
  },
  {
    img: imgThumbnail2,
    date: '18 Aug 2026 · All Day',
    title: 'Monthly New Books Exhibition',
    location: '📍 Exhibition Zone, 1st Floor',
  },
  {
    img: imgThumbnail3,
    date: '25 Aug 2026 · 9:30 AM',
    title: 'Citation and EndNote Workshop',
    location: '📍 Computer Lab, 3rd Floor',
  },
]

const books = [
  { img: imgCover1, title: 'Beneath Copper Skies', author: 'by Eme Savage', rating: '4.5 (198)' },
  { img: imgCover2, title: 'The Lighthouse Keeper', author: 'by James Michael Pratt', rating: '4.8 (455)' },
  { img: imgCover3, title: 'Whispers in Autumn', author: 'by Trisha Leigh', rating: '4.2 (267)' },
  {
    img: imgCover4,
    title: "The Cartographer's Daughter",
    author: 'by Kiran Millwood Hargrave',
    rating: '3.9 (140)',
  },
  { img: imgCover5, title: 'The Silent Orchard', author: 'by Elena Marsh', rating: '4.0 (312)' },
]

function Stars() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} component="img" src={starFull} alt="" sx={{ height: 14, width: 14 }} />
      ))}
      <Box component="img" src={starHalf} alt="" sx={{ height: 14, width: 14 }} />
    </Box>
  )
}

function HeroSection() {
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
            top: 195,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontFamily: fonts.inter,
            fontSize: 60,
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
              component="a"
              href={link.to}
              sx={{
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

function EventSection() {
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
            <Typography
              component="a"
              href="/events"
              sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 600, color: colors.accentGreen }}
            >
              View All →
            </Typography>
          </Box>
        </Reveal>

        <Box sx={{ display: 'flex', gap: '24px' }}>
          {events.map((event, i) => (
            <Reveal key={event.title} delay={i * 90}>
              <Box
                component="article"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  height: '100%',
                  width: 384,
                  borderRadius: '16px',
                  border: `1px solid ${colors.border}`,
                  bgcolor: 'white',
                  px: '24px',
                  py: '28px',
                  transition: 'box-shadow 300ms',
                  '&:hover': { boxShadow: '0 6px 18px rgba(26,26,23,0.12)' },
                }}
              >
                <Box
                  component="img"
                  src={event.img}
                  alt=""
                  sx={{ height: 140, width: '100%', borderRadius: '10px', objectFit: 'cover' }}
                />
                <Box sx={{ width: 'fit-content', borderRadius: '20px', bgcolor: colors.accentGreenLight, px: '12px', py: '5px' }}>
                  <Typography
                    sx={{ fontFamily: fonts.thai, fontSize: 13, fontWeight: 500, letterSpacing: '2px', color: colors.accentGreen }}
                  >
                    {event.date}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: fonts.thai, fontSize: 18, fontWeight: 600, lineHeight: 1.35, color: colors.ink }}>
                  {event.title}
                </Typography>
                <Typography
                  sx={{ fontFamily: fonts.thai, fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: colors.inkMuted }}
                >
                  {event.location}
                </Typography>
                <Typography
                  component="a"
                  href="/events"
                  sx={{ fontFamily: fonts.thai, fontSize: 15, fontWeight: 600, color: colors.accentGreen }}
                >
                  View Details →
                </Typography>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function RecommendedBooks() {
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
              component="a"
              href="/books"
              sx={{ fontFamily: fonts.inter, fontSize: 14, fontWeight: 600, color: colors.terracotta600 }}
            >
              View All
            </Typography>
          </Box>
        </Reveal>

        <Box sx={{ display: 'flex', gap: '24px' }}>
          {books.map((book, i) => (
            <Box key={book.title} sx={{ flex: 1 }}>
              <Reveal delay={i * 70}>
                <Box
                  component="article"
                  sx={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    flexDirection: 'column',
                    gap: '14px',
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
                  <Box
                    component="img"
                    src={book.img}
                    alt=""
                    sx={{ height: 300, width: '100%', borderRadius: '10px', objectFit: 'cover' }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Stars />
                    <Typography sx={{ fontFamily: fonts.inter, fontSize: 12, color: colors.brown700 }}>
                      {book.rating}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, lineHeight: '22px', color: colors.brown900 }}
                  >
                    {book.title}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.inter, fontSize: 13, color: colors.brown500 }}>
                    {book.author}
                  </Typography>
                  <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      sx={{
                        borderRadius: '8px',
                        bgcolor: colors.cream50,
                        color: colors.brown900,
                        px: '14px',
                        py: '8px',
                        fontFamily: fonts.inter,
                        fontSize: 12,
                        fontWeight: 600,
                        '&:hover': { bgcolor: colors.cream50 },
                      }}
                    >
                      View
                    </Button>
                  </Box>
                </Box>
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
    </Box>
  )
}

export default PRPage
