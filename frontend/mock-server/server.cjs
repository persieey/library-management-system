// เซิร์ฟเวอร์จำลอง backend สำหรับทดสอบหน้าเว็บด้วยมือ — ไม่ใช่ backend จริง
// ใช้ Node ล้วน ไม่ต้อง npm install ลบทิ้งได้เมื่อ backend Go พร้อมแล้ว
const http = require('http')

const PORT = 8080
// Vite เด้งพอร์ตอัตโนมัติถ้า 3000 ไม่ว่าง จึงอนุญาตไว้หลายพอร์ต
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
])

// username / password: devpass เหมือนกันหมด
const USERS = {
  student: { id: 1, username: 'student', role: 'user', permissions: ['borrow:resources', 'room:book', 'feedback:submit'] },
  librarian: {
    id: 2,
    username: 'librarian',
    role: 'librarian',
    permissions: ['borrow:resources', 'room:book', 'feedback:submit', 'backoffice:access', 'catalog:manage', 'loans:approve', 'pr:manage'],
  },
  staff: {
    id: 3,
    username: 'staff',
    role: 'staff',
    permissions: ['borrow:resources', 'room:book', 'feedback:submit', 'backoffice:access', 'rooms:manage', 'equipment:manage'],
  },
  admin: {
    id: 4,
    username: 'admin',
    role: 'admin',
    permissions: [
      'borrow:resources', 'room:book', 'feedback:submit', 'backoffice:access',
      'catalog:manage', 'loans:approve', 'pr:manage', 'rooms:manage',
      'equipment:manage', 'personnel:manage', 'roles:assign',
    ],
  },
}

const PASSWORD = 'devpass'
const sessions = new Map() // token -> username

function withCors(req, res) {
  const origin = req.headers.origin
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
  })
}

const server = http.createServer(async (req, res) => {
  withCors(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'POST' && req.url === '/api/v1/auth/login') {
    const raw = await readBody(req)
    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      sendJson(res, 400, { success: false, error: { message: 'รูปแบบข้อมูลไม่ถูกต้อง' } })
      return
    }

    const user = USERS[payload.username]
    if (!user || payload.password !== PASSWORD) {
      sendJson(res, 401, { success: false, error: { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' } })
      return
    }

    const token = `mock-${user.username}-${Date.now()}`
    sessions.set(token, user.username)
    sendJson(res, 200, { success: true, data: { token, user } })
    return
  }

  if (req.method === 'GET' && req.url === '/api/v1/users/profile') {
    const auth = req.headers.authorization || ''
    const token = auth.replace('Bearer ', '')
    const username = sessions.get(token)
    if (!username) {
      sendJson(res, 401, { success: false, error: { message: 'ยังไม่ได้เข้าสู่ระบบ' } })
      return
    }
    sendJson(res, 200, { success: true, data: USERS[username] })
    return
  }

  sendJson(res, 404, { success: false, error: { message: 'ไม่พบ endpoint นี้ใน mock server' } })
})

server.listen(PORT, () => {
  console.log(`Mock backend รันอยู่ที่ http://localhost:${PORT}`)
  console.log('บัญชีทดสอบ: student / librarian / staff / admin — รหัสผ่านทุกบัญชีคือ devpass')
})
