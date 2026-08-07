import { Navigate, Routes, Route } from 'react-router-dom'
import PRPage from '../pages/pr'
import Personnel from '../pages/personnel'
import EmployeesHome from '../pages/employees'
import ManagePR from '../pages/employees/pr'
import PersonnelPage from '../pages/employees/personnel'
import ComingSoon from '../pages/employees/ComingSoon'
import NotFound from '../pages/not-found'
import RequirePermission from '../components/RequirePermission'
import { PERMISSIONS } from '../config/roles'
import ManagerDashboard from '../pages/manager'
import ManagerSchedules from '../pages/manager/schedules'
import ManagerLeave from '../pages/manager/leave'
import ManagerBooks from '../pages/manager/books'
import ManagerActivities from '../pages/manager/activities'
import ManagerComplaints from '../pages/manager/complaints'
import ManagerReports from '../pages/manager/reports'

const COMING_SOON_ROUTES = [
  { path: 'recording-room', title: 'Recording Room', permission: PERMISSIONS.MANAGE_ROOMS },
  { path: 'equipment', title: 'Equipment', permission: PERMISSIONS.MANAGE_EQUIPMENT },
  { path: 'repair-request', title: 'Repair request', permission: PERMISSIONS.MANAGE_EQUIPMENT },
  { path: 'repair-track', title: 'Track the repair', permission: PERMISSIONS.MANAGE_EQUIPMENT },
  { path: 'catalog', title: 'Catalog', permission: PERMISSIONS.MANAGE_CATALOG },
  { path: 'loans', title: 'Loans', permission: PERMISSIONS.APPROVE_LOANS },
]

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PRPage />} />

      {/* Manager portal — all pages behind MANAGE_PERSONNEL permission */}
      <Route
        path="/manager"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <ManagerDashboard />
          </RequirePermission>
        }
      />
      <Route
        path="/manager/schedules"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <ManagerSchedules />
          </RequirePermission>
        }
      />
      <Route
        path="/manager/leave"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <ManagerLeave />
          </RequirePermission>
        }
      />
      <Route
        path="/manager/personnel"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <PersonnelPage />
          </RequirePermission>
        }
      />
      <Route
        path="/manager/books"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <ManagerBooks />
          </RequirePermission>
        }
      />
      <Route
        path="/manager/activities"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <ManagerActivities />
          </RequirePermission>
        }
      />
      <Route
        path="/manager/complaints"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <ManagerComplaints />
          </RequirePermission>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <ManagerReports />
          </RequirePermission>
        }
      />

      {/* Old back-office routes */}
      <Route
        path="/employees"
        element={
          <RequirePermission permission={PERMISSIONS.ACCESS_BACKOFFICE}>
            <EmployeesHome />
          </RequirePermission>
        }
      />

      {COMING_SOON_ROUTES.map((route) => (
        <Route
          key={route.path}
          path={`/employees/${route.path}`}
          element={
            <RequirePermission permission={route.permission}>
              <ComingSoon title={route.title} />
            </RequirePermission>
          }
        />
      ))}

      <Route
        path="/employees/personnel"
        element={<Navigate to="/manager/personnel" replace />}
      />

      <Route
        path="/employees/pr"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PR}>
            <ManagePR />
          </RequirePermission>
        }
      />

      <Route
        path="/personnel"
        element={
          <RequirePermission permission={PERMISSIONS.MANAGE_PERSONNEL}>
            <Personnel />
          </RequirePermission>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
