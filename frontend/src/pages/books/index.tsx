import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import BookCard from '../../components/BookCard'
import CatalogHero from '../../components/catalog/CatalogHero'
import CatalogToolbar from '../../components/catalog/CatalogToolbar'
import CatalogStatus from '../../components/catalog/CatalogStatus'
import { usePublicBooks } from '../../hooks/usePublicBooks'
import { useCatalogFilter } from '../../hooks/useCatalogFilter'
import type { Book } from '../../interface/IBookInterface'

// รายการหนังสือทั้งหมด — ปลายทางของปุ่ม Books บนหน้าแรก, การ์ด "Browse by
// Category" ที่มี ?category=... ต่อท้าย, และปุ่ม "View All" ของ "Recommended for
// You" ที่มี ?recommended=true ต่อท้าย (กรองให้เหลือเฉพาะเล่มที่ติดดาวแนะนำไว้)
// ข้อมูลมาจาก GET /api/v1/books ซึ่งเปิดให้คนที่ยังไม่ล็อกอินดูได้
function BooksPage() {
  const { books: allBooks, isLoading, error } = usePublicBooks()
  const [searchParams] = useSearchParams()

  const onlyRecommended = searchParams.get('recommended') === 'true'
  const books = useMemo(
    () => (onlyRecommended ? allBooks.filter((b) => b.recommended) : allBooks),
    [allBooks, onlyRecommended],
  )

  const filter = useCatalogFilter<Book>(books, {
    searchText: (b) => [b.title, b.author, b.publisher, b.isbn, b.call_number, b.category],
    category: (b) => b.category,
    title: (b) => b.title,
    author: (b) => b.author,
    createdAt: (b) => b.created_at,
  })

  // ตั้งหมวดหมู่/คำค้นหาเริ่มต้นจาก query string ตอนเข้าหน้านี้ครั้งแรก (เช่นกดมาจาก
  // การ์ดหมวดหมู่บนหน้าแรก หรือพิมพ์ค้นหาจากช่องค้นหาบนหน้าแรก) ผู้ใช้ยังเปลี่ยนตัวกรอง
  // ต่อจากในหน้านี้ได้ตามปกติ
  useEffect(() => {
    const category = searchParams.get('category')
    if (category) filter.setCategory(category)
    const q = searchParams.get('q')
    if (q) filter.setQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const hasResults = !isLoading && !error && filter.results.length > 0

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <CatalogHero
        title={onlyRecommended ? 'หนังสือแนะนำ' : 'หนังสือทั้งหมด'}
        subtitle={
          onlyRecommended
            ? 'หนังสือที่เจ้าหน้าที่คัดสรรมาแนะนำให้คุณโดยเฉพาะ'
            : 'ค้นหาจากชื่อเรื่อง ผู้แต่ง สำนักพิมพ์ ISBN หรือเลขเรียกหนังสือ'
        }
        placeholder="พิมพ์เพื่อค้นหาหนังสือ . . ."
        query={filter.query}
        onQueryChange={filter.setQuery}
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
          {!isLoading && !error && books.length > 0 && (
            <CatalogToolbar
              categories={filter.categories}
              category={filter.category}
              onCategoryChange={filter.setCategory}
              sort={filter.sort}
              onSortChange={filter.setSort}
              shown={filter.results.length}
              total={books.length}
              isFiltered={filter.isFiltered}
              onReset={filter.reset}
            />
          )}

          <CatalogStatus
            isLoading={isLoading}
            error={error}
            isEmpty={books.length === 0}
            emptyText={onlyRecommended ? 'ยังไม่มีหนังสือแนะนำในตอนนี้' : 'ยังไม่มีหนังสือในระบบ'}
            isNoMatch={books.length > 0 && filter.results.length === 0}
          />

          {hasResults && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '24px',
              }}
            >
              {filter.results.map((book, i) => (
                // delay หยุดเพิ่มหลังใบที่ 12 ไม่งั้นใบท้ายๆ รอนานเกินไป
                <Reveal key={book.book_id} delay={Math.min(i, 11) * 60}>
                  <BookCard book={book} />
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

export default BooksPage
