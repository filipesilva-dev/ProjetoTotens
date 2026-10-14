import type { CartItem } from './product';
export type OrderStatus = 'PENDING_PAYMENT' | 'PROCESSING' | 'PAID' | 'CANCELED' | 'PREPARING' | 'READY' | 'DELIVERED';
export type PaymentMethod = 'PIX';
export interface PixCharge { orderId: string; qrCodeImage: string; copyPaste: string; amount: number; }
export interface Order {
  id: string; code: string; status: OrderStatus; items: CartItem[];
  subtotal: number; total: number; createdAt: string; totemId: string;
  customer?: { cpf?: string; email?: string };
}
