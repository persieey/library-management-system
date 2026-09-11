import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import EbookCard from '../../components/EbookCard'
import CatalogHero from '../../components/catalog/CatalogHero'
import CatalogToolbar from '../../components/catalog/CatalogToolbar'
import CatalogStatus from '../../components/catalog/CatalogStatus'
import { usePublicEbooks } from '../../hooks/usePublicEbooks'
import { useCatalogFilter } from '../../hooks/useCatalogFilter'
import { logEbookSearch } from '../../services/https/ebooks'
import { useAuth } from '../../auth/useAuth'
import type { Ebook } from '../../interface/IEbookInterface'

// รายการ E-Book ทั้งหมด — ปลายทางของปุ่ม eBooks บนหน้าแรก และของช่องค้นหารวม (/search)
// หน้าตาและวิธีใช้เหมือนหน้าหนังสือทุกอย่าง ต่างแค่การ์ดมีปุ่มเปิดไฟล์
function EbooksPage() {
  const { ebooks, isLoading, error } = usePublicEbooks()
  const { token } = useAuth()
  const [searchParams] = useSearchParams()

  const filter = useCatalogFilter<Ebook>(ebooks, {
    searchText: (e) => [e.title, e.author, e.publisher, e.isbn, e.category],
    category: (e) => e.category,
    title: (e) => e.title,
    author: (e) => e.author,
    createdAt: (e) => e.created_at,
  })

  // ตั้งคำค้นหาเริ่มต้นจาก query string (เช่นกดมาจากช่องค้นหารวมหน้าแรก /search)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) filter.setQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // เก็บ log คำค้นหาจริงให้หน้ารายงานสถิติ "สถิติการค้นหา e-book" มีข้อมูลจริง
  //
  // เดิมดีเลย์แค่ 500ms ต่อการพิมพ์ทุกครั้ง — คนพิมพ์คำยาว ๆ แล้วมีจังหวะเว้นระหว่างคำ
  // (เช่นพิมพ์ "การ" เว้นคิด แล้วพิมพ์ "เขียนโปรแกรม" ต่อ) กลายเป็น log แยกเป็นท่อนสั้น-ยาวปนกัน
  // ไม่ใช่คำค้นหาที่ตั้งใจจริง แก้โดย (1) ยืดดีเลย์เป็น 1.2 วิ ให้ทนจังหวะเว้นคำได้มากขึ้น
  // (2) จำคำล่าสุดที่ log ไปแล้วไว้ ถ้าคำใหม่เป็นแค่ prefix ของคำที่ log ไปแล้ว (เช่น backspace)
  // ไม่ log ซ้ำ (3) พอออกจากช่องค้นหา (blur) ถือว่าเป็นคำค้นหาสุดท้ายจริง ยิง log ทันทีไม่ต้องรอดีเลย์
  const lastLoggedRef = useRef('')
  const pendingTimerRef = useRef<number | null>(null)

  const commitSearchLog = (raw: string) => {
    const q = raw.trim()
    if (!q || q === lastLoggedRef.current) return
    // ลบตัวอักษรถอยกลับมาเป็นคำสั้นกว่าที่เพิ่ง log ไปแล้ว (ยังเป็นคำเดิมแค่สั้นลง) ไม่ต้อง log ซ้ำ
    if (lastLoggedRef.current.startsWith(q)) return
    lastLoggedRef.current = q
    logEbookSearch(q, token).catch(() => {})
  }

  useEffect(() => {
    const q = filter.query.trim()
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current)
    if (!q || q === lastLoggedRef.current) return
    pendingTimerRef.current = window.setTimeout(() => commitSearchLog(q), 1200)
    return () => {
      if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.query, token])

  const handleSearchBlur = () => {
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current)
    commitSearchLog(filter.query)
  }

  const hasResults = !isLoading && !error && filter.results.length > 0

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <CatalogHero
        title="E-Book ทั้งหมด"
        subtitle="อ่านออนไลน์ได้ทันทีหลังเข้าสู่ระบบ ค้นหาจากชื่อเรื่อง ผู้แต่ง สำนักพิมพ์ หรือ ISBN"
        placeholder="พิมพ์เพื่อค้นหา E-Book . . ."
        query={filter.query}
        onQueryChange={filter.setQuery}
        onQueryBlur={handleSearchBlur}
      />

      <Box component="section" sx={{ flex: 1, width: '100%', bgcolor: 'white' }}>
        <Box
          sx={{
            mx: 'auto',
            maxWidth: 1440,
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            px: { xs: '24px', md: '64px' },
            py: { xs: '32px', md: '48px' },
          }}
        >
          {!isLoading && !error && ebooks.length > 0 && (
            <CatalogToolbar
              categories={filter.categories}
              category={filter.category}
              onCategoryChange={filter.setCategory}
              sort={filter.sort}
              onSortChange={filter.setSort}
              shown={filter.results.length}
              total={ebooks.length}
              isFiltered={filter.isFiltered}
              onReset={filter.reset}
            />
          )}

          <CatalogStatus
            isLoading={isLoading}
            error={error}
            isEmpty={ebooks.length === 0}
            emptyText="ยังไม่มี E-Book ในระบบ"
            isNoMatch={ebooks.length > 0 && filter.results.length === 0}
          />

          {hasResults && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '24px',
              }}
            >
              {filter.results.map((ebook, i) => (
                <Reveal key={ebook.ebook_id} delay={Math.min(i, 11) * 60}>
                  <EbookCard ebook={ebook} />
                </Reveal>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}

export default EbooksPage
