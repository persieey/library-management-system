import { Link } from 'react-router-dom'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { useAuth } from '../../auth/useAuth'
import { backOfficeMenuFor, ROLE_LABELS } from '../../config/roles'

function EmployeesHome() {
  const { user, can } = useAuth()
  const tasks = backOfficeMenuFor(can).filter((item) => item.label !== 'Homepage')

  return (
    <BackOfficeLayout title="Homepage">
      <p className="font-kanit text-[20px] text-ink">
        สวัสดี {user?.username} — สิทธิ์ระดับ{user?.role ? ROLE_LABELS[user.role] : ''}
      </p>
      <p className="mt-[6px] font-kanit text-[15px] text-ink-muted">
        เมนูด้านซ้ายแสดงเฉพาะงานที่สิทธิ์ของคุณเข้าถึงได้
      </p>

      <div className="mt-[28px] flex flex-wrap gap-[16px]">
        {tasks.flatMap((item) =>
          (item.children || [item]).map((task) => (
            <Link
              key={task.to}
              to={task.to!}
              className="flex h-[96px] w-[240px] items-center rounded-card border border-line bg-white px-[20px] font-kanit text-[18px] text-brand-green transition-shadow duration-300 hover:shadow-[0_6px_18px_rgba(26,26,23,0.12)]"
            >
              {task.label}
            </Link>
          )),
        )}
      </div>
    </BackOfficeLayout>
  )
}

export default EmployeesHome
