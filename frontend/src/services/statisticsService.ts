import { request } from './api';
import type {
  SummaryStats,
  BookStat,
  ReturnStats,
  RoomStats,
  EbookStats,
  EquipmentStats,
} from '../interface/statistics';

export interface FilterParams {
  period?: string;
  startDate?: string;
  endDate?: string;
}

function buildQueryString(params?: FilterParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.append('period', params.period);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const statisticsService = {
  async getSummary(params?: FilterParams): Promise<SummaryStats> {
    return request<SummaryStats>(`/statistics/summary${buildQueryString(params)}`);
  },

  async getBooks(params?: FilterParams): Promise<BookStat[]> {
    return request<BookStat[]>(`/statistics/books${buildQueryString(params)}`);
  },

  async getReturns(params?: FilterParams): Promise<ReturnStats> {
    return request<ReturnStats>(`/statistics/returns${buildQueryString(params)}`);
  },

  async getRooms(params?: FilterParams): Promise<RoomStats> {
    return request<RoomStats>(`/statistics/rooms${buildQueryString(params)}`);
  },

  async getEbooks(params?: FilterParams): Promise<EbookStats> {
    return request<EbookStats>(`/statistics/ebooks${buildQueryString(params)}`);
  },

  async getEquipment(params?: FilterParams): Promise<EquipmentStats> {
    return request<EquipmentStats>(`/statistics/equipment${buildQueryString(params)}`);
  },
};
