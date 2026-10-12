import { api } from './api';
import type { Plan } from '@/types';
import { MOCK_PLANS } from '@/mock/plans';
import { ENV } from '@/config/env';
export const plansService = {
  async list(): Promise<Plan[]> {
    if (ENV.useMocks) { await new Promise((r) => setTimeout(r, 100)); return MOCK_PLANS; }
    const { data } = await api.get<Plan[]>('/plans');
    return data;
  },
  async byId(id: string): Promise<Plan> {
    if (ENV.useMocks) {
      const p = MOCK_PLANS.find((x) => x.id === id);
      if (!p) throw { detail: 'Plano não encontrado', status: 404 };
      return p;
    }
    const { data } = await api.get<Plan>(`/plans/${id}`);
    return data;
  },
};
