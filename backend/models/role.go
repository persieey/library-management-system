package models

// Role คือระดับสิทธิ์ของบัญชีผู้ใช้ เก็บเป็นคอลัมน์ role ในตาราง users
type Role string

const (
	// RoleUser ผู้ใช้ทั่วไป — นักศึกษาและอาจารย์ ทุกบัญชีอย่างน้อยต้องเป็นระดับนี้
	RoleUser Role = "user"
	// RoleLibrarian บรรณารักษ์ — ดูแลหนังสือ ทรัพยากร และข่าวประชาสัมพันธ์
	RoleLibrarian Role = "librarian"
	// RoleStaff เจ้าหน้าที่ — ดูแลห้องอัดเสียง อุปกรณ์ และงานแจ้งซ่อม
	RoleStaff Role = "staff"
	// RoleManager หัวหน้าหอสมุด — จัดการบุคลากร ตารางเวร การลา และรายงาน
	RoleManager Role = "manager"
	// RoleAdmin ผู้ดูแลระบบ — ทำได้ทุกอย่าง รวมถึงจัดการบุคลากรและกำหนด role
	RoleAdmin Role = "admin"
)

// AllRoles ใช้ตรวจค่าที่รับเข้ามาและใช้แสดงตัวเลือกในหน้าจัดการบุคลากร
var AllRoles = []Role{RoleUser, RoleLibrarian, RoleStaff, RoleManager, RoleAdmin}

// Permission คือสิ่งที่ทำได้หนึ่งอย่าง โค้ดฝั่ง handler ควรเช็ค permission ไม่ใช่เช็ค role ตรงๆ
// เวลาเพิ่มความสามารถใหม่จะได้แก้ที่ rolePermissions ที่เดียว
type Permission string

const (
	PermBorrowResources  Permission = "borrow:resources"   // ยืม-คืนของตัวเอง
	PermBookRoom         Permission = "room:book"          // จองห้องศึกษา
	PermSubmitFeedback   Permission = "feedback:submit"    // ส่งข้อเสนอแนะ/ร้องเรียน
	PermAccessBackOffice Permission = "backoffice:access"  // เข้าหน้าหลังบ้านพนักงาน
	PermManageCatalog    Permission = "catalog:manage"     // จัดการหนังสือและทรัพยากร
	PermApproveLoans     Permission = "loans:approve"      // อนุมัติการยืม-คืน
	PermManagePR         Permission = "pr:manage"          // จัดการข่าวประชาสัมพันธ์
	PermManageRooms      Permission = "rooms:manage"       // จัดการห้องอัดเสียง
	PermManageEquipment  Permission = "equipment:manage"   // จัดการอุปกรณ์และงานแจ้งซ่อม
	PermManagePersonnel  Permission = "personnel:manage"   // จัดการบุคลากร
	PermAssignRoles      Permission = "roles:assign"       // กำหนด role ให้บัญชีอื่น
)

// สิทธิ์พื้นฐานที่ทุกบัญชีที่ล็อกอินได้รับ ไม่ว่าจะ role ไหน
var basePermissions = []Permission{
	PermBorrowResources,
	PermBookRoom,
	PermSubmitFeedback,
}

// สิทธิ์เพิ่มเติมของแต่ละ role นอกเหนือจาก basePermissions
var extraPermissions = map[Role][]Permission{
	RoleUser: {},
	RoleLibrarian: {
		PermAccessBackOffice,
		PermManageCatalog,
		PermApproveLoans,
	},
	RoleStaff: {
		PermAccessBackOffice,
		PermManageRooms,
		PermManageEquipment,
	},
	RoleManager: {
		PermAccessBackOffice,
		PermManagePersonnel,
		PermApproveLoans,
	},
	RoleAdmin: {
		PermAccessBackOffice,
		PermManageCatalog,
		PermApproveLoans,
		PermManagePR,
		PermManageRooms,
		PermManageEquipment,
		PermManagePersonnel,
		PermAssignRoles,
	},
}

// IsValid บอกว่า role ที่รับมาเป็นค่าที่รู้จักหรือไม่
func (r Role) IsValid() bool {
	_, ok := extraPermissions[r]
	return ok
}

// Permissions คืนสิทธิ์ทั้งหมดของ role นี้ (พื้นฐาน + เพิ่มเติม)
func (r Role) Permissions() []Permission {
	extra := extraPermissions[r]
	all := make([]Permission, 0, len(basePermissions)+len(extra))
	all = append(all, basePermissions...)
	all = append(all, extra...)
	return all
}

// Can บอกว่า role นี้ทำสิ่งนั้นได้หรือไม่
func (r Role) Can(p Permission) bool {
	if !r.IsValid() {
		return false
	}
	for _, base := range basePermissions {
		if base == p {
			return true
		}
	}
	for _, extra := range extraPermissions[r] {
		if extra == p {
			return true
		}
	}
	return false
}
