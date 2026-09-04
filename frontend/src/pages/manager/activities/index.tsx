import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import { mgr } from '../../../theme'
import StatusBadge from '../../../components/StatusBadge'
import PREditorDialog, { type PRDraft } from '../../employees/pr/PREditorDialog'
import EventEditorDialog from '../../employees/pr/EventEditorDialog'
import { formatEventDate } from '../../employees/pr/eventDateFormat'
import { usePR } from '../../../context/PRContext'
import { useEvents } from '../../../context/EventContext'
import type { PRStatus } from '../../../interface/IPRInterface'
import type { EventDraft } from '../../../interface/IEventInterface'
import { fonts } from '../../../theme'

const label = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted, textTransform: 'uppercase' as const }
const body = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const action = { fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, lineHeight: 1, cursor: 'pointer' }

const PR_STATUS_BADGE: Record<PRStatus, { label: string; variant: 'published' | 'draft' | 'pending' | 'rejected' }> = {
  เผยแพร่: { label: 'เผยแพร่แล้ว', variant: 'published' },
  ร่าง: { label: 'ร่าง', variant: 'draft' },
  ตั้งเวลา: { label: 'ตั้งเวลา', variant: 'pending' },
  หมดอายุ: { label: 'หมดอายุ', variant: 'rejected' },
}

const NEW_BUTTON_SX = {
  fontFamily: fonts.thai,
  fontWeight: 600,
  fontSize: 14,
  bgcolor: mgr.accentGreen,
  borderRadius: '8px',
  px: '18px',
  py: '10px',
  '&:hover': { bgcolor: '#1e4028' },
  textTransform: 'none' as const,
}

function SectionHeading({ title, buttonLabel, onAdd }: { title: string; buttonLabel: string; onAdd: () => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 20, lineHeight: 1.3, color: mgr.ink }}>
        {title}
      </Typography>
      <Button variant="contained" disableElevation onClick={onAdd} sx={NEW_BUTTON_SX}>
        + {buttonLabel}
      </Button>
    </Box>
  )
}

const ANNOUNCEMENT_COLS = [
  { label: 'หัวข้อ', w: 380 },
  { label: 'สถานะ', w: 130 },
  { label: 'วันเผยแพร่', w: 150 },
  { label: 'ยอดเข้าชม', w: 100 },
  { label: 'การจัดการ', w: 160 },
]

function AnnouncementsSection() {
  const { items, create, update, remove, togglePause, toast, clearToast } = usePR()
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

  const handleSubmit = (draft: PRDraft) => {
    if (editingId === null) create(draft)
    else update(editingId, draft)
    setEditorOpen(false)
  }

  const handleDelete = (id: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    if (!window.confirm(`ต้องการลบ "${item.title}" ใช่หรือไม่?`)) return
    remove(id)
    if (editingId === id) setEditorOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SectionHeading title="ข่าวประชาสัมพันธ์" buttonLabel="สร้างข่าวประชาสัมพันธ์" onAdd={openCreate} />

      <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', bgcolor: '#f6f8f6', px: '20px', py: '14px' }}>
          {ANNOUNCEMENT_COLS.map((c) => (
            <Typography key={c.label} sx={{ ...label, width: c.w, flexShrink: 0 }}>{c.label}</Typography>
          ))}
        </Box>

        {items.length === 0 ? (
          <Box sx={{ px: '20px', py: '24px' }}>
            <Typography sx={body}>ยังไม่มีข่าวประชาสัมพันธ์</Typography>
          </Box>
        ) : (
          items.map((item) => {
            const badge = PR_STATUS_BADGE[item.status]
            const isPublished = item.status === 'เผยแพร่'
            return (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', px: '20px', py: '14px', borderTop: `1px solid ${mgr.border}` }}>
                <Typography sx={{ ...body, width: 380, flexShrink: 0 }}>{item.title}</Typography>
                <Box sx={{ width: 130, flexShrink: 0 }}>
                  <StatusBadge label={badge.label} variant={badge.variant} />
                </Box>
                <Typography sx={{ ...body, width: 150, flexShrink: 0 }}>{item.publishedAt}</Typography>
                <Typography sx={{ ...body, width: 100, flexShrink: 0 }}>{item.views.toLocaleString('th-TH')}</Typography>
                <Box sx={{ width: 160, flexShrink: 0, display: 'flex', gap: '12px' }}>
                  <Typography sx={{ ...action, color: mgr.accentGreen }} onClick={() => openEdit(item.id)}>แก้ไข</Typography>
                  <Typography sx={{ ...action, color: mgr.inkMuted }} onClick={() => togglePause(item.id)}>
                    {isPublished ? 'พักการเผยแพร่' : 'เผยแพร่ทันที'}
                  </Typography>
                  <Typography sx={{ ...action, color: mgr.danger }} onClick={() => handleDelete(item.id)}>ลบ</Typography>
                </Box>
              </Box>
            )
          })
        )}
      </Paper>

      <PREditorDialog open={editorOpen} editingItem={editingItem} onClose={() => setEditorOpen(false)} onSubmit={handleSubmit} />

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={clearToast}>
        <Alert severity="success" onClose={clearToast} sx={{ fontFamily: fonts.inter }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}

const EVENT_COLS = [
  { label: 'กิจกรรม', w: 340 },
  { label: 'วันที่', w: 200 },
  { label: 'สถานที่', w: 260 },
  { label: 'สถานะ', w: 120 },
  { label: 'การจัดการ', w: 120 },
]

function EventsSection() {
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
    if (!window.confirm(`ต้องการลบ "${item.title}" ใช่หรือไม่?`)) return
    remove(id)
    if (editingId === id) setEditorOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SectionHeading title="กิจกรรม" buttonLabel="เพิ่มกิจกรรม" onAdd={openCreate} />

      <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', bgcolor: '#f6f8f6', px: '20px', py: '14px' }}>
          {EVENT_COLS.map((c) => (
            <Typography key={c.label} sx={{ ...label, width: c.w, flexShrink: 0 }}>{c.label}</Typography>
          ))}
        </Box>

        {items.length === 0 ? (
          <Box sx={{ px: '20px', py: '24px' }}>
            <Typography sx={body}>ยังไม่มีกิจกรรม</Typography>
          </Box>
        ) : (
          items.map((item) => {
            const isUpcoming = dayjs(item.date).isAfter(dayjs())
            return (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', px: '20px', py: '14px', borderTop: `1px solid ${mgr.border}` }}>
                <Typography sx={{ ...body, width: 340, flexShrink: 0 }}>{item.title}</Typography>
                <Typography sx={{ ...body, width: 200, flexShrink: 0 }}>{formatEventDate(item.date, item.allDay)}</Typography>
                <Typography sx={{ ...body, width: 260, flexShrink: 0 }}>{item.location}</Typography>
                <Box sx={{ width: 120, flexShrink: 0 }}>
                  <StatusBadge label={isUpcoming ? 'กำลังจะถึง' : 'ผ่านไปแล้ว'} variant={isUpcoming ? 'published' : 'ended'} />
                </Box>
                <Box sx={{ width: 120, flexShrink: 0, display: 'flex', gap: '12px' }}>
                  <Typography sx={{ ...action, color: mgr.accentGreen }} onClick={() => openEdit(item.id)}>แก้ไข</Typography>
                  <Typography sx={{ ...action, color: mgr.danger }} onClick={() => handleDelete(item.id)}>ลบ</Typography>
                </Box>
              </Box>
            )
          })
        )}
      </Paper>

      <EventEditorDialog open={editorOpen} editingItem={editingItem} onClose={() => setEditorOpen(false)} onSubmit={handleSubmit} />

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={clearToast}>
        <Alert severity="success" onClose={clearToast} sx={{ fontFamily: fonts.inter }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default function ManagerActivities() {
  return (
    <BackOfficeLayout title="กิจกรรมและประชาสัมพันธ์">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <EventsSection />
        <AnnouncementsSection />
      </Box>
    </BackOfficeLayout>
  )
}
