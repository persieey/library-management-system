import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import seal from '../assets/logo.png'
import wordmark from '../assets/logo-wordmark.png'
import chevronDown from '../assets/icons/chevron-down.svg'
import { useAuth } from '../auth/useAuth'
import { backOfficeMenuFor, ROLE_LABELS, type NavAction } from '../config/roles'

const ROW = 'flex h-[35px] items-center border-b-[0.5px] border-[rgba(148,148,148,0.6)] px-[11px] font-kanit text-[16px]'

function MenuRow({ item, active }: { item: NavAction; active: boolean }) {
  return (
    <Link
      to={item.to!}
      className={`${ROW} ${active ? 'bg-[#f8f5ee] text-brand-green' : 'bg-brand-green text-white hover:bg-white/10'}`}
    >
      {item.label}
    </Link>
  )
}

function MenuGroup({ item, pathname }: { item: NavAction; pathname: string }) {
  const hasActiveChild = item.children?.some((child) => child.to === pathname) ?? false
  const [open, setOpen] = useState(hasActiveChild)

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${ROW} w-full justify-between bg-brand-green text-white hover:bg-white/10`}
      >
        {item.label}
        <img
          src={chevronDown}
          alt=""
          className={`h-[11px] w-[11px] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open &&
        item.children?.map((child) => (
          <Link
            key={child.to}
            to={child.to!}
            className={`${ROW} pl-[42px] ${
              child.to === pathname
                ? 'bg-[#f8f5ee] text-brand-green'
                : 'bg-brand-green text-white hover:bg-white/10'
            }`}
          >
            {child.label}
          </Link>
        ))}
    </>
  )
}

function BackOfficeLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, logout, can } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const menu = backOfficeMenuFor(can)

  const handleLogout = async () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex h-[100px] border-b border-[#e5e5e5]">
        <Link to="/" className="flex w-[250px] shrink-0 items-center gap-[10px] bg-brand-green px-[10px]">
          <img src={seal} alt="" className="h-[80px] w-[80px] object-contain" />
          <img src={wordmark} alt="Udompanya University" className="h-[40px] w-[132px] object-contain" />
        </Link>

        <div className="flex flex-1 items-center justify-between px-[35px]">
          <h1 className="font-kanit text-[36px] text-brand-green">{title}</h1>

          <div className="flex items-center gap-[20px]">
            <button
              type="button"
              onClick={handleLogout}
              className="h-[40px] w-[120px] rounded-[5px] bg-brand-green font-kanit text-[22px] text-white"
            >
              Log out
            </button>
            <div className="flex items-center gap-[10px]">
              <span className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-brand-green font-kanit text-[18px] uppercase text-white">
                {user?.username?.slice(0, 2)}
              </span>
              <div className="font-kanit leading-tight">
                <p className="text-[15px] text-ink">{user?.username}</p>
                <p className="text-[13px] text-ink-muted">{user?.role ? ROLE_LABELS[user.role] : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-100px)]">
        <nav className="w-[250px] shrink-0 bg-brand-green">
          {menu.map((item) =>
            item.children ? (
              <MenuGroup key={item.label} item={item} pathname={pathname} />
            ) : (
              <MenuRow key={item.to} item={item} active={item.to === pathname} />
            ),
          )}
        </nav>

        <main className="flex-1 px-[35px] py-[25px]">{children}</main>
      </div>
    </div>
  )
}

export default BackOfficeLayout
