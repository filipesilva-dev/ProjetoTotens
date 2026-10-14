import { api } from './api';
import type { Plan } from '@/types';
export const plansService = {
  async listAll(): Promise<Plan[]> {
    const { data } = await api.get<Plan[]>('/admin/plans');
    return data.map(p => ({ ...p, priceMonthly: Number(p.priceMonthly), priceYearly: Number(p.priceYearly) }));
  },
  async list(): Promise<Plan[]> {
    const { data } = await api.get<Plan[]>('/plans');
    return data.map(p => ({ ...p, priceMonthly: Number(p.priceMonthly), priceYearly: Number(p.priceYearly) }));
  },
  async byId(id: string): Promise<Plan> {
    const { data } = await api.get<Plan>(`/plans/${id}`);
    return data;
  },
  async create(payload: Partial<Plan>): Promise<Plan> {
    const { data } = await api.post<Plan>('/admin/plans', payload);
    return data;
  },
  async update(id: string, payload: Partial<Plan>): Promise<Plan> {
    const { data } = await api.patch<Plan>(`/admin/plans/${id}`, payload);
    return data;
  },
};
