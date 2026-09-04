export interface Complaint {
  complaint_id: string;
  user_id?: number | string | null;
  department_id?: string | null;
  department_name?: string;
  topic: string;
  category: string;
  description: string;
  location?: string;
  priority?: string;
  attached_image?: string;
  submit_date: string;
  submit_time: string;
  status: string;
  inspector_report?: string;
  reject_reason?: string;
  resolution_summary?: string;
  resolution_image?: string;
  inspector_name?: string;
}

export interface DisplayComplaint extends Complaint {
  id?: string;
  date?: string;
  time?: string;
  externalUnit?: string;
  inspectorReport?: string;
  rejectReason?: string;
  resolutionSummary?: string;
  resolutionImage?: string;
}

export interface CreateComplaintDTO {
  topic: string;
  category: string;
  description: string;
  location?: string;
  priority?: string;
  attached_image?: string;
  user_id?: number | string;
}

export interface UpdateComplaintDTO {
  status?: string;
  department_id?: string;
  external_unit?: string;
  inspector_report?: string;
  reject_reason?: string;
  resolution_summary?: string;
  resolution_image?: string;
  employee_id?: number | string;
}
