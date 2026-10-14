import { api } from './api';
import type { CartItem, Order } from '@/types';
export interface CreateOrderPayload {
  items: CartItem[];
  customer?: { cpf?: string; email?: string };
  paymentMethod: 'PIX';
}
export const ordersService = {
  async create(payload: CreateOrderPayload): Promise<Order> {
    const idempotencyKey = crypto.randomUUID();
    const { data } = await api.post<Order>('/orders', { ...payload,
      items: payload.items.map(i => ({ productId: i.productId, quantity: i.quantity,
        removedIngredients: i.removedIngredients, additions: i.additions, notes: i.notes })) },
      { headers: { 'Idempotency-Key': idempotencyKey } });
    return { ...data, subtotal: Number(data.subtotal), total: Number(data.total) };
  },
  async list(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders');
    return data.map(o => ({ ...o, subtotal: Number(o.subtotal), total: Number(o.total) }));
  },
  status: async (id: string, status: Order['status']) => (await api.patch<Order>(`/orders/${id}/status`, null, { params: { status } })).data,
  async downloadKitchenTicket(id: string) {
    const { data } = await api.get<Blob>(`/orders/${id}/kitchen-ticket`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const tab = window.open(url, '_blank');
    if (!tab) {
      const a = document.createElement('a'); a.href = url; a.download = `comanda-${id}.pdf`; a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
};
