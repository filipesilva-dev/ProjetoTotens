import { api } from './api';
import type { Tenant } from '@/types';
export const tenantsService = {
  async list(): Promise<Tenant[]> {
    const { data } = await api.get<Tenant[]>('/admin/tenants');
    return data.map(t => ({ ...t, cnpj: t.cnpj ?? '' }));
  },
  async bySlug(slug: string): Promise<Tenant> {
    const { data } = await api.get<Tenant>(`/admin/tenants/${slug}`);
    return { ...data, cnpj: data.cnpj ?? '' };
  },
  async create(payload: Partial<Tenant>): Promise<Tenant> {
    const { data } = await api.post<Tenant>('/admin/tenants', payload);
    return { ...data, cnpj: data.cnpj ?? '' };
  },
  async update(id: string, payload: Partial<Tenant>): Promise<Tenant> {
    const { data } = await api.patch<Tenant>(`/admin/tenants/${id}`, payload);
    return { ...data, cnpj: data.cnpj ?? '' };
  },
  async updateStatus(id: string, status: Tenant['status']): Promise<void> {
    await api.patch(`/admin/tenants/${id}/status`, { status });
  },
  fiscal: async (id: string) => (await api.get<{ enabled: boolean; apiKeyConfigured: boolean }>(`/admin/tenants/${id}/fiscal`)).data,
  saveFiscal: async (id: string, enabled: boolean, apiKey?: string) =>
    (await api.put<{ enabled: boolean; apiKeyConfigured: boolean }>(`/admin/tenants/${id}/fiscal`, { enabled, api_key: apiKey || null })).data,
};
