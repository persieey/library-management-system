export interface EventItem {
  id: number
  image: string
  date: string // ISO string
  allDay: boolean
  title: string
  location: string
  description: string
}

export interface EventDraft {
  image: string
  date: string
  allDay: boolean
  title: string
  location: string
  description: string
}
