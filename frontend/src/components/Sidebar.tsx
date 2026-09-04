import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { fonts, sidebar as s } from '../theme'

/**
 * แถบเมนูด้านข้างที่ใช้ร่วมกันทุกระบบ
 *
 * เวลาทำระบบใหม่ ไม่ต้องเขียนสไตล์ใหม่ แค่ประกาศรายการเมนูแล้วส่งเข้ามา
 * หน้าตาจะเหมือนกันทุกระบบโดยอัตโนมัติ อยากเปลี่ยนธีมทั้งแอปแก้ที่ `sidebar` ใน theme.ts
 *
 * แบบที่ 1 — เมนูเปลี่ยนหน้า (ใส่ `to`) ตัวคอมโพเนนต์ดูจาก URL ให้เองว่าอันไหนถูกเลือก
 *
 *   const NAV: SidebarItem[] = [
 *     { id: 'overview', icon: '🏠', label: 'ภาพรวม', to: '/manager' },
 *     { id: 'leave',    icon: '📝', label: 'การลา', to: '/manager/leave' },
 *   ]
 *
 *   <Sidebar items={NAV} />
 *
 * แบบที่ 2 — เมนูสลับเนื้อหาในหน้าเดียว (ไม่ใส่ `to` แต่คุมด้วย state)
 *
 *   const [tab, setTab] = useState('inbox')
 *   <Sidebar items={TABS} activeId={tab} onSelect={setTab} />
 *
 * เมนูที่มี `children` จะกลายเป็นกลุ่มที่กางได้ และกางเองเมื่อเมนูย่อยข้างในถูกเลือกอยู่
 * ใส่ `badge` เพื่อโชว์ตัวเลขคาเมนู และใส่ `bottomItems` สำหรับปุ่มที่ต้องอยู่ล่างสุด เช่น ออกจากระบบ
 */

export interface SidebarItem {
  /** ใช้อ้างอิงเมนูนี้ ต้องไม่ซ้ำกับตัวอื่น */
  id: string
  label: string
  /** ใส่ได้ทั้ง emoji และ <svg> ไม่ใส่ก็ได้ */
  icon?: ReactNode
  /** ใส่เมื่อเมนูนี้พาไปอีกหน้า ถ้าไม่ใส่จะกลายเป็นปุ่มธรรมดา */
  to?: string
  /** สั่งงานตอนถูกคลิก ใช้กับเมนูที่ไม่ได้เปลี่ยนหน้า เช่น ออกจากระบบ */
  onClick?: () => void
  /** ตัวเลขคาเมนู เช่น จำนวนเรื่องที่ยังไม่อ่าน — เป็น 0 หรือไม่ใส่ = ไม่โชว์ */
  badge?: number
  /** เมนูย่อย — ใส่แล้วแถวนี้จะกลายเป็นกลุ่มที่กดกางได้ */
  children?: SidebarItem[]
}

interface SidebarProps {
  items: SidebarItem[]
  /** ปุ่มที่ดันไปอยู่ล่างสุดของแถบ */
  bottomItems?: SidebarItem[]
  /** ระบุเองว่าเมนูไหนถูกเลือก ถ้าไม่ส่งมาจะดูจาก URL ให้ */
  activeId?: string
  onSelect?: (id: string) => void
  width?: number
}

// หาเมนูที่ตรงกับ URL มากที่สุด รวมเมนูย่อยด้วย
// เทียบความยาวเพื่อให้ /manager กับ /manager/leave อยู่ด้วยกันได้โดยไม่สว่างพร้อมกัน
function activeFromPath(items: SidebarItem[], pathname: string): string | undefined {
  let bestId: string | undefined
  let bestLength = -1

  const walk = (list: SidebarItem[]) => {
    for (const item of list) {
      if (item.to && (pathname === item.to || pathname.startsWith(`${item.to}/`))) {
        if (item.to.length > bestLength) {
          bestLength = item.to.length
          bestId = item.id
        }
      }
      if (item.children) walk(item.children)
    }
  }

  walk(items)
  return bestId
}

function rowSx(active: boolean, indented = false) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    width: '100%',
    pl: indented ? '38px' : '19px',
    pr: '19px',
    py: '16px',
    border: 'none',
    borderRadius: '8px',
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 200ms, color 200ms, box-shadow 200ms',
    bgcolor: active ? s.activeBg : 'transparent',
    boxShadow: active ? s.activeShadow : 'none',
    color: active ? s.activeInk : s.item,
    '&:hover': active ? {} : { bgcolor: s.itemHoverBg, color: s.itemHoverInk },
  } as const
}

function RowContent({ item, trailing }: { item: SidebarItem; trailing?: ReactNode }) {
  return (
    <>
      {item.icon !== undefined && (
        <Box component="span" sx={{ fontSize: 17, lineHeight: 1, display: 'flex', flexShrink: 0 }}>
          {item.icon}
        </Box>
      )}
      <Typography
        sx={{
          fontFamily: fonts.thai,
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1,
          color: 'inherit',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {item.label}
      </Typography>
      {item.badge !== undefined && item.badge > 0 && (
        <Box
          component="span"
          sx={{
            flexShrink: 0,
            minWidth: 20,
            px: '6px',
            py: '2px',
            borderRadius: '999px',
            bgcolor: 'currentColor',
            fontFamily: fonts.inter,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.4,
            textAlign: 'center',
            // ตัวเลขใช้สีพื้นหลังของแถว ป้ายจึงอ่านออกทั้งตอนเลือกและไม่ได้เลือก
            color: s.surface,
          }}
        >
          {item.badge}
        </Box>
      )}
      {trailing}
    </>
  )
}

function SidebarRow({
  item,
  active,
  indented,
  onSelect,
}: {
  item: SidebarItem
  active: boolean
  indented?: boolean
  onSelect?: (id: string) => void
}) {
  // เมนูที่มี to เป็นลิงก์จริง กดค้างเปิดแท็บใหม่ได้
  if (item.to) {
    return (
      <Box component={Link} to={item.to} sx={rowSx(active, indented)}>
        <RowContent item={item} />
      </Box>
    )
  }

  // ที่เหลือเป็น <button> จริง ไม่ใช่ div เพื่อให้กด Tab แล้ว Enter ได้
  return (
    <Box
      component="button"
      type="button"
      onClick={() => {
        item.onClick?.()
        onSelect?.(item.id)
      }}
      sx={rowSx(active, indented)}
    >
      <RowContent item={item} />
    </Box>
  )
}

// กลุ่มเมนูที่กดกางได้ กางเองตั้งแต่แรกถ้าเมนูย่อยข้างในกำลังถูกเลือก
function SidebarGroup({
  item,
  activeId,
  onSelect,
}: {
  item: SidebarItem
  activeId?: string
  onSelect?: (id: string) => void
}) {
  const children = item.children ?? []
  const hasActiveChild = children.some((child) => child.id === activeId)
  const [open, setOpen] = useState(hasActiveChild)

  // เปลี่ยนหน้าไปยังเมนูย่อยของกลุ่มนี้จากที่อื่น กลุ่มต้องกางตาม
  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        sx={rowSx(false)}
      >
        <RowContent
          item={item}
          trailing={
            <KeyboardArrowDownIcon
              sx={{
                fontSize: '18px !important',
                flexShrink: 0,
                transition: 'transform 200ms',
                transform: open ? 'rotate(180deg)' : 'none',
              }}
            />
          }
        />
      </Box>
      {open &&
        children.map((child) => (
          <SidebarRow
            key={child.id}
            item={child}
            active={child.id === activeId}
            indented
            onSelect={onSelect}
          />
        ))}
    </>
  )
}

export default function Sidebar({
  items,
  bottomItems = [],
  activeId,
  onSelect,
  width = s.width,
}: SidebarProps) {
  const { pathname } = useLocation()
  const resolvedActive = activeId ?? activeFromPath(items, pathname)

  const render = (item: SidebarItem) =>
    item.children?.length ? (
      <SidebarGroup key={item.id} item={item} activeId={resolvedActive} onSelect={onSelect} />
    ) : (
      <SidebarRow
        key={item.id}
        item={item}
        active={item.id === resolvedActive}
        onSelect={onSelect}
      />
    )

  return (
    <Box
      component="nav"
      sx={{
        width,
        flexShrink: 0,
        bgcolor: s.surface,
        borderRight: `1px solid ${s.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        px: '16px',
        py: '24px',
      }}
    >
      {items.map(render)}

      {bottomItems.length > 0 && (
        <>
          <Box sx={{ flex: 1 }} />
          {bottomItems.map(render)}
        </>
      )}
    </Box>
  )
}
