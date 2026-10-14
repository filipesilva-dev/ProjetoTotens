import { api } from './api';
import type { PixCharge } from '@/types';
let pendingOrderId: string | undefined;

export const paymentsService = {
  async createPixCharge(orderId: string): Promise<PixCharge> {
    const { data } = await api.post<PixCharge>('/payments/pix', { orderId });
    pendingOrderId = orderId;
    return { ...data, amount: Number(data.amount) };
  },
  status: async (orderId: string) => (await api.get<{ status: string }>(`/payments/${orderId}/status`)).data,
  cancel: async (orderId: string) => (await api.post(`/payments/${orderId}/cancel`)).data,
  simulate: async (orderId: string) => (await api.post(`/payments/${orderId}/simulate`)).data,
  currentOrderId: () => pendingOrderId,
};
