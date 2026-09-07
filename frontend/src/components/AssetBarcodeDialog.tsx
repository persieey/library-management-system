import { useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Barcode from 'react-barcode'
import { colors, fonts } from '../theme'

export interface AssetBarcodeTarget {
  code: string
  name: string
  location?: string
}

interface Props {
  asset: AssetBarcodeTarget | null
  onClose: () => void
}

export default function AssetBarcodeDialog({ asset, onClose }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!asset) return
    const img = boxRef.current?.querySelector('img') as HTMLImageElement | undefined
    const src = img?.src ?? ''
    const w = window.open('', '_blank', 'width=420,height=520')
    if (!w) return
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${asset.code}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:'Kanit','Noto Sans Thai',sans-serif}
        body{display:flex;align-items:center;justify-content:center;min-height:100vh}
        .label{border:1px solid #000;border-radius:8px;padding:16px 20px;text-align:center;width:300px}
        .label img{width:260px}
        .name{font-size:13px;margin-top:6px}
        .loc{font-size:12px;color:#555;margin-top:2px}
        .org{font-size:11px;color:#777;margin-top:8px;border-top:1px dashed #999;padding-top:6px}
        @media print{@page{margin:8mm}}
      </style></head>
      <body onload="window.print();setTimeout(function(){window.close()},300)">
        <div class="label">
          <img src="${src}" alt="${asset.code}"/>
          <div class="name">${asset.name ?? ''}</div>
          <div class="loc">${asset.location ?? ''}</div>
          <div class="org">Udompanya University Library</div>
        </div>
      </body></html>`)
    w.document.close()
  }

  return (
    <Dialog open={Boolean(asset)} onClose={onClose} sx={{ '& .MuiPaper-root': { borderRadius: '14px' } }}>
      <DialogTitle sx={{ fontFamily: fonts.kanit, fontSize: 18, color: colors.brandGreen }}>
        บาร์โค้ดสินทรัพย์
      </DialogTitle>
      <DialogContent>
        {asset && (
          <Box
            ref={boxRef}
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              border: '1px solid #e2e7e2', borderRadius: '12px', p: '24px', minWidth: 300, bgcolor: 'white',
            }}
          >
            <Barcode value={asset.code} format="CODE128" renderer="img" width={2} height={70} fontSize={14} margin={8} />
            <Typography sx={{ fontFamily: fonts.kanit, fontSize: 13, color: colors.ink, textAlign: 'center' }}>
              {asset.name}
            </Typography>
            {asset.location && (
              <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: colors.inkMuted }}>
                {asset.location}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: '24px', pb: '16px', gap: '8px' }}>
        <Button onClick={onClose} sx={{ fontFamily: fonts.kanit, color: colors.inkMuted }}>ปิด</Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          sx={{ fontFamily: fonts.kanit, bgcolor: colors.brandGreen, '&:hover': { bgcolor: '#0d2720' } }}
        >
          พิมพ์ label
        </Button>
      </DialogActions>
    </Dialog>
  )
}
