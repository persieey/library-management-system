import { apiFetch } from './index'
import type { Personnel, PersonnelFormData, PersonnelStatus } from '../../interface/IPersonnelInterface'

interface PersonnelResponse {
  id: number
  staff_id: string
  first_name: string
  last_name: string
  department: string
  position: string
  email: string
  phone: string
  start_date: string
  status: PersonnelStatus
}

export function toPersonnel(res: PersonnelResponse): Personnel {
  return {
    id: res.id,
    staffId: res.staff_id,
    firstName: res.first_name,
    lastName: res.last_name,
    department: res.department,
    position: res.position,
    email: res.email,
    phone: res.phone,
    startDate: res.start_date,
    status: res.status,
  }
}

function toRequest(data: PersonnelFormData) {
  return {
    staff_id: data.staffId,
    first_name: data.firstName,
    last_name: data.lastName,
    department: data.department,
    position: data.position,
    email: data.email,
    phone: data.phone,
    start_date: data.startDate,
    status: data.status,
  }
}

export async function listPersonnel(token: string): Promise<Personnel[]> {
  const people = await apiFetch<PersonnelResponse[]>('/api/v1/personnel', { token })
  return people.map(toPersonnel)
}

export async function createPersonnel(token: string, data: PersonnelFormData): Promise<Personnel> {
  const created = await apiFetch<PersonnelResponse>('/api/v1/personnel', {
    method: 'POST',
    token,
    body: toRequest(data),
  })
  return toPersonnel(created)
}

export async function updatePersonnel(
  token: string,
  id: number,
  data: PersonnelFormData,
): Promise<Personnel> {
  const updated = await apiFetch<PersonnelResponse>(`/api/v1/personnel/${id}`, {
    method: 'PATCH',
    token,
    body: toRequest(data),
  })
  return toPersonnel(updated)
}

export function deletePersonnel(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/v1/personnel/${id}`, { method: 'DELETE', token })
}

export async function togglePersonnelStatus(token: string, id: number): Promise<Personnel> {
  const person = await apiFetch<PersonnelResponse>(`/api/v1/personnel/${id}/status`, {
    method: 'POST',
    token,
  })
  return toPersonnel(person)
}
