import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

// การ์ดล็อกอินตาม Figma (log in 55:248) ขนาด 400x450 — ตัดปุ่ม Employees ออก
// เพราะสิทธิ์มาจาก role ของบัญชีที่ล็อกอิน ไม่ใช่ปุ่มแยก
function LoginModal({ open, onClose }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const usernameRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    usernameRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setUsername("");
      setPassword("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await login({ username: username.trim(), password });
      onClose();
    } catch {
      setError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    "h-[35px] w-[291px] rounded-[5px] border-[0.5px] border-[rgba(124,124,124,0.25)] bg-white px-[10px] font-kanit text-[12px] text-black outline-none focus:border-accent-green";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 motion-safe:animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        onSubmit={handleSubmit}
        className="w-[400px] rounded-[50px] bg-white px-[57px] pb-[40px] pt-[50px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] motion-safe:animate-pop-in"
      >
        <h2 id="login-title" className="font-kanit text-[24px] font-bold text-black">
          Welcome to library
        </h2>
        <p className="mt-[8px] font-kanit text-[12px] font-extralight text-black/80">
          Enter your username to log in your account
        </p>

        <label htmlFor="login-username" className="mt-[27px] block font-kanit text-[12px] font-light text-black">
          Username
        </label>
        <input
          id="login-username"
          ref={usernameRef}
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`mt-[9px] ${fieldClass}`}
        />

        <label htmlFor="login-password" className="mt-[23px] block font-kanit text-[12px] font-light text-black">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-[9px] ${fieldClass}`}
        />

        <div className="mt-[11px] flex justify-end">
          <a href="/forgot-password" className="font-kanit text-[12px] font-bold text-black underline">
            Forgot password
          </a>
        </div>

        {error && <p className="mt-[10px] font-kanit text-[12px] text-terracotta-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-[26px] h-[40px] w-[295px] rounded-[50px] bg-black font-kanit text-[14px] text-white disabled:opacity-60"
        >
          {submitting ? "กำลังเข้าสู่ระบบ..." : "Log in"}
        </button>
      </form>
    </div>
  );
}

export default LoginModal;
