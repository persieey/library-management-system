import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth ต้องอยู่ภายใน <AuthProvider>')
  return context
}
