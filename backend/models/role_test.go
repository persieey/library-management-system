package models

import "testing"

func TestAllRolesAreValid(t *testing.T) {
	for _, role := range AllRoles {
		if !role.IsValid() {
			t.Errorf("role %q ควรเป็นค่าที่ใช้ได้", role)
		}
	}
	if Role("owner").IsValid() {
		t.Error("role ที่ไม่รู้จักไม่ควรผ่าน IsValid")
	}
}

func TestEveryRoleGetsBasePermissions(t *testing.T) {
	for _, role := range AllRoles {
		for _, perm := range basePermissions {
			if !role.Can(perm) {
				t.Errorf("role %q ควรทำ %q ได้ เพราะเป็นสิทธิ์พื้นฐาน", role, perm)
			}
		}
	}
}

func TestRoleBoundaries(t *testing.T) {
	cases := []struct {
		role Role
		perm Permission
		want bool
	}{
		{RoleUser, PermAccessBackOffice, false},
		{RoleUser, PermBookRoom, true},
		{RoleLibrarian, PermManagePR, true},
		{RoleLibrarian, PermManageEquipment, false},
		{RoleLibrarian, PermManagePersonnel, false},
		{RoleStaff, PermManageEquipment, true},
		{RoleStaff, PermManagePR, false},
		{RoleStaff, PermManagePersonnel, false},
		{RoleAdmin, PermManagePersonnel, true},
		{RoleAdmin, PermAssignRoles, true},
	}

	for _, c := range cases {
		if got := c.role.Can(c.perm); got != c.want {
			t.Errorf("%q.Can(%q) = %v ต้องการ %v", c.role, c.perm, got, c.want)
		}
	}
}

func TestUnknownRoleCanDoNothing(t *testing.T) {
	stranger := Role("")
	if stranger.Can(PermBookRoom) {
		t.Error("role ว่างไม่ควรได้สิทธิ์อะไรเลย แม้แต่สิทธิ์พื้นฐาน")
	}
}

func TestAdminHasEveryPermission(t *testing.T) {
	all := []Permission{
		PermBorrowResources, PermBookRoom, PermSubmitFeedback,
		PermAccessBackOffice, PermManageCatalog, PermApproveLoans,
		PermManagePR, PermManageRooms, PermManageEquipment,
		PermManagePersonnel, PermAssignRoles,
	}
	for _, perm := range all {
		if !RoleAdmin.Can(perm) {
			t.Errorf("admin ควรทำ %q ได้", perm)
		}
	}
}
