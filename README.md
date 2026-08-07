# Library Management System

ระบบจัดการห้องสมุด พัฒนาด้วย React (Vite) + Go

---

## ความต้องการของระบบ

- [Go](https://go.dev/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+
- npm

---

## วิธีรันโปรเจกต์

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/persieey/library-management-system.git
cd library-management-system
git checkout B6731878
```

### 2. รัน Backend (Go)

เปิด terminal แรก:

```bash
cd backend
$env:LMS_SEED_PASSWORD="devpass"; go run .
```

Backend จะรันที่ `http://localhost:8080`

### 3. รัน Frontend (React)

เปิด terminal สอง:

```bash
cd frontend
npm install
npm run dev
```

Frontend จะรันที่ `http://localhost:3000`

---

## บัญชีทดสอบ

รหัสผ่านทุกบัญชีคือ `devpass`

| Username | Role | สิทธิ์ |
|---|---|---|
| `student` | User | ผู้ใช้ทั่วไป |
| `librarian` | Librarian | Catalog, Loans, Manage PR |
| `staff` | Staff | Recording Room |
| `manager` | Manager | จัดการบุคลากร |
| `admin` | Admin | ทุกอย่าง |

---

## โครงสร้างโปรเจกต์

```
library-management-system/
├── backend/          # Go backend (REST API, port 8080)
│   ├── models/       # Entity / Model
│   ├── handlers/     # HTTP handlers
│   ├── auth/         # Session & password
│   └── store/        # In-memory data store
└── frontend/         # React + Vite frontend (port 3000)
    └── src/
        ├── pages/
        │   ├── employees/pr/        # ระบบประชาสัมพันธ์
        │   ├── employees/personnel/ # ระบบจัดการบุคลากร
        │   └── manager/             # Manager Portal
        └── components/
```
