import { api } from './api';

export interface FiscalInvoice {
  id: string;
  orderId: string;
  status: string;
  number?: string;
  pdfUrl?: string;
  error?: string;
}

export const fiscalService = {
  list: async () => (await api.get<FiscalInvoice[]>('/fiscal-invoices')).data,
  refresh: async (id: string) => (await api.get<FiscalInvoice>(`/fiscal-invoices/${id}`)).data,
  retry: async (id: string) => (await api.post<FiscalInvoice>(`/fiscal-invoices/${id}/retry`)).data,
  async download(id: string) {
    const { data } = await api.get<Blob>(`/fiscal-invoices/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a'); link.href = url; link.download = `nfce-${id}.pdf`; link.click();
    URL.revokeObjectURL(url);
  },
};
