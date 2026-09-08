import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import Card from '../../components/Card'
import { navIcon } from '../../components/navIcons'
import { useAuth } from '../../auth/useAuth'
import { backOfficeMenuFor, POSITION_LABELS } from '../../config/roles'
import { fonts, sidebar as s } from '../../theme'

function EmployeesHome() {
  const { user, allows } = useAuth()

  // จัดกลุ่มเป็นหมวดตามเมนูใน sidebar แทนการแผ่เป็นการ์ดยาวเรียงเดียว จะได้ไม่ต้องไล่หาทีละใบ
  // รายการเดี่ยวที่ไม่มีเมนูย่อยรวมอยู่ในหมวด "งานทั่วไป"
  const menu = backOfficeMenuFor(allows)
  const sections = [
    ...menu.filter((item) => item.children?.length).map((item) => ({ label: item.label, tasks: item.children! })),
    ...(menu.some((item) => !item.children?.length)
      ? [{ label: 'งานทั่วไป', tasks: menu.filter((item) => !item.children?.length) }]
      : []),
  ]

  return (
    <BackOfficeLayout title="หน้ารวมระบบ">
      <Card
        title={`สวัสดี ${user?.name ?? ''}`}
        subtitle={`เข้าใช้งานด้วยสิทธิ์${user ? POSITION_LABELS[user.position] : ''} — เมนูด้านซ้ายและการ์ดข้างล่างแสดงเฉพาะงานที่คุณเข้าถึงได้`}
      >
        {sections.length === 0 ? (
          <Typography sx={{ fontFamily: fonts.thai, fontSize: 14, color: s.item }}>
            ยังไม่มีระบบที่สิทธิ์ของคุณเข้าถึงได้
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {sections.map((section) => (
              <Box key={section.label}>
                <Typography
                  sx={{
                    fontFamily: fonts.kanit,
                    fontWeight: 600,
                    fontSize: 14,
                    color: s.item,
                    mb: '12px',
                  }}
                >
                  {section.label}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {section.tasks.map((task) => (
                    <Box
                      key={task.to}
                      component={Link}
                      to={task.to ?? '/employees'}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        px: '18px',
                        py: '18px',
                        borderRadius: '10px',
                        border: `1px solid ${s.border}`,
                        textDecoration: 'none',
                        color: s.item,
                        transition: 'border-color 180ms, box-shadow 180ms, color 180ms',
                        '&:hover': {
                          color: s.itemHoverInk,
                          borderColor: s.itemHoverInk,
                          boxShadow: '0 6px 18px rgba(18, 55, 47, 0.10)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', flexShrink: 0, '& svg': { fontSize: 22 } }}>
                        {navIcon(task.icon)}
                      </Box>
                      <Typography
                        sx={{ fontFamily: fonts.kanit, fontWeight: 600, fontSize: 15, lineHeight: 1.4, color: 'inherit' }}
                      >
                        {task.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    </BackOfficeLayout>
  )
}

export default EmployeesHome
