import { Navigate, Routes, Route } from 'react-router-dom'
import PRPage from '../pages/pr'
import EventsPage from '../pages/events'
import EventDetailPage from '../pages/events/detail'
import BooksPage from '../pages/books'
import BookDetailPage from '../pages/books/detail'
import EbooksPage from '../pages/ebooks'
import EmployeesHome from '../pages/employees'
import ManagePR from '../pages/employees/pr'
import ComplaintsPage from '../pages/employees/complaints/Employee'
import StatisticsPage from '../pages/employees/statistics/Statistics'
import PersonnelPage from '../pages/employees/personnel'
import ComingSoon from '../pages/employees/ComingSoon'
import NotFound from '../pages/not-found'
import RequirePosition, { RequireLogin } from '../components/RequirePosition'
import { CAN_ACCESS_BACKOFFICE, CAN_MANAGE_BOOKS, CAN_MANAGE_PERSONNEL, CAN_MANAGE_PR } from '../config/roles'
import ManagerDashboard from '../pages/manager'
import ManagerLeave from '../pages/manager/leave'
import ProfilePage from '../pages/employees/profile'
import MyLeavePage from '../pages/employees/leave'
import SchedulesPage from '../pages/employees/schedules'
import ManageBooks from '../pages/employees/books'
import ManageEbooks from '../pages/employees/ebooks'
// ระบบอุปกรณ์ / จองห้อง / แจ้งซ่อม ยกมาจากสาขา B6715588
import EquipmentPage from '../pages/Equipment/Equipment'
import RecordingRoomPage from '../pages/RecordingRoom/RecordingRoom'
import RepairRequestPage from '../pages/RepairRequestUI/RepairRequestUI'
import TrackRepairPage from '../pages/TrackRepair/TrackRepair'
import RoomBookingPage from '../pages/RoomBookingUI/RoomBookingUI'
// ยืม-คืนหนังสือและอุปกรณ์ ยกตรรกะมาจากสาขา B6731915
import BorrowPage from '../pages/borrow'
import BorrowServicePage from '../pages/employees/borrow-service'
// ระบบจัดซื้อทรัพย์สิน / ตรวจนับทรัพย์สิน ยกมาจากสาขา B6710248
import RequirePermission from '../components/RequirePermission'
import { PERMISSIONS } from '../config/roles'
import ProcurementHome from '../pages/procurement'
import CreatePurchaseRequest from '../pages/procurement/create'
import RequestList from '../pages/procurement/requests'
import CheckDetails from '../pages/procurement/details'
import RegisterAsset from '../pages/procurement/register-asset'
import ApproveRequests from '../pages/procurement/approve'
import ProcurementOverview from '../pages/procurement/overview'
import AssetsToAudit from '../pages/asset-audit'
import PhysicalAudit from '../pages/asset-audit/physical'
import RecordDiscrepancies from '../pages/asset-audit/discrepancies'
import CreateAuditReport from '../pages/asset-audit/report'
import SubmitReport from '../pages/asset-audit/submit'
import ReviewAuditReports from '../pages/asset-audit/review'

const COMING_SOON_ROUTES = [
  // หน้าที่ยังไม่ได้ทำ ต้องมีตัวรองรับไม่ให้ 404 เพราะมีเมนูชี้มา
  { path: 'catalog', title: 'Catalog', positions: CAN_MANAGE_PR },
  { path: 'loans', title: 'Loans', positions: CAN_MANAGE_PR },
]

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PRPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/books" element={<BooksPage />} />
      <Route path="/books/:id" element={<BookDetailPage />} />
      <Route path="/ebooks" element={<EbooksPage />} />

      {/* Manager portal — all pages behind MANAGE_PERSONNEL permission */}
      <Route
        path="/manager"
        element={
          <RequirePosition positions={CAN_MANAGE_PERSONNEL}>
            <ManagerDashboard />
          </RequirePosition>
        }
      />
      <Route
        path="/manager/leave"
        element={
          <RequirePosition positions={CAN_MANAGE_PERSONNEL}>
            <ManagerLeave />
          </RequirePosition>
        }
      />
      <Route
        path="/manager/personnel"
        element={
          <RequirePosition positions={CAN_MANAGE_PERSONNEL}>
            <PersonnelPage />
          </RequirePosition>
        }
      />

      {/* Old back-office routes */}
      <Route
        path="/employees"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <EmployeesHome />
          </RequirePosition>
        }
      />

      {COMING_SOON_ROUTES.map((route) => (
        <Route
          key={route.path}
          path={`/employees/${route.path}`}
          element={
            <RequirePosition positions={route.positions}>
              <ComingSoon title={route.title} />
            </RequirePosition>
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
          <RequirePosition positions={CAN_MANAGE_PR}>
            <ManagePR />
          </RequirePosition>
        }
      />

      {/* หัวข้อย่อยของระบบประชาสัมพันธ์ — ใช้คอมโพเนนต์เดียวกัน แยกด้วย path
          เพื่อให้กดจาก sidebar แล้วลิงก์ตรงไปหน้านั้นได้ และกดปุ่มย้อนกลับได้ */}
      <Route
        path="/employees/pr/:tab"
        element={
          <RequirePosition positions={CAN_MANAGE_PR}>
            <ManagePR />
          </RequirePosition>
        }
      />

      {/* ระบบร้องเรียนและสถิติ ของ B6707590 — เจ้าหน้าที่ทุกตำแหน่งเข้าได้ */}
      <Route
        path="/employees/complaints"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <ComplaintsPage />
          </RequirePosition>
        }
      />
      {/* :tab คือ box / pending / verify — ให้กดจาก sidebar เข้าแท็บที่ต้องการได้ตรง ๆ */}
      <Route
        path="/employees/complaints/:tab"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <ComplaintsPage />
          </RequirePosition>
        }
      />
      <Route
        path="/employees/statistics"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <StatisticsPage />
          </RequirePosition>
        }
      />
      {/* :tab คือหมวดรายงาน เช่น overview / top-books / returns — ดู STATS_TAB_TO_MENU ใน Statistics.tsx */}
      <Route
        path="/employees/statistics/:tab"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <StatisticsPage />
          </RequirePosition>
        }
      />

      {/* ระบบจัดการหนังสือและ E-Book ของ B6729615 */}
      <Route
        path="/employees/books"
        element={
          <RequirePosition positions={CAN_MANAGE_BOOKS}>
            <ManageBooks />
          </RequirePosition>
        }
      />

      {/* :tab คือ catalog / inspections หน้าเดียวกันสลับแท็บด้วย URL */}
      <Route
        path="/employees/books/:tab"
        element={
          <RequirePosition positions={CAN_MANAGE_BOOKS}>
            <ManageBooks />
          </RequirePosition>
        }
      />

      <Route
        path="/employees/ebooks"
        element={
          <RequirePosition positions={CAN_MANAGE_BOOKS}>
            <ManageEbooks />
          </RequirePosition>
        }
      />

      <Route
        path="/employees/profile"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <ProfilePage />
          </RequirePosition>
        }
      />

      <Route
        path="/employees/schedules"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <SchedulesPage />
          </RequirePosition>
        }
      />

      <Route
        path="/employees/leave"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <MyLeavePage />
          </RequirePosition>
        }
      />

      {/* ระบบอุปกรณ์ / จองห้อง / แจ้งซ่อม ของ B6715588 — เจ้าหน้าที่ทุกตำแหน่งเข้าได้ */}
      <Route
        path="/staff/equipment"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <EquipmentPage />
          </RequirePosition>
        }
      />

      <Route
        path="/staff/recording-room"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <RecordingRoomPage />
          </RequirePosition>
        }
      />

      <Route
        path="/staff/repair-request"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <RepairRequestPage />
          </RequirePosition>
        }
      />

      <Route
        path="/staff/track-repair"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <TrackRepairPage />
          </RequirePosition>
        }
      />

      {/* ยืม-คืนหนังสือ/อุปกรณ์ ฝั่งเจ้าหน้าที่ — ระบบของ B6731915 */}
      <Route
        path="/employees/borrow-service"
        element={
          <RequirePosition positions={CAN_ACCESS_BACKOFFICE}>
            <BorrowServicePage />
          </RequirePosition>
        }
      />

      {/* หน้าจองห้องสำหรับผู้ใช้ที่ล็อกอินแล้ว (สมาชิกหรือเจ้าหน้าที่) */}
      <Route
        path="/booking"
        element={
          <RequireLogin>
            <RoomBookingPage />
          </RequireLogin>
        }
      />
      <Route
        path="/borrow"
        element={
          <RequireLogin>
            <BorrowPage />
          </RequireLogin>
        }
      />

      {/* ระบบจัดซื้อทรัพย์สินและตรวจนับทรัพย์สิน ของ B6710248 */}
      <Route
        path="/procurement"
        element={
          <RequirePermission permission={PERMISSIONS.PROCUREMENT_ACCESS}>
            <ProcurementHome />
          </RequirePermission>
        }
      />
      <Route
        path="/procurement/create"
        element={
          <RequirePermission permission={PERMISSIONS.PROCUREMENT_ACCESS}>
            <CreatePurchaseRequest />
          </RequirePermission>
        }
      />
      <Route
        path="/procurement/requests"
        element={
          <RequirePermission permission={PERMISSIONS.PROCUREMENT_ACCESS}>
            <RequestList />
          </RequirePermission>
        }
      />
      <Route
        path="/procurement/details"
        element={
          <RequirePermission permission={PERMISSIONS.PROCUREMENT_ACCESS}>
            <CheckDetails />
          </RequirePermission>
        }
      />
      <Route
        path="/procurement/register-asset"
        element={
          <RequirePermission permission={PERMISSIONS.PROCUREMENT_ACCESS}>
            <RegisterAsset />
          </RequirePermission>
        }
      />
      <Route
        path="/procurement/approve"
        element={
          <RequirePermission permission={PERMISSIONS.PROCUREMENT_APPROVE}>
            <ApproveRequests />
          </RequirePermission>
        }
      />
      <Route
        path="/procurement/overview"
        element={
          <RequirePermission permission={PERMISSIONS.PROCUREMENT_APPROVE}>
            <ProcurementOverview />
          </RequirePermission>
        }
      />
      <Route
        path="/asset-audit"
        element={
          <RequirePermission permission={PERMISSIONS.AUDIT_ACCESS}>
            <AssetsToAudit />
          </RequirePermission>
        }
      />
      <Route
        path="/asset-audit/physical"
        element={
          <RequirePermission permission={PERMISSIONS.AUDIT_ACCESS}>
            <PhysicalAudit />
          </RequirePermission>
        }
      />
      <Route
        path="/asset-audit/discrepancies"
        element={
          <RequirePermission permission={PERMISSIONS.AUDIT_ACCESS}>
            <RecordDiscrepancies />
          </RequirePermission>
        }
      />
      <Route
        path="/asset-audit/report"
        element={
          <RequirePermission permission={PERMISSIONS.AUDIT_ACCESS}>
            <CreateAuditReport />
          </RequirePermission>
        }
      />
      <Route
        path="/asset-audit/submit"
        element={
          <RequirePermission permission={PERMISSIONS.AUDIT_ACCESS}>
            <SubmitReport />
          </RequirePermission>
        }
      />
      <Route
        path="/asset-audit/review"
        element={
          <RequirePermission permission={PERMISSIONS.AUDIT_APPROVE}>
            <ReviewAuditReports />
          </RequirePermission>
        }
      />

      {/* ทางเข้าโปรไฟล์ของสมาชิก หน้าเดียวกันแต่ห่อด้วย header ของหน้าสาธารณะ */}
      <Route
        path="/profile"
        element={
          <RequireLogin>
            <ProfilePage />
          </RequireLogin>
        }
      />


      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
