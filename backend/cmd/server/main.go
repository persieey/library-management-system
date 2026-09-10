package main

import (
	"log" //<= ของตัว go เอง

	"github.com/joho/godotenv" // <= ของคนอื่นๆ

	"github.com/SA-1-69/T09/backend/internal/config" // <= ของเราเอง
	"github.com/SA-1-69/T09/backend/internal/controllers"
	"github.com/SA-1-69/T09/backend/internal/routes"
	"github.com/SA-1-69/T09/backend/internal/jobs"
	"github.com/SA-1-69/T09/backend/internal/scheduler"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("ไม่พบไฟล์.env จะใสค่าของ Environment มาแทน")
	}

	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("โหลด config ไม่ได้ : %v", err)
	}
	db, err := config.ConnectDatabase(cfg)
	if err != nil {
		log.Fatalf("เชื่อมต่อ Postgres ไม่ได้ : %v", err)
	}
	if err := config.SeedAdmin(db, cfg); err != nil {
		log.Fatalf("seed admin ไม่สำเร็จ: %v", err)
	}
	if err := config.SeedLibrary(db, cfg); err != nil {
		log.Fatalf("seed ข้อมูลหอสมุดไม่สำเร็จ: %v", err)
	}
	if err := config.SeedRooms(db); err != nil {
		log.Fatalf("seed rooms ไม่สำเร็จ: %v", err)
	}
	if err := config.SeedEquipment(db); err != nil {
		log.Fatalf("seed equipment ไม่สำเร็จ: %v", err)
	}
	if err := config.SeedExternalDepartments(db); err != nil {
		log.Fatalf("seed external departments ไม่สำเร็จ: %v", err)
	}
	if err := config.SeedMembers(db, cfg); err != nil {
		log.Fatalf("seed members ไม่สำเร็จ: %v", err)
	}
	if err := config.SeedEbooks(db); err != nil {
		log.Fatalf("seed ebooks ไม่สำเร็จ: %v", err)
	}
	if err := config.SeedBooks(db); err != nil {
		log.Fatalf("seed books ไม่สำเร็จ: %v", err)
	}
	if err := config.SeedBookCopies(db); err != nil {
		log.Fatalf("seed book copies ไม่สำเร็จ: %v", err)
	}

	jwtProvider := utils.NewJWTProvider(cfg.JWTSecret, cfg.JWTExpiresIn)
	authController := controllers.NewAuthController(db, jwtProvider)

	userController := controllers.NewUserController(db)
	complaintController := controllers.NewComplaintController(db)
	statisticsController := controllers.NewStatisticsController(db)
	prController := controllers.NewPRController(db)
	eventController := controllers.NewEventController(db)
	personnelController := controllers.NewPersonnelController(db)
	leaveController := controllers.NewLeaveController(db)
	dutyController := controllers.NewDutyController(db)

	// ระบบจัดการหนังสือและ E-Book ของ B6729615
	ebookController := controllers.NewEbookController(db)
	bookController := controllers.NewBookController(db)
	bookCopyController := controllers.NewBookCopyController(db)
	inspectionController := controllers.NewInspectionController(db)

	// ระบบอุปกรณ์ แจ้งซ่อม และจองห้องของ B6715588
	equipmentController := controllers.NewEquipmentController(db)
	repairController := controllers.NewRepairController(db)
	roomBookingController := controllers.NewRoomBookingController(db)

	// ระบบจัดซื้อทรัพย์สินและตรวจนับทรัพย์สินของ B6710248
	requestController := controllers.NewRequestController(db)
	assetController := controllers.NewAssetController(db)
	auditController := controllers.NewAuditController(db)

	// ระบบยืม-คืนหนังสือและอุปกรณ์ พร้อมค่าปรับของ B6731915
	libraryController := controllers.NewLibraryController(db)
	problemController := controllers.NewProblemController(db)

	// ปิดการจองที่เลยเวลาแล้วโดยอัตโนมัติ ทำงานเบื้องหลังตลอดอายุเซิร์ฟเวอร์
	jobs.StartExpiryWorker(db)

	// เลื่อนสถานะข่าวที่ตั้งเวลาไว้ ทำงานเบื้องหลังตลอดอายุเซิร์ฟเวอร์
	go scheduler.StartPRScheduler(db)

	router := routes.SetupRouter(authController, userController,
		complaintController, statisticsController,
		prController, eventController, personnelController, leaveController, dutyController,
		ebookController, bookController, bookCopyController, inspectionController,
		equipmentController, repairController, roomBookingController,
		requestController, assetController, auditController,
		libraryController, problemController, jwtProvider)

	// port:= os.Getenv("SERVER_PORT")

	// if port == "" {
	// 	port = "8080"
	// }

	log.Printf("Server: http://localhost:%s", cfg.ServerPort)
	router.Run(":" + cfg.ServerPort)

}
