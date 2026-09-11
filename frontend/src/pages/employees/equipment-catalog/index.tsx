import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import { useAuth } from '../../../auth/useAuth'
import { ApiError } from '../../../services/https'
import {
  listEquipmentItems,
  createEquipmentItem,
  deleteEquipmentItem,
  type EquipmentItem,
} from '../../../services/https/equipmentItems'
import { colors, fonts } from '../../../theme'

const EMPTY_DRAFT = { equipment_name: '', asset_number: '', category: '', brand: '', model: '', location: '' }

const STATUS_LABEL: Record<string, { label: string; color: 'success' | 'default' }> = {
  available: { label: 'ว่าง พร้อมให้ยืม', color: 'success' },
  not_available: { label: 'ไม่ว่าง', color: 'default' },
}

// จัดการคลังอุปกรณ์ที่เปิดให้สมาชิกยืม (equipment_items) — เดิมไม่มีหน้าจัดการเลย ตารางนี้
// ว่างเปล่าตลอด ทำให้หน้า "จองอุปกรณ์" ของสมาชิก (/borrow) ไม่มีอะไรให้เลือกยืมเลย
function EquipmentCatalogPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      setItems(await listEquipmentItems(token))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'โหลดข้อมูลอุปกรณ์ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((e) =>
      [e.equipment_id, e.equipment_name, e.category, e.brand, e.model, e.location, e.asset_number]
        .some((v) => (v || '').toLowerCase().includes(q)),
    )
  }, [items, search])

  const counts = useMemo(() => {
    const available = items.filter((e) => e.status === 'available').length
    return { available, total: items.length }
  }, [items])

  const openCreate = () => {
    setDraft(EMPTY_DRAFT)
    setFormError('')
    setCreateOpen(true)
  }

  const submitCreate = async () => {
    if (!token) return
    if (!draft.equipment_name.trim()) {
      setFormError('กรุณากรอกชื่ออุปกรณ์')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const created = await createEquipmentItem(token, draft)
      setItems((prev) => [...prev, created])
      setCreateOpen(false)
      setNotice('เพิ่มอุปกรณ์เข้าคลังสำเร็จ')
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : 'เพิ่มอุปกรณ์ไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: EquipmentItem) => {
    if (!token) return
    if (!window.confirm(`ต้องการลบ "${item.equipment_name}" ออกจากคลังหรือไม่?`)) return
    try {
      await deleteEquipmentItem(token, item.equipment_id)
      setItems((prev) => prev.filter((e) => e.equipment_id !== item.equipment_id))
      setNotice('ลบอุปกรณ์แล้ว')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ลบอุปกรณ์ไม่สำเร็จ')
    }
  }

  return (
    <BackOfficeLayout title="คลังอุปกรณ์ให้ยืม" trail={[{ label: 'คลังอุปกรณ์ให้ยืม', to: '/employees/equipment-catalog' }]}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted }}>
          รายการอุปกรณ์ที่เปิดให้สมาชิกยืมได้จากหน้า "ยืม-คืนหนังสือและอุปกรณ์" — เพิ่มอุปกรณ์ใหม่เข้าคลังได้จากปุ่มด้านล่าง
        </Typography>

        <Box sx={{ display: 'flex', gap: '16px' }}>
          <Paper variant="outlined" sx={{ flex: 1, p: '18px', borderRadius: '12px', borderColor: colors.border }}>
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>ว่าง พร้อมให้ยืม</Typography>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 26, fontWeight: 700, color: colors.brandGreen }}>{counts.available}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ flex: 1, p: '18px', borderRadius: '12px', borderColor: colors.border }}>
            <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>อุปกรณ์ทั้งหมด</Typography>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 26, fontWeight: 700, color: colors.ink }}>{counts.total}</Typography>
          </Paper>
        </Box>

        <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <TextField
            size="small"
            placeholder="ค้นหาจากชื่อ รหัส หมวดหมู่ หรือตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 280 }}
          />
          <Button
            variant="contained"
            onClick={openCreate}
            sx={{ fontFamily: fonts.thai, textTransform: 'none', bgcolor: colors.brandGreen, '&:hover': { bgcolor: colors.accentGreen } }}
          >
            + เพิ่มอุปกรณ์เข้าคลัง
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '48px' }}>
            <CircularProgress size={28} sx={{ color: colors.accentGreen }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '24px' }}>
            {items.length === 0 ? 'ยังไม่มีอุปกรณ์ในคลัง ลองเพิ่มอุปกรณ์ชิ้นแรกดู' : 'ไม่พบอุปกรณ์ที่ตรงกับคำค้นหา'}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((item) => {
              const status = STATUS_LABEL[item.status] ?? { label: item.status, color: 'default' as const }
              return (
                <Box
                  key={item.equipment_id}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    px: '16px',
                    py: '12px',
                    bgcolor: 'white',
                  }}
                >
                  <Box sx={{ minWidth: 220 }}>
                    <Typography sx={{ fontFamily: fonts.thai, fontWeight: 700 }}>{item.equipment_name}</Typography>
                    <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                      {[item.category, item.brand, item.model, item.location].filter(Boolean).join(' · ') || '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Chip size="small" color={status.color} label={status.label} />
                    <IconButton size="small" color="error" onClick={() => void handleDelete(item)} aria-label="ลบอุปกรณ์">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontFamily: fonts.kanit }}>เพิ่มอุปกรณ์เข้าคลังให้ยืม</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px', pt: '8px !important' }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="ชื่ออุปกรณ์"
            required
            fullWidth
            autoFocus
            value={draft.equipment_name}
            onChange={(e) => setDraft((p) => ({ ...p, equipment_name: e.target.value }))}
            placeholder="เช่น กล้อง Canon EOS M50"
          />
          <Box sx={{ display: 'flex', gap: '16px' }}>
            <TextField
              label="หมวดหมู่"
              fullWidth
              value={draft.category}
              onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
              placeholder="เช่น กล้องถ่ายภาพ"
            />
            <TextField
              label="รหัสครุภัณฑ์"
              fullWidth
              value={draft.asset_number}
              onChange={(e) => setDraft((p) => ({ ...p, asset_number: e.target.value }))}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: '16px' }}>
            <TextField
              label="ยี่ห้อ"
              fullWidth
              value={draft.brand}
              onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))}
            />
            <TextField
              label="รุ่น"
              fullWidth
              value={draft.model}
              onChange={(e) => setDraft((p) => ({ ...p, model: e.target.value }))}
            />
          </Box>
          <TextField
            label="ตำแหน่งที่เก็บ"
            fullWidth
            value={draft.location}
            onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
            placeholder="เช่น เคาน์เตอร์ยืม-คืน ชั้น 1"
          />
        </DialogContent>
        <DialogActions sx={{ px: '24px', pb: '16px' }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ fontFamily: fonts.thai, color: colors.inkMuted }}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => void submitCreate()}
            disabled={submitting}
            variant="contained"
            sx={{ fontFamily: fonts.thai, bgcolor: colors.brandGreen }}
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={2500} onClose={() => setNotice('')}>
        <Alert severity="success" onClose={() => setNotice('')} sx={{ fontFamily: fonts.thai }}>
          {notice}
        </Alert>
      </Snackbar>
    </BackOfficeLayout>
  )
}

export default EquipmentCatalogPage
