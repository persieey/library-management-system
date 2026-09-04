import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import { mgr } from '../../../theme'
import StatusBadge from '../../../components/StatusBadge'
import { fonts } from '../../../theme'

type ComplaintStatus = 'open' | 'inprogress' | 'resolved'

interface Complaint {
  id: number
  author: string
  preview: string
  date: string
  status: ComplaintStatus
  title: string
  submittedBy: string
  location: string
  message: string
  notes: string
}

const COMPLAINTS: Complaint[] = [
  {
    id: 1, author: 'นักศึกษา (ไม่ระบุชื่อ)', status: 'open',
    preview: 'แอร์ในห้องอ่านหนังสือกลุ่ม ชั้น 3 เสีย...',
    date: '2 ส.ค. 2569',
    title: 'เครื่องปรับอากาศเสีย — ห้องอ่านหนังสือกลุ่ม ชั้น 3',
    submittedBy: 'นักศึกษา (ไม่ระบุชื่อ)', location: 'ห้องอ่านหนังสือกลุ่ม ชั้น 3',
    message: 'เครื่องปรับอากาศในห้องอ่านหนังสือกลุ่ม ชั้น 3 เสียมาสามวันแล้ว ทำให้ห้องร้อนเกินกว่าจะใช้ทำงานกลุ่มได้ รบกวนส่งช่างมาตรวจสอบโดยเร็วที่สุด',
    notes: 'แจ้งทีมอาคารสถานที่แล้วเมื่อ 2 ส.ค. รอช่างเข้ามาตรวจ',
  },
  {
    id: 2, author: 'ปรีชา ส. (อาจารย์)', status: 'open',
    preview: 'หนังสือที่สั่งจองล่าช้ากว่ากำหนดสองสัปดาห์...',
    date: '30 ก.ค. 2569',
    title: 'หนังสือที่สั่งจองมาล่าช้า',
    submittedBy: 'ปรีชา ส. (อาจารย์)', location: 'ห้องพักอาจารย์',
    message: 'หนังสือที่สั่งจองไว้ล่าช้ากว่ากำหนดสองสัปดาห์โดยไม่มีการแจ้งเตือนใดๆ ส่งผลกระทบต่อการเตรียมการสอน',
    notes: '',
  },
  {
    id: 3, author: 'นักศึกษา (ไม่ระบุชื่อ)', status: 'inprogress',
    preview: 'เสนอให้ขยายเวลาเปิดทำการช่วงสอบปลายภาค',
    date: '26 ก.ค. 2569',
    title: 'ขยายเวลาเปิดทำการช่วงสอบ',
    submittedBy: 'นักศึกษา (ไม่ระบุชื่อ)', location: 'ไม่ระบุ',
    message: 'เสนอให้ขยายเวลาเปิดทำการถึง 22:00 น. ในช่วงสอบปลายภาค เพื่อรองรับนักศึกษาที่มาอ่านหนังสือสอบ',
    notes: 'ฝ่ายบริหารกำลังพิจารณา',
  },
  {
    id: 4, author: 'มาลี ท. (เจ้าหน้าที่)', status: 'resolved',
    preview: 'เครื่องพิมพ์ชั้น 2 กระดาษ/หมึกหมดบ่อยครั้ง',
    date: '20 ก.ค. 2569',
    title: 'ปัญหาเครื่องพิมพ์ชั้น 2',
    submittedBy: 'มาลี ท. (เจ้าหน้าที่)', location: 'ชั้น 2 บริเวณเครื่องพิมพ์',
    message: 'เครื่องพิมพ์ที่ชั้น 2 กระดาษและหมึกหมดบ่อยครั้ง ต้องการตารางเติมวัสดุสิ้นเปลืองอย่างสม่ำเสมอ',
    notes: 'แก้ไขแล้ว: ตั้งตารางเติมวัสดุสิ้นเปลืองแล้ว มอบหมายทีมดูแลรักษาแล้ว',
  },
  {
    id: 5, author: 'นักศึกษา (ไม่ระบุชื่อ)', status: 'resolved',
    preview: 'ประทับใจกิจกรรมอบรมการอ้างอิงมาก ขอบคุณค่ะ/ครับ',
    date: '18 ก.ค. 2569',
    title: 'ข้อเสนอแนะเชิงบวก — อบรมการอ้างอิง',
    submittedBy: 'นักศึกษา (ไม่ระบุชื่อ)', location: 'ไม่ระบุ',
    message: 'ประทับใจกิจกรรมอบรมการอ้างอิงมาก ขอบคุณค่ะ/ครับ',
    notes: 'รับทราบแล้ว',
  },
]

const sf = { fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const body = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const lbl  = { fontFamily: fonts.thai, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', color: mgr.inkMuted }
const sm   = { fontFamily: fonts.thai, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted }

export default function ManagerComplaints() {
  const [selected, setSelected] = useState<Complaint>(COMPLAINTS[0])
  const [notes, setNotes] = useState<Record<number, string>>(
    Object.fromEntries(COMPLAINTS.map((c) => [c.id, c.notes]))
  )
  const [statuses, setStatuses] = useState<Record<number, ComplaintStatus>>(
    Object.fromEntries(COMPLAINTS.map((c) => [c.id, c.status]))
  )

  const openCount = Object.values(statuses).filter((s) => s === 'open').length

  const resolve = (id: number) => setStatuses((prev) => ({ ...prev, [id]: 'resolved' }))

  return (
    <BackOfficeLayout title="เรื่องร้องเรียนและข้อเสนอแนะ">
      <Box sx={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left: complaint list */}
        <Paper variant="outlined" sx={{ width: 380, flexShrink: 0, borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
          {/* header badge */}
          <Box sx={{ px: '20px', py: '12px', borderBottom: `1px solid ${mgr.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <StatusBadge label={`ค้างอยู่ ${openCount} เรื่อง`} variant="open" />
          </Box>
          {COMPLAINTS.map((c, i) => {
            const status = statuses[c.id]
            const isActive = selected.id === c.id
            return (
              <Box
                key={c.id}
                onClick={() => setSelected(c)}
                sx={{
                  px: '20px', py: '16px',
                  borderTop: i === 0 ? 'none' : `1px solid ${mgr.border}`,
                  bgcolor: isActive ? mgr.accentLight : 'white',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  '&:hover': { bgcolor: isActive ? mgr.accentLight : '#fafafa' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={sf}>{c.author}</Typography>
                  <StatusBadge
                    label={status === 'open' ? 'เปิดอยู่' : status === 'inprogress' ? 'กำลังดำเนินการ' : 'แก้ไขแล้ว'}
                    variant={status}
                  />
                </Box>
                <Typography sx={sm}>{c.preview}</Typography>
                <Typography sx={sm}>{c.date}</Typography>
              </Box>
            )
          })}
        </Paper>

        {/* Right: detail panel */}
        <Paper variant="outlined" sx={{ flex: 1, borderRadius: '12px', borderColor: mgr.border, p: '28px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography sx={{ fontFamily: fonts.thai, fontWeight: 600, fontSize: 15, lineHeight: 1.35, color: mgr.ink, flex: 1, mr: 2 }}>
              {selected.title}
            </Typography>
            <StatusBadge
              label={statuses[selected.id] === 'open' ? 'เปิดอยู่' : statuses[selected.id] === 'inprogress' ? 'กำลังดำเนินการ' : 'แก้ไขแล้ว'}
              variant={statuses[selected.id]}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: '24px' }}>
            {[
              { label: 'ผู้แจ้ง', value: selected.submittedBy },
              { label: 'วันที่', value: selected.date },
              { label: 'สถานที่', value: selected.location },
            ].map(({ label: l, value }) => (
              <Box key={l} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Typography sx={lbl}>{l}</Typography>
                <Typography sx={body}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Typography sx={lbl}>ข้อความ</Typography>
          <Typography sx={body}>{selected.message}</Typography>

          <Typography sx={lbl}>บันทึกการแก้ไข</Typography>
          <TextField
            multiline
            minRows={2}
            size="small"
            value={notes[selected.id] ?? ''}
            onChange={(e) => setNotes((prev) => ({ ...prev, [selected.id]: e.target.value }))}
            placeholder="เพิ่มบันทึกการแก้ไข..."
            sx={{ '& .MuiInputBase-input': { fontFamily: fonts.thai, fontSize: 13, color: mgr.inkMuted }, bgcolor: '#f6f8f6' }}
            slotProps={{ input: { style: { borderRadius: 8 } } }}
          />

          {statuses[selected.id] !== 'resolved' && (
            <Box>
              <Button
                variant="contained"
                disableElevation
                onClick={() => resolve(selected.id)}
                sx={{ fontFamily: fonts.thai, fontWeight: 600, fontSize: 14, bgcolor: mgr.accentGreen, borderRadius: '8px', px: '22px', py: '11px', '&:hover': { bgcolor: '#1e4028' }, textTransform: 'none' }}
              >
                ทำเครื่องหมายว่าแก้ไขแล้ว
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </BackOfficeLayout>
  )
}
