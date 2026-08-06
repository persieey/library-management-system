import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo-wordmark.png";
import chevronDown from "../assets/icons/chevron-down.svg";
import { useAuth } from "../context/AuthContext";
import LoginModal from "./LoginModal";

// เมนูย่อยของ Resources (Figma: Resources 48:132)
const RESOURCE_LINKS = [
  { label: "Books", to: "/books" },
  { label: "eBooks", to: "/ebooks" },
  { label: "Online Databases", to: "/online-databases" },
  { label: "BU Research", to: "/bu-research" },
  { label: "Theses", to: "/theses" },
  { label: "Online Resource", to: "/online-resource" },
];

function ResourcesMenu({ compact }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-[10px] font-kanit text-white transition-[font-size] duration-300 ${
          compact ? "text-[18px]" : "text-[22px]"
        }`}
      >
        Resources
        <img
          src={chevronDown}
          alt=""
          className={`h-[17px] w-[17px] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 w-[209px] bg-brand-green/80 py-[7px]">
          {RESOURCE_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block px-[12px] py-[10px] font-kanit text-[16px] text-white hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user, logout, actions } = useAuth();
  const [compact, setCompact] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navText = compact ? "text-[18px]" : "text-[22px]";

  return (
    <>
      {/* กันที่ให้ header ที่ลอยอยู่ ความสูงคงที่ เนื้อหาข้างล่างจะได้ไม่กระตุกตอนหด */}
      <div className="h-[110px]" aria-hidden />
      <header
        className={`fixed inset-x-0 top-0 z-50 bg-brand-green transition-[height,box-shadow] duration-300 ease-out ${
          compact ? "h-[72px] shadow-[0_4px_20px_rgba(0,0,0,0.25)]" : "h-[110px]"
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-[83px]">
          <Link to="/">
            <img
              src={logo}
              alt="Udompanya University"
              className={`object-contain transition-[height,width] duration-300 ease-out ${
                compact ? "h-[42px] w-[139px]" : "h-[65px] w-[215px]"
              }`}
            />
          </Link>

          {/* ระยะห่างแต่ละอันไม่เท่ากัน — อิงตำแหน่งจริงใน Figma (973 / 1100 / 1280) */}
          <nav className="flex items-center">
            {/* ปุ่มพิเศษมาจาก role ของบัญชีที่ล็อกอิน — ดู ROLE_ACTIONS ใน AuthContext */}
            {actions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={`mr-[72px] flex h-[35px] items-center justify-center rounded-[10px] bg-surface-muted px-[16px] font-kanit text-brand-green transition-[font-size] duration-300 ${navText}`}
              >
                {action.label}
              </Link>
            ))}
            <Link to="/" className={`font-kanit text-white transition-[font-size] duration-300 ${navText}`}>
              Home
            </Link>
            <div className="ml-[75px]">
              <ResourcesMenu compact={compact} />
            </div>
            {user ? (
              <button
                type="button"
                onClick={logout}
                className={`ml-[47px] font-kanit text-white transition-[font-size] duration-300 ${navText}`}
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className={`ml-[47px] font-kanit text-white transition-[font-size] duration-300 ${navText}`}
              >
                Sign in
              </button>
            )}
          </nav>
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export default Header;
