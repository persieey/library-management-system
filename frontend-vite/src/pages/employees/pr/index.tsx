import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import PRCard from './PRCard'
import PREditorDialog, { type PRDraft } from './PREditorDialog'
import PRPreviewDialog from './PRPreviewDialog'
import { printPRItem } from './printPRItem'
import type { PRStatus } from '../../../interface/IPRInterface'
import { usePR } from '../../../context/PRContext'
import searchIcon from '../../../assets/icons/pr-search.svg'
import plusIcon from '../../../assets/icons/pr-plus.svg'
import wordmark from '../../../assets/logo-wordmark.png'
import { useAuth } from '../../../auth/useAuth'
import { colors, fonts } from '../../../theme'

type SidebarTab = 'overview' | 'events' | 'announcements'

const SIDEBAR_ITEMS: { key: SidebarTab; label: string }[] = [
  { key: 'overview', label: 'ภาพรวม' },
  { key: 'events', label: 'กิจกรรม' },
  { key: 'announcements', label: 'ประกาศ' },
]

type FilterTab = 'ทั้งหมด' | PRStatus
const FILTER_TABS: FilterTab[] = ['ทั้งหมด', 'เผยแพร่', 'ตั้งเวลา', 'ร่าง', 'หมดอายุ']

function SidebarNav({ active, onSelect }: { active: SidebarTab; onSelect: (tab: SidebarTab) => void }) {
  return (
    <Box sx={{ width: 250, flexShrink: 0, bgcolor: colors.brandGreen, minHeight: '100%' }}>
      {SIDEBAR_ITEMS.map((item) => (
        <Box
          key={item.key}
          component="button"
          onClick={() => onSelect(item.key)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: 64,
            px: '24px',
            border: 'none',
            cursor: 'pointer',
            bgcolor: active === item.key ? '#f8f5ee' : 'transparent',
            color: active === item.key ? colors.brandGreen : 'white',
            fontFamily: fonts.kanit,
            fontSize: 20,
            textAlign: 'left',
          }}
        >
          {item.label}
        </Box>
      ))}
    </Box>
  )
}

function AnnouncementsPanel() {
  const { items: allItems, create, update, remove, togglePause, copyItem, incrementView, toast, clearToast } = usePR()
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

  const handlePreview = (id: number) => {
    setPreviewId(id)
    incrementView(id)
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

function ComingSoonPanel({ title }: { title: string }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 20, color: colors.inkMuted }}>
        {title} — ยังไม่ได้ทำ
      </Typography>
    </Box>
  )
}

function TopBar() {
  const { user, logout } = useAuth()

  return (
    <Box
      component="header"
      sx={{
        height: 100,
        width: '100%',
        bgcolor: colors.brandGreen,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '32px',
      }}
    >
      <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center' }}>
        <Box component="img" src={wordmark} alt="Udompanya University" sx={{ height: 50, width: 165, objectFit: 'contain' }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, color: 'white' }}>{user?.username}</Typography>
        <Button
          onClick={logout}
          sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: '8px', fontFamily: fonts.kanit }}
        >
          Log out
        </Button>
      </Box>
    </Box>
  )
}

// Figma: สำหรับพนักงาน_Homepage (1:246) — โมดูลจัดการประชาสัมพันธ์
function ManagePR() {
  const [tab, setTab] = useState<SidebarTab>('announcements')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <TopBar />
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
        <SidebarNav active={tab} onSelect={setTab} />
        {tab === 'announcements' && <AnnouncementsPanel />}
        {tab === 'overview' && <ComingSoonPanel title="ภาพรวม" />}
        {tab === 'events' && <ComingSoonPanel title="กิจกรรม" />}
      </Box>
    </Box>
  )
}

export default ManagePR
