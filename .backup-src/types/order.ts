import type { CartItem } from './product';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PROCESSING'
  | 'PAID'
  | 'CANCELED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED';

export type PaymentMethod = 'PIX';

export interface PixCharge {
  orderId: string;
  qrCodeImage: string;
  copyPaste: string;
  amount: number;
}

/**
 * Pedido feito em um totem de autoatendimento.
 *
 * Não existe "mesa" — o cliente retira no balcão quando a senha é chamada.
 * `totemId` identifica qual totem gerou o pedido (útil quando há mais de um).
 */
export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  /** Identificador do totem físico (ex: "Totem 1", "Totem 2"). */
  totemId: string;
  customer?: { cpf?: string; email?: string };
}
