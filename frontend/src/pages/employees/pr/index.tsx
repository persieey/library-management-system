import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import PRCard from './PRCard'
import PREditorDialog, { type PRDraft } from './PREditorDialog'
import PRPreviewDialog from './PRPreviewDialog'
import { printPRItem } from './printPRItem'
import EventCard from './EventCard'
import EventEditorDialog from './EventEditorDialog'
import { formatEventDate } from './eventDateFormat'
import type { PRStatus } from '../../../interface/IPRInterface'
import type { EventDraft } from '../../../interface/IEventInterface'
import type { Book } from '../../../interface/IBookInterface'
import { usePR } from '../../../context/PRContext'
import { useEvents } from '../../../context/EventContext'
import { useAuth } from '../../../auth/useAuth'
import { listBooks, setBookRecommended } from '../../../services/https/books'
import searchIcon from '../../../assets/icons/pr-search.svg'
import plusIcon from '../../../assets/icons/pr-plus.svg'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import { colors, fonts } from '../../../theme'

type SidebarTab = 'overview' | 'events' | 'announcements' | 'books'

type FilterTab = 'ทั้งหมด' | PRStatus
const FILTER_TABS: FilterTab[] = ['ทั้งหมด', 'เผยแพร่', 'ตั้งเวลา', 'ร่าง', 'หมดอายุ']

function AnnouncementsPanel() {
  const { items: allItems, create, update, remove, togglePause, copyItem, toast, clearToast } = usePR()
  const [filter, setFilter] = useState<FilterTab>('ทั้งหมด')
  const [query, setQuery] = useState('')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)

  const editingItem = useMemo(() => allItems.find((i) => i.id === editingId) ?? null, [allItems, editingId])
  const previewItem = useMemo(() => allItems.find((i) => i.id === previewId) ?? null, [allItems, previewId])

  const items = useMemo(
    () =>
      allItems
        .filter((item) => filter === 'ทั้งหมด' || item.status === filter)
        .filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
    [allItems, filter, query],
  )

  const openCreate = () => {
    setEditingId(null)
    setEditorOpen(true)
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setEditorOpen(true)
  }

  const handleSubmit = (draft: PRDraft) => {
    if (editingId === null) create(draft)
    else update(editingId, draft)
    setEditorOpen(false)
  }

  // ปุ่ม "ดู" ของแอดมินไว้แค่พรีวิวข่าวตัวเอง ไม่นับเป็นยอดเข้าชม — ยอดเข้าชมจริงนับ
  // จากฝั่งผู้อ่านสาธารณะที่กดเปิดผ่านกระดิ่งแจ้งเตือน (NotificationBell) เท่านั้น
  const handlePreview = (id: number) => {
    setPreviewId(id)
  }

  const handlePrint = (id: number) => {
    const item = allItems.find((i) => i.id === id)
    if (item) printPRItem(item)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find((i) => i.id === id)
    if (!item) return
    if (!window.confirm(`ต้องการลบข่าว "${item.title}" ใช่หรือไม่?`)) return
    remove(id)
    if (editingId === id) setEditorOpen(false)
    if (previewId === id) setPreviewId(null)
  }

  return (
    <Box sx={{ flex: 1, px: '32px', py: '32px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '24px' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen }}>
          จัดการประชาสัมพันธ์
        </Typography>
        <Button
          onClick={openCreate}
          startIcon={<Box component="img" src={plusIcon} alt="" sx={{ height: 22, width: 22 }} />}
          sx={{
            bgcolor: 'rgba(0,0,0,0.67)',
            color: 'white',
            borderRadius: '30px',
            px: '20px',
            py: '10px',
            fontFamily: fonts.kanit,
            fontSize: 16,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          }}
        >
          สร้างข่าวประชาสัมพันธ์
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          mb: '24px',
          bgcolor: 'white',
          borderRadius: '30px',
          p: '10px',
        }}
      >
        <Box sx={{ display: 'flex', bgcolor: '#d6d6d6', borderRadius: '30px', p: '6px' }}>
          {FILTER_TABS.map((tab) => (
            <Box
              key={tab}
              component="button"
              onClick={() => setFilter(tab)}
              sx={{
                border: 'none',
                cursor: 'pointer',
                borderRadius: '30px',
                px: '16px',
                py: '8px',
                fontFamily: fonts.kanit,
                fontSize: 15,
                whiteSpace: 'nowrap',
                bgcolor: filter === tab ? 'white' : 'transparent',
                color: '#676767',
              }}
            >
              {tab}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid black',
            borderRadius: '30px',
            px: '14px',
            py: '6px',
          }}
        >
          <Box component="img" src={searchIcon} alt="" sx={{ height: 18, width: 18 }} />
          <InputBase
            placeholder="ค้นหาประกาศ . . ."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flex: 1, fontFamily: fonts.kanit, fontSize: 15, color: '#676767' }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {items.length === 0 ? (
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 16, color: colors.inkMuted }}>
            ไม่พบประกาศที่ตรงกับเงื่อนไข
          </Typography>
        ) : (
          items.map((item) => (
            <PRCard
              key={item.id}
              item={item}
              onTogglePause={togglePause}
              onEdit={openEdit}
              onCopy={copyItem}
              onPreview={handlePreview}
              onPrint={handlePrint}
              onDelete={handleDelete}
            />
          ))
        )}
      </Box>

      <PREditorDialog
        open={editorOpen}
        editingItem={editingItem}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />
      <PRPreviewDialog item={previewItem} onClose={() => setPreviewId(null)} />

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={clearToast}>
        <Alert severity="success" onClose={clearToast} sx={{ fontFamily: fonts.thai }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// ติดดาวแนะนำหนังสือ — รายชื่อหนังสือทั้งหมด กดดาวแล้วขึ้น "Recommended for You"
// บนหน้าแรกทันที (RecommendedBooks อ่านจาก book.recommended ตรง ๆ ไม่ต้อง publish ซ้ำ)
function RecommendBooksPanel() {
  const { token } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [pendingId, setPendingId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    listBooks(token)
      .then((data) => {
        if (!cancelled) setBooks(data)
      })
      .catch(() => {
        if (!cancelled) setError('โหลดรายการหนังสือไม่สำเร็จ')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return books
    return books.filter((b) => [b.title, b.author, b.category].some((v) => v?.toLowerCase().includes(q)))
  }, [books, query])

  const recommendedCount = books.filter((b) => b.recommended).length

  async function toggleStar(book: Book) {
    if (!token) return
    const next = !book.recommended
    setPendingId(book.book_id)
    setBooks((prev) => prev.map((b) => (b.book_id === book.book_id ? { ...b, recommended: next } : b)))
    try {
      await setBookRecommended(token, book.book_id, next)
      setToast(next ? `แนะนำ "${book.title}" แล้ว` : `เอา "${book.title}" ออกจากรายการแนะนำแล้ว`)
    } catch {
      // ยิงพลาด ย้อนค่ากลับตามจริง
      setBooks((prev) => prev.map((b) => (b.book_id === book.book_id ? { ...b, recommended: !next } : b)))
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted }}>
          ติดดาวหนังสือที่อยากแนะนำ ให้ขึ้นแสดงในส่วน "Recommended for You" บนหน้าแรก — แนะนำอยู่ตอนนี้ {recommendedCount} เล่ม
        </Typography>
        <InputBase
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อเรื่อง ผู้แต่ง หรือหมวดหมู่..."
          sx={{
            fontFamily: fonts.thai,
            fontSize: 14,
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            px: '14px',
            py: '8px',
            minWidth: 260,
            bgcolor: 'white',
          }}
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted }}>กำลังโหลด...</Typography>
      ) : filtered.length === 0 ? (
        <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '24px' }}>ไม่พบหนังสือที่ตรงกับคำค้นหา</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((book) => (
            <Box
              key={book.book_id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                px: '16px',
                py: '10px',
                bgcolor: book.recommended ? colors.accentGreenLight : 'white',
              }}
            >
              <IconButton
                aria-label={book.recommended ? 'เอาออกจากรายการแนะนำ' : 'แนะนำหนังสือเล่มนี้'}
                onClick={() => void toggleStar(book)}
                disabled={pendingId === book.book_id}
                sx={{ color: book.recommended ? '#d4a017' : colors.inkMuted }}
              >
                {book.recommended ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontFamily: fonts.thai, fontWeight: 600 }} noWrap>
                  {book.title}
                </Typography>
                <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }} noWrap>
                  {book.author} · {book.category || 'ไม่ระบุหมวดหมู่'}
                </Typography>
              </Box>
              {book.recommended && (
                <Typography sx={{ fontFamily: fonts.thai, fontSize: 12, fontWeight: 600, color: colors.brandGreen }}>
                  แนะนำอยู่
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={() => setToast('')}>
        <Alert severity="success" onClose={() => setToast('')} sx={{ fontFamily: fonts.thai }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}

interface StatCardProps {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Box sx={{ flex: 1, borderRadius: '16px', bgcolor: 'white', border: `1px solid ${colors.border}`, px: '24px', py: '20px' }}>
      <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted, mb: '6px' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen }}>{value}</Typography>
    </Box>
  )
}

// ภาพรวม — สรุปสถิติจากทั้งข่าวประชาสัมพันธ์และกิจกรรม พร้อมทางลัดไปแท็บที่เกี่ยวข้อง
function OverviewPanel({ onNavigate }: { onNavigate: (tab: SidebarTab) => void }) {
  const { items: prItems } = usePR()
  const { items: eventItems } = useEvents()

  const publishedCount = useMemo(() => prItems.filter((item) => item.status === 'เผยแพร่').length, [prItems])
  const totalViews = useMemo(() => prItems.reduce((sum, item) => sum + item.views, 0), [prItems])
  const upcomingEvents = useMemo(
    () =>
      eventItems
        .filter((item) => dayjs(item.date).isAfter(dayjs()))
        .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()),
    [eventItems],
  )

  const recentAnnouncements = useMemo(
    () =>
      [...prItems]
        .sort((a, b) => (b.publishedTimestamp ?? 0) - (a.publishedTimestamp ?? 0))
        .slice(0, 3),
    [prItems],
  )

  return (
    <Box sx={{ flex: 1, px: '32px', py: '32px' }}>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen, mb: '24px' }}>
        ภาพรวม
      </Typography>

      <Box sx={{ display: 'flex', gap: '16px', mb: '32px' }}>
        <StatCard label="ประกาศทั้งหมด" value={prItems.length.toLocaleString('th-TH')} />
        <StatCard label="เผยแพร่อยู่ตอนนี้" value={publishedCount.toLocaleString('th-TH')} />
        <StatCard label="ยอดเข้าชมรวม" value={totalViews.toLocaleString('th-TH')} />
        <StatCard label="กิจกรรมที่กำลังจะถึง" value={upcomingEvents.length.toLocaleString('th-TH')} />
      </Box>

      <Box sx={{ display: 'flex', gap: '24px' }}>
        <Box sx={{ flex: 1, borderRadius: '16px', bgcolor: 'white', border: `1px solid ${colors.border}`, p: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 20, color: colors.ink }}>
              ประกาศล่าสุด
            </Typography>
            <Box
              component="button"
              onClick={() => onNavigate('announcements')}
              sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: fonts.thai, fontSize: 14, color: colors.accentGreen }}
            >
              ดูทั้งหมด →
            </Box>
          </Box>

          {recentAnnouncements.length === 0 ? (
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted }}>
              ยังไม่มีข่าวประชาสัมพันธ์
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentAnnouncements.map((item) => (
                <Box key={item.id} sx={{ borderBottom: `1px solid ${colors.border}`, pb: '10px' }}>
                  <Typography sx={{ fontFamily: fonts.thai, fontSize: 15, color: colors.ink }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                    {item.status} · {item.publishedAt}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ flex: 1, borderRadius: '16px', bgcolor: 'white', border: `1px solid ${colors.border}`, p: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 20, color: colors.ink }}>
              กิจกรรมที่ใกล้ที่สุด
            </Typography>
            <Box
              component="button"
              onClick={() => onNavigate('events')}
              sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: fonts.thai, fontSize: 14, color: colors.accentGreen }}
            >
              ดูทั้งหมด →
            </Box>
          </Box>

          {upcomingEvents.length === 0 ? (
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted }}>
              ยังไม่มีกิจกรรมที่กำลังจะถึง
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingEvents.slice(0, 3).map((item) => (
                <Box key={item.id} sx={{ borderBottom: `1px solid ${colors.border}`, pb: '10px' }}>
                  <Typography sx={{ fontFamily: fonts.thai, fontSize: 15, color: colors.ink }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                    {formatEventDate(item.date, item.allDay)} · {item.location}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

// จัดการกิจกรรม — รายการนี้จะไปโผล่ในส่วน "Event Announcements" ของหน้าแรกทันทีที่บันทึก
// ต่างจากข่าวประชาสัมพันธ์ที่ไปแจ้งเตือนที่กระดิ่งแทน
function EventsPanel() {
  const { items, create, update, remove, toast, clearToast } = useEvents()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const editingItem = useMemo(() => items.find((i) => i.id === editingId) ?? null, [items, editingId])

  const openCreate = () => {
    setEditingId(null)
    setEditorOpen(true)
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setEditorOpen(true)
  }

  const handleSubmit = (draft: EventDraft) => {
    if (editingId === null) create(draft)
    else update(editingId, draft)
    setEditorOpen(false)
  }

  const handleDelete = (id: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    if (!window.confirm(`ต้องการลบกิจกรรม "${item.title}" ใช่หรือไม่?`)) return
    remove(id)
    if (editingId === id) setEditorOpen(false)
  }

  return (
    <Box sx={{ flex: 1, px: '32px', py: '32px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '24px' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen }}>
          จัดการกิจกรรม
        </Typography>
        <Button
          onClick={openCreate}
          startIcon={<Box component="img" src={plusIcon} alt="" sx={{ height: 22, width: 22 }} />}
          sx={{
            bgcolor: 'rgba(0,0,0,0.67)',
            color: 'white',
            borderRadius: '30px',
            px: '20px',
            py: '10px',
            fontFamily: fonts.kanit,
            fontSize: 16,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          }}
        >
          เพิ่มกิจกรรม
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {items.length === 0 ? (
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 16, color: colors.inkMuted }}>
            ยังไม่มีกิจกรรม
          </Typography>
        ) : (
          items.map((item) => (
            <EventCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
          ))
        )}
      </Box>

      <EventEditorDialog
        open={editorOpen}
        editingItem={editingItem}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={clearToast}>
        <Alert severity="success" onClose={clearToast} sx={{ fontFamily: fonts.thai }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// โมดูลจัดการประชาสัมพันธ์ — อยู่ใต้ BackOfficeLayout ร่วมกับระบบอื่น
// แท็บมาจาก URL ไม่ใช่ state เพื่อให้ลิงก์ตรงเข้าหัวข้อย่อยและกดย้อนกลับได้
const TAB_TITLES: Record<SidebarTab, string> = {
  overview: 'ประชาสัมพันธ์ — ภาพรวม',
  events: 'ประชาสัมพันธ์ — กิจกรรม',
  announcements: 'ประชาสัมพันธ์ — ประกาศ',
  books: 'ประชาสัมพันธ์ — หนังสือแนะนำ',
}

function ManagePR() {
  const { tab: tabParam } = useParams()
  const navigate = useNavigate()

  // ไม่มี :tab ใน URL แปลว่าเข้ามาที่ /employees/pr ตรงๆ ให้แสดงภาพรวม
  const tab: SidebarTab =
    tabParam === 'events' || tabParam === 'announcements' || tabParam === 'books' ? tabParam : 'overview'

  const goToTab = (next: SidebarTab) =>
    navigate(next === 'overview' ? '/employees/pr' : `/employees/pr/${next}`)

  return (
    <BackOfficeLayout title={TAB_TITLES[tab]}>
      {tab === 'overview' && <OverviewPanel onNavigate={goToTab} />}
      {tab === 'events' && <EventsPanel />}
      {tab === 'announcements' && <AnnouncementsPanel />}
      {tab === 'books' && <RecommendBooksPanel />}
    </BackOfficeLayout>
  )
}

export default ManagePR
