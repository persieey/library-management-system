# T09 Backend — ระบบห้องสมุด

Backend ของโปรเจกต์ เขียนด้วย **Go + Gin + GORM + PostgreSQL (Docker) + JWT + bcrypt** ตามที่วิชากำหนด

โครงนี้เป็น **ฐานกลางของทีม** — มีระบบ login, JWT, และการแยกสิทธิ์ตามตำแหน่งพร้อมแล้ว
แต่ละคนเอาไปเขียนฟีเจอร์ของตัวเองต่อได้เลย ไม่ต้องเริ่มใหม่

---

## เริ่มใช้งาน (ทำครั้งแรกครั้งเดียว)

**ต้องมีในเครื่องก่อน:** Go, Docker Desktop, Git

```bash
git clone https://github.com/SA-1-69/T09.git
cd T09
```

### 1. สร้างไฟล์ `.env`

ก๊อป `backend/.env.example` แล้วเปลี่ยนชื่อเป็น `backend/.env` จากนั้นเติมค่าให้ครบ:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=t09
DB_PASSWORD=123456789
DB_NAME=t09db

JWT_SECRET=t09_888
JWT_EXPIRES_IN=24h
SERVER_PORT=8080

SEED_ADMIN_EMAIL=admin@t09.local
SEED_ADMIN_PASSWORD=admin1234
SEED_ADMIN_NAME=System Admin
```

ค่าเหล่านี้ต้องตรงกับ `compose.yml` ไม่งั้นต่อ database ไม่ติด

> `.env` อยู่ใน `.gitignore` แล้ว **ห้ามเอาขึ้น Git** ถ้าเพิ่มตัวแปรใหม่ ให้เพิ่มชื่อตัวแปร (ไม่ใส่ค่า) ใน `.env.example` ด้วย เพื่อนคนอื่นจะได้รู้

### 2. รัน database — จากโฟลเดอร์ `T09`

```bash
docker compose up -d
docker ps
```

ต้องเห็น 2 container: `t09db-postgres` และ `t09-pgadmin-1`

> ⚠️ **ต้องรัน `docker compose` จาก `T09` เท่านั้น** Docker ใช้ชื่อโฟลเดอร์เป็นชื่อโปรเจกต์ ถ้ารันจากที่อื่นมันจะสร้าง database ใหม่แยกอีกชุด แล้วข้อมูลเดิมจะเหมือนหายไป

### 3. รัน server — จากโฟลเดอร์ `T09/backend`

```bash
cd backend
go mod tidy
go run ./cmd/server
```

> ⚠️ **ต้องรัน `go run` จาก `backend` เท่านั้น** เพราะโปรแกรมมองหา `.env` ในโฟลเดอร์ที่รันคำสั่ง
> ถ้า `cd` เข้าไปใน `cmd/server` แล้วรัน `go run .` จะขึ้น `โหลด config ไม่ได้`

ตารางใน database จะถูกสร้างอัตโนมัติด้วย GORM AutoMigrate ไม่ต้องรัน SQL เอง

### 4. ทดสอบ

```bash
curl http://localhost:8080/health
```
### 5. บัญชีตั้งต้น

ระบบจะสร้างบัญชี manager ให้อัตโนมัติตอนรันครั้งแรก ใช้ค่าจาก SEED_ADMIN_* ใน .env
```
email: admin@t09.local
password: admin1234
```
ถ้ามี manager อยู่แล้วจะไม่สร้างซ้ำ — ลบตารางแล้วรันใหม่ก็ได้บัญชีนี้กลับมาเสมอ
---

## โครงสร้างผู้ใช้

```
              users
    (ทุกคนในระบบอยู่ที่นี่หมด)
    user_id, name, phone, email,
    password (แฮชด้วย bcrypt), status
              │
      ┌───────┴───────┐
      ▼               ▼
  employees        members
  position         university_id
  (manager /       member_type
   librarian)      borrow_limit
```

**1 คน = 1 แถวใน `users` เสมอ** แล้วมีอีกแถวใน `employees` หรือ `members` ตามบทบาท

คนหนึ่งเป็นทั้ง employee และ member ได้ (เช่นบรรณารักษ์ที่ยืมหนังสือด้วย) แต่เป็นอย่างละไม่เกิน 1 ครั้ง

---

## ระบบสิทธิ์

ตอน login ระบบจะหาว่าคนนั้นเป็นใคร แล้วใส่ `role` กับ `position` ลงใน JWT token

| role | position | ความหมาย |
|---|---|---|
| `employee` | `manager` | ดูแลระบบทั้งหมด |
| `employee` | `librarian` | จัดการหนังสือ/ebook, เพิ่มสมาชิก |
| `member` | (ว่าง) | ผู้ใช้บริการทั่วไป |
| `none` | (ว่าง) | มีบัญชีแต่ยังไม่ได้กำหนดบทบาท |

### วิธีใช้ในฟีเจอร์ของคุณ

```go
books := api.Group("/books")
books.Use(middleware.JWTAuthMiddleware(jwtProvider))    // ต้องมาก่อนเสมอ

// ใครล็อกอินแล้วก็ดูได้
books.GET("", bookController.GetAll)

// เฉพาะ librarian กับ manager ถึงจะแก้ข้อมูลได้
books.POST("", middleware.RequirePosition("librarian", "manager"), bookController.Create)
books.PUT("/:id", middleware.RequirePosition("librarian", "manager"), bookController.Update)
books.DELETE("/:id", middleware.RequirePosition("manager"), bookController.Delete)
```

**กฎสำคัญ:** `RequirePosition` ต้องอยู่**หลัง** `JWTAuthMiddleware` เสมอ เพราะมันอ่านค่า `role`/`position` ที่ JWT middleware ใส่ไว้ ถ้าสลับลำดับจะหาค่าไม่เจอ

`RequireEmployee()` ก็มีให้ใช้ ถ้าแค่อยากกันว่าต้องเป็นพนักงาน ไม่เจาะจงตำแหน่ง

### รู้ได้ยังไงว่าใครกำลังเรียก API

```go
userID, _ := c.Get("user_id")
role, _ := c.Get("role")
position, _ := c.Get("position")
```

> 🔒 **ห้ามรับ `user_id` จาก request body เด็ดขาด** ต้องเอาจาก `c.Get("user_id")` เท่านั้น
> ไม่งั้นใครก็ส่ง `user_id` ของคนอื่นมาปลอมตัวได้

> 🔒 **ห้ามพึ่ง frontend ในการกันสิทธิ์** การซ่อนปุ่มไม่ใช่การป้องกัน ต้องเช็คที่ฝั่ง server เสมอ

---

## API ที่มีแล้ว

| Method | Path | ใครเรียกได้ | ทำอะไร |
|---|---|---|---|
| GET | `/health` | ทุกคน | เช็คว่า server ทำงาน |
| POST | `/api/v1/auth/register` | ทุกคน | สมัครบัญชี (ยังไม่มีบทบาท) |
| POST | `/api/v1/auth/login` | ทุกคน | เข้าสู่ระบบ คืน JWT token |
| GET | `/api/v1/users/profile` | ล็อกอินแล้ว | ดูโปรไฟล์ตัวเอง |
| POST | `/api/v1/users/members` | manager, librarian | สร้างบัญชีสมาชิก |
| POST | `/api/v1/users/employees` | **manager เท่านั้น** | สร้างบัญชีพนักงาน |

### ตัวอย่างการเรียก

**เข้าสู่ระบบ** — คืน `token`, `role`, `position`

```bash
curl -X POST http://localhost:8080/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@t09.local\",\"password\":\"admin123\"}"
```

```json
{
  "message": "เข้าสู่ระบบสำเร็จ",
  "token": "eyJhbGci...", //<==นำไปใส่ใน token หลังคำว่า "Authorization: Bearer 
  "role": "employee",
  "position": "manager",
  "user": { "user_id": 1, "name": "admin" }
}
```

**สร้างสมาชิก** (ต้องเป็น manager หรือ librarian)

```bash
curl -X POST http://localhost:8080/api/v1/users/members ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <token>" ^
  -d "{\"name\":\"student1\",\"email\":\"s1@test.com\",\"phone\":\"0899999999\",\"password\":\"123456\",\"university_id\":\"B6712345\",\"borrow_limit\":5}"
```

**สร้างพนักงาน** (ต้องเป็น manager)

`position` รับได้แค่ `manager` หรือ `librarian` เท่านั้น ส่งค่าอื่นจะถูกปฏิเสธ

```bash
curl -X POST http://localhost:8080/api/v1/users/employees ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <token>" ^
  -d "{\"name\":\"lib1\",\"email\":\"lib1@test.com\",\"phone\":\"0888888888\",\"password\":\"123456\",\"position\":\"librarian\"}"
```

### เรียกจาก React

```js
// login แล้วเก็บ token
const res = await fetch("http://localhost:8080/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
localStorage.setItem("token", data.token);

// เรียก API ที่ต้อง login
const token = localStorage.getItem("token");
await fetch("http://localhost:8080/api/v1/users/profile", {
  headers: { "Authorization": `Bearer ${token}` }
});
```

CORS เปิดไว้แล้ว เรียกจาก React ได้เลยไม่ต้องตั้งค่าเพิ่ม

---

## โครงสร้างโฟลเดอร์ — ไฟล์ใหม่วางตรงไหน

```
T09/
├── compose.yml               Docker (รัน docker compose จากที่นี่)
├── .gitignore
└── backend/
    ├── cmd/server/main.go    ประกอบทุกอย่างเข้าด้วยกัน
    ├── internal/
    │   ├── config/           อ่าน .env + ต่อ database + AutoMigrate
    │   ├── models/           struct ที่กลายเป็นตารางใน database
    │   ├── dto/              struct สำหรับรับ/ส่ง JSON กับ frontend
    │   ├── controllers/      ตรรกะการทำงานของแต่ละฟีเจอร์
    │   ├── middleware/       CORS, ตรวจ JWT, เช็คสิทธิ์
    │   ├── routes/routes.go  ลงทะเบียน endpoint ทั้งหมด
    │   └── utils/            bcrypt, JWT
    └── .env                  (ไม่อยู่ใน Git — สร้างเอง)
```

### เขียนฟีเจอร์ใหม่ ทำ 5 ขั้นนี้

1. `models/<ชื่อ>.go` — struct ของตาราง
2. เพิ่ม model ใหม่ใน `AutoMigrate` ที่ `config/database.go`
3. `dto/<ชื่อ>_dto.go` — struct รับข้อมูลจาก frontend
4. `controllers/<ชื่อ>_controller.go` — ตรรกะ
5. เพิ่ม route ใน `routes/routes.go` + สร้าง controller ใน `main.go`

---

## ตัวอย่าง controller (ก๊อปไปดัดแปลงได้)

```go
package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type BookController struct {
	db *gorm.DB
}

func NewBookController(db *gorm.DB) *BookController {
	return &BookController{db: db}
}

func (bc *BookController) GetAll(c *gin.Context) {
	var books []models.Book
	if err := bc.db.Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"books": books})
}

func (bc *BookController) Create(c *gin.Context) {
	var req dto.CreateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// รู้ว่าใครเป็นคนสร้าง — เอาจาก token ไม่ใช่จาก frontend
	userID, _ := c.Get("user_id")

	book := models.Book{
		Title:     req.Title,
		ISBN:      req.ISBN,
		CreatedBy: userID.(uint),
	}

	if err := bc.db.Create(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "สร้างสำเร็จ", "book": book})
}
```

**สิ่งที่ต้องระวังในทุก handler:**

- `c.JSON` ที่เป็น error **ต้องตามด้วย `return` เสมอ** ไม่งั้นโค้ดจะทำงานต่อทั้งที่ตอบไปแล้ว
- ถ้าต้องสร้างข้อมูลหลายตารางพร้อมกัน ให้ใช้ `db.Transaction(...)` เพื่อกันข้อมูลค้างกลางทาง (ดูตัวอย่างใน `user_controller.go`)
- ข้อมูลลับ (รหัสผ่าน) ใส่ `json:"-"` ใน model จะได้ไม่หลุดออกไปกับ response

---

## กฎของทีม

### ไฟล์ที่ต้องบอกก่อนแก้

| โฟลเดอร์ | เหตุผล |
|---|---|
| `internal/models/` | ถ้าแก้มั่ว AutoMigrate จะชนกันทั้งทีม (ยกเว้นไฟล์ model ของฟีเจอร์ตัวเอง) |
| `internal/middleware/` | JWT/CORS/สิทธิ์ ใช้ร่วมกันทุกคน |
| `internal/config/` | ยกเว้นการเพิ่ม model ใหม่ใน AutoMigrate — ทำได้เลย |

ไฟล์ใน `controllers/`, `dto/` ที่เป็นของฟีเจอร์ตัวเอง แก้ได้อิสระ

### `routes.go` ทุกคนต้องแก้

เพิ่มเฉพาะบรรทัดของตัวเอง **อย่าไปจัดเรียงหรือแก้ของคนอื่น** จะทำให้ merge ชนโดยไม่จำเป็น

### เรื่องชื่อ

- path: `/api/v1/<ชื่อพหูพจน์>` เช่น `/api/v1/books`
- JSON: `snake_case` เช่น `book_id`, `created_at`
- ชื่อไฟล์ Go: `snake_case.go`
- ชื่อ field ใน Go: ขึ้นต้นด้วยตัวใหญ่เสมอ (ไม่งั้น package อื่นเรียกไม่ได้ และ JSON ไม่ออก)

### อย่า merge เข้า main พร้อมกัน

เข้าคิวทีละคน คนที่ merge ทีหลังให้ `git pull origin main` มาก่อนแล้วค่อย merge

---

## ยังไม่ได้ตกลงกัน

**login ด้วยอะไร**

ตอนนี้ใช้ **email** เพราะ class diagram ไม่มี field ที่ไม่ซ้ำกันสำหรับ login (มีแต่ Name/Phone)
ทางเลือกอื่น: ใช้ `phone`, หรือให้ employee ใช้รหัสพนักงาน / member ใช้รหัสนักศึกษา

เรื่องนี้กระทบหน้า login ของทุกคน **ควรตกลงก่อนใครเริ่มเขียน frontend**

---

## ปัญหาที่เจอบ่อย

**`โหลด config ไม่ได้ : ใส่ค่าในไฟล์ .env ด้วยเพื่อน`**
→ ไม่ได้สร้าง `.env` หรือรัน `go run` ผิดโฟลเดอร์ ต้องรันจาก `backend`

**ต่อ database ไม่ติด**
→ ค่าใน `.env` ไม่ตรงกับ `compose.yml` หรือลืม `docker compose up -d`

**ข้อมูลใน database หายไปเฉยๆ**
→ รัน `docker compose` ผิดโฟลเดอร์ ต้องรันจาก `T09` เท่านั้น

**pgAdmin ต่อ Postgres ไม่ได้**
→ ช่อง Host ต้องใส่ `t09db-postgres` ไม่ใช่ `localhost`

**port 5432 ถูกใช้อยู่แล้ว**
→ มี Postgres ตัวอื่นรันค้าง สั่ง `docker ps` แล้ว `docker stop <ชื่อ>`

**แก้โค้ดแล้วไม่มีอะไรเปลี่ยน**
→ Go คอมไพล์ก่อนรัน ต้อง Ctrl+C แล้ว `go run ./cmd/server` ใหม่ทุกครั้ง

**เพิ่ม field ใน model แล้วตารางไม่เปลี่ยน**
→ AutoMigrate เพิ่มคอลัมน์ให้ แต่ไม่ลบและไม่แก้ชนิดข้อมูลเดิม ถ้าจำเป็นให้ `DROP TABLE` แล้วรันใหม่ (ตอนยังไม่มีข้อมูลจริง)

**เขียน `gorm:` tag แล้วไม่มีผล**
→ เช็คว่าสะกดถูก (`gorm` ไม่ใช่ `grom`) และ **ห้ามมีเว้นวรรคหลัง `gorm:`** — Go ไม่ฟ้อง แต่ tag จะไม่ทำงาน

**`403 ไม่มีสิทธิ์ใช้งานส่วนนี้`**
→ token ที่ใช้มี position ไม่ตรงกับที่ endpoint ต้องการ ถ้าเพิ่งเปลี่ยนตำแหน่งใน database ต้อง **login ใหม่** เพราะ role ฝังอยู่ใน token เดิม

**`401 token ไม่ถูกต้องหรือหมดอายุ`**
→ token อายุ 24 ชม. หรือลืมใส่คำว่า `Bearer ` หน้า token