import { api } from './api';

export interface Manager {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'gerente';
  active: boolean;
}

const path = (tenantId: string) => `/admin/tenants/${tenantId}/managers`;

export const managersService = {
  list: async (tenantId: string): Promise<Manager[]> => (await api.get<Manager[]>(path(tenantId))).data,
  create: async (tenantId: string, data: { name: string; email: string; password: string }): Promise<Manager> =>
    (await api.post<Manager>(path(tenantId), data)).data,
  update: async (tenantId: string, userId: string, data: { name?: string; email?: string; active?: boolean }): Promise<Manager> =>
    (await api.patch<Manager>(`${path(tenantId)}/${userId}`, data)).data,
  resetPassword: async (tenantId: string, userId: string, password: string): Promise<void> => {
    await api.post(`${path(tenantId)}/${userId}/reset-password`, { password });
  },
};
