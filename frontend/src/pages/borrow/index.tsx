import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import CoverImage from '../../components/catalog/CoverImage'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../services/https'
import * as portal from '../../services/https/borrowerPortal'
import { colors, fonts } from '../../theme'

type Tab = 'books' | 'equipment' | 'history'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// สุชาดากำหนดไว้ที่ backend: เลือกวันรับได้ตั้งแต่วันนี้ถึงอีก 3 วัน (bookingDates ใน library_controller.go)
function maxBookingISO() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDate(value: string | null | undefined) {
  if (!value || value.startsWith('0001-')) return '—'
  return new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

type SelectedItem = { kind: 'book'; item: portal.CatalogResource } | { kind: 'equipment'; item: portal.CatalogEquipment }

type HistoryRow = {
  id: string
  loanId: string | number
  kind: 'หนังสือ' | 'อุปกรณ์'
  title: string
  code?: string
  reservedFor: string
  dueAt: string
  returnedAt: string | null
  cancelledAt?: string | null
  status: string
  fine: number
  finePaid: boolean
}

const STATUS_LABEL: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' }> = {
  reserved: { label: 'รอรับ', color: 'warning' },
  borrowed: { label: 'กำลังยืม', color: 'warning' },
  completed: { label: 'คืนแล้ว', color: 'success' },
  cancelled: { label: 'ยกเลิกแล้ว', color: 'default' },
}

// ยืม-คืนหนังสือและอุปกรณ์ — ปลายทางของปุ่ม "borrow" บนหน้าแรก
//
// ตรรกะการจอง/ต่อคิว/ยกเลิกทั้งหมดยกมาจาก B6731915 (สุชาดา) ผ่าน
// services/https/borrowerPortal.ts ที่คัดลอกมาทั้งไฟล์ไม่มีแก้ไข
// หน้านี้เป็นแค่ UI ใหม่ที่เข้าธีมของโปรเจกต์ ตรรกะข้างในเหมือนต้นฉบับเธอ
function BorrowPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('books')
  const [bookingDate, setBookingDate] = useState(todayISO())
  const [bookingDays, setBookingDays] = useState(14)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const [resources, setResources] = useState<portal.CatalogResource[]>([])
  const [equipment, setEquipment] = useState<portal.CatalogEquipment[]>([])
  const [bookLoans, setBookLoans] = useState<portal.BookLoan[]>([])
  const [equipmentLoans, setEquipmentLoans] = useState<portal.EquipmentLoan[]>([])
  const [queue, setQueue] = useState<portal.QueueRequest[]>([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [cancelTarget, setCancelTarget] = useState<HistoryRow | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextResources, nextEquipment] = await Promise.all([
        portal.getResources(undefined, bookingDate, bookingDays),
        portal.getEquipment(undefined, bookingDate, bookingDays),
      ])
      setResources(nextResources)
      setEquipment(nextEquipment)
      if (token) {
        const [nextLoans, nextEquipmentLoans, nextQueue] = await Promise.all([
          portal.getMyLoans(token),
          portal.getMyEquipmentLoans(token),
          portal.getMyQueue(token),
        ])
        setBookLoans(nextLoans)
        setEquipmentLoans(nextEquipmentLoans)
        setQueue(nextQueue)
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [token, bookingDate, bookingDays])

  useEffect(() => {
    void load()
  }, [load])

  const activeItems = tab === 'equipment' ? equipment : resources
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(activeItems.map((i) => i.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th'))],
    [activeItems],
  )

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase()
    return resources
      .filter((i) => category === 'all' || i.category === category)
      .filter((i) => !q || [i.title, i.author, i.barcode, i.category].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => a.title.localeCompare(b.title, 'th'))
  }, [resources, search, category])

  const filteredEquipment = useMemo(() => {
    const q = search.trim().toLowerCase()
    return equipment
      .filter((i) => category === 'all' || i.category === category)
      .filter((i) => !q || [i.name, i.asset_code, i.category].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'))
  }, [equipment, search, category])

  const history = useMemo<HistoryRow[]>(
    () => [
      ...bookLoans.map((l) => ({
        id: `book-${l.ID}`,
        loanId: l.ID,
        kind: 'หนังสือ' as const,
        title: l.resource?.title || 'หนังสือ',
        code: l.resource?.barcode,
        reservedFor: l.reserved_for,
        dueAt: l.due_at,
        returnedAt: l.returned_at,
        cancelledAt: l.cancelled_at,
        status: l.status,
        fine: l.fine || 0,
        finePaid: l.fine_paid || false,
      })),
      ...equipmentLoans.map((l) => ({
        id: `equipment-${l.ID}`,
        loanId: l.ID,
        kind: 'อุปกรณ์' as const,
        title: l.equipment?.name || 'อุปกรณ์',
        code: l.equipment?.asset_code,
        reservedFor: l.reserved_for,
        dueAt: l.due_at,
        returnedAt: l.returned_at,
        cancelledAt: l.cancelled_at,
        status: l.status,
        fine: l.fine || 0,
        finePaid: l.fine_paid || false,
      })),
    ],
    [bookLoans, equipmentLoans],
  )

  const ownQueueFor = (kind: 'book' | 'equipment', id: string | number) =>
    queue.find((q) => q.kind === kind && q.item_id === id && q.status === 'waiting')

  async function confirmBooking() {
    if (!selected || !token) return
    setSubmitting(true)
    setError('')
    try {
      if (selected.kind === 'book') await portal.requestBook(token, selected.item.ID, bookingDate, bookingDays)
      else await portal.requestEquipment(token, selected.item.ID, bookingDate, bookingDays)
      setNotice(`จอง${selected.kind === 'book' ? 'หนังสือ' : 'อุปกรณ์'}เรียบร้อยแล้ว`)
      setSelected(null)
      await load()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'จองไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  async function joinQueueForSelected() {
    if (!selected || !token) return
    setSubmitting(true)
    setError('')
    try {
      await portal.joinQueue(token, selected.kind, selected.item.ID, bookingDays)
      setNotice('ต่อคิวแล้ว ดูลำดับได้ในแท็บประวัติ')
      setSelected(null)
      await load()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ต่อคิวไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelQueueRow(id: number) {
    if (!token) return
    setSubmitting(true)
    try {
      await portal.cancelQueue(token, id)
      setNotice('ยกเลิกคิวแล้ว')
      await load()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ยกเลิกคิวไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget || !token) return
    if (cancelReason.trim().length < 3) {
      setError('กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (cancelTarget.kind === 'หนังสือ') await portal.cancelBookReservation(token, cancelTarget.loanId, cancelReason)
      else await portal.cancelEquipmentReservation(token, cancelTarget.loanId, cancelReason)
      setNotice('ยกเลิกรายการจองแล้ว')
      setCancelTarget(null)
      setCancelReason('')
      await load()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ยกเลิกไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Box component="section" sx={{ width: '100%', bgcolor: colors.brandGreen }}>
        <Box sx={{ mx: 'auto', maxWidth: 1440, px: { xs: '24px', md: '64px' }, pt: { xs: '32px', md: '48px' }, pb: { xs: '28px', md: '40px' } }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: { xs: 30, md: 42 }, fontWeight: 700, color: 'white' }}>
            ยืม-คืนหนังสือและอุปกรณ์
          </Typography>
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 15, color: colors.footerText, mt: '8px' }}>
            เลือกวันที่ต้องการรับได้ตั้งแต่วันนี้ถึงอีก 3 วันข้างหน้า
          </Typography>

          <Box sx={{ display: 'flex', gap: '20px', mt: '28px', flexWrap: 'wrap' }}>
            {(['books', 'equipment', 'history'] as Tab[]).map((t) => (
              <Box
                key={t}
                onClick={() => setTab(t)}
                sx={{
                  cursor: 'pointer',
                  pb: '10px',
                  borderBottom: `3px solid ${tab === t ? 'white' : 'transparent'}`,
                  color: tab === t ? 'white' : colors.footerText,
                  fontFamily: fonts.kanit,
                  fontWeight: tab === t ? 700 : 500,
                  fontSize: 15,
                }}
              >
                {t === 'books' ? 'จองหนังสือ' : t === 'equipment' ? 'จองอุปกรณ์' : 'ประวัติของฉัน'}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ flex: 1, width: '100%', bgcolor: 'white' }}>
        <Box sx={{ mx: 'auto', maxWidth: 1440, display: 'flex', flexDirection: 'column', gap: '24px', px: { xs: '24px', md: '64px' }, py: { xs: '32px', md: '40px' } }}>
          {tab !== 'history' && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
              <TextField
                size="small"
                label="ค้นหา"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tab === 'books' ? 'ชื่อเรื่อง ผู้แต่ง หรือรหัส...' : 'ชื่ออุปกรณ์...'}
                sx={{ minWidth: 220 }}
              />
              <TextField size="small" select label="หมวดหมู่" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 170 }}>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c === 'all' ? 'ทุกหมวดหมู่' : c}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="date"
                label="วันที่ต้องการรับ"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                slotProps={{ htmlInput: { min: todayISO(), max: maxBookingISO() } }}
                sx={{ minWidth: 170 }}
              />
              <TextField
                size="small"
                type="number"
                label="ระยะเวลายืม (วัน)"
                value={bookingDays}
                onChange={(e) => setBookingDays(Math.min(30, Math.max(1, Math.trunc(Number(e.target.value)) || 1)))}
                slotProps={{ htmlInput: { min: 1, max: 30 } }}
                sx={{ minWidth: 150 }}
              />
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: '64px' }}>
              <CircularProgress size={32} sx={{ color: colors.accentGreen }} />
            </Box>
          ) : tab === 'books' ? (
            filteredResources.length === 0 ? (
              <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>ไม่พบหนังสือที่ตรงกับเงื่อนไข</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                {filteredResources.map((item, i) => (
                  <Reveal key={item.ID} delay={Math.min(i, 11) * 60}>
                    <ResourceCard
                      title={item.title}
                      subtitle={item.author}
                      cover={item.image_url}
                      status={item.status}
                      queued={Boolean(ownQueueFor('book', item.ID))}
                      onClick={() => setSelected({ kind: 'book', item })}
                    />
                  </Reveal>
                ))}
              </Box>
            )
          ) : tab === 'equipment' ? (
            filteredEquipment.length === 0 ? (
              <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไข</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                {filteredEquipment.map((item, i) => (
                  <Reveal key={item.ID} delay={Math.min(i, 11) * 60}>
                    <ResourceCard
                      title={item.name}
                      subtitle={item.asset_code}
                      cover={item.image_url}
                      status={item.status}
                      queued={Boolean(ownQueueFor('equipment', item.ID))}
                      onClick={() => setSelected({ kind: 'equipment', item })}
                    />
                  </Reveal>
                ))}
              </Box>
            )
          ) : !token ? (
            <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>เข้าสู่ระบบเพื่อดูประวัติการยืมของคุณ</Typography>
          ) : (
            <HistoryPanel history={history} queue={queue} onCancel={setCancelTarget} onCancelQueue={cancelQueueRow} />
          )}
        </Box>
      </Box>

      <Footer />

      {/* กล่องยืนยันการจอง — ถ้าของถูกจองอยู่แล้วเปลี่ยนเป็นปุ่มต่อคิวแทน ตามตรรกะเดิมของสุชาดา */}
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="xs">
        {selected && (
          <>
            <DialogTitle sx={{ fontFamily: fonts.kanit }}>
              {selected.kind === 'book' ? 'จองหนังสือ' : 'จองอุปกรณ์'}
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ fontFamily: fonts.thai, fontWeight: 600, mb: 1 }}>
                {selected.kind === 'book' ? selected.item.title : selected.item.name}
              </Typography>
              <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted }}>
                วันที่รับ: {fmtDate(bookingDate)} · ระยะเวลา {bookingDays} วัน
              </Typography>
              {!token && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  ต้องเข้าสู่ระบบก่อนจึงจะจองได้
                </Alert>
              )}
              {token && selected.item.status !== 'available' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  ตอนนี้ไม่ว่าง กด "ต่อคิว" เพื่อรอรับเมื่อว่าง
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelected(null)}>ปิด</Button>
              {token && selected.item.status !== 'available' ? (
                <Button variant="contained" disabled={submitting} onClick={() => void joinQueueForSelected()}>
                  ต่อคิว
                </Button>
              ) : (
                <Button variant="contained" disabled={!token || submitting} onClick={() => void confirmBooking()}>
                  ยืนยันการจอง
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* กล่องยกเลิก — ต้องระบุเหตุผลอย่างน้อย 3 ตัวอักษรตามที่ backend ของสุชาดากำหนด */}
      <Dialog open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: fonts.kanit }}>ยกเลิกการจอง</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: fonts.thai, mb: 2 }}>{cancelTarget?.title}</Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="เหตุผลที่ยกเลิก"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelTarget(null)}>ปิด</Button>
          <Button variant="contained" color="error" disabled={submitting} onClick={() => void confirmCancel()}>
            ยืนยันยกเลิก
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} message={notice} />
    </Box>
  )
}

function ResourceCard({
  title,
  subtitle,
  cover,
  status,
  queued,
  onClick,
}: {
  title: string
  subtitle: string
  cover: string
  status: string
  queued: boolean
  onClick: () => void
}) {
  const available = status === 'available'
  return (
    <Box
      component="article"
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderRadius: '16px',
        border: `1px solid ${colors.borderSubtle}`,
        bgcolor: 'white',
        p: '14px',
        cursor: 'pointer',
        transition: 'box-shadow 200ms',
        '&:hover': { boxShadow: '0 6px 18px rgba(59,42,30,0.12)' },
      }}
    >
      <CoverImage src={cover} title={title} height={220} />
      <Typography sx={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 600, color: colors.brown900 }} noWrap title={title}>
        {title}
      </Typography>
      <Typography sx={{ fontFamily: fonts.inter, fontSize: 12, color: colors.brown500 }} noWrap>
        {subtitle}
      </Typography>
      <Chip
        size="small"
        label={queued ? 'ต่อคิวไว้แล้ว' : available ? 'ว่าง' : 'ถูกจองแล้ว'}
        sx={{
          alignSelf: 'flex-start',
          bgcolor: queued ? colors.gold200 : available ? colors.accentGreenLight : colors.surfaceMuted,
          color: available ? colors.accentGreen : colors.ink,
          fontFamily: fonts.thai,
          fontWeight: 600,
        }}
      />
    </Box>
  )
}

function HistoryPanel({
  history,
  queue,
  onCancel,
  onCancelQueue,
}: {
  history: HistoryRow[]
  queue: portal.QueueRequest[]
  onCancel: (row: HistoryRow) => void
  onCancelQueue: (id: number) => void
}) {
  const waitingQueue = queue.filter((q) => q.status === 'waiting')
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {waitingQueue.length > 0 && (
        <Box>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, fontWeight: 600, mb: '12px' }}>คิวที่รอ</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {waitingQueue.map((q) => (
              <Box
                key={q.ID}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: `1px solid ${colors.borderSubtle}`,
                  borderRadius: '10px',
                  px: '16px',
                  py: '10px',
                }}
              >
                <Box>
                  <Typography sx={{ fontFamily: fonts.thai, fontWeight: 600 }}>{q.title}</Typography>
                  <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                    ลำดับที่ {q.position} · {q.ready ? 'พร้อมให้จองแล้ว' : 'รอคิว'}
                  </Typography>
                </Box>
                <Button size="small" color="error" onClick={() => onCancelQueue(q.ID)}>
                  ยกเลิกคิว
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, fontWeight: 600, mb: '12px' }}>ประวัติการยืม</Typography>
        {history.length === 0 ? (
          <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted }}>ยังไม่มีประวัติการยืม</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map((row) => {
              const status = STATUS_LABEL[row.status] ?? { label: row.status, color: 'default' as const }
              return (
                <Box
                  key={row.id}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '10px',
                    px: '16px',
                    py: '12px',
                  }}
                >
                  <Box sx={{ minWidth: 200 }}>
                    <Typography sx={{ fontFamily: fonts.thai, fontWeight: 600 }}>
                      {row.kind} · {row.title}
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                      รับ {fmtDate(row.reservedFor)} · กำหนดคืน {fmtDate(row.dueAt)}
                      {row.returnedAt && ` · คืนแล้ว ${fmtDate(row.returnedAt)}`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {row.fine > 0 && (
                      <Chip
                        size="small"
                        color={row.finePaid ? 'success' : 'error'}
                        label={row.finePaid ? `ชำระแล้ว ${row.fine} บาท` : `ค้างชำระ ${row.fine} บาท`}
                      />
                    )}
                    <Chip size="small" color={status.color} label={status.label} />
                    {row.status === 'reserved' && (
                      <Button size="small" color="error" onClick={() => onCancel(row)}>
                        ยกเลิก
                      </Button>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default BorrowPage
