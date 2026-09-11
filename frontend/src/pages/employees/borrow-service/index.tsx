import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import { useAuth } from '../../../auth/useAuth'
import { ApiError } from '../../../services/https'
import * as api from '../../../services/https/library'
import * as portal from '../../../services/https/borrowerPortal'
import { colors, fonts } from '../../../theme'

type Kind = 'books' | 'equipment'
type Stage = 'reserved' | 'borrowed' | 'return' | 'fine'

const STAGE_LABEL: Record<Stage, string> = {
  reserved: 'รอรับ',
  borrowed: 'กำลังยืม',
  return: 'ต้องคืน',
  fine: 'ค่าปรับค้างชำระ',
}

function dateText(value: unknown) {
  if (!value) return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) || d.getFullYear() < 1900 ? '—' : d.toLocaleDateString('th-TH')
}

// ถึงวันรับแล้วหรือยัง (เทียบเป็นวันปฏิทิน ไม่ใช่เวลา) — ย้ายมาจากตรรกะเดิมของสุชาดา
function isDue(row: api.Item) {
  if (row.status !== 'reserved') return false
  const d = new Date(String(row.reserved_for))
  if (d.getFullYear() < 1900) return false
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' }) <= new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' })
}

function memberName(row: api.Item) {
  const user = row.user as api.Item | undefined
  if (!user) return '—'
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || '—'
}

// จัดการรายการยืม-คืนหนังสือ/อุปกรณ์ ฝั่งเจ้าหน้าที่
//
// ตรรกะการรับ/คืน/ชำระค่าปรับ/ไม่มารับทั้งหมดยกมาจาก B6731915 (สุชาดา) ผ่าน
// services/https/library.ts ที่คัดลอกมาทั้งไฟล์ไม่มีแก้ไข หน้านี้เป็นแค่ UI ใหม่
// ที่วางบน BackOfficeLayout เดียวกับหน้าหลังบ้านอื่นทุกหน้า
function BorrowServicePage() {
  const { token } = useAuth()
  const [kind, setKind] = useState<Kind>('books')
  const [stage, setStage] = useState<Stage>('reserved')
  const [rows, setRows] = useState<api.Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')

  const [returningRow, setReturningRow] = useState<api.Item | null>(null)
  const [returnCondition, setReturnCondition] = useState<'good' | 'damaged' | 'lost'>('good')
  const [returnDescription, setReturnDescription] = useState('')

  const [payingRow, setPayingRow] = useState<api.Item | null>(null)
  const [fineAmount, setFineAmount] = useState('0')
  const [fineDescription, setFineDescription] = useState('')

  // สร้างรายการยืมแทนสมาชิก (walk-in) — บรรณารักษ์ค้นหาสมาชิกจริงในระบบก่อนเสมอ
  const [createOpen, setCreateOpen] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [memberResults, setMemberResults] = useState<api.MemberMatch[]>([])
  const [memberSearching, setMemberSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<api.MemberMatch | null>(null)
  const [createResources, setCreateResources] = useState<(portal.CatalogResource | portal.CatalogEquipment)[]>([])
  const [resourceQuery, setResourceQuery] = useState('')
  const [selectedResource, setSelectedResource] = useState<portal.CatalogResource | portal.CatalogEquipment | null>(null)
  const [createDate, setCreateDate] = useState('')
  const [createDays, setCreateDays] = useState(3)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  function todayISO() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  function maxBookingISO() {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function openCreate() {
    setCreateOpen(true)
    setMemberQuery('')
    setMemberResults([])
    setSelectedMember(null)
    setResourceQuery('')
    setSelectedResource(null)
    setCreateDate(todayISO())
    setCreateDays(kind === 'equipment' ? 3 : 14)
    setCreateError('')
    void (kind === 'books' ? portal.getResources() : portal.getEquipment()).then(setCreateResources)
  }

  // debounce ค้นหาสมาชิก กันยิง API ทุกตัวอักษรที่พิมพ์
  useEffect(() => {
    if (!createOpen) return
    const q = memberQuery.trim()
    if (q.length < 2) {
      setMemberResults([])
      return
    }
    setMemberSearching(true)
    const timer = window.setTimeout(() => {
      if (!token) return
      api
        .searchMembers(token, q)
        .then(setMemberResults)
        .catch(() => setMemberResults([]))
        .finally(() => setMemberSearching(false))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [memberQuery, createOpen, token])

  const filteredCreateResources = useMemo(() => {
    const q = resourceQuery.trim().toLowerCase()
    return createResources
      .filter((r) => {
        const name = kind === 'books' ? (r as portal.CatalogResource).title : (r as portal.CatalogEquipment).name
        return !q || name.toLowerCase().includes(q)
      })
      .slice(0, 30)
  }, [createResources, resourceQuery, kind])

  async function submitCreate() {
    if (!token || !selectedMember || !selectedResource) return
    setCreating(true)
    setCreateError('')
    try {
      const path = kind === 'books' ? 'books/librarian/reservations' : 'equipment/librarian/reservations'
      await api.createForMember(token, path, {
        university_id: selectedMember.university_id,
        ...(kind === 'books'
          ? { resource_id: (selectedResource as portal.CatalogResource).ID }
          : { equipment_id: (selectedResource as portal.CatalogEquipment).ID }),
        reserved_for: createDate,
        days: createDays,
      })
      setCreateOpen(false)
      setNotice('สร้างรายการยืมสำเร็จ')
      await load()
    } catch (cause) {
      setCreateError(cause instanceof ApiError ? cause.message : 'สร้างรายการยืมไม่สำเร็จ')
    } finally {
      setCreating(false)
    }
  }

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const path = kind === 'books' ? 'books/librarian/reservations' : 'equipment/librarian/reservations'
      setRows(await api.list(token, path))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [kind, token])

  useEffect(() => {
    void load()
    // รีเฟรชเองทุก 30 วิ เผื่อสมาชิกจองเข้ามาใหม่ระหว่างที่หน้าเปิดค้างไว้
    const timer = window.setInterval(() => void load(), 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const counts = useMemo(
    () => ({
      reserved: rows.filter((r) => r.status === 'reserved' && !isDue(r)).length,
      borrowed: rows.filter((r) => r.status === 'borrowed' || isDue(r)).length,
      return: rows.filter((r) => r.status === 'borrowed').length,
      fine: rows.filter((r) => (Boolean(r.fine_id) || Number(r.fine ?? 0) > 0) && !r.fine_paid).length,
    }),
    [rows],
  )

  const stageRows = useMemo(() => {
    if (stage === 'reserved') return rows.filter((r) => r.status === 'reserved' && !isDue(r))
    if (stage === 'borrowed') return rows.filter((r) => r.status === 'borrowed' || isDue(r))
    if (stage === 'return') return rows.filter((r) => r.status === 'borrowed')
    return rows.filter((r) => (Boolean(r.fine_id) || Number(r.fine ?? 0) > 0) && !r.fine_paid)
  }, [rows, stage])

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? stageRows.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : stageRows
  }, [stageRows, search])

  async function runAction(id: string | number, action: 'checkout' | 'no-show') {
    if (!token) return
    setError('')
    try {
      const path = kind === 'books' ? 'books/librarian/reservations' : 'equipment/librarian/reservations'
      await api.action(token, `${path}/${id}/${action}`)
      setNotice(action === 'checkout' ? 'บันทึกรับแล้วสำเร็จ' : 'บันทึกไม่มารับสำเร็จ')
      await load()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'บันทึกไม่สำเร็จ')
    }
  }

  async function confirmReturn() {
    if (!token || !returningRow) return
    setError('')
    try {
      const path = kind === 'books' ? 'books/librarian/reservations' : 'equipment/librarian/reservations'
      const result = await api.action(token, `${path}/${returningRow.ID}/return`, { condition: returnCondition, description: returnDescription })
      setReturningRow(null)
      setNotice('บันทึกการคืนสำเร็จ')
      await load()
      if (result.requires_fine) setStage('fine')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'บันทึกการคืนไม่สำเร็จ')
    }
  }

  async function submitFine(paid: boolean) {
    if (!token || !payingRow) return
    const amount = Number(fineAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      setError('จำนวนค่าปรับต้องเป็นศูนย์หรือมากกว่า')
      return
    }
    setError('')
    try {
      const path = kind === 'books' ? 'books/librarian/reservations' : 'equipment/librarian/reservations'
      await api.action(token, `${path}/${payingRow.ID}/pay-fine`, { amount, description: fineDescription, paid })
      if (paid) setPayingRow(null)
      setNotice(paid ? 'บันทึกการชำระค่าปรับสำเร็จ' : 'บันทึกยอดค่าปรับสำเร็จ')
      await load()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'บันทึกค่าปรับไม่สำเร็จ')
    }
  }

  return (
    <BackOfficeLayout title="จัดการยืม-คืน" trail={[{ label: 'ยืม-คืนหนังสือ/อุปกรณ์', to: '/employees/borrow-service' }]}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box sx={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: '10px' }}>
            {(['books', 'equipment'] as Kind[]).map((k) => (
              <Button
                key={k}
                variant={kind === k ? 'contained' : 'outlined'}
                onClick={() => {
                  setKind(k)
                  setSearch('')
                }}
                sx={{
                  fontFamily: fonts.thai,
                  textTransform: 'none',
                  bgcolor: kind === k ? colors.brandGreen : 'transparent',
                  borderColor: colors.brandGreen,
                  color: kind === k ? 'white' : colors.brandGreen,
                  '&:hover': { bgcolor: kind === k ? colors.accentGreen : colors.accentGreenLight },
                }}
              >
                {k === 'books' ? 'การจองหนังสือ' : 'การจองอุปกรณ์'}
              </Button>
            ))}
          </Box>
          <Button
            variant="contained"
            onClick={openCreate}
            sx={{ fontFamily: fonts.thai, textTransform: 'none', bgcolor: colors.brandGreen, '&:hover': { bgcolor: colors.accentGreen } }}
          >
            + สร้างรายการยืม
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: `1px solid ${colors.border}`, pb: '4px' }}>
          {(Object.keys(STAGE_LABEL) as Stage[]).map((s) => (
            <Button
              key={s}
              onClick={() => setStage(s)}
              sx={{
                fontFamily: fonts.thai,
                textTransform: 'none',
                fontWeight: stage === s ? 700 : 500,
                color: stage === s ? colors.brandGreen : colors.inkMuted,
                borderBottom: stage === s ? `3px solid ${colors.brandGreen}` : '3px solid transparent',
                borderRadius: 0,
              }}
            >
              {STAGE_LABEL[s]} <Chip size="small" label={counts[s]} sx={{ ml: '6px' }} />
            </Button>
          ))}
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          size="small"
          placeholder="ค้นหาผู้จองหรือรายการ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 320 }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '48px' }}>
            <CircularProgress size={28} sx={{ color: colors.accentGreen }} />
          </Box>
        ) : visibleRows.length === 0 ? (
          <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, py: '24px' }}>ไม่มีรายการในหมวดนี้</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleRows.map((row) => {
              const title = kind === 'books' ? (row.resource as api.Item | undefined)?.title : (row.equipment as api.Item | undefined)?.name
              const due = isDue(row)
              return (
                <Box
                  key={String(row.ID)}
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
                    <Typography sx={{ fontFamily: fonts.thai, fontWeight: 700 }}>
                      #{row.ID} · {title ?? '—'}
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>
                      ผู้จอง {memberName(row)} · รับ {dateText(row.reserved_for)} · กำหนดคืน {dateText(row.due_at)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {stage === 'fine' ? (
                      <Chip
                        size="small"
                        color="error"
                        label={row.fine_status === 'pending' && Number(row.fine ?? 0) === 0 ? 'รอประเมินค่าปรับ' : `ค่าปรับ ${Number(row.fine ?? 0)} บาท`}
                      />
                    ) : (
                      <Chip size="small" color={row.status === 'borrowed' ? 'warning' : 'success'} label={row.status === 'borrowed' ? 'กำลังยืม' : due ? 'ถึงวันรับแล้ว' : 'รอรับ'} />
                    )}

                    {due ? (
                      <>
                        <Button size="small" variant="contained" onClick={() => void runAction(row.ID, 'checkout')}>
                          บันทึกรับแล้ว
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm('ยืนยันไม่มารับ และเปิดให้จองใหม่?')) void runAction(row.ID, 'no-show')
                          }}
                        >
                          ไม่มารับ
                        </Button>
                      </>
                    ) : stage === 'return' ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setReturningRow(row)
                          setReturnCondition('good')
                          setReturnDescription('')
                        }}
                      >
                        บันทึกการคืน
                      </Button>
                    ) : stage === 'fine' ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setPayingRow(row)
                          setFineAmount(String(Number(row.fine ?? 0)))
                          setFineDescription(String(row.fine_description ?? ''))
                        }}
                      >
                        บันทึกค่าปรับ
                      </Button>
                    ) : (
                      <Typography sx={{ fontFamily: fonts.thai, fontSize: 13, color: colors.inkMuted }}>ยังไม่ถึงวันรับ</Typography>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>

      {/* รับคืน — ต้องระบุสภาพก่อนเสมอ ถ้าชำรุด/หายจะขึ้นแท็บค่าปรับให้อัตโนมัติ */}
      <Dialog open={Boolean(returningRow)} onClose={() => setReturningRow(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontFamily: fonts.kanit }}>บันทึกการคืน</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, mb: 2 }}>
            {kind === 'books' ? (returningRow?.resource as api.Item | undefined)?.title : (returningRow?.equipment as api.Item | undefined)?.name}
          </Typography>
          <TextField select fullWidth label="สภาพเมื่อรับคืน" value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as 'good' | 'damaged' | 'lost')}>
            <MenuItem value="good">ปกติ — กลับมาว่างให้จองต่อ</MenuItem>
            <MenuItem value="damaged">ชำรุด — ปิดไม่ให้จอง</MenuItem>
            <MenuItem value="lost">สูญหาย — ปิดไม่ให้จอง</MenuItem>
          </TextField>
          <TextField fullWidth multiline minRows={3} label="รายละเอียด/หมายเหตุ" value={returnDescription} onChange={(e) => setReturnDescription(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReturningRow(null)}>ยกเลิก</Button>
          <Button variant="contained" onClick={() => void confirmReturn()}>
            บันทึกการคืน
          </Button>
        </DialogActions>
      </Dialog>

      {/* ค่าปรับ — บันทึกยอด/หมายเหตุอย่างเดียวได้ก่อน แล้วค่อยชำระทีหลัง */}
      <Dialog open={Boolean(payingRow)} onClose={() => setPayingRow(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontFamily: fonts.kanit }}>บันทึกค่าปรับ</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, mb: 2 }}>
            {kind === 'books' ? (payingRow?.resource as api.Item | undefined)?.title : (payingRow?.equipment as api.Item | undefined)?.name}
          </Typography>
          {Number(payingRow?.overdue_days ?? 0) > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              คืนเกินกำหนด {payingRow?.overdue_days} วัน คิดวันละ 5 บาท
            </Alert>
          )}
          <TextField fullWidth type="number" label="จำนวนค่าปรับ (บาท)" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
          <TextField fullWidth multiline minRows={3} label="หมายเหตุ" value={fineDescription} onChange={(e) => setFineDescription(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayingRow(null)}>ปิด</Button>
          <Button onClick={() => void submitFine(false)}>บันทึกยอด</Button>
          <Button variant="contained" onClick={() => void submitFine(true)}>
            บันทึกการชำระ
          </Button>
        </DialogActions>
      </Dialog>

      {/* สร้างรายการยืมแทนสมาชิก (walk-in) — ต้องค้นแล้วเลือกสมาชิกจริงในระบบก่อนเสมอ
          เพื่อให้รายการนี้ผูกกับ user_id จริง ไม่ใช่พิมพ์ชื่อลอย ๆ */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontFamily: fonts.kanit }}>สร้างรายการยืม{kind === 'books' ? 'หนังสือ' : 'อุปกรณ์'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {createError && <Alert severity="error">{createError}</Alert>}

          <Box>
            <TextField
              fullWidth
              size="small"
              label="ค้นหาสมาชิก (ชื่อ / อีเมล / รหัสนักศึกษา)"
              value={selectedMember ? `${selectedMember.name ?? ''} · ${selectedMember.university_id}` : memberQuery}
              onChange={(e) => {
                setSelectedMember(null)
                setMemberQuery(e.target.value)
              }}
            />
            {!selectedMember && memberQuery.trim().length >= 2 && (
              <List dense sx={{ border: `1px solid ${colors.border}`, borderRadius: '8px', mt: '6px', maxHeight: 180, overflow: 'auto' }}>
                {memberSearching ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={18} />
                  </Box>
                ) : memberResults.length === 0 ? (
                  <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, fontSize: 13, px: 2, py: 1 }}>ไม่พบสมาชิกที่ตรงกับคำค้นหา</Typography>
                ) : (
                  memberResults.map((m) => (
                    <ListItemButton key={m.user_id} onClick={() => setSelectedMember(m)}>
                      <ListItemText
                        primary={m.name ?? '—'}
                        secondary={`รหัส ${m.university_id} · ${m.email ?? ''}`}
                        slotProps={{ primary: { sx: { fontFamily: fonts.thai } }, secondary: { sx: { fontFamily: fonts.thai } } }}
                      />
                    </ListItemButton>
                  ))
                )}
              </List>
            )}
          </Box>

          <Box>
            <TextField
              fullWidth
              size="small"
              label={kind === 'books' ? 'ค้นหาหนังสือ' : 'ค้นหาอุปกรณ์'}
              value={selectedResource ? (kind === 'books' ? (selectedResource as portal.CatalogResource).title : (selectedResource as portal.CatalogEquipment).name) : resourceQuery}
              onChange={(e) => {
                setSelectedResource(null)
                setResourceQuery(e.target.value)
              }}
            />
            {!selectedResource && resourceQuery.trim().length >= 1 && (
              <List dense sx={{ border: `1px solid ${colors.border}`, borderRadius: '8px', mt: '6px', maxHeight: 180, overflow: 'auto' }}>
                {filteredCreateResources.length === 0 ? (
                  <Typography sx={{ fontFamily: fonts.thai, color: colors.inkMuted, fontSize: 13, px: 2, py: 1 }}>ไม่พบรายการที่ตรงกับคำค้นหา</Typography>
                ) : (
                  filteredCreateResources.map((r) => {
                    const name = kind === 'books' ? (r as portal.CatalogResource).title : (r as portal.CatalogEquipment).name
                    const sub = kind === 'books' ? (r as portal.CatalogResource).barcode : (r as portal.CatalogEquipment).asset_code
                    return (
                      <ListItemButton key={r.ID} onClick={() => setSelectedResource(r)}>
                        <ListItemText
                          primary={name}
                          secondary={`${sub} · ${r.status === 'available' ? 'ว่าง' : 'ไม่ว่าง'}`}
                          slotProps={{ primary: { sx: { fontFamily: fonts.thai } }, secondary: { sx: { fontFamily: fonts.thai } } }}
                        />
                      </ListItemButton>
                    )
                  })
                )}
              </List>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              type="date"
              label="วันที่รับ"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              slotProps={{ htmlInput: { min: todayISO(), max: maxBookingISO() } }}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              type="number"
              label="ระยะเวลายืม (วัน)"
              value={createDays}
              onChange={(e) => {
                const cap = kind === 'equipment' ? 7 : 30
                setCreateDays(Math.min(cap, Math.max(1, Math.trunc(Number(e.target.value)) || 1)))
              }}
              slotProps={{ htmlInput: { min: 1, max: kind === 'equipment' ? 7 : 30 } }}
              sx={{ flex: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            disabled={creating || !selectedMember || !selectedResource || !createDate}
            onClick={() => void submitCreate()}
          >
            สร้างรายการยืม
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} message={notice} />
    </BackOfficeLayout>
  )
}

export default BorrowServicePage
