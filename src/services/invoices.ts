import { api } from './api';
import type { Invoice } from '@/types';
import { MOCK_INVOICES } from '@/mock/invoices';
import { ENV } from '@/config/env';
export const invoicesService = {
  async list(): Promise<Invoice[]> {
    if (ENV.useMocks) { await new Promise((r) => setTimeout(r, 150)); return MOCK_INVOICES; }
    const { data } = await api.get<Invoice[]>('/invoices');
    return data;
  },
  async byId(id: string): Promise<Invoice> {
    if (ENV.useMocks) {
      const i = MOCK_INVOICES.find((x) => x.id === id);
      if (!i) throw { detail: 'Boleto não encontrado', status: 404 };
      return i;
    }
    const { data } = await api.get<Invoice>(`/invoices/${id}`);
    return data;
  },
  async create(payload: Partial<Invoice>): Promise<Invoice> {
    if (ENV.useMocks) {
      await new Promise((r) => setTimeout(r, 400));
      return { ...MOCK_INVOICES[0]!, ...payload, id: 'inv-' + Date.now() };
    }
    const { data } = await api.post<Invoice>('/invoices', payload);
    return data;
  },
};
