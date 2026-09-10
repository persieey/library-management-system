package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/SA-1-69/T09/backend/internal/controllers"
	"github.com/SA-1-69/T09/backend/internal/middleware"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

func SetupRouter(authControllers *controllers.AuthController,
	userController *controllers.UserController,
	complaintController *controllers.ComplaintController,
	statisticsController *controllers.StatisticsController,
	prController *controllers.PRController,
	eventController *controllers.EventController,
	personnelController *controllers.PersonnelController,
	leaveController *controllers.LeaveController,
	dutyController *controllers.DutyController,
	ebookController *controllers.EbookController,
	bookController *controllers.BookController,
	bookCopyController *controllers.BookCopyController,
	inspectionController *controllers.InspectionController,
	equipmentController *controllers.EquipmentController,
	repairController *controllers.RepairController,
	roomBookingController *controllers.RoomBookingController,
	requestController *controllers.RequestController,
	assetController *controllers.AssetController,
	auditController *controllers.AuditController,
	libraryController *controllers.LibraryController,
	problemController *controllers.ProblemController,
	jwtProvider *utils.JWTProvider) *gin.Engine {
	router := gin.Default()
	router.Use(middleware.CORSMiddleware())
	// รูปแนบของใบแจ้งซ่อม — เปิดให้ <img src> โหลดได้ตรงๆ
	//
	// เปิดเฉพาะโฟลเดอร์ repairs เท่านั้น ห้ามเปิด ./uploads ทั้งก้อน
	// เพราะไฟล์ PDF ของ E-Book ถูกเก็บไว้ที่ ./uploads ตรงๆ (ebook_controller.go)
	// ถ้าเปิดทั้งโฟลเดอร์ ใครก็โหลด ebook ได้โดยไม่ต้องล็อกอิน
	// ข้ามการตรวจสิทธิ์ที่ GET /ebooks/:id/file กันไว้ทั้งหมด
	router.Static("/uploads/repairs", "./uploads/repairs")

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "server T09 is running!!",
		})
	})
	api := router.Group("/api/v1")

	auth := api.Group("/auth")
	auth.POST("/register", authControllers.Register)
	auth.POST("/login", authControllers.Login)
	auth.POST("/logout", middleware.JWTAuthMiddleware(jwtProvider), authControllers.Logout)
	users := api.Group("/users")
	users.Use(middleware.JWTAuthMiddleware(jwtProvider))
	users.GET("/profile", userController.GetProfile)
	// แก้ข้อมูลตัวเอง ทุกตำแหน่งทำได้ เพราะยึด user_id จาก token ไม่ใช่จาก body
	users.PUT("/profile", userController.UpdateProfile)
	users.PUT("/password", userController.ChangePassword)
	users.POST("/members", middleware.RequirePosition("manager", "librarian"), userController.CreateMember)
	//เพิ่มนักศึกษา จาก mamage และ librarian
	users.POST("/employees", middleware.RequirePosition("manager"), userController.CreateEmployee)
	//เพิ่มพนักงานห้องสมุด จาก mamager ได้อย่างเดี๋ยว

	// ---------- ข่าวประชาสัมพันธ์ ----------
	// อ่านได้ทุกคน แต่ถ้าล็อกอินมาด้วยจะเห็นข่าวร่างและข่าวตั้งเวลาด้วย
	// จึงใช้ OptionalAuth ไม่ใช่ JWTAuthMiddleware ที่กันคนไม่ล็อกอินออก
	api.GET("/pr", middleware.OptionalAuth(jwtProvider), prController.List)
	api.POST("/pr/:id/view", prController.View)

	pr := api.Group("/pr")
	pr.Use(middleware.JWTAuthMiddleware(jwtProvider), middleware.RequirePosition("librarian", "manager"))
	pr.POST("", prController.Create)
	pr.PATCH("/:id", prController.Update)
	pr.DELETE("/:id", prController.Delete)
	pr.POST("/:id/toggle", prController.Toggle)
	pr.POST("/:id/copy", prController.Copy)

	// ---------- กิจกรรม ----------
	// หน้ากิจกรรมเป็นหน้าสาธารณะ แต่การแก้ไขต้องเป็นบรรณารักษ์ขึ้นไป
	api.GET("/events", eventController.List)

	events := api.Group("/events")
	events.Use(middleware.JWTAuthMiddleware(jwtProvider), middleware.RequirePosition("librarian", "manager"))
	events.POST("", eventController.Create)
	events.PATCH("/:id", eventController.Update)
	events.DELETE("/:id", eventController.Delete)

	// ---------- บุคลากร ----------
	// งานบุคคลเป็นเรื่องของหัวหน้าหอสมุดเท่านั้น
	// ---------- ตารางเวร ----------
	// ทุกตำแหน่งดูได้เพราะต้องรู้ว่าตัวเองเข้าเวรวันไหน แต่จัดเวรได้เฉพาะหัวหน้า
	duties := api.Group("/duties")
	duties.Use(middleware.JWTAuthMiddleware(jwtProvider), middleware.RequirePosition("staff", "librarian", "manager"))
	duties.GET("", dutyController.List)
	duties.GET("/service-points", dutyController.ListServicePoints)
	duties.POST("", middleware.RequirePosition("manager"), dutyController.Create)
	duties.DELETE("/:id", middleware.RequirePosition("manager"), dutyController.Delete)

	// ---------- การลา ----------
	// พนักงานทุกตำแหน่งยื่นและดูของตัวเองได้ ส่วนการอนุมัติเป็นของหัวหน้าเท่านั้น
	leaves := api.Group("/leaves")
	leaves.Use(middleware.JWTAuthMiddleware(jwtProvider), middleware.RequirePosition("staff", "librarian", "manager"))
	leaves.POST("", leaveController.Create)
	leaves.GET("/mine", leaveController.ListMine)
	leaves.PUT("/:id/cancel", leaveController.Cancel)
	leaves.GET("", middleware.RequirePosition("manager"), leaveController.List)
	leaves.PUT("/:id/decide", middleware.RequirePosition("manager"), leaveController.Decide)

	personnel := api.Group("/personnel")
	personnel.Use(middleware.JWTAuthMiddleware(jwtProvider), middleware.RequirePosition("manager"))
	personnel.GET("", personnelController.List)
	personnel.POST("", personnelController.Create)
	personnel.PATCH("/:id", personnelController.Update)
	personnel.DELETE("/:id", personnelController.Delete)
	personnel.POST("/:id/status", personnelController.ToggleStatus)

	// ---------- ร้องเรียนและข้อเสนอแนะ (ระบบของ B6707590) ----------
	// ส่งเรื่องได้โดยไม่ต้องล็อกอิน เพราะผู้ใช้ทั่วไปต้องแจ้งปัญหาได้
	// ส่วนการอ่านและอัปเดตสถานะเป็นงานของเจ้าหน้าที่
	apiV1Complaints := api.Group("/complaints")
	apiV1Complaints.POST("", complaintController.CreateComplaint)

	manageComplaints := api.Group("/complaints")
	manageComplaints.Use(middleware.JWTAuthMiddleware(jwtProvider), middleware.RequirePosition("staff", "librarian", "manager"))
	manageComplaints.GET("", complaintController.GetComplaints)
	manageComplaints.GET("/:id", complaintController.GetComplaintByID)
	manageComplaints.PUT("/:id", complaintController.UpdateComplaint)

	// ---------- รายงานสถิติ (ระบบของ B6707590) ----------
	stats := api.Group("/statistics")
	stats.Use(middleware.JWTAuthMiddleware(jwtProvider), middleware.RequirePosition("staff", "librarian", "manager"))
	stats.GET("/summary", statisticsController.GetSummaryStats)
	stats.GET("/books", statisticsController.GetBookStats)
	stats.GET("/returns", statisticsController.GetReturnStats)
	stats.GET("/rooms", statisticsController.GetRoomStats)
	stats.GET("/ebooks", statisticsController.GetEbookStats)
	stats.GET("/equipment", statisticsController.GetEquipmentStats)


	// ---------- หนังสือ / E-Book (ระบบของ B6729615) ----------
	// ยกกลุ่ม route มาจากโปรเจกต์ของกรทั้งชุด สิทธิ์เป็นไปตามที่เจ้าของเขียนไว้เดิม

	// ── ebooks ──
	ebooks := api.Group("/ebooks")

	// สาธารณะ : รายชื่อกับรูปปก ให้หน้า /ebooks ของคนทั่วไปดูได้
	// วางไว้ก่อน ebooks.Use(JWT) แบบเดียวกับ /books
	// ส่วนตัวไฟล์ยังต้องล็อกอิน อยู่ใต้ JWT ตามเดิม
	ebooks.GET("", ebookController.GetAll)
	ebooks.GET("/:id/cover", ebookController.GetCover)
	// ค้นหาจริงกรองฝั่งหน้าเว็บล้วน ๆ ไม่ได้ยิง query ทุกครั้งที่พิมพ์ จึงมี endpoint แยกไว้เก็บ log
	// อย่างเดียว ใช้ OptionalAuth เพราะหน้า /ebooks เปิดสาธารณะ ไม่บังคับ login ก่อนค้นหา
	ebooks.POST("/search-log", middleware.OptionalAuth(jwtProvider), ebookController.LogSearch)

	ebooks.Use(middleware.JWTAuthMiddleware(jwtProvider))

	ebooks.GET("/:id/file", ebookController.GetFile)

	ebooks.POST("", middleware.RequirePosition("librarian", "manager"), ebookController.Create)
	ebooks.PUT("/:id", middleware.RequirePosition("librarian", "manager"), ebookController.Update)
	ebooks.DELETE("/:id", middleware.RequirePosition("librarian", "manager"), ebookController.Delete)
	ebooks.POST("/upload", middleware.RequirePosition("librarian", "manager"), ebookController.UploadFile)
	ebooks.POST("/upload-cover", middleware.RequirePosition("librarian", "manager"), ebookController.UploadCover)

	// ── books ──
	books := api.Group("/books")

	// สาธารณะ : หน้าแรกกับหน้า /books ให้คนที่ยังไม่ล็อกอินดูรายการหนังสือได้
	// วางไว้ก่อน books.Use(JWT) เหมือนที่เจ้าของทำกับ /books/:id/cover
	books.GET("", bookController.GetAll)
	books.GET("/:id/cover", bookController.GetCover)

	// /catalog มาจาก B6731915 (สุชาดา) — เหมือน GetAll แต่ตอบสถานะว่าง/ไม่ว่าง
	// ของแต่ละเล่มตามวันที่จะยืม (query reserved_for, days) คนละอันกับ GetAll ข้างบน
	books.GET("/catalog", libraryController.Resources)

	books.Use(middleware.JWTAuthMiddleware(jwtProvider))

	books.POST("", middleware.RequirePosition("librarian", "manager"), bookController.Create)
	books.PUT("/:id", middleware.RequirePosition("librarian", "manager"), bookController.Update)
	books.DELETE("/:id", middleware.RequirePosition("librarian", "manager"), bookController.Delete)
	books.POST("/upload-cover", middleware.RequirePosition("librarian", "manager"), bookController.UploadCover)

	// ── book copies ──
	copies := api.Group("/book-copies")
	copies.Use(middleware.JWTAuthMiddleware(jwtProvider))

	copies.GET("", bookCopyController.GetAll)
	copies.GET("/:id/inspections", inspectionController.GetByCopy)

	copies.POST("", middleware.RequirePosition("librarian", "manager"), bookCopyController.Create)
	copies.PUT("/:id", middleware.RequirePosition("librarian", "manager"), bookCopyController.Update)
	copies.DELETE("/:id", middleware.RequirePosition("librarian", "manager"), bookCopyController.Delete)

	// ── inspections ──
	inspections := api.Group("/inspections")
	inspections.Use(middleware.JWTAuthMiddleware(jwtProvider))

	inspections.GET("", inspectionController.GetAll)

	inspections.POST("", middleware.RequirePosition("librarian", "manager"), inspectionController.Create)
	inspections.PUT("/:id", middleware.RequirePosition("librarian", "manager"), inspectionController.Update)
	inspections.DELETE("/:id", middleware.RequirePosition("manager"), inspectionController.Delete)


	// ---------- ยืม-คืนหนังสือและอุปกรณ์ พร้อมค่าปรับ (ระบบของ B6731915) ----------
	// ยกตรรกะ LibraryController มาจากโปรเจกต์ของสุชาดาทั้งชุด ไม่ได้แก้โครงสร้างโค้ดเธอ
	// เขียน route ขึ้นใหม่เองให้ใช้ middleware ของทีม (RequirePosition) แทน
	// RequireRoles("librarian") เดิมของเธอ เพราะระบบสิทธิ์ของทีมแยก role/position
	// ส่วนเช็ค role=="member" ในตัว controller ใช้ได้ตรงอยู่แล้วไม่ต้องแก้

	// ── การยืม-คืนหนังสือ ── (ต่อจากกลุ่ม books ด้านบน ซึ่ง .Use(JWT) ไปแล้ว)
	books.GET("/reservations", libraryController.MyLoans)
	books.POST("/reservations", libraryController.BorrowSelf)
	books.POST("/reservations/:id/cancel", libraryController.CancelLoanSelf)

	booksLibrarian := middleware.RequirePosition("librarian", "manager")
	books.GET("/librarian/reservations", booksLibrarian, libraryController.Loans)
	books.POST("/librarian/reservations/:id/checkout", booksLibrarian, libraryController.Checkout)
	books.POST("/librarian/reservations/:id/return", booksLibrarian, libraryController.Return)
	books.POST("/librarian/reservations/:id/pay-fine", booksLibrarian, libraryController.PayLoanFine)
	books.GET("/librarian/problems", booksLibrarian, problemController.BookProblems)
	books.POST("/librarian/reservations/:id/no-show", booksLibrarian, func(c *gin.Context) {
		c.Params = append(c.Params, gin.Param{Key: "kind", Value: "loans"})
		libraryController.NoShow(c)
	})

	// ── การยืม-คืนอุปกรณ์ ── กลุ่มใหม่บนพาธ /equipment เดิม
	// ต้องแยกกลุ่มจาก equipment ด้านล่าง เพราะกลุ่มนั้น RequireEmployee() ทั้งกลุ่ม
	// แต่ /equipment/catalog ต้องเปิดสาธารณะ และ /equipment/reservations ต้องให้
	// สมาชิก (ไม่ใช่พนักงาน) ใช้ได้ด้วย — Gin ให้สร้างหลายกลุ่มพาธเดียวกันได้
	// (ทดสอบแล้วไม่ panic) แต่ละกลุ่มมี middleware ของตัวเองแยกกัน
	equipmentReservations := api.Group("/equipment")
	equipmentReservations.GET("/catalog", libraryController.Equipment)
	equipmentReservations.Use(middleware.JWTAuthMiddleware(jwtProvider))
	equipmentReservations.GET("/reservations", libraryController.MyEquipmentLoans)
	equipmentReservations.POST("/reservations", libraryController.BorrowEquipmentSelf)
	equipmentReservations.POST("/reservations/:id/cancel", libraryController.CancelEquipmentLoanSelf)
	equipmentReservations.GET("/librarian/reservations", booksLibrarian, libraryController.EquipmentLoans)
	equipmentReservations.POST("/librarian/reservations/:id/checkout", booksLibrarian, libraryController.CheckoutEquipment)
	equipmentReservations.POST("/librarian/reservations/:id/return", booksLibrarian, libraryController.ReturnEquipment)
	equipmentReservations.POST("/librarian/reservations/:id/pay-fine", booksLibrarian, libraryController.PayEquipmentFine)
	equipmentReservations.GET("/librarian/problems", booksLibrarian, problemController.EquipmentProblems)
	equipmentReservations.POST("/librarian/reservations/:id/no-show", booksLibrarian, func(c *gin.Context) {
		c.Params = append(c.Params, gin.Param{Key: "kind", Value: "equipment-loans"})
		libraryController.NoShow(c)
	})

	// ── ต่อคิวรอ (ใช้ร่วมกันทั้งหนังสือและอุปกรณ์) ──
	myQueue := api.Group("/my-queue")
	myQueue.Use(middleware.JWTAuthMiddleware(jwtProvider))
	myQueue.GET("", libraryController.MyQueue)
	myQueue.POST("", libraryController.JoinQueue)
	myQueue.POST("/:id/cancel", libraryController.CancelQueue)

	// ---------- อุปกรณ์ / แจ้งซ่อม / จองห้อง (ระบบของ B6715588) ----------
	// ยกกลุ่ม route มาจากโปรเจกต์ของบรรพตทั้งชุด สิทธิ์เป็นไปตามที่เจ้าของเขียนไว้เดิม

	// ---------- อุปกรณ์ ----------
	equipment := api.Group("/equipment")
	equipment.Use(middleware.JWTAuthMiddleware(jwtProvider))
	equipment.Use(middleware.RequireEmployee())
	{
		equipment.GET("", equipmentController.List)
		equipment.POST("", equipmentController.Create)
		equipment.PATCH("/:id/status", equipmentController.UpdateStatus)
	}

	// ---------- แจ้งซ่อม ----------
	repairs := api.Group("/repairs")
	repairs.Use(middleware.JWTAuthMiddleware(jwtProvider))
	{
		repairs.POST("", repairController.Create)
		repairs.GET("/mine", repairController.MyRepairs)
		repairs.GET("", middleware.RequireEmployee(), repairController.List)
		repairs.PATCH("/:id/status", middleware.RequireEmployee(), repairController.UpdateStatus)
	}

	// ---------- ห้อง / การจองห้อง ----------
	roomsGroup := api.Group("/rooms")
	roomsGroup.Use(middleware.JWTAuthMiddleware(jwtProvider))
	roomsGroup.GET("", roomBookingController.ListRooms)
	roomsGroup.POST("", middleware.RequireEmployee(), roomBookingController.CreateRoom)

	// เปลี่ยนจาก /bookings เป็น /room-bookings ให้ชัดว่าเป็นการจอง "ห้อง"
	// แยกจากระบบจองหนังสือ/อุปกรณ์ของอีกทีม
	roomBookings := api.Group("/room-bookings")
	roomBookings.Use(middleware.JWTAuthMiddleware(jwtProvider))
	{
		roomBookings.POST("", roomBookingController.Create)
		roomBookings.GET("/availability", roomBookingController.Availability) // ทุกคน login แล้วดูได้
		roomBookings.GET("/mine", roomBookingController.MyBookings)           // ทุกคน login แล้วดูของตัวเองได้
		roomBookings.PATCH("/:id/cancel", roomBookingController.Cancel)       // เจ้าของ หรือ staff
		roomBookings.GET("", middleware.RequireEmployee(), roomBookingController.List)
		roomBookings.PATCH("/:id/status", middleware.RequireEmployee(), roomBookingController.UpdateStatus)
	}


	// ---------- จัดซื้อทรัพย์สิน / ตรวจนับทรัพย์สิน (ระบบของ B6710248) ----------
	// ยกกลุ่ม route มาจากโปรเจกต์ของสุรทินทั้งชุด สิทธิ์เป็นไปตามที่เจ้าของเขียนไว้เดิม

	// ---------- ใบขอซื้อ ----------
	requests := api.Group("/requests")
	requests.Use(middleware.JWTAuthMiddleware(jwtProvider))
	requests.GET("", requestController.GetAll)
	requests.GET("/:id", requestController.GetByID)
	requests.POST("", requestController.Create)
	// อนุมัติ/ปฏิเสธใบขอซื้อ ต้องเป็นหัวหน้าเท่านั้น
	// ของเดิมไม่ได้กันไว้ ทำให้ผู้ยื่นอนุมัติคำขอตัวเองผ่าน API ได้
	// หน้าเว็บซ่อนปุ่มไว้หลัง PROCUREMENT_APPROVE อยู่แล้ว แต่การซ่อนปุ่มไม่ใช่การป้องกัน
	requests.PATCH("/:id/status", middleware.RequirePosition("manager"), requestController.UpdateStatus)

	// ---------- ทรัพย์สิน ----------
	assets := api.Group("/assets")
	assets.Use(middleware.JWTAuthMiddleware(jwtProvider))
	assets.GET("", assetController.GetAll)
	assets.POST("", assetController.Create)

	// ---------- ตรวจนับทรัพย์สิน ----------
	audit := api.Group("/audit")
	audit.Use(middleware.JWTAuthMiddleware(jwtProvider))
	audit.GET("/stats", auditController.GetStats)
	audit.GET("/sessions", auditController.ListSessions)
	audit.POST("/sessions", auditController.CreateSession)
	audit.GET("/sessions/:id", auditController.GetSession)
	audit.PUT("/sessions/:id", auditController.UpdateSession)
	audit.POST("/sessions/:id/rows", auditController.SaveRows)
	audit.POST("/sessions/:id/discrepancies", auditController.AddDiscrepancy)
	audit.DELETE("/discrepancies/:disc_id", auditController.DeleteDiscrepancy)
	audit.POST("/sessions/:id/submit", auditController.SubmitReport)
	audit.POST("/sessions/:id/review", middleware.RequirePosition("manager"), auditController.ReviewReport)

	return router
}
