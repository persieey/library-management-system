import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs, { Dayjs } from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import AssetAuditLayout from '../AssetAuditLayout'
import { auditApi, activeSession } from '../../../services/https/audit'
import { apiFetch } from '../../../services/https'
import { useAuth } from '../../../auth/useAuth'
import { colors, fonts } from '../../../theme'
import type { Equipment } from '../../../types'

const AUDIT_BG = '#1a3d2e'
const CONDITIONS = ['ปกติ', 'ชำรุด', 'สูญหาย', 'ย้ายสถานที่']

// อุปกรณ์จากระบบแจ้งซ่อม (B6715588) ใช้รหัส "available"/"maintenance"
// ส่วนตรวจนับใช้ CONDITIONS ข้างบน — แปลงให้ตรงกันตอนดึงเข้ามาเป็นแถวตรวจนับ
const EQUIPMENT_STATUS_TO_CONDITION: Record<string, string> = {
  available: 'ปกติ',
  maintenance: 'ชำรุด',
}
// คำนำหน้ารหัสของอุปกรณ์ กันชนกับรหัสสินทรัพย์ AST-xxxx เดิม
const EQUIPMENT_CODE_PREFIX = 'EQ-'

// เล่มหนังสือจากระบบจัดการหนังสือ (B6729615) ใช้ condition_status: good/damaged/repairing/lost
// ("repairing" ไม่มีในชุดสภาพของหน้าตรวจนับ ใกล้เคียงที่สุดคือ "ชำรุด")
const BOOK_CONDITION_TO_AUDIT: Record<string, string> = {
  good: 'ปกติ',
  damaged: 'ชำรุด',
  repairing: 'ชำรุด',
  lost: 'สูญหาย',
}
// คำนำหน้ารหัสของเล่มหนังสือ กันชนกับรหัสอื่น
const BOOK_CODE_PREFIX = 'BK-'

interface AssetRecord {
  id: string
  name: string
  type: string
  location: string
  condition: string
  quantity: number
}

interface BookCopyRecord {
  copy_id: number
  book_id: number
  copy_number: number
  building: string
  slot: string
  availability_status: string
  condition_status: string
  book?: { title: string }
}

// อาคาร/ชั้น-ช่องวาง ของเล่มหนังสือ ไม่ได้เป็นฟิลด์ location เดียวแบบสินทรัพย์/อุปกรณ์
// ต้องประกอบเป็นข้อความเดียวกันก่อน จะได้ใช้เป็นตัวกรอง "พื้นที่ตรวจนับ" ร่วมกันได้
function bookCopyLocation(c: BookCopyRecord): string {
  const parts = [c.building && `อาคาร ${c.building}`, c.slot].filter(Boolean)
  return parts.join(' — ')
}

interface AuditRow {
  asset_id: string
  asset_code: string
  asset_name: string
  expected: number
  found: number
  condition: string
  note: string
}

export default function PhysicalAudit() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [location, setLocation] = useState('')
  const [auditDate, setAuditDate] = useState<Dayjs | null>(dayjs())
  const [rows, setRows] = useState<AuditRow[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const token = localStorage.getItem('auth_token')

  // Load existing session if any
  useEffect(() => {
    const sid = activeSession.get()
    if (sid) {
      auditApi.getSession(sid).then((s) => {
        setLocation(s.location)
        setAuditDate(dayjs(s.audit_date))
        if (s.rows && s.rows.length > 0) {
          setRows(s.rows.map((r) => ({
            asset_id: r.asset_id as string,
            asset_code: r.asset_code,
            asset_name: r.asset_name,
            expected: r.expected,
            found: r.found,
            condition: r.condition,
            note: r.note,
          })))
        }
      }).catch(() => {})
    }
    // Load distinct locations from all assets + equipment (ระบบแจ้งซ่อม) + เล่มหนังสือ (ระบบจัดการหนังสือ)
    // /api/v1/equipment และ /api/v1/book-copies ห่อผลลัพธ์ไว้ใน object ไม่ใช่ array ตรง ๆ แบบ /api/v1/assets
    Promise.all([
      apiFetch<AssetRecord[]>('/api/v1/assets', { token }).catch(() => []),
      apiFetch<{ equipment: Equipment[] }>('/api/v1/equipment', { token }).catch(() => ({ equipment: [] })),
      apiFetch<{ copies: BookCopyRecord[] }>('/api/v1/book-copies', { token }).catch(() => ({ copies: [] })),
    ]).then(([assets, equipmentRes, copiesRes]) => {
      const locs = [
        ...new Set([
          ...(assets ?? []).map((a) => a.location),
          ...(equipmentRes.equipment ?? []).map((e) => e.location),
          ...(copiesRes.copies ?? []).map(bookCopyLocation),
        ].filter(Boolean)),
      ]
      setLocations(locs)
    })
  }, [])

  // Load assets + equipment when location changes
  useEffect(() => {
    if (!location) return
    setLoadingAssets(true)

    Promise.all([
      apiFetch<AssetRecord[]>(`/api/v1/assets?location=${encodeURIComponent(location)}`, { token }).catch(() => []),
      // /api/v1/equipment และ /api/v1/book-copies ไม่รองรับ filter ตามพื้นที่ ต้องกรองเองฝั่งหน้าเว็บ
      apiFetch<{ equipment: Equipment[] }>('/api/v1/equipment', { token }).catch(() => ({ equipment: [] })),
      apiFetch<{ copies: BookCopyRecord[] }>('/api/v1/book-copies', { token }).catch(() => ({ copies: [] })),
      auditApi.getSession(activeSession.get() ?? 0).catch(() => null),
    ]).then(([assets, equipmentRes, copiesRes, session]) => {
      const equipment = equipmentRes.equipment
      const copies = copiesRes.copies
      const existingRows = session?.rows ?? []
      const findExisting = (assetId: string) => existingRows.find((r) => r.asset_id === assetId)

      // สินทรัพย์จากระบบจัดซื้อ — จัดกลุ่มตามชื่อ+ประเภท เหมือนเดิม
      const grouped = new Map<string, { items: AssetRecord[] }>()
      for (const a of assets ?? []) {
        const key = `${a.name}||${a.type}`
        if (!grouped.has(key)) grouped.set(key, { items: [] })
        grouped.get(key)!.items.push(a)
      }
      const assetRows: AuditRow[] = []
      grouped.forEach(({ items }) => {
        const first = items[0]
        const existing = findExisting(first.id)
        assetRows.push({
          asset_id: first.id,
          asset_code: first.id,
          asset_name: first.name,
          expected: first.quantity || items.length,
          found: existing?.found ?? 0,
          condition: existing?.condition ?? 'ปกติ',
          note: existing?.note ?? '',
        })
      })

      // อุปกรณ์จากระบบแจ้งซ่อม — หนึ่งชิ้นต่อหนึ่งแถว (ไม่มี quantity แบบสินทรัพย์)
      const equipmentRows: AuditRow[] = (equipment ?? [])
        .filter((e) => e.location === location)
        .map((e) => {
          const assetId = `${EQUIPMENT_CODE_PREFIX}${e.equipment_id}`
          const existing = findExisting(assetId)
          return {
            asset_id: assetId,
            asset_code: assetId,
            asset_name: e.name,
            expected: 1,
            found: existing?.found ?? 0,
            condition: existing?.condition ?? EQUIPMENT_STATUS_TO_CONDITION[e.status] ?? 'ปกติ',
            note: existing?.note ?? '',
          }
        })

      // เล่มหนังสือจากระบบจัดการหนังสือ — หนึ่งเล่มต่อหนึ่งแถวเหมือนอุปกรณ์
      const bookRows: AuditRow[] = (copies ?? [])
        .filter((c) => bookCopyLocation(c) === location)
        .map((c) => {
          const assetId = `${BOOK_CODE_PREFIX}${c.copy_id}`
          const existing = findExisting(assetId)
          return {
            asset_id: assetId,
            asset_code: assetId,
            asset_name: `${c.book?.title ?? 'ไม่ทราบชื่อ'} (เล่มที่ ${c.copy_number})`,
            expected: 1,
            found: existing?.found ?? 0,
            condition: existing?.condition ?? BOOK_CONDITION_TO_AUDIT[c.condition_status] ?? 'ปกติ',
            note: existing?.note ?? '',
          }
        })

      setRows([...assetRows, ...equipmentRows, ...bookRows])
    }).finally(() => setLoadingAssets(false))
  }, [location])

  const updateRow = (idx: number, field: keyof AuditRow, value: string | number) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const handleSave = async () => {
    if (!location) { setError('กรุณาเลือกพื้นที่ตรวจนับ'); return }
    setSaving(true)
    setError('')
    try {
      let sid = activeSession.get()
      if (!sid) {
        const session = await auditApi.createSession({
          location,
          audit_date: (auditDate ?? dayjs()).toISOString(),
        })
        sid = session.id
        activeSession.set(sid)
      }
      await auditApi.saveRows(sid, rows)
      setSaved(true)
    } catch (e: any) {
      setError(e?.message ?? 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontFamily: fonts.kanit, fontSize: 13, borderRadius: '6px',
      '& fieldset': { borderColor: '#e2e7e2' },
      '&.Mui-focused fieldset': { borderColor: AUDIT_BG },
    },
  }

  return (
    <AssetAuditLayout title="Physical Audit">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '24px', bgcolor: 'white' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 17, fontWeight: 600, color: AUDIT_BG, mb: '16px' }}>
            เริ่มการตรวจนับจริง
          </Typography>
          <Box sx={{ display: 'flex', gap: '20px' }}>
            <Box sx={{ flex: 2 }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>พื้นที่ตรวจนับ</Typography>
              {/* พื้นที่รวมมาจาก 3 ระบบ (สินทรัพย์/อุปกรณ์/หนังสือ) อาจมีเป็นร้อยรายการ
                  ใช้ Autocomplete แทน select ธรรมดา จะได้พิมพ์ค้นหาแทนไล่สกรอลดูทีละบรรทัด */}
              <Autocomplete
                fullWidth size="small"
                options={locations}
                value={location || null}
                onChange={(_, val) => setLocation(val ?? '')}
                noOptionsText="ไม่พบพื้นที่ที่ค้นหา"
                renderInput={(params) => (
                  <TextField {...params} placeholder="พิมพ์เพื่อค้นหาพื้นที่..." sx={inputSx} />
                )}
                slotProps={{
                  listbox: { sx: { fontFamily: fonts.kanit, fontSize: 14 } },
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>วันที่ตรวจนับ</Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={auditDate}
                  onChange={(val) => setAuditDate(val)}
                  slotProps={{ textField: { size: 'small', sx: inputSx, fullWidth: true } }}
                />
              </LocalizationProvider>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>ผู้ตรวจนับ</Typography>
              <Box sx={{ height: 40, border: '1px solid #e2e7e2', borderRadius: '6px', display: 'flex', alignItems: 'center', px: '12px', fontFamily: fonts.kanit, fontSize: 13, color: AUDIT_BG, fontWeight: 600 }}>
                {user?.name ?? '-'}
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', overflow: 'hidden', bgcolor: 'white' }}>
          <Box sx={{ px: '20px', py: '14px', borderBottom: '1px solid #e2e7e2', bgcolor: '#f8f5ee' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: AUDIT_BG }}>
              บันทึกผลการตรวจนับ
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 0.8fr 1fr 1.2fr 1.5fr', px: '20px', py: '10px', bgcolor: '#fafafa', borderBottom: '1px solid #e2e7e2' }}>
            {['รหัส', 'ชื่อสินทรัพย์', 'ควรมี', 'พบจริง', 'สภาพ', 'หมายเหตุ'].map((h) => (
              <Typography key={h} sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</Typography>
            ))}
          </Box>

          {loadingAssets ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: '32px' }}>
              <CircularProgress sx={{ color: AUDIT_BG }} size={28} />
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ px: '20px', py: '28px', textAlign: 'center' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.inkMuted }}>
                {location ? 'ไม่พบสินทรัพย์ในพื้นที่นี้' : 'กรุณาเลือกพื้นที่เพื่อโหลดรายการสินทรัพย์'}
              </Typography>
            </Box>
          ) : (
            rows.map((a, i) => {
              const diff = a.found - a.expected
              const hasDiff = a.found > 0 && diff !== 0
              return (
                <Box
                  key={a.asset_id}
                  sx={{
                    display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 0.8fr 1fr 1.2fr 1.5fr',
                    px: '20px', py: '10px', alignItems: 'center',
                    borderTop: i === 0 ? '1px solid #e2e7e2' : '1px solid #f0f0f0',
                    bgcolor: hasDiff ? '#fff7ed' : 'transparent',
                  }}
                >
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: AUDIT_BG, fontWeight: 500 }}>{a.asset_code}</Typography>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink }}>{a.asset_name}</Typography>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, textAlign: 'center' }}>{a.expected}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TextField
                      size="small" type="number"
                      value={a.found}
                      onChange={(e) => updateRow(i, 'found', Number(e.target.value))}
                      sx={{ ...inputSx, width: 70 }}
                      slotProps={{ htmlInput: { min: 0 } }}
                    />
                    {hasDiff && (
                      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 11, color: diff > 0 ? '#166534' : '#b91c1c', fontWeight: 600 }}>
                        {diff > 0 ? `+${diff}` : diff}
                      </Typography>
                    )}
                  </Box>
                  <TextField
                    select size="small" value={a.condition}
                    onChange={(e) => updateRow(i, 'condition', e.target.value)}
                    sx={{ ...inputSx, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], fontSize: 12 } }}
                  >
                    {CONDITIONS.map((c) => <MenuItem key={c} value={c} sx={{ fontFamily: fonts.kanit, fontSize: 13 }}>{c}</MenuItem>)}
                  </TextField>
                  <TextField
                    size="small" placeholder="หมายเหตุ" value={a.note}
                    onChange={(e) => updateRow(i, 'note', e.target.value)}
                    sx={{ ...inputSx, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], fontSize: 12 } }}
                  />
                </Box>
              )
            })
          )}

          <Box sx={{ px: '20px', py: '16px', borderTop: '1px solid #e2e7e2', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="contained"
              sx={{ bgcolor: AUDIT_BG, fontFamily: fonts.kanit, fontSize: 14, px: '24px', borderRadius: '8px', '&:hover': { bgcolor: '#0d2318' } }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกผลการตรวจนับ'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/asset-audit/discrepancies')}
              sx={{ fontFamily: fonts.kanit, fontSize: 14, px: '20px', borderColor: '#e2e7e2', color: colors.inkMuted, borderRadius: '8px' }}
            >
              ไปบันทึกความคลาดเคลื่อน →
            </Button>
            {error && <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: '#b91c1c' }}>{error}</Typography>}
          </Box>
        </Paper>
      </Box>

      <Snackbar open={saved} autoHideDuration={2500} onClose={() => setSaved(false)}>
        <Alert severity="success" onClose={() => setSaved(false)} sx={{ fontFamily: fonts.kanit }}>
          บันทึกผลการตรวจนับเรียบร้อยแล้ว
        </Alert>
      </Snackbar>
    </AssetAuditLayout>
  )
}
