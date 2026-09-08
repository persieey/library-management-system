export const COMPLAINT_STATUS = {
  PENDING_INSPECTION: 'รอตรวจสอบ',
  AWAITING_SUPERVISOR: 'รอหัวหน้าพิจารณา',
  COORDINATING: 'อยู่ระหว่างประสานงาน',
  IN_PROGRESS: 'กำลังดำเนินงาน',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
} as const;

export type ComplaintStatusType = typeof COMPLAINT_STATUS[keyof typeof COMPLAINT_STATUS];

export const STATUS_MAP: Record<string, string> = {
  'Pending Inspection': COMPLAINT_STATUS.PENDING_INSPECTION,
  'Awaiting Supervisor': COMPLAINT_STATUS.AWAITING_SUPERVISOR,
  'Coordinating': COMPLAINT_STATUS.COORDINATING,
  'In Progress': COMPLAINT_STATUS.IN_PROGRESS,
  'Completed': COMPLAINT_STATUS.COMPLETED,
  'Cancelled': COMPLAINT_STATUS.CANCELLED,
  'กำลังดำเนินการ': COMPLAINT_STATUS.IN_PROGRESS,
};

export function getStatusClass(status: string): string {
  switch (status) {
    case COMPLAINT_STATUS.PENDING_INSPECTION:
      return 'status-warning';
    case COMPLAINT_STATUS.AWAITING_SUPERVISOR:
      return 'status-purple';
    case COMPLAINT_STATUS.IN_PROGRESS:
    case 'กำลังดำเนินการ':
      return 'status-blue';
    case COMPLAINT_STATUS.COORDINATING:
      return 'status-info';
    case COMPLAINT_STATUS.COMPLETED:
      return 'status-success';
    case COMPLAINT_STATUS.CANCELLED:
      return 'status-danger';
    default:
      return '';
  }
}

export function getPriorityInfo(priority?: string): { label: string; className: string } {
  if (priority === 'ด่วนที่สุด') {
    return { label: '🔴 ด่วนที่สุด', className: 'priority-critical' };
  }
  if (priority === 'ด่วน') {
    return { label: '🟠 ด่วน', className: 'priority-high' };
  }
  return { label: '🟢 ปกติ', className: 'priority-normal' };
}
