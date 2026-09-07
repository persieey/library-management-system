import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import AssetAuditLayout from '../AssetAuditLayout'
import { auditApi, activeSession, type Discrepancy } from '../../../services/https/audit'
import { colors, fonts } from '../../../theme'

const AUDIT_BG = '#1a3d2e'
const DISC_TYPES = ['จำนวนขาด', 'จำนวนเกิน', 'สภาพชำรุด', 'สูญหาย', 'ข้อมูลไม่ตรง', 'ย้ายสถานที่ไม่แจ้ง']

const EMPTY = () => ({ asset_code: '', asset_name: '', type: '', expected: '', actual: '', cause: '', action: '' })

export default function RecordDiscrepancies() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Discrepancy[]>([])
  const [form, setForm] = useState(EMPTY())
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [saved, setSaved] = useState(false)
  const [adding, setAdding] = useState(false)
  const [noSession, setNoSession] = useState(false)

  useEffect(() => {
    const sid = activeSession.get()
    if (!sid) { setNoSession(true); return }
    auditApi.getSession(sid).then((s) => {
      setRows(s.discrepancies ?? [])
    }).catch(() => setNoSession(true))
  }, [])

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  const handleAdd = async () => {
    const errs: Partial<typeof form> = {}
    if (!form.asset_code) errs.asset_code = 'กรุณาระบุ'
    if (!form.asset_name) errs.asset_name = 'กรุณาระบุ'
    if (!form.type) errs.type = 'กรุณาเลือก'
    if (!form.actual) errs.actual = 'กรุณาระบุ'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const sid = activeSession.get()
    if (!sid) return
    setAdding(true)
    try {
      const disc = await auditApi.addDiscrepancy(sid, form)
      setRows((p) => [...p, disc])
      setForm(EMPTY())
      setSaved(true)
    } catch (e: any) {
      setErrors({ actual: e?.message ?? 'บันทึกไม่สำเร็จ' })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: number) => {
    try {
      await auditApi.deleteDiscrepancy(id)
      setRows((p) => p.filter((r) => r.id !== id))
    } catch {}
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontFamily: fonts.kanit, fontSize: 13, borderRadius: '6px',
      '& fieldset': { borderColor: '#e2e7e2' },
      '&.Mui-focused fieldset': { borderColor: AUDIT_BG },
    },
  }

  if (noSession) {
    return (
      <AssetAuditLayout title="Record Discrepancies">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '16px' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 16, color: colors.inkMuted }}>
            กรุณาเริ่มการตรวจนับก่อน
          </Typography>
          <Button onClick={() => navigate('/asset-audit/physical')} variant="contained"
            sx={{ bgcolor: AUDIT_BG, fontFamily: fonts.kanit, borderRadius: '8px', '&:hover': { bgcolor: '#0d2318' } }}>
            ไปหน้า Physical Audit
          </Button>
        </Box>
      </AssetAuditLayout>
    )
  }

  return (
    <AssetAuditLayout title="Record Discrepancies">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', p: '24px', bgcolor: 'white' }}>
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 17, fontWeight: 600, color: AUDIT_BG, mb: '20px' }}>
            เพิ่มรายการความคลาดเคลื่อน
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Box sx={{ display: 'flex', gap: '16px' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>
                  รหัสสินทรัพย์ <span style={{ color: '#b91c1c' }}>*</span>
                </Typography>
                <TextField fullWidth size="small" placeholder="A-0001" value={form.asset_code} onChange={set('asset_code')} error={Boolean(errors.asset_code)} helperText={errors.asset_code} sx={inputSx} />
              </Box>
              <Box sx={{ flex: 2 }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>
                  ชื่อสินทรัพย์ <span style={{ color: '#b91c1c' }}>*</span>
                </Typography>
                <TextField fullWidth size="small" value={form.asset_name} onChange={set('asset_name')} error={Boolean(errors.asset_name)} helperText={errors.asset_name} sx={inputSx} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>
                  ประเภทความคลาดเคลื่อน <span style={{ color: '#b91c1c' }}>*</span>
                </Typography>
                <TextField select fullWidth size="small" value={form.type} onChange={set('type')} error={Boolean(errors.type)} helperText={errors.type} sx={inputSx}>
                  <MenuItem value="" disabled sx={{ fontFamily: fonts.kanit }}>เลือกประเภท</MenuItem>
                  {DISC_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ fontFamily: fonts.kanit }}>{t}</MenuItem>)}
                </TextField>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '16px' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>ข้อมูลที่ควรเป็น</Typography>
                <TextField fullWidth size="small" placeholder="เช่น มี 10 ชิ้น สภาพสมบูรณ์" value={form.expected} onChange={set('expected')} sx={inputSx} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>
                  สิ่งที่พบจริง <span style={{ color: '#b91c1c' }}>*</span>
                </Typography>
                <TextField fullWidth size="small" placeholder="เช่น มี 8 ชิ้น หายไป 2" value={form.actual} onChange={set('actual')} error={Boolean(errors.actual)} helperText={errors.actual} sx={inputSx} />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '16px' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>สาเหตุที่คาดว่าเกิดขึ้น</Typography>
                <TextField fullWidth size="small" value={form.cause} onChange={set('cause')} sx={inputSx} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted, mb: '6px' }}>แนวทางแก้ไขที่แนะนำ</Typography>
                <TextField fullWidth size="small" value={form.action} onChange={set('action')} sx={inputSx} />
              </Box>
            </Box>

            <Box>
              <Button
                onClick={handleAdd}
                disabled={adding}
                variant="contained"
                sx={{ bgcolor: AUDIT_BG, fontFamily: fonts.kanit, fontSize: 14, px: '24px', borderRadius: '8px', '&:hover': { bgcolor: '#0d2318' } }}
              >
                {adding ? <CircularProgress size={18} sx={{ color: 'white' }} /> : '+ เพิ่มรายการ'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {rows.length > 0 && (
          <Paper variant="outlined" sx={{ borderRadius: '14px', borderColor: '#e2e7e2', overflow: 'hidden' }}>
            <Box sx={{ px: '20px', py: '14px', borderBottom: '1px solid #e2e7e2', bgcolor: '#f8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 15, fontWeight: 600, color: AUDIT_BG }}>
                รายการความคลาดเคลื่อนที่บันทึกแล้ว ({rows.length} รายการ)
              </Typography>
              <Button
                onClick={() => navigate('/asset-audit/report')}
                variant="outlined"
                sx={{ fontFamily: fonts.kanit, fontSize: 13, borderColor: AUDIT_BG, color: AUDIT_BG, borderRadius: '8px' }}
              >
                สร้างรายงาน →
              </Button>
            </Box>
            {rows.map((r, i) => (
              <Box
                key={r.id}
                sx={{
                  px: '20px', py: '16px',
                  borderTop: i === 0 ? '1px solid #e2e7e2' : '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
                  bgcolor: '#fff7ed',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '6px' }}>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: AUDIT_BG, fontWeight: 600 }}>{r.asset_code}</Typography>
                    <Typography sx={{ fontFamily: fonts.kanit, fontSize: 14, color: colors.ink }}>{r.asset_name}</Typography>
                    <Box component="span" sx={{ px: '8px', py: '2px', borderRadius: '999px', fontSize: 11, fontFamily: fonts.kanit, color: '#b45309', bgcolor: '#fef3c7' }}>
                      {r.type}
                    </Box>
                  </Box>
                  <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.inkMuted }}>
                    พบจริง: <span style={{ color: '#b91c1c', fontWeight: 600 }}>{r.actual}</span>
                    {r.cause ? ` · สาเหตุ: ${r.cause}` : ''}
                    {r.action ? ` · แนวทาง: ${r.action}` : ''}
                  </Typography>
                </Box>
                <Button
                  onClick={() => handleRemove(r.id)}
                  size="small"
                  sx={{ fontFamily: fonts.kanit, fontSize: 12, color: '#b91c1c', minWidth: 0, px: '8px' }}
                >
                  ลบ
                </Button>
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      <Snackbar open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert severity="success" onClose={() => setSaved(false)} sx={{ fontFamily: fonts.kanit }}>
          บันทึกรายการความคลาดเคลื่อนเรียบร้อยแล้ว
        </Alert>
      </Snackbar>
    </AssetAuditLayout>
  )
}
