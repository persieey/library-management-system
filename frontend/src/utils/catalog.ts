import type { Book, BookCopy } from '../interface/IBookInterface'
import type { Ebook } from '../interface/IEbookInterface'


/**
 * แนน แจ็ค ต้อม ตรง เอาไปใช้ได้นะ
 * หนังสือหนึ่งเรื่องที่รวมทั้งฉบับเล่มจริงและฉบับออนไลน์ไว้ด้วยกัน
 *
 * book กับ ebook เป็น null ได้ทั้งคู่ (แต่ไม่พร้อมกัน)
 * เพราะบางเรื่องมีแค่เล่มจริง บางเรื่องมีแค่ไฟล์
 */
export interface CatalogItem {
  /** คีย์สำหรับ React — ไม่ซ้ำกันแน่นอนเพราะนำหน้าด้วยชนิด */
  key: string
  title: string
  author: string
  publisher: string
  category: string
  isbn: string
  description: string

  book: Book | null
  ebook: Ebook | null

  /** จำนวนเล่มจริงทั้งหมด และที่พร้อมให้ยืม */
  copyCount: number
  availableCount: number
}

/** ตัดช่องว่างหน้าหลังและแปลงเป็นตัวเล็ก ใช้เทียบชื่อเรื่อง */
function norm(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * รวมรายการหนังสือกับ E-Book ที่เป็นเรื่องเดียวกันให้เป็นการ์ดเดียว
 *
 * จับคู่ด้วย ISBN ก่อนเพราะเป็นรหัสสากล ตรงกันแปลว่าเล่มเดียวกันแน่นอน
 * ถ้าไม่มี ISBN ค่อยเทียบชื่อเรื่อง ซึ่งแม่นน้อยกว่าแต่ดีกว่าไม่จับคู่เลย
 */
export function buildCatalog(
  books: Book[],
  ebooks: Ebook[],
  copies: BookCopy[],
): CatalogItem[] {
  const usedEbookIds = new Set<number>()

  const items: CatalogItem[] = books.map((book) => {
    const match =
      ebooks.find((e) => e.isbn && book.isbn && e.isbn === book.isbn) ??
      ebooks.find((e) => norm(e.title) === norm(book.title)) ??
      null

    if (match) usedEbookIds.add(match.ebook_id)

    const own = copies.filter((c) => c.book_id === book.book_id)

    return {
      key: `book-${book.book_id}`,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      category: book.category,
      isbn: book.isbn,
      // คำบรรยายของเล่มจริงมาก่อน ถ้าว่างค่อยใช้ของ ebook
      description: book.description || match?.description || '',
      book,
      ebook: match,
      copyCount: own.length,
      availableCount: own.filter((c) => c.availability_status === 'available').length,
    }
  })

  // E-Book ที่ไม่มีเล่มจริงคู่กัน ต้องแสดงเป็นการ์ดของตัวเอง
  const standalone: CatalogItem[] = ebooks
    .filter((e) => !usedEbookIds.has(e.ebook_id))
    .map((ebook) => ({
      key: `ebook-${ebook.ebook_id}`,
      title: ebook.title,
      author: ebook.author,
      publisher: ebook.publisher,
      category: ebook.category,
      isbn: ebook.isbn,
      description: ebook.description || '',
      book: null,
      ebook,
      copyCount: 0,
      availableCount: 0,
    }))

  return [...items, ...standalone]
}

/** กรองด้วยคำค้นและหมวดหมู่ — ใช้ร่วมกันได้ทุกหน้าที่แสดงรายการ */
export function filterCatalog(
  items: CatalogItem[],
  query: string,
  category: string,
): CatalogItem[] {
  const keyword = norm(query)

  return items.filter((item) => {
    const matchKeyword =
      !keyword ||
      norm(item.title).includes(keyword) ||
      norm(item.author).includes(keyword) ||
      norm(item.isbn).includes(keyword)

    const matchCategory = !category || item.category === category

    return matchKeyword && matchCategory
  })
}