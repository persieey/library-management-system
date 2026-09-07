import type { ReactNode } from 'react'
import GridViewOutlined from '@mui/icons-material/GridViewOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined'
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined'
import CampaignOutlined from '@mui/icons-material/CampaignOutlined'
import ForumOutlined from '@mui/icons-material/ForumOutlined'
import InsertChartOutlined from '@mui/icons-material/InsertChartOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import MicNoneOutlined from '@mui/icons-material/MicNoneOutlined'
import DevicesOutlined from '@mui/icons-material/DevicesOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined'
import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined'
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined'
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined'

/**
 * ไอคอนของเมนู — ใช้ชุด @mui/icons-material ที่โปรเจคมีอยู่แล้ว ไม่ต้องลงอะไรเพิ่ม
 *
 * เก็บเป็น "คีย์" แทนที่จะเป็น JSX เพราะรายการเมนูบางชุดอยู่ในไฟล์ .ts (เช่น config/roles.ts)
 * ซึ่งเขียน JSX ไม่ได้ ที่นี่จึงเป็นตัวแปลคีย์เป็นไอคอนจริง
 *
 *   { icon: 'personnel', label: 'บุคลากร', to: '/manager/personnel' }
 *   <Sidebar items={items.map(i => ({ ...i, icon: navIcon(i.icon) }))} />
 *
 * เพิ่มไอคอนใหม่: import ที่หัวไฟล์แล้วเติมใน ICONS ข้างล่าง
 */

const SIZE = { fontSize: 20 } as const

const ICONS: Record<string, ReactNode> = {
  overview: <GridViewOutlined sx={SIZE} />,
  schedules: <CalendarMonthOutlined sx={SIZE} />,
  leave: <EventNoteOutlined sx={SIZE} />,
  personnel: <PeopleAltOutlined sx={SIZE} />,
  books: <MenuBookOutlined sx={SIZE} />,
  activities: <CampaignOutlined sx={SIZE} />,
  complaints: <ForumOutlined sx={SIZE} />,
  reports: <InsertChartOutlined sx={SIZE} />,
  logout: <LogoutOutlined sx={SIZE} />,
  home: <HomeOutlined sx={SIZE} />,
  recordingRoom: <MicNoneOutlined sx={SIZE} />,
  roomBooking: <MeetingRoomOutlined sx={SIZE} />,
  equipment: <DevicesOutlined sx={SIZE} />,
  repair: <BuildOutlined sx={SIZE} />,
  repairTrack: <FactCheckOutlined sx={SIZE} />,
  catalog: <AutoStoriesOutlined sx={SIZE} />,
  loans: <SwapHorizOutlined sx={SIZE} />,
}

/** แปลงคีย์เป็นไอคอน คีย์ที่ไม่รู้จักจะคืน undefined แล้วเมนูจะแสดงแบบไม่มีไอคอน */
export function navIcon(key?: string): ReactNode {
  return key ? ICONS[key] : undefined
}
