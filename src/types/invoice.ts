export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export interface Invoice {
  id: string; number: string; tenantId: string; tenantName: string;
  tenantSlug: string; planId: string; planName: string; amount: number;
  status: InvoiceStatus; issuedAt: string; dueAt: string; paidAt?: string;
  boletoUrl?: string; barcode?: string; pixQrImage?: string;
  pixCopyPaste?: string; notes?: string;
}
