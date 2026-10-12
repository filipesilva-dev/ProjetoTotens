import { api } from './api';
import type { CartItem, Order } from '@/types';
import { ENV } from '@/config/env';

export interface CreateOrderPayload {
  items: CartItem[];
  customer?: { cpf?: string; email?: string };
  paymentMethod: 'PIX';
}

/**
 * Serviço de pedidos.
 *
 * Contrato esperado do backend FastAPI:
 *   POST /api/orders         → Order
 *   GET  /api/orders/:id     → Order
 *   GET  /api/orders         → Order[]
 *
 * Enquanto VITE_USE_MOCKS=true, simula a criação com um `totemId` fixo
 * (o backend real vai preencher isso com o totem que originou o pedido).
 */
export const ordersService = {
  async create(payload: CreateOrderPayload): Promise<Order> {
    if (ENV.useMocks) {
      await new Promise((r) => setTimeout(r, 300));
      const subtotal = payload.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      return {
        id: 'mock-order-' + Date.now(),
        code: String(Math.floor(Math.random() * 900) + 100),
        status: 'PENDING_PAYMENT',
        items: payload.items,
        subtotal,
        total: subtotal,
        createdAt: new Date().toISOString(),
        totemId: 'Totem 1', // ← mock; o backend real preenche com o totem físico
        customer: payload.customer,
      };
    }
    const { data } = await api.post<Order>('/orders', payload);
    return data;
  },

  async list(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },

  async get(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },
};
