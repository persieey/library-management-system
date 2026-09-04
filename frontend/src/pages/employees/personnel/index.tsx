import { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import BackOfficeLayout from '../../../components/BackOfficeLayout'
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined'
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined'
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined'
import StatCard, { StatCardGrid } from '../../../components/StatCard'
import Card from '../../../components/Card'
import { PersonnelProvider, usePersonnel, DEPARTMENTS } from '../../../context/PersonnelContext'
import PersonnelFormDialog from './PersonnelFormDialog'
import PersonnelDeleteDialog from './PersonnelDeleteDialog'
import type { Personnel, PersonnelFormData } from '../../../interface/IPersonnelInterface'
import { fonts, colors, sidebar as sidebarStyle } from '../../../theme'

const HEAD = { fontFamily: fonts.kanit, fontWeight: 600, color: colors.brandGreen, whiteSpace: 'nowrap' as const }
const CELL = { fontFamily: fonts.kanit }

function formatDate(iso: string) {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function PersonnelTable() {
  const { personnel, add, update, remove, toggleStatus } = usePersonnel()

  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('ทั้งหมด')
  const [filterStatus, setFilterStatus] = useState<'ทั้งหมด' | 'active' | 'inactive'>('ทั้งหมด')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Personnel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Personnel | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return personnel.filter((p) => {
      const matchSearch =
        !q ||
        p.staffId.toLowerCase().includes(q) ||
        p.firstName.includes(search) ||
        p.lastName.includes(search) ||
        p.email.toLowerCase().includes(q)
      const matchDept = filterDept === 'ทั้งหมด' || p.department === filterDept
      const matchStatus = filterStatus === 'ทั้งหมด' || p.status === filterStatus
      return matchSearch && matchDept && matchStatus
    })
  }, [personnel, search, filterDept, filterStatus])

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (p: Personnel) => { setEditing(p); setFormOpen(true) }

  const handleSave = (data: PersonnelFormData) => {
    if (editing) update(editing.id, data)
    else add(data)
    setFormOpen(false)
  }

  const handleDelete = () => {
    if (deleteTarget) remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const activeCount = personnel.filter((p) => p.status === 'active').length

  return (
    <>
      {/* การ์ดสรุปจำนวนบุคลากร */}
      <Box sx={{ mb: 3 }}>
        <StatCardGrid>
          <StatCard
            icon={<PeopleAltOutlined />}
            label="บุคลากรทั้งหมด"
            value={personnel.length}
            valueColor={colors.brandGreen}
          />
          <StatCard
            icon={<HowToRegOutlined />}
            label="Active"
            value={activeCount}
            valueColor="#2E7D32"
          />
          <StatCard
            icon={<PersonOffOutlined />}
            label="Inactive"
            value={personnel.length - activeCount}
            valueColor="#757575"
          />
        </StatCardGrid>
      </Box>

      {/* ตารางบุคลากร — หัวการ์ดมีชื่อ คำอธิบาย และปุ่มเพิ่ม */}
      <Card
        title="รายชื่อบุคลากร"
        subtitle={`แสดง ${filtered.length} จาก ${personnel.length} รายการ`}
        actions={
          <Button variant="contained" disableElevation onClick={openAdd}
            sx={{ fontFamily: fonts.kanit, textTransform: 'none', borderRadius: '8px', bgcolor: colors.brandGreen, '&:hover': { bgcolor: '#2E7D32' } }}>
            + เพิ่มบุคลากร
          </Button>
        }
      >
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="ค้นหา ชื่อ / รหัส / อีเมล"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240, '& input': { fontFamily: fonts.kanit } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <span style={{ fontSize: 18 }}>🔍</span>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField select size="small" label="แผนก" value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          sx={{ minWidth: 200, '& .MuiInputBase-input, & label': { fontFamily: fonts.kanit } }}>
          {['ทั้งหมด', ...DEPARTMENTS].map((d) => (
            <MenuItem key={d} value={d} sx={{ fontFamily: fonts.kanit }}>{d}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="สถานะ" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          sx={{ minWidth: 140, '& .MuiInputBase-input, & label': { fontFamily: fonts.kanit } }}>
          {(['ทั้งหมด', 'active', 'inactive'] as const).map((s) => (
            <MenuItem key={s} value={s} sx={{ fontFamily: fonts.kanit }}>{s}</MenuItem>
          ))}
        </TextField>
      </Box>

      <TableContainer sx={{ border: `1px solid ${sidebarStyle.border}`, borderRadius: '10px' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f1f8e9' }}>
              <TableCell sx={HEAD}>รหัส</TableCell>
              <TableCell sx={HEAD}>ชื่อ-นามสกุล</TableCell>
              <TableCell sx={HEAD}>แผนก</TableCell>
              <TableCell sx={HEAD}>ตำแหน่ง</TableCell>
              <TableCell sx={HEAD}>อีเมล</TableCell>
              <TableCell sx={HEAD}>เบอร์โทร</TableCell>
              <TableCell sx={HEAD}>เริ่มงาน</TableCell>
              <TableCell sx={HEAD} align="center">สถานะ</TableCell>
              <TableCell sx={HEAD} align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ fontFamily: fonts.kanit, color: 'text.secondary', py: 4 }}>
                  ไม่พบข้อมูลที่ค้นหา
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ ...CELL, fontWeight: 600, color: colors.brandGreen }}>{p.staffId}</TableCell>
                  <TableCell sx={CELL}>{p.firstName} {p.lastName}</TableCell>
                  <TableCell sx={{ ...CELL, fontSize: 13 }}>{p.department}</TableCell>
                  <TableCell sx={CELL}>{p.position}</TableCell>
                  <TableCell sx={{ ...CELL, fontSize: 13 }}>{p.email}</TableCell>
                  <TableCell sx={CELL}>{p.phone || '-'}</TableCell>
                  <TableCell sx={{ ...CELL, fontSize: 13 }}>{formatDate(p.startDate)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="คลิกเพื่อเปลี่ยนสถานะ">
                      <Chip
                        label={p.status === 'active' ? 'Active' : 'Inactive'}
                        size="small"
                        onClick={() => toggleStatus(p.id)}
                        sx={{
                          fontFamily: fonts.kanit,
                          cursor: 'pointer',
                          bgcolor: p.status === 'active' ? '#e8f5e9' : '#f5f5f5',
                          color: p.status === 'active' ? '#2E7D32' : '#757575',
                          border: `1px solid ${p.status === 'active' ? '#a5d6a7' : '#e0e0e0'}`,
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="แก้ไข">
                      <IconButton size="small" onClick={() => openEdit(p)}>✏️</IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton size="small" onClick={() => setDeleteTarget(p)}>🗑️</IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Card>

      <PersonnelFormDialog open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSave={handleSave} />
      <PersonnelDeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  )
}

export default function PersonnelPage() {
  return (
    <PersonnelProvider>
      <BackOfficeLayout title="บุคลากร">
        <PersonnelTable />
      </BackOfficeLayout>
    </PersonnelProvider>
  )
}
