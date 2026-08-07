import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ManagerLayout, { mgr } from '../../../components/ManagerLayout'
import StatusBadge from '../../../components/StatusBadge'
import { fonts } from '../../../theme'

type ActivityStatus = 'published' | 'draft' | 'ended'

interface Activity {
  id: number
  title: string
  date: string
  location: string
  status: ActivityStatus
}

const INITIAL: Activity[] = [
  { id: 1, title: 'Database Research Workshop',    date: 'Aug 12, 2026', location: 'Training Room, 2F',  status: 'published' },
  { id: 2, title: 'New Books Exhibition',           date: 'Aug 18, 2026', location: 'Exhibit Zone, 1F',  status: 'published' },
  { id: 3, title: 'Citation & EndNote Workshop',    date: 'Aug 25, 2026', location: 'Computer Lab, 3F',  status: 'draft' },
  { id: 4, title: 'Reading Promotion Week',         date: 'Sep 1–5, 2026', location: 'Main Hall',        status: 'draft' },
  { id: 5, title: 'Library Orientation for Freshmen', date: 'Jul 20, 2026', location: 'Auditorium',      status: 'ended' },
]

const label  = { fontFamily: fonts.inter, fontWeight: 500, fontSize: 12, letterSpacing: '0.48px', lineHeight: 1.2, color: mgr.inkMuted, textTransform: 'uppercase' as const }
const body   = { fontFamily: fonts.inter, fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: mgr.ink }
const action = { fontFamily: fonts.inter, fontWeight: 600, fontSize: 14, lineHeight: 1, cursor: 'pointer' }

const COLS = [
  { label: 'ACTIVITY',  w: 340 },
  { label: 'DATE',      w: 160 },
  { label: 'LOCATION',  w: 260 },
  { label: 'STATUS',    w: 140 },
  { label: 'ACTIONS',   w: 180 },
]

export default function ManagerActivities() {
  const [items, setItems] = useState<Activity[]>(INITIAL)

  const publish = (id: number) => setItems((prev) => prev.map((a) => a.id === id ? { ...a, status: 'published' } : a))

  return (
    <ManagerLayout title="Activities & Announcements">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            disableElevation
            sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 14, bgcolor: mgr.accentGreen, borderRadius: '8px', px: '18px', py: '10px', '&:hover': { bgcolor: '#1e4028' }, textTransform: 'none' }}
          >
            + New Activity
          </Button>
        </Box>

        <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: mgr.ink }}>
          All Activities
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: mgr.border, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', bgcolor: '#f6f8f6', px: '20px', py: '14px' }}>
            {COLS.map((c) => (
              <Typography key={c.label} sx={{ ...label, width: c.w, flexShrink: 0 }}>{c.label}</Typography>
            ))}
          </Box>

          {items.map((a) => (
            <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', px: '20px', py: '14px', borderTop: `1px solid ${mgr.border}` }}>
              <Typography sx={{ ...body, width: 340, flexShrink: 0 }}>{a.title}</Typography>
              <Typography sx={{ ...body, width: 160, flexShrink: 0 }}>{a.date}</Typography>
              <Typography sx={{ ...body, width: 260, flexShrink: 0 }}>{a.location}</Typography>
              <Box sx={{ width: 140, flexShrink: 0 }}>
                <StatusBadge
                  label={a.status === 'published' ? 'Published' : a.status === 'draft' ? 'Draft' : 'Ended'}
                  variant={a.status}
                />
              </Box>
              <Box sx={{ width: 180, flexShrink: 0, display: 'flex', gap: '12px' }}>
                <Typography sx={{ ...action, color: mgr.accentGreen }}>Edit</Typography>
                {a.status === 'draft' && (
                  <Typography sx={{ ...action, color: mgr.inkMuted }} onClick={() => publish(a.id)}>Publish</Typography>
                )}
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>
    </ManagerLayout>
  )
}
