import { api } from './api';
import type { Invoice } from '@/types';
export const invoicesService = {
  async list(): Promise<Invoice[]> {
    const { data } = await api.get<Invoice[]>('/admin/invoices');
    return data.map(i => ({ ...i, amount: Number(i.amount) }));
  },
  async byId(id: string): Promise<Invoice> {
    const { data } = await api.get<Invoice>(`/admin/invoices/${id}`);
    return data;
  },
  async create(payload: Partial<Invoice>): Promise<Invoice> {
    const { data } = await api.post<Invoice>('/admin/invoices', payload);
    return { ...data, amount: Number(data.amount) };
  },
  async cancel(id: string): Promise<Invoice> {
    const { data } = await api.post<Invoice>(`/admin/invoices/${id}/cancel`);
    return { ...data, amount: Number(data.amount) };
  },
  resend: (id: string) => api.post(`/admin/invoices/${id}/resend`),
  async downloadPdf(id: string, number: string) {
    const { data } = await api.get<Blob>(`/admin/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url; link.download = `instrucoes-boleto-${number}.pdf`; link.click();
    URL.revokeObjectURL(url);
  },
};
