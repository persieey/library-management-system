export type PersonnelStatus = 'active' | 'inactive'

export interface Personnel {
  id: number
  staffId: string
  firstName: string
  lastName: string
  department: string
  position: string
  email: string
  phone: string
  startDate: string // ISO date string
  status: PersonnelStatus
}

export type PersonnelFormData = Omit<Personnel, 'id'>
