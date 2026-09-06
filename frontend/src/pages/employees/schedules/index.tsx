import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import Card from '../../../components/Card'
import { useAuth } from '../../../auth/useAuth'
import * as dutyApi from '../../../services/https/duties'
import { listPersonnel } from '../../../services/https/personnel'
import type { Personnel } from '../../../interface/IPersonnelInterface'
import {
  PERIODS,
  PERIOD_LABEL,
  PERIOD_TIME,
  type DutyDraft,
  type DutyPeriod,
  type DutyShift,
} from '../../../interface/IDutyInterface'
import { fonts, mgr } from '../../../theme'

const label = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', color: mgr.inkMuted }
const body = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const action = { fontFamily: fonts.thai, fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '8px', fontFamily: fonts.thai, fontSize: 14 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: mgr.border },
} as const

const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const pad = (n: number) => String(n).padStart(2, '0')
/** YYYY-MM-DD ตามเวลาเครื่อง ไม่ใช้ toISOString เพราะจะเพี้ยนไปวันหนึ่งตอนข้ามโซนเวลา */
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** วันจันทร์ของสัปดาห์ที่วันนั้นอยู่ JS นับอาทิตย์เป็น 0 */
function mondayOf(d: Date): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7))
  copy.setHours(0, 0, 0, 0)
  return copy
}

function thaiDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y) return isoDate
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`
}

const fullName = (p: Personnel) => `${p.firstName} ${p.lastName}`

export default function SchedulesPage() {
  const { token, allows } = useAuth()
  const isManager = allows('manager')

  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [shifts, setShifts] = useState<DutyShift[]>([])
  const [people, setPeople] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const [editing, setEditing] = useState<DutyShift | null>(null)
  const [draft, setDraft] = useState<DutyDraft | null>(null)
  const [saving, setSaving] = useState(false)

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
      }),
    [weekStart],
  )

  const range = useMemo(() => ({ from: iso(days[0]), to: iso(days[6]) }), [days])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      setShifts(await dutyApi.listDuties(token, range))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อ่านตารางเวรไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [token, range])

  useEffect(() => {
    void load()
  }, [load])

  // รายชื่อบุคลากรใช้เฉพาะตอนหัวหน้าเปิดฟอร์ม คนอื่นไม่ต้องโหลด และ API ก็กันไว้เฉพาะ manager
  useEffect(() => {
    if (!token || !isManager) return
    listPersonnel(token)
      .then((rows) => setPeople(rows.filter((p) => p.status === 'active')))
      .catch(() => setPeople([]))
  }, [token, isManager])

  const shiftAt = (date: string, period: DutyPeriod) =>
    shifts.find((s) => s.date === date && s.period === period)

  const openNew = (date: string, period: DutyPeriod) => {
    setEditing(null)
    setDraft({ date, period, lead_id: people[0]?.id ?? 0, assistant_id: undefined, note: '' })
  }

  const openEdit = (s: DutyShift) => {
    setEditing(s)
    setDraft({ date: s.date, period: s.period, lead_id: s.lead_id, assistant_id: s.assistant_id, note: s.note })
  }

  const save = async () => {
    if (!token || !draft) return
    setSaving(true)
    setError('')
    try {
      if (editing) await dutyApi.updateDuty(token, editing.id, draft)
      else await dutyApi.createDuty(token, draft)
      setDraft(null)
      setEditing(null)
      setToast('บันทึกตารางเวรแล้ว')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (s: DutyShift) => {
    if (!token) return
    try {
      await dutyApi.deleteDuty(token, s.id)
      setToast('ลบเวรแล้ว')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(d)
  }

  const todayIso = iso(new Date())

  return (
    <BackOfficeLayout title="ตารางเวร">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Button onClick={() => shiftWeek(-1)} sx={{ ...body, minWidth: 0, color: mgr.accentGreen }}>
            ← สัปดาห์ก่อน
          </Button>
          <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 16, color: mgr.ink }}>
            {thaiDate(range.from)} – {thaiDate(range.to)}
          </Typography>
          <Button onClick={() => shiftWeek(1)} sx={{ ...body, minWidth: 0, color: mgr.accentGreen }}>
            สัปดาห์ถัดไป →
          </Button>
          <Button onClick={() => setWeekStart(mondayOf(new Date()))} sx={{ ...body, minWidth: 0, color: mgr.inkMuted }}>
            สัปดาห์นี้
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ fontFamily: fonts.thai, fontSize: 13, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        <Card noPadding>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <Box component="thead">
                <Box component="tr">
                  <Box component="th" sx={{ ...label, textAlign: 'left', p: '12px 20px', borderBottom: `1px solid ${mgr.border}`, width: 150 }}>
                    วัน
                  </Box>
                  {PERIODS.map((p) => (
                    <Box key={p} component="th" sx={{ ...label, textAlign: 'left', p: '12px 20px', borderBottom: `1px solid ${mgr.border}` }}>
                      {PERIOD_LABEL[p]} · {PERIOD_TIME[p]}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {loading && (
                  <Box component="tr">
                    <Box component="td" colSpan={4} sx={{ ...body, p: '20px', textAlign: 'center', color: mgr.inkMuted }}>
                      กำลังโหลด...
                    </Box>
                  </Box>
                )}
                {!loading &&
                  days.map((d) => {
                    const date = iso(d)
                    const isToday = date === todayIso
                    return (
                      <Box component="tr" key={date}>
                        <Box
                          component="td"
                          sx={{
                            p: '12px 20px',
                            borderBottom: `1px solid ${mgr.border}`,
                            bgcolor: isToday ? mgr.accentLight : 'transparent',
                          }}
                        >
                          <Typography sx={{ ...body, fontWeight: isToday ? 600 : 400 }}>
                            {DAY_NAMES[d.getDay()]}
                          </Typography>
                          <Typography sx={{ ...body, fontSize: 12.5, color: mgr.inkMuted }}>{thaiDate(date)}</Typography>
                        </Box>

                        {PERIODS.map((p) => {
                          const s = shiftAt(date, p)
                          return (
                            <Box
                              key={p}
                              component="td"
                              sx={{
                                p: '12px 20px',
                                borderBottom: `1px solid ${mgr.border}`,
                                verticalAlign: 'top',
                                bgcolor: isToday ? mgr.accentLight : 'transparent',
                              }}
                            >
                              {s ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <Typography sx={{ ...body, fontWeight: 500 }}>{s.lead_name}</Typography>
                                  {s.assistant_name && (
                                    <Typography sx={{ ...body, fontSize: 13, color: mgr.inkMuted }}>
                                      ผู้ช่วย: {s.assistant_name}
                                    </Typography>
                                  )}
                                  {isManager && (
                                    <Box sx={{ display: 'flex', gap: '12px', mt: '4px' }}>
                                      <Typography onClick={() => openEdit(s)} sx={{ ...action, color: mgr.accentGreen }}>
                                        แก้ไข
                                      </Typography>
                                      <Typography onClick={() => remove(s)} sx={{ ...action, color: mgr.danger }}>
                                        ลบ
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              ) : isManager ? (
                                <Typography onClick={() => openNew(date, p)} sx={{ ...action, color: mgr.inkMuted }}>
                                  + จัดเวร
                                </Typography>
                              ) : (
                                <Typography sx={{ ...body, color: mgr.inkMuted }}>—</Typography>
                              )}
                            </Box>
                          )
                        })}
                      </Box>
                    )
                  })}
              </Box>
            </Box>
          </Box>
        </Card>

        {!isManager && (
          <Typography sx={{ ...body, fontSize: 13, color: mgr.inkMuted }}>
            ดูได้อย่างเดียว การจัดเวรเป็นหน้าที่ของหัวหน้าหอสมุด
          </Typography>
        )}
      </Box>

      <Dialog open={!!draft} onClose={() => setDraft(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17 }}>
          {editing ? 'แก้ไขเวร' : 'จัดเวรใหม่'}
        </DialogTitle>
        <DialogContent>
          {draft && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px', pt: '6px' }}>
              <Typography sx={{ ...body, color: mgr.inkMuted }}>
                {thaiDate(draft.date)} · ช่วง{PERIOD_LABEL[draft.period]}
              </Typography>

              <TextField
                select
                size="small"
                label="หัวหน้าเวร"
                value={draft.lead_id || ''}
                onChange={(e) => setDraft({ ...draft, lead_id: Number(e.target.value) })}
                sx={fieldSx}
              >
                {people.map((p) => (
                  <MenuItem key={p.id} value={p.id} sx={{ fontFamily: fonts.thai, fontSize: 14 }}>
                    {fullName(p)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="ผู้ช่วย (ไม่บังคับ)"
                value={draft.assistant_id ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, assistant_id: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                sx={fieldSx}
              >
                <MenuItem value="" sx={{ fontFamily: fonts.thai, fontSize: 14 }}>
                  ไม่มีผู้ช่วย
                </MenuItem>
                {people
                  .filter((p) => p.id !== draft.lead_id)
                  .map((p) => (
                    <MenuItem key={p.id} value={p.id} sx={{ fontFamily: fonts.thai, fontSize: 14 }}>
                      {fullName(p)}
                    </MenuItem>
                  ))}
              </TextField>

              <TextField
                size="small"
                label="หมายเหตุ"
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                sx={fieldSx}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDraft(null)} sx={{ ...body, color: mgr.inkMuted }}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving || !draft?.lead_id}
            sx={{ fontFamily: fonts.thai, fontSize: 14, borderRadius: '8px', bgcolor: mgr.sidebar }}
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ fontFamily: fonts.thai, fontSize: 14, borderRadius: '8px' }}>
          {toast}
        </Alert>
      </Snackbar>
    </BackOfficeLayout>
  )
}
