import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import CatalogPanel from './CatalogPanel'
import CopyDialog from './CopyDialog'
import type { Book } from '../../../interface/IBookInterface'
import { useBooks } from '../../../context/BookContext'
import { colors, fonts } from '../../../theme'
import InspectionPanel from './InspectionPanel'

type Tab = 'overview' | 'catalog' | 'inspections'

const TAB_TITLES: Record<Tab, string> = {
  overview: 'จัดการหนังสือ — ภาพรวม',
  catalog: 'จัดการหนังสือ — รายการหนังสือ',
  inspections: 'จัดการหนังสือ — การตรวจสอบ',
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        borderRadius: '16px',
        bgcolor: 'white',
        border: `1px solid ${colors.border}`,
        px: '24px',
        py: '20px',
      }}
    >
      <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted, mb: '6px' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen }}>
        {value}
      </Typography>
    </Box>
  )
}

function OverviewPanel() {
  const { books, copies, inspections } = useBooks()

  const unresolved = inspections.filter((i) => !i.resolved).length
  const available = copies.filter((c) => c.availability_status === 'available').length

  return (
    <Box sx={{ flex: 1, py: '32px' }}>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, color: colors.brandGreen, mb: '24px' }}>
        ภาพรวม
      </Typography>

      <Box sx={{ display: 'flex', gap: '16px' }}>
        <StatCard label="หนังสือทั้งหมด" value={books.length.toLocaleString('th-TH')} />
        <StatCard label="เล่มทั้งหมด" value={copies.length.toLocaleString('th-TH')} />
        <StatCard label="เล่มที่พร้อมให้ยืม" value={available.toLocaleString('th-TH')} />
        <StatCard label="รายการตรวจที่ค้าง" value={unresolved.toLocaleString('th-TH')} />
      </Box>
    </Box>
  )
}

function ManageBooks() {
  const { tab: tabParam } = useParams()
  const { isLoading, error, toast, clearToast } = useBooks()

  // หนังสือที่กำลังเปิดหน้าจัดการเล่มอยู่ — null คือปิด dialog
  const [copyBook, setCopyBook] = useState<Book | null>(null)

  const tab: Tab = tabParam === 'catalog' || tabParam === 'inspections' ? tabParam : 'overview'

  return (
    <BackOfficeLayout title={TAB_TITLES[tab]}>
      {isLoading && (
        <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '32px' }}>
          กำลังโหลด...
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ fontFamily: fonts.thai, mt: '16px' }}>
          {error}
        </Alert>
      )}

      {!isLoading && (
        <>
          {tab === 'overview' && <OverviewPanel />}
          {tab === 'catalog' && <CatalogPanel onManageCopies={setCopyBook} />}
          {tab === 'inspections' && <InspectionPanel />}
        </>
      )}

      <CopyDialog book={copyBook} onClose={() => setCopyBook(null)} />

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={clearToast}>
        <Alert severity="success" onClose={clearToast} sx={{ fontFamily: fonts.thai }}>
          {toast}
        </Alert>
      </Snackbar>
    </BackOfficeLayout>
  )
}

export default ManageBooks