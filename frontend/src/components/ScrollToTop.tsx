import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router ไม่รีเซ็ตตำแหน่ง scroll ให้เองตอนเปลี่ยนหน้า (ต่างจากการโหลดหน้าใหม่ทั้งหน้า)
// กดลิงก์ (เช่น "View All") จากจุดที่เลื่อนลงมาล่างสุดของหน้าเดิม หน้าใหม่เลยเริ่มที่
// ตำแหน่งเดิมนั้นแทนที่จะเริ่มบนสุด — คอมโพเนนต์นี้เลื่อนกลับขึ้นบนสุดทุกครั้งที่ path
// เปลี่ยน ไม่ render อะไรเลย แค่แฝงตัวอยู่ใต้ BrowserRouter
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
