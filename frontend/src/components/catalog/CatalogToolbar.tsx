import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import { CATALOG_SORTS, type CatalogSort } from '../../hooks/useCatalogFilter'
import { colors, fonts } from '../../theme'

interface CatalogToolbarProps {
  categories: string[]
  category: string
  onCategoryChange: (value: string) => void
  sort: CatalogSort
  onSortChange: (value: CatalogSort) => void
  shown: number
  total: number
  isFiltered: boolean
  onReset: () => void
}

// แถบกรองใต้ hero — ชิปหมวดหมู่ทางซ้าย ตัวเรียงลำดับทางขวา
// หมวดหมู่มาจากข้อมูลจริงที่โหลดมา ไม่ได้ hard-code ไว้
function CatalogToolbar({
  categories,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  shown,
  total,
  isFiltered,
  onReset,
}: CatalogToolbarProps) {
  const chipSx = (active: boolean) => ({
    fontFamily: fonts.thai,
    fontSize: 13,
    fontWeight: 600,
    borderRadius: '999px',
    height: 32,
    cursor: 'pointer',
    bgcolor: active ? colors.brandGreen : colors.cream50,
    color: active ? 'white' : colors.brown700,
    border: `1px solid ${active ? colors.brandGreen : colors.borderSubtle}`,
    transition: 'background-color 200ms, color 200ms',
    '&:hover': { bgcolor: active ? colors.brandGreen : colors.accentGreenLight },
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Chip label="ทั้งหมด" onClick={() => onCategoryChange('')} sx={chipSx(category === '')} />
          {categories.map((name) => (
            <Chip
              key={name}
              label={name}
              onClick={() => onCategoryChange(name)}
              sx={chipSx(category === name)}
            />
          ))}
        </Box>

        <Select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as CatalogSort)}
          size="small"
          aria-label="เรียงลำดับ"
          sx={{
            minWidth: 160,
            borderRadius: '10px',
            fontFamily: fonts.thai,
            fontSize: 14,
            color: colors.brown900,
            bgcolor: 'white',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderSubtle },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.brown500 },
          }}
        >
          {CATALOG_SORTS.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{ fontFamily: fonts.thai, fontSize: 14 }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: colors.inkMuted }}>
          {isFiltered ? `พบ ${shown} รายการ จากทั้งหมด ${total}` : `ทั้งหมด ${total} รายการ`}
        </Typography>
        {isFiltered && (
          <Button
            onClick={onReset}
            size="small"
            sx={{
              fontFamily: fonts.thai,
              fontSize: 13,
              fontWeight: 600,
              color: colors.terracotta600,
              textTransform: 'none',
              minWidth: 0,
              p: 0,
              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
            }}
          >
            ล้างตัวกรอง
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default CatalogToolbar
