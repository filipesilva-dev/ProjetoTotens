import { api } from './api';
import type { Tenant } from '@/types';
import { MOCK_TENANTS } from '@/mock/tenants';
import { ENV } from '@/config/env';
export const tenantsService = {
  async list(): Promise<Tenant[]> {
    if (ENV.useMocks) { await new Promise((r) => setTimeout(r, 150)); return MOCK_TENANTS; }
    const { data } = await api.get<Tenant[]>('/tenants');
    return data;
  },
  async bySlug(slug: string): Promise<Tenant> {
    if (ENV.useMocks) {
      const t = MOCK_TENANTS.find((x) => x.slug === slug);
      if (!t) throw { detail: 'Estabelecimento não encontrado', status: 404 };
      return t;
    }
    const { data } = await api.get<Tenant>(`/tenants/${slug}`);
    return data;
  },
  async create(payload: Partial<Tenant>): Promise<Tenant> {
    if (ENV.useMocks) {
      await new Promise((r) => setTimeout(r, 400));
      return { ...MOCK_TENANTS[0]!, ...payload, id: 't-' + Date.now() };
    }
    const { data } = await api.post<Tenant>('/tenants', payload);
    return data;
  },
  async updateStatus(id: string, status: Tenant['status']): Promise<void> {
    if (ENV.useMocks) { await new Promise((r) => setTimeout(r, 200)); return; }
    await api.patch(`/tenants/${id}/status`, { status });
  },
};
