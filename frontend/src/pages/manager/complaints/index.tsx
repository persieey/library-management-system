import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../../components/ManagerLayout'
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
    id: 1, author: 'Anon Student', status: 'open',
    preview: 'AC not working in the group study room on 3F...',
    date: 'Aug 2, 2026',
    title: 'Air conditioning issue — Group Study Room 3F',
    submittedBy: 'Anonymous Student', location: 'Group Study Room, 3F',
    message: 'The air conditioning unit in Group Study Room 3F has not been working for the past three days, making the room too hot to use for group work. Please send someone to check it as soon as possible.',
    notes: 'Facilities team notified on Aug 2. Awaiting technician visit.',
  },
  {
    id: 2, author: 'Preecha S. (Faculty)', status: 'open',
    preview: 'Requested book delivery delayed by two weeks...',
    date: 'Jul 30, 2026',
    title: 'Book delivery delay',
    submittedBy: 'Preecha S. (Faculty)', location: 'Faculty Office',
    message: 'Requested book delivery was delayed by two weeks without any notification. This affected my course preparation.',
    notes: '',
  },
  {
    id: 3, author: 'Anon Student', status: 'inprogress',
    preview: 'Suggest extending opening hours during finals week',
    date: 'Jul 26, 2026',
    title: 'Extend opening hours during finals',
    submittedBy: 'Anonymous Student', location: 'N/A',
    message: 'Suggest extending opening hours during finals week to 22:00 to support students studying for exams.',
    notes: 'Under review by management.',
  },
  {
    id: 4, author: 'Malee T. (Staff)', status: 'resolved',
    preview: 'Printer on 2F frequently out of paper/toner',
    date: 'Jul 20, 2026',
    title: 'Printer issue on 2F',
    submittedBy: 'Malee T. (Staff)', location: '2nd Floor, Printer Area',
    message: 'Printer on 2F is frequently out of paper and toner. Needs regular restocking schedule.',
    notes: 'Resolved: restocking schedule set up. Maintenance team assigned.',
  },
  {
    id: 5, author: 'Anon Student', status: 'resolved',
    preview: 'Great experience with the citation workshop, thank you!',
    date: 'Jul 18, 2026',
    title: 'Positive feedback — Citation Workshop',
    submittedBy: 'Anonymous Student', location: 'N/A',
    message: 'Great experience with the citation workshop, thank you!',
    notes: 'Acknowledged.',
  },
]

const sf = { fontFamily: fonts.inter, fontWeight: 600, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const body = { fontFamily: fonts.inter, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const lbl  = { fontFamily: fonts.inter, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', color: mgr.inkMuted, textTransform: 'uppercase' as const }
const sm   = { fontFamily: fonts.inter, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: mgr.inkMuted }

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
    <ManagerLayout title="Complaints & Feedback">
      <Box sx={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left: complaint list */}
        <Paper variant="outlined" sx={{ width: 380, flexShrink: 0, borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
          {/* header badge */}
          <Box sx={{ px: '20px', py: '12px', borderBottom: `1px solid ${mgr.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <StatusBadge label={`${openCount} OPEN`} variant="open" />
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
                    label={status === 'open' ? 'Open' : status === 'inprogress' ? 'In Progress' : 'Resolved'}
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
            <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 15, lineHeight: 1.35, color: mgr.ink, flex: 1, mr: 2 }}>
              {selected.title}
            </Typography>
            <StatusBadge
              label={statuses[selected.id] === 'open' ? 'Open' : statuses[selected.id] === 'inprogress' ? 'In Progress' : 'Resolved'}
              variant={statuses[selected.id]}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: '24px' }}>
            {[
              { label: 'SUBMITTED BY', value: selected.submittedBy },
              { label: 'DATE', value: selected.date },
              { label: 'LOCATION', value: selected.location },
            ].map(({ label: l, value }) => (
              <Box key={l} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Typography sx={lbl}>{l}</Typography>
                <Typography sx={body}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Typography sx={lbl}>MESSAGE</Typography>
          <Typography sx={body}>{selected.message}</Typography>

          <Typography sx={lbl}>RESOLUTION NOTES</Typography>
          <TextField
            multiline
            minRows={2}
            size="small"
            value={notes[selected.id] ?? ''}
            onChange={(e) => setNotes((prev) => ({ ...prev, [selected.id]: e.target.value }))}
            placeholder="Add resolution notes..."
            sx={{ '& .MuiInputBase-input': { fontFamily: fonts.inter, fontSize: 13, color: mgr.inkMuted }, bgcolor: '#f6f8f6' }}
            slotProps={{ input: { style: { borderRadius: 8 } } }}
          />

          {statuses[selected.id] !== 'resolved' && (
            <Box>
              <Button
                variant="contained"
                disableElevation
                onClick={() => resolve(selected.id)}
                sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 14, bgcolor: mgr.accentGreen, borderRadius: '8px', px: '22px', py: '11px', '&:hover': { bgcolor: '#1e4028' }, textTransform: 'none' }}
              >
                Mark as Resolved
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </ManagerLayout>
  )
}
