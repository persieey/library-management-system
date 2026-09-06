import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
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
  type DutyPeriod,
  type DutyShift,
  type ServicePoint,
} from '../../../interface/IDutyInterface'
import { fonts, mgr } from '../../../theme'

const label = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', color: mgr.inkMuted }
const body = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '8px', fontFamily: fonts.thai, fontSize: 14 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: mgr.border },
} as const

const DAY_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
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

  const [selected, setSelected] = useState(() => iso(new Date()))
  const [points, setPoints] = useState<ServicePoint[]>([])
  const [shifts, setShifts] = useState<DutyShift[]>([])
  const [people, setPeople] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const [draft, setDraft] = useState<{ period: DutyPeriod; point: ServicePoint } | null>(null)
  const [pickPerson, setPickPerson] = useState<number>(0)
  const [pickLead, setPickLead] = useState(false)
  const [saving, setSaving] = useState(false)

  const week = useMemo(() => {
    const start = mondayOf(new Date(selected))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [selected])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [sp, rows] = await Promise.all([
        dutyApi.listServicePoints(token),
        dutyApi.listDuties(token, { from: selected, to: selected }),
      ])
      setPoints(sp)
      setShifts(rows)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อ่านตารางเวรไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [token, selected])

  useEffect(() => {
    void load()
  }, [load])

  // รายชื่อบุคลากรใช้เฉพาะตอนหัวหน้าเปิดฟอร์ม และ API ก็กันไว้เฉพาะ manager อยู่แล้ว
  useEffect(() => {
    if (!token || !isManager) return
    listPersonnel(token)
      .then((rows) => setPeople(rows.filter((p) => p.status === 'active')))
      .catch(() => setPeople([]))
  }, [token, isManager])

  const staffAt = (pointId: number, period: DutyPeriod) =>
    shifts.filter((s) => s.service_point_id === pointId && s.period === period)

  /** คนที่มีเวรอยู่แล้วในช่วงนี้ ไม่ควรให้เลือกซ้ำเพราะอยู่สองจุดพร้อมกันไม่ได้ */
  const busyIn = (period: DutyPeriod) => new Set(shifts.filter((s) => s.period === period).map((s) => s.personnel_id))

  const openAssign = (period: DutyPeriod, point: ServicePoint) => {
    const busy = busyIn(period)
    const first = people.find((p) => !busy.has(p.id))
    setPickPerson(first?.id ?? 0)
    setPickLead(staffAt(point.id, period).length === 0)
    setDraft({ period, point })
  }

  const save = async () => {
    if (!token || !draft || !pickPerson) return
    setSaving(true)
    setError('')
    try {
      await dutyApi.createDuty(token, {
        date: selected,
        period: draft.period,
        service_point_id: draft.point.id,
        personnel_id: pickPerson,
        lead: pickLead,
        note: '',
      })
      setDraft(null)
      setToast('จัดเวรเรียบร้อย')
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
      setToast('ถอนออกจากเวรแล้ว')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

  const todayIso = iso(new Date())

  return (
    <BackOfficeLayout title="ตารางเวร">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* แถบเลือกวัน เห็นทั้งสัปดาห์แล้วกดเลือกทีละวัน เพราะหนึ่งวันมีหลายจุดบริการจนใส่ตารางสัปดาห์ไม่ไหว */}
        <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            onClick={() => {
              const d = new Date(selected)
              d.setDate(d.getDate() - 7)
              setSelected(iso(d))
            }}
            sx={{ ...body, minWidth: 0, color: mgr.accentGreen }}
          >
            ←
          </Button>
          {week.map((d) => {
            const key = iso(d)
            const active = key === selected
            return (
              <Box
                key={key}
                onClick={() => setSelected(key)}
                sx={{
                  cursor: 'pointer',
                  px: '14px',
                  py: '8px',
                  borderRadius: '10px',
                  minWidth: 62,
                  textAlign: 'center',
                  border: `1px solid ${active ? mgr.sidebar : mgr.border}`,
                  bgcolor: active ? mgr.sidebar : key === todayIso ? mgr.accentLight : 'transparent',
                  color: active ? '#fff' : mgr.ink,
                }}
              >
                <Typography sx={{ ...body, fontSize: 12, color: 'inherit', opacity: 0.85 }}>
                  {DAY_SHORT[d.getDay()]}
                </Typography>
                <Typography sx={{ ...body, fontWeight: 600, color: 'inherit' }}>{d.getDate()}</Typography>
              </Box>
            )
          })}
          <Button
            onClick={() => {
              const d = new Date(selected)
              d.setDate(d.getDate() + 7)
              setSelected(iso(d))
            }}
            sx={{ ...body, minWidth: 0, color: mgr.accentGreen }}
          >
            →
          </Button>
          <Button onClick={() => setSelected(todayIso)} sx={{ ...body, minWidth: 0, color: mgr.inkMuted }}>
            วันนี้
          </Button>
        </Box>

        <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17, color: mgr.ink }}>
          {thaiDate(selected)}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ fontFamily: fonts.thai, fontSize: 13, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        <Card noPadding>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <Box component="thead">
                <Box component="tr">
                  <Box component="th" sx={{ ...label, textAlign: 'left', p: '12px 20px', borderBottom: `1px solid ${mgr.border}`, width: 250 }}>
                    จุดบริการ
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
                {!loading && points.length === 0 && (
                  <Box component="tr">
                    <Box component="td" colSpan={4} sx={{ ...body, p: '20px', textAlign: 'center', color: mgr.inkMuted }}>
                      ยังไม่มีจุดบริการในระบบ
                    </Box>
                  </Box>
                )}
                {!loading &&
                  points.map((point) => (
                    <Box component="tr" key={point.id}>
                      <Box component="td" sx={{ p: '14px 20px', borderBottom: `1px solid ${mgr.border}`, verticalAlign: 'top' }}>
                        <Typography sx={{ ...body, fontWeight: 600 }}>{point.name}</Typography>
                        <Typography sx={{ ...body, fontSize: 12.5, color: mgr.inkMuted }}>
                          {point.location} · ต้องมีอย่างน้อย {point.min_staff} คน
                        </Typography>
                      </Box>

                      {PERIODS.map((period) => {
                        const rows = staffAt(point.id, period)
                        const short = rows.length > 0 && rows.length < point.min_staff
                        return (
                          <Box
                            key={period}
                            component="td"
                            sx={{ p: '14px 20px', borderBottom: `1px solid ${mgr.border}`, verticalAlign: 'top' }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {rows.map((s) => (
                                <Box key={s.id} sx={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                  <Typography sx={{ ...body, fontWeight: s.lead ? 600 : 400 }}>
                                    {s.lead && '★ '}
                                    {s.personnel_name}
                                    {s.on_leave && (
                                      <Typography component="span" sx={{ ...body, color: mgr.danger, fontSize: 12.5 }}>
                                        {' '}
                                        (ลาอนุมัติแล้ว)
                                      </Typography>
                                    )}
                                  </Typography>
                                  {isManager && (
                                    <Typography
                                      onClick={() => remove(s)}
                                      sx={{ ...body, fontSize: 12.5, color: mgr.danger, cursor: 'pointer' }}
                                    >
                                      ถอน
                                    </Typography>
                                  )}
                                </Box>
                              ))}

                              {rows.length === 0 && (
                                <Typography sx={{ ...body, color: mgr.inkMuted }}>ปิดบริการ</Typography>
                              )}

                              {short && (
                                <Typography sx={{ ...body, fontSize: 12.5, color: mgr.warning }}>
                                  คนไม่ครบขั้นต่ำ
                                </Typography>
                              )}

                              {isManager && (
                                <Typography
                                  onClick={() => openAssign(period, point)}
                                  sx={{ ...body, fontSize: 13, color: mgr.accentGreen, cursor: 'pointer', fontWeight: 600 }}
                                >
                                  + เพิ่มคน
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  ))}
              </Box>
            </Box>
          </Box>
        </Card>

        <Typography sx={{ ...body, fontSize: 13, color: mgr.inkMuted }}>
          ★ คือผู้รับผิดชอบหลักของจุดบริการนั้น
          {!isManager && ' · ดูได้อย่างเดียว การจัดเวรเป็นหน้าที่ของหัวหน้าหอสมุด'}
        </Typography>
      </Box>

      <Dialog open={!!draft} onClose={() => setDraft(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 17 }}>เพิ่มคนเข้าเวร</DialogTitle>
        <DialogContent>
          {draft && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px', pt: '6px' }}>
              <Typography sx={{ ...body, color: mgr.inkMuted }}>
                {draft.point.name} · {thaiDate(selected)} · ช่วง{PERIOD_LABEL[draft.period]}
              </Typography>

              <TextField
                select
                size="small"
                label="เจ้าหน้าที่"
                value={pickPerson || ''}
                onChange={(e) => setPickPerson(Number(e.target.value))}
                sx={fieldSx}
              >
                {people.map((p) => {
                  const busy = busyIn(draft.period).has(p.id)
                  return (
                    <MenuItem key={p.id} value={p.id} disabled={busy} sx={{ fontFamily: fonts.thai, fontSize: 14 }}>
                      {fullName(p)} · {p.department}
                      {busy && ' (มีเวรช่วงนี้แล้ว)'}
                    </MenuItem>
                  )
                })}
              </TextField>

              <FormControlLabel
                control={<Checkbox checked={pickLead} onChange={(e) => setPickLead(e.target.checked)} />}
                label={<Typography sx={body}>เป็นผู้รับผิดชอบหลักของจุดนี้</Typography>}
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
            disabled={saving || !pickPerson}
            sx={{ fontFamily: fonts.thai, fontSize: 14, borderRadius: '8px', bgcolor: mgr.sidebar }}
          >
            {saving ? 'กำลังบันทึก...' : 'เพิ่ม'}
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
