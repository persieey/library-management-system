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
	jwtProvider *utils.JWTProvider) *gin.Engine {
	router := gin.Default()
	router.Use(middleware.CORSMiddleware())
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
	duties.POST("", middleware.RequirePosition("manager"), dutyController.Create)
	duties.PUT("/:id", middleware.RequirePosition("manager"), dutyController.Update)
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

	return router
}
