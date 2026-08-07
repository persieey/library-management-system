import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Personnel, PersonnelFormData } from '../interface/IPersonnelInterface'

export const DEPARTMENTS = [
  'งานบริการยืม-คืน',
  'งานประชาสัมพันธ์',
  'งานพัฒนาทรัพยากร',
  'งานบริการสารสนเทศ',
  'งานเทคโนโลยีสารสนเทศ',
  'งานธุรการ',
]

const MOCK_PERSONNEL: Personnel[] = [
  { id: 1, staffId: 'ST001', firstName: 'สมชาย', lastName: 'ใจดี', department: 'งานบริการยืม-คืน', position: 'บรรณารักษ์', email: 'somchai@lib.ac.th', phone: '081-234-5678', startDate: '2018-05-01', status: 'active' },
  { id: 2, staffId: 'ST002', firstName: 'วิภา', lastName: 'รักเรียน', department: 'งานประชาสัมพันธ์', position: 'เจ้าหน้าที่', email: 'wipa@lib.ac.th', phone: '082-345-6789', startDate: '2020-03-15', status: 'active' },
  { id: 3, staffId: 'ST003', firstName: 'ประยูร', lastName: 'แสงทอง', department: 'งานพัฒนาทรัพยากร', position: 'บรรณารักษ์', email: 'prayoon@lib.ac.th', phone: '083-456-7890', startDate: '2015-09-01', status: 'active' },
  { id: 4, staffId: 'ST004', firstName: 'นภา', lastName: 'ดวงดี', department: 'งานบริการสารสนเทศ', position: 'เจ้าหน้าที่', email: 'napa@lib.ac.th', phone: '084-567-8901', startDate: '2021-06-01', status: 'active' },
  { id: 5, staffId: 'ST005', firstName: 'อนุชา', lastName: 'ศรีสุข', department: 'งานเทคโนโลยีสารสนเทศ', position: 'นักวิชาการ', email: 'anucha@lib.ac.th', phone: '085-678-9012', startDate: '2019-01-07', status: 'active' },
  { id: 6, staffId: 'ST006', firstName: 'มาลี', lastName: 'บุญมาก', department: 'งานบริการยืม-คืน', position: 'เจ้าหน้าที่', email: 'malee@lib.ac.th', phone: '086-789-0123', startDate: '2017-11-20', status: 'inactive' },
]

interface PersonnelContextValue {
  personnel: Personnel[]
  add: (data: PersonnelFormData) => void
  update: (id: number, data: PersonnelFormData) => void
  remove: (id: number) => void
  toggleStatus: (id: number) => void
}

const PersonnelContext = createContext<PersonnelContextValue | null>(null)

export function PersonnelProvider({ children }: { children: ReactNode }) {
  const [personnel, setPersonnel] = useState<Personnel[]>(MOCK_PERSONNEL)
  const [nextId, setNextId] = useState(MOCK_PERSONNEL.length + 1)

  const add = (data: PersonnelFormData) => {
    setPersonnel((prev) => [...prev, { id: nextId, ...data }])
    setNextId((n) => n + 1)
  }

  const update = (id: number, data: PersonnelFormData) => {
    setPersonnel((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }

  const remove = (id: number) => {
    setPersonnel((prev) => prev.filter((p) => p.id !== id))
  }

  const toggleStatus = (id: number) => {
    setPersonnel((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p)),
    )
  }

  return (
    <PersonnelContext.Provider value={{ personnel, add, update, remove, toggleStatus }}>
      {children}
    </PersonnelContext.Provider>
  )
}

export function usePersonnel() {
  const ctx = useContext(PersonnelContext)
  if (!ctx) throw new Error('usePersonnel must be used within PersonnelProvider')
  return ctx
}
