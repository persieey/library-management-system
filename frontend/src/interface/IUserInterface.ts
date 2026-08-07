export type Role = 'user' | 'librarian' | 'staff' | 'manager' | 'admin'

export interface User {
  id: number
  username: string
  role: Role
  permissions: string[]
}
