package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/SA-1-69/T09/backend/internal/controllers"
	"github.com/SA-1-69/T09/backend/internal/middleware"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

func SetupRouter(authControllers *controllers.AuthController,
	userController *controllers.UserController,
	prController *controllers.PRController,
	eventController *controllers.EventController,
	personnelController *controllers.PersonnelController,
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
	personnel := api.Group("/personnel")
	personnel.Use(middleware.JWTAuthMiddleware(jwtProvider), middleware.RequirePosition("manager"))
	personnel.GET("", personnelController.List)
	personnel.POST("", personnelController.Create)
	personnel.PATCH("/:id", personnelController.Update)
	personnel.DELETE("/:id", personnelController.Delete)
	personnel.POST("/:id/status", personnelController.ToggleStatus)

	return router
}
