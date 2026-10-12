import { Text } from '@/components/ui';
import type { InvoiceStatus } from '@/types';
import './InvoiceStatusBadge.css';
const LABELS: Record<InvoiceStatus, { label: string; tone: string }> = {
  pending:   { label: 'Pendente',    tone: 'info' },
  paid:      { label: 'Pago',        tone: 'success' },
  overdue:   { label: 'Vencido',     tone: 'danger' },
  cancelled: { label: 'Cancelado',   tone: 'muted' },
  refunded:  { label: 'Estornado',   tone: 'warning' },
};
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const meta = LABELS[status];
  return (
    <span className={`isb isb--${meta.tone}`}>
      <Text as="span" size="xs" weight="bold">{meta.label}</Text>
    </span>
  );
}
