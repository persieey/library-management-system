package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"library-management-system/auth"
	"library-management-system/handlers"
	"library-management-system/models"
	"library-management-system/store"
)

const (
	defaultAddr   = ":8080"
	defaultOrigin = "http://localhost:3000"

	// รอบตรวจข่าวที่ตั้งเวลาไว้ ถี่พอให้เห็นผลทันทีตอนสาธิต แต่ไม่ถี่จนกวนฐานข้อมูล
	schedulerInterval = 30 * time.Second
)

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// runScheduler คอยเลื่อนสถานะข่าวที่ถึงกำหนดเผยแพร่และข่าวที่หมดอายุ
// อยู่ฝั่งเซิร์ฟเวอร์เพื่อให้ทำงานต่อแม้ไม่มีใครเปิดหน้าเว็บค้างไว้
func runScheduler(items *store.PRStore) {
	ticker := time.NewTicker(schedulerInterval)
	defer ticker.Stop()

	for range ticker.C {
		published, err := items.RunDueTransitions(time.Now())
		if err != nil {
			log.Printf("ตรวจข่าวตามกำหนดเวลาไม่สำเร็จ: %v", err)
			continue
		}
		for _, title := range published {
			log.Printf("เผยแพร่ข่าวอัตโนมัติแล้ว: %s", title)
		}
	}
}

func main() {
	dbConfig := store.ConfigFromEnv()
	db, err := store.Open(dbConfig)
	if err != nil {
		log.Fatalf("เปิดฐานข้อมูลไม่สำเร็จ: %v", err)
	}
	log.Printf("ฐานข้อมูล: %s", dbConfig.Describe())

	users := store.NewUserStore(db)
	prItems := store.NewPRStore(db)
	events := store.NewEventStore(db)
	people := store.NewPersonnelStore(db)

	if err := seedAccounts(users); err != nil {
		log.Fatalf("สร้างบัญชีตัวอย่างไม่สำเร็จ: %v", err)
	}
	if err := seedPersonnel(people); err != nil {
		log.Fatalf("สร้างข้อมูลบุคลากรตัวอย่างไม่สำเร็จ: %v", err)
	}
	if err := seedPR(prItems); err != nil {
		log.Fatalf("สร้างข่าวตัวอย่างไม่สำเร็จ: %v", err)
	}
	if err := seedEvents(events); err != nil {
		log.Fatalf("สร้างกิจกรรมตัวอย่างไม่สำเร็จ: %v", err)
	}

	authAPI := &handlers.Auth{Users: users, Sessions: auth.NewSessionStore()}
	prAPI := &handlers.PR{Items: prItems}
	eventAPI := &handlers.Events{Items: events}
	personnelAPI := &handlers.Personnel{People: people}

	go runScheduler(prItems)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), handlers.CORS(env("LMS_CORS_ORIGIN", defaultOrigin)))

	api := router.Group("/api/v1")

	// บัญชีผู้ใช้
	api.POST("/auth/login", authAPI.Login)
	api.POST("/auth/logout", authAPI.Logout)
	api.GET("/users/profile", authAPI.RequireAuth(), authAPI.Profile)

	// ข่าวประชาสัมพันธ์ — คนทั่วไปเห็นเฉพาะข่าวที่เผยแพร่แล้ว เจ้าหน้าที่เห็นทั้งหมด
	api.GET("/pr", authAPI.OptionalAuth(), prAPI.List)
	api.POST("/pr/:id/view", prAPI.View)

	managePR := api.Group("/pr", authAPI.RequirePermission(models.PermManagePR))
	managePR.POST("", prAPI.Create)
	managePR.PATCH("/:id", prAPI.Update)
	managePR.DELETE("/:id", prAPI.Delete)
	managePR.POST("/:id/toggle", prAPI.Toggle)
	managePR.POST("/:id/copy", prAPI.Copy)

	// กิจกรรม — หน้ากิจกรรมเป็นหน้าสาธารณะ แต่การแก้ไขต้องมีสิทธิ์จัดการข่าว
	api.GET("/events", eventAPI.List)

	manageEvents := api.Group("/events", authAPI.RequirePermission(models.PermManagePR))
	manageEvents.POST("", eventAPI.Create)
	manageEvents.PATCH("/:id", eventAPI.Update)
	manageEvents.DELETE("/:id", eventAPI.Delete)

	// บุคลากร — ต้องมีสิทธิ์จัดการบุคลากรทุก endpoint
	personnel := api.Group("/personnel", authAPI.RequirePermission(models.PermManagePersonnel))
	personnel.GET("", personnelAPI.List)
	personnel.POST("", personnelAPI.Create)
	personnel.PATCH("/:id", personnelAPI.Update)
	personnel.DELETE("/:id", personnelAPI.Delete)
	personnel.POST("/:id/status", personnelAPI.ToggleStatus)

	addr := env("LMS_ADDR", defaultAddr)
	log.Printf("Library Management System - Backend ฟังอยู่ที่ %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("เซิร์ฟเวอร์หยุดทำงาน: %v", err)
	}
}
