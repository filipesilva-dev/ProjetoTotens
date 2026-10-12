import { api } from './api';
import type { CartItem, Order } from '@/types';
import { ENV } from '@/config/env';
export interface CreateOrderPayload {
  items: CartItem[];
  customer?: { cpf?: string; email?: string };
  paymentMethod: 'PIX';
}
export const ordersService = {
  async create(payload: CreateOrderPayload): Promise<Order> {
    if (ENV.useMocks) {
      await new Promise((r) => setTimeout(r, 300));
      const subtotal = payload.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      return { id: 'mock-' + Date.now(), code: String(Math.floor(Math.random() * 900) + 100),
        status: 'PENDING_PAYMENT', items: payload.items, subtotal, total: subtotal,
        createdAt: new Date().toISOString(), totemId: 'Totem 1', customer: payload.customer };
    }
    const idempotencyKey = crypto.randomUUID();
    const { data } = await api.post<Order>('/orders', payload, { headers: { 'Idempotency-Key': idempotencyKey } });
    return data;
  },
  async list(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },
};
