import { useMemo, useState } from 'react'

export type CatalogSort = 'newest' | 'title' | 'author'

export const CATALOG_SORTS: Array<{ value: CatalogSort; label: string }> = [
  { value: 'newest', label: 'เพิ่มล่าสุด' },
  { value: 'title', label: 'ชื่อเรื่อง ก-ฮ' },
  { value: 'author', label: 'ผู้แต่ง ก-ฮ' },
]

interface CatalogAccessors<T> {
  /** ข้อความทั้งหมดที่ให้ค้นเจอ เช่น ชื่อเรื่อง ผู้แต่ง ISBN */
  searchText: (item: T) => Array<string | null | undefined>
  category: (item: T) => string
  title: (item: T) => string
  author: (item: T) => string
  createdAt: (item: T) => string
}

interface CatalogFilterState<T> {
  query: string
  setQuery: (value: string) => void
  category: string
  setCategory: (value: string) => void
  sort: CatalogSort
  setSort: (value: CatalogSort) => void
  /** หมวดหมู่ที่มีอยู่จริงในข้อมูล เรียงตามตัวอักษร */
  categories: string[]
  results: T[]
  isFiltered: boolean
  reset: () => void
}

/**
 * ค้นหาและกรองรายการหนังสือ/E-Book ฝั่งเบราว์เซอร์
 *
 * กรองจากข้อมูลที่โหลดมาแล้วทั้งก้อน ไม่ได้ยิง API ใหม่ทุกตัวอักษร
 * ผลลัพธ์จึงเปลี่ยนทันทีที่พิมพ์ และไม่กวน backend
 * ถ้าวันหนึ่งหนังสือเยอะจนโหลดทีเดียวไม่ไหว ค่อยเปลี่ยนไปกรองฝั่ง server
 */
export function useCatalogFilter<T>(items: T[], accessors: CatalogAccessors<T>): CatalogFilterState<T> {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<CatalogSort>('newest')

  const categories = useMemo(() => {
    const found = new Set<string>()
    for (const item of items) {
      const value = accessors.category(item)
      if (value) found.add(value)
    }
    return [...found].sort((a, b) => a.localeCompare(b, 'th'))
    // accessors เป็น object ที่สร้างใหม่ทุก render จึงอ้างอิงแค่ items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    const matched = items.filter((item) => {
      if (category && accessors.category(item) !== category) return false
      if (!keyword) return true
      return accessors
        .searchText(item)
        .some((field) => (field ?? '').toLowerCase().includes(keyword))
    })

    const sorted = [...matched]
    if (sort === 'title') {
      sorted.sort((a, b) => accessors.title(a).localeCompare(accessors.title(b), 'th'))
    } else if (sort === 'author') {
      sorted.sort((a, b) => accessors.author(a).localeCompare(accessors.author(b), 'th'))
    } else {
      sorted.sort((a, b) => accessors.createdAt(b).localeCompare(accessors.createdAt(a)))
    }
    return sorted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, category, sort])

  return {
    query,
    setQuery,
    category,
    setCategory,
    sort,
    setSort,
    categories,
    results,
    isFiltered: Boolean(query.trim() || category),
    reset: () => {
      setQuery('')
      setCategory('')
    },
  }
}
