import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { fonts } from '../theme'

type Variant = 'pending' | 'approved' | 'rejected' | 'inprogress' | 'draft' | 'published' | 'available' | 'borrowed' | 'resolved' | 'open' | 'ended'

const STYLES: Record<Variant, { bg: string; color: string }> = {
  pending:    { bg: '#fef3c7', color: '#b45309' },
  open:       { bg: '#fef3c7', color: '#b45309' },
  approved:   { bg: '#dcfce7', color: '#15803d' },
  published:  { bg: '#dcfce7', color: '#15803d' },
  available:  { bg: '#dcfce7', color: '#15803d' },
  resolved:   { bg: '#dcfce7', color: '#15803d' },
  rejected:   { bg: '#fee2e2', color: '#b91c1c' },
  borrowed:   { bg: '#fee2e2', color: '#b91c1c' },
  inprogress: { bg: '#e4ece1', color: '#2f5d3a' },
  draft:      { bg: '#f1f3f1', color: '#4b5563' },
  ended:      { bg: '#f1f3f1', color: '#4b5563' },
}

interface Props {
  label: string
  variant: Variant
}

export default function StatusBadge({ label, variant }: Props) {
  const s = STYLES[variant]
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: '10px', py: '4px', borderRadius: '20px', bgcolor: s.bg }}>
      <Typography sx={{ fontFamily: fonts.inter, fontWeight: 600, fontSize: 12, lineHeight: 1, color: s.color, whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
    </Box>
  )
}
