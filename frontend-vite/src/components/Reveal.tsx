import { useEffect, useRef, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'

interface RevealProps {
  children: ReactNode
  delay?: number
}

// ค่อยๆ จางเข้ามาตอนเลื่อนถึง — เล่นครั้งเดียวแล้วเลิกเฝ้า
function Reveal({ children, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Box
      ref={ref}
      sx={{
        height: '100%',
        width: '100%',
        transition: 'opacity 700ms ease-out, transform 700ms ease-out',
        transitionDelay: `${delay}ms`,
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      {children}
    </Box>
  )
}

export default Reveal
