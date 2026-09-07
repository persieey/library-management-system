
import { useState, useEffect, useRef } from 'react'
import { api } from '../../../services/api'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Barcode from 'react-barcode'
import ProcurementLayout from '../ProcurementLayout'
import AssetBarcodeDialog, { type AssetBarcodeTarget } from '../../../components/AssetBarcodeDialog'
import { colors, fonts } from '../../../theme'

interface AssetRow {
  id: string
  barcode?: string
  name: string
  type: string
  location: string
  condition: string
  pr_ref: string
  register_date: string
  quantity: number
}

interface ApprovedRequest {
  id: string
  title: string
  category: string
  quantity: number
  total_price: number
}

const CATEGORY_TO_TYPE: Record<string, string> = {
  'หนังสือและสื่อการเรียน': 'หนังสือ / สื่อการเรียน',
  'ครุภัณฑ์': 'ครุภัณฑ์',
  'อุปกรณ์สำนักงาน': 'อุปกรณ์สำนักงาน',
  'เทคโนโลยีสารสนเทศ': 'เทคโนโลยีสารสนเทศ',
  'อื่นๆ': 'อื่นๆ',
}

const ASSET_TYPES = ['หนังสือ / สื่อการเรียน', 'ครุภัณฑ์', 'อุปกรณ์สำนักงาน', 'เทคโนโลยีสารสนเทศ', 'อื่นๆ']
const CONDITIONS = ['ใหม่', 'ดี', 'พอใช้', 'ชำรุด']
const LOCATIONS = ['ชั้น 1 — โซนนิยาย', 'ชั้น 1 — โซนวิชาการ', 'ชั้น 2 — ห้องค้นคว้า', 'ชั้น 2 — ห้องสื่อ', 'ห้องเก็บ', 'อื่นๆ']

interface FormState {
  name: string
  type: string
  location: string
  condition: string
  prRef: string
  serialNo: string
  notes: string
  quantity: string
}

const EMPTY: FormState = {
  name: '', type: '', location: '', condition: 'ใหม่', prRef: '', serialNo: '', notes: '', quantity: '1',
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink, mb: '6px' }}>
      {children}
      {required && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
    </Typography>
  )
}

export default function RegisterAsset() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Partial<FormState> & { selectedPR?: string }>({})
  const [list, setList] = useState<AssetRow[]>([])
  const [approvedRequests, setApprovedRequests] = useState<ApprovedRequest[]>([])
  const [selectedPR, setSelectedPR] = useState<string>('')
  const [barcodeAsset, setBarcodeAsset] = useState<AssetBarcodeTarget | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const bulkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [assets, requests] = await Promise.all([
        api.assets.getAll(),
        api.requests.getAll(),
      ])
      const assetList = assets ?? []
      setList(assetList)
      const registeredPrRefs = new Set(assetList.map((a: any) => a.pr_ref).filter(Boolean))
      setApprovedRequests(
        (requests ?? []).filter((r: any) => r.status === 'approved' && !registeredPrRefs.has(String(r.id)))
      )
    }
    fetchData()
  }, [])

  const handleSelectPR = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value
    setSelectedPR(id)
    setErrors((prev) => ({ ...prev, selectedPR: '' }))
    if (!id) { setForm(EMPTY); return }
    const req = approvedRequests.find((r) => String(r.id) === id)
    if (!req) return
    setForm((prev) => ({
      ...prev,
      name: req.title,
      type: CATEGORY_TO_TYPE[req.category] ?? '',
      prRef: String(req.id),
      quantity: String(req.quantity ?? 1),
    }))
  }

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Partial<FormState> & { selectedPR?: string } = {}
    if (!selectedPR) errs.selectedPR = 'กรุณาเลือกคำขอจัดซื้อที่อนุมัติแล้ว'
    if (!form.name) errs.name = 'กรุณาระบุชื่อสินทรัพย์'
    if (!form.type) errs.type = 'กรุณาเลือกประเภท'
    if (!form.location) errs.location = 'กรุณาเลือกที่เก็บ'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const result = await api.assets.create({
      name: form.name,
      type: form.type,
      location: form.location,
      condition: form.condition,
      pr_ref: form.prRef,
      serial_no: form.serialNo,
      notes: form.notes,
      quantity: parseInt(form.quantity) || 1,
    })

    if (!result) { alert('บันทึกไม่สำเร็จ'); return }

    setList((prev) => {
      const next = [result, ...prev]
      const registeredPrRefs = new Set(next.map((a: any) => a.pr_ref).filter(Boolean))
      setApprovedRequests((reqs) => reqs.filter((r) => !registeredPrRefs.has(String(r.id))))
      return next
    })
    setSaved(true)
    setForm(EMPTY)
    setSelectedPR('')
    setBarcodeAsset({
      code: (result as any).barcode || (result as any).id || '',
      name: (result as any).name ?? form.name,
      location: (result as any).location ?? form.location,
    })
  }

  const allSelected = list.length > 0 && list.every((a) => selectedIds.has(a.id))
  const selectedAssets = list.filter((a) => selectedIds.has(a.id))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(list.map((a) => a.id)))
  }

  const printSelected = () => {
    const imgs = Array.from(bulkRef.current?.querySelectorAll('img') ?? []) as HTMLImageElement[]
    const labels = selectedAssets.map((a, idx) => `
      <div class="label">
        <img src="${imgs[idx]?.src ?? ''}" alt="${a.barcode || a.id}"/>
        <div class="name">${a.name ?? ''}</div>
        <div class="loc">${a.location ?? ''}</div>
        <div class="org">Udompanya University Library</div>
      </div>`).join('')
    const w = window.open('', '_blank', 'width=900,height=900')
    if (!w) return
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>บาร์โค้ด ${selectedAssets.length} รายการ</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:'Kanit','Noto Sans Thai',sans-serif}
        .sheet{display:flex;flex-wrap:wrap;gap:10px;padding:12px}
        .label{border:1px solid #000;border-radius:8px;padding:12px 14px;text-align:center;width:270px}
        .label img{width:240px}
        .name{font-size:12px;margin-top:4px}
        .loc{font-size:11px;color:#555;margin-top:2px}
        .org{font-size:10px;color:#777;margin-top:6px;border-top:1px dashed #999;padding-top:4px}
        @media print{@page{margin:8mm}.label{break-inside:avoid}}
      </style></head>
      <body onload="window.print();setTimeout(function(){window.close()},400)">
        <div class="sheet">${labels}</div>
      </body></html>`)
    w.document.close()
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontFamily: fonts.kanit, fontSize: 14, borderRadius: '8px',
      '& fieldset': { borderColor: '#e2e7e2' },
      '&:hover fieldset': { borderColor: colors.brandGreen },
      '&.Mui-focused fieldset': { borderColor: colors.brandGreen },
    },
  }

  return (
    <ProcurementLayout title="Register Asset">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 900 }}>
        <Paper variant="outlined" sx={{ borderRadius: '16px', borderColor: '#e2e7e2', p: '32px', bgcolor: 'white' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 18, fontWeight: 600, color: colors.brandGreen, mb: '24px' }}>
            ลงทะเบียนสินทรัพย์ใหม่
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Select approved PR */}
            <Box>
              <FieldLabel required>เลือกคำขอจัดซื้อที่อนุมัติแล้ว</FieldLabel>
              {approvedRequests.length === 0 ? (
                <Box sx={{ p: '12px 16px', borderRadius: '8px', border: '1px solid #e2e7e2', bgcolor: '#fef9ee' }}>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: '#b45309' }}>
                    ไม่มีคำขอจัดซื้อที่อนุมัติแล้ว — กรุณาให้ Manager อนุมัติคำขอก่อน
                  </Typography>
                </Box>
              ) : (
                <TextField
                  select fullWidth size="small"
                  value={selectedPR}
                  onChange={handleSelectPR}
                  error={Boolean(errors.selectedPR)}
                  helperText={errors.selectedPR}
                  sx={inputSx}
                >
                  <MenuItem value="" disabled sx={{ fontFamily: fonts.kanit }}>เลือกคำขอ</MenuItem>
                  {approvedRequests.map((r) => (
                    <MenuItem key={r.id} value={String(r.id)} sx={{ fontFamily: fonts.kanit }}>
                      #{r.id} — {r.title} ({r.quantity} ชิ้น · {r.total_price.toLocaleString('th-TH')} บาท)
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>

            {/* Asset ID (read only) */}
            <Box sx={{ display: 'flex', gap: '20px' }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>รหัสสินทรัพย์ (ออกโดยระบบ)</FieldLabel>
                <Box
                  sx={{
                    height: 40, borderRadius: '8px', border: '1px solid #e2e7e2',
                    bgcolor: '#f8f5ee', display: 'flex', alignItems: 'center',
                    px: '14px', fontFamily: fonts.kanit, fontSize: 14,
                    color: colors.brandGreen, fontWeight: 600,
                  }}
                >
                  ออกโดยระบบอัตโนมัติ
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>หมายเลขซีเรียล / S/N</FieldLabel>
                <TextField fullWidth size="small" placeholder="ถ้ามี" value={form.serialNo} onChange={set('serialNo')} sx={inputSx} />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '20px' }}>
              <Box sx={{ flex: 2 }}>
                <FieldLabel required>ชื่อสินทรัพย์</FieldLabel>
                <TextField fullWidth size="small" placeholder="เช่น เครื่องสแกนเอกสาร Canon DR-S150" value={form.name} onChange={set('name')} error={Boolean(errors.name)} helperText={errors.name} sx={inputSx} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>จำนวนชิ้น</FieldLabel>
                <TextField
                  fullWidth size="small" type="number"
                  slotProps={{ htmlInput: { min: 1 } }}
                  value={form.quantity}
                  onChange={set('quantity')}
                  sx={inputSx}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '20px' }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>ประเภทสินทรัพย์</FieldLabel>
                <TextField select fullWidth size="small" value={form.type} onChange={set('type')} error={Boolean(errors.type)} helperText={errors.type} sx={inputSx}>
                  <MenuItem value="" disabled sx={{ fontFamily: fonts.kanit }}>เลือกประเภท</MenuItem>
                  {ASSET_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ fontFamily: fonts.kanit }}>{t}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>สภาพ</FieldLabel>
                <TextField select fullWidth size="small" value={form.condition} onChange={set('condition')} sx={inputSx}>
                  {CONDITIONS.map((c) => <MenuItem key={c} value={c} sx={{ fontFamily: fonts.kanit }}>{c}</MenuItem>)}
                </TextField>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '20px' }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>สถานที่จัดเก็บ</FieldLabel>
                <TextField select fullWidth size="small" value={form.location} onChange={set('location')} error={Boolean(errors.location)} helperText={errors.location} sx={inputSx}>
                  <MenuItem value="" disabled sx={{ fontFamily: fonts.kanit }}>เลือกที่เก็บ</MenuItem>
                  {LOCATIONS.map((l) => <MenuItem key={l} value={l} sx={{ fontFamily: fonts.kanit }}>{l}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>อ้างอิงคำขอจัดซื้อ (PR)</FieldLabel>
                <Box
                  sx={{
                    height: 40, borderRadius: '8px', border: '1px solid #e2e7e2',
                    bgcolor: '#f8f5ee', display: 'flex', alignItems: 'center',
                    px: '14px', fontFamily: fonts.kanit, fontSize: 14,
                    color: colors.brandGreen, fontWeight: 600,
                  }}
                >
                  {form.prRef || '-'}
                </Box>
              </Box>
            </Box>

            <Box>
              <FieldLabel>หมายเหตุ</FieldLabel>
              <TextField fullWidth multiline rows={2} placeholder="ข้อมูลเพิ่มเติม..." value={form.notes} onChange={set('notes')} sx={inputSx} />
            </Box>

            <Box sx={{ display: 'flex', gap: '12px', pt: '8px' }}>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={!selectedPR}
                sx={{ bgcolor: colors.brandGreen, fontFamily: fonts.kanit, fontSize: 15, px: '28px', py: '10px', borderRadius: '8px', '&:hover': { bgcolor: '#0d2720' }, '&.Mui-disabled': { bgcolor: '#c0d4ca', color: 'white' } }}
              >
                ลงทะเบียนสินทรัพย์
              </Button>
              <Button
                onClick={() => { setForm(EMPTY); setSelectedPR('') }}
                variant="outlined"
                sx={{ fontFamily: fonts.kanit, fontSize: 15, px: '24px', borderColor: '#e2e7e2', color: colors.inkMuted, borderRadius: '8px' }}
              >
                ล้างข้อมูล
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Registered assets table */}
        <Paper variant="outlined" sx={{ borderRadius: '16px', borderColor: '#e2e7e2', overflow: 'hidden', bgcolor: 'white' }}>
          <Box sx={{ px: '24px', py: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, fontWeight: 600, color: colors.brandGreen }}>
              สินทรัพย์ที่ลงทะเบียนแล้ว
            </Typography>
            <Button
              onClick={printSelected}
              disabled={selectedIds.size === 0}
              variant="contained"
              size="small"
              sx={{ bgcolor: colors.brandGreen, fontFamily: fonts.kanit, fontSize: 13, px: '16px', borderRadius: '8px', '&:hover': { bgcolor: '#0d2720' }, '&.Mui-disabled': { bgcolor: '#c0d4ca', color: 'white' } }}
            >
              พิมพ์บาร์โค้ดที่เลือก ({selectedIds.size})
            </Button>
          </Box>
          <Divider />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '44px 1fr 2fr 1.5fr 1.5fr 0.6fr 0.6fr 1fr 0.8fr',
              bgcolor: '#f8f5ee', px: '24px', py: '10px', alignItems: 'center',
            }}
          >
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={selectedIds.size > 0 && !allSelected}
              onChange={toggleSelectAll}
              disabled={list.length === 0}
              sx={{ p: 0, color: colors.brandGreen, '&.Mui-checked': { color: colors.brandGreen }, '&.MuiCheckbox-indeterminate': { color: colors.brandGreen } }}
            />
            {['รหัส', 'ชื่อสินทรัพย์', 'ประเภท', 'สถานที่เก็บ', 'จำนวน', 'สภาพ', 'วันที่', 'บาร์โค้ด'].map((h) => (
              <Typography key={h} sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {h}
              </Typography>
            ))}
          </Box>
          {list.length === 0 ? (
            <Box sx={{ py: '32px', textAlign: 'center' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.inkMuted }}>ยังไม่มีสินทรัพย์ที่ลงทะเบียน</Typography>
            </Box>
          ) : (
            list.map((a, i) => (
              <Box
                key={a.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 2fr 1.5fr 1.5fr 0.6fr 0.6fr 1fr 0.8fr',
                  px: '24px', py: '14px', alignItems: 'center',
                  borderTop: i === 0 ? '1px solid #e2e7e2' : '1px solid #f0f0f0',
                  bgcolor: selectedIds.has(a.id) ? '#f0f5f2' : 'transparent',
                }}
              >
                <Checkbox
                  size="small"
                  checked={selectedIds.has(a.id)}
                  onChange={() => toggleSelect(a.id)}
                  sx={{ p: 0, color: colors.brandGreen, '&.Mui-checked': { color: colors.brandGreen } }}
                />
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.brandGreen, fontWeight: 500 }}>#{a.id}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>{a.name}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>{a.type}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>{a.location}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink }}>{a.quantity ?? '-'}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink }}>{a.condition}</Typography>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
                  {a.register_date ? new Date(a.register_date).toLocaleDateString('th-TH') : '-'}
                </Typography>
                <Button
                  onClick={() => setBarcodeAsset({ code: a.barcode || a.id, name: a.name, location: a.location })}
                  size="small"
                  sx={{ fontFamily: fonts.kanit, fontSize: 12, minWidth: 0, color: colors.brandGreen, border: `1px solid ${colors.brandGreen}`, borderRadius: '6px', px: '10px' }}
                >
                  บาร์โค้ด
                </Button>
              </Box>
            ))
          )}
        </Paper>
      </Box>

      <Snackbar open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert severity="success" onClose={() => setSaved(false)} sx={{ fontFamily: fonts.kanit }}>
          ลงทะเบียนสินทรัพย์เรียบร้อยแล้ว
        </Alert>
      </Snackbar>

      <AssetBarcodeDialog asset={barcodeAsset} onClose={() => setBarcodeAsset(null)} />

      {/* hidden — barcode images for bulk print */}
      <Box ref={bulkRef} aria-hidden sx={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        {selectedAssets.map((a) => (
          <Barcode key={a.id} value={a.barcode || a.id} format="CODE128" renderer="img" width={2} height={70} fontSize={14} margin={8} />
        ))}
      </Box>
    </ProcurementLayout>
  )
}
