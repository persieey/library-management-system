import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { fonts, colors } from '../../theme'

// ข้อมูลตัวอย่าง — ยังไม่ได้ต่อ backend จริง
const staff = [
  { id: 1, firstName: 'สมชาย', lastName: 'ใจดี', position: 'บรรณารักษ์', email: 'somchai@lib.ac.th', phone: '081-234-5678' },
  { id: 2, firstName: 'สมหญิง', lastName: 'รักเรียน', position: 'เจ้าหน้าที่', email: 'somying@lib.ac.th', phone: '082-345-6789' },
]

const HEAD_CELL_SX = { fontFamily: fonts.kanit, fontWeight: 600, color: colors.brandGreen }
const BODY_CELL_SX = { fontFamily: fonts.kanit }

function Personnel() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white', px: { xs: 3, md: 6 }, py: 5 }}>
      <Typography sx={{ fontFamily: fonts.kanit, fontSize: 32, fontWeight: 600, color: colors.brandGreen, mb: 3 }}>
        จัดการบุคลากร
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={HEAD_CELL_SX}>ลำดับ</TableCell>
              <TableCell sx={HEAD_CELL_SX}>ชื่อ</TableCell>
              <TableCell sx={HEAD_CELL_SX}>นามสกุล</TableCell>
              <TableCell sx={HEAD_CELL_SX}>ตำแหน่ง</TableCell>
              <TableCell sx={HEAD_CELL_SX}>อีเมล</TableCell>
              <TableCell sx={HEAD_CELL_SX}>เบอร์โทร</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((person) => (
              <TableRow key={person.id}>
                <TableCell sx={BODY_CELL_SX}>{person.id}</TableCell>
                <TableCell sx={BODY_CELL_SX}>{person.firstName}</TableCell>
                <TableCell sx={BODY_CELL_SX}>{person.lastName}</TableCell>
                <TableCell sx={BODY_CELL_SX}>{person.position}</TableCell>
                <TableCell sx={BODY_CELL_SX}>{person.email}</TableCell>
                <TableCell sx={BODY_CELL_SX}>{person.phone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default Personnel
