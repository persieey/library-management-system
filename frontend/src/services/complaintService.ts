import { request } from './api';
import type { Complaint, CreateComplaintDTO, UpdateComplaintDTO } from '../interface/complaint';

export const complaintService = {
  // ดึงรายการข้อร้องเรียนทั้งหมด
  async getAll(): Promise<Complaint[]> {
    return request<Complaint[]>('/complaints');
  },

  // ดึงข้อร้องเรียนตาม ID
  async getById(id: string): Promise<Complaint> {
    return request<Complaint>(`/complaints/${id}`);
  },

  // บันทึกข้อร้องเรียนใหม่
  async create(data: CreateComplaintDTO): Promise<{ message: string; data: Complaint }> {
    return request<{ message: string; data: Complaint }>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // อัปเดตข้อร้องเรียน
  async update(id: string, data: UpdateComplaintDTO): Promise<{ message: string }> {
    return request<{ message: string }>(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
