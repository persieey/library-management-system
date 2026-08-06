import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { actionsFor, ROLES } from "../config/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // TODO: ต่อ POST /api/login ของ backend Go เมื่อพร้อม
  // การตรวจรหัสผ่านและการกำหนด role ต้องทำฝั่งเซิร์ฟเวอร์เท่านั้น
  // ตอนนี้เป็นตัวยึดให้ flow หน้าเว็บเดินได้ ยังไม่ได้ยืนยันตัวตนจริง
  const login = useCallback(async ({ username }) => {
    const account = { username, role: ROLES.USER };
    setUser(account);
    return account;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      actions: user ? actionsFor(user.role) : [],
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth ต้องอยู่ภายใน <AuthProvider>");
  return context;
}
