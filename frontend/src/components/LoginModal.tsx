import { useEffect, useRef, useState } from 'react'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../services/https'
import { fonts } from '../theme'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

// การ์ดล็อกอินตาม Figma (log in 55:248) ขนาด 400x450
// ไม่มีปุ่ม Employees — สิทธิ์มาจาก role ของบัญชีที่ล็อกอิน ไม่ใช่ปุ่มแยก
function LoginModal({ open, onClose }: LoginModalProps) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => usernameRef.current?.focus(), 50)
    else {
      setUsername('')
      setPassword('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await login({ username: username.trim(), password })
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'white',
          borderRadius: '50px',
          px: '57px',
          pt: '50px',
          pb: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 700, fontSize: 24, color: 'black' }}>
          Welcome to library
        </Typography>
        <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 200, fontSize: 12, color: 'rgba(0,0,0,0.8)', mt: 1 }}>
          Enter your username to log in your account
        </Typography>

        <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 300, fontSize: 12, mt: '27px' }}>
          Username
        </Typography>
        <TextField
          inputRef={usernameRef}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          size="small"
          sx={{ mt: '9px', '& .MuiOutlinedInput-root': { height: 35, borderRadius: '5px' } }}
        />

        <Typography sx={{ fontFamily: fonts.kanit, fontWeight: 300, fontSize: 12, mt: '23px' }}>
          Password
        </Typography>
        <TextField
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          size="small"
          sx={{ mt: '9px', '& .MuiOutlinedInput-root': { height: 35, borderRadius: '5px' } }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '11px' }}>
          <Link
            href="/forgot-password"
            underline="always"
            sx={{ fontFamily: fonts.kanit, fontWeight: 700, fontSize: 12, color: 'black' }}
          >
            Forgot password
          </Link>
        </Box>

        {error && (
          <Typography sx={{ fontFamily: fonts.kanit, fontSize: 12, color: 'error.main', mt: '10px' }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          disabled={submitting}
          fullWidth
          sx={{
            mt: '26px',
            height: 40,
            width: 295,
            mx: 'auto',
            display: 'block',
            bgcolor: 'black',
            color: 'white',
            borderRadius: '50px',
            fontFamily: fonts.kanit,
            fontSize: 14,
            '&:hover': { bgcolor: '#222' },
          }}
        >
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'Log in'}
        </Button>
      </Box>
    </Modal>
  )
}

export default LoginModal
