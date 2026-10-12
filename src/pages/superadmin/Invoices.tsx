import { useState } from 'react';
import { Button, Card, Text } from '@/components/ui';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceStatusBadge } from '@/components/superadmin/InvoiceStatusBadge';
import { formatBRL } from '@/utils/currency';
import { formatDateBR } from '@/utils/date';
import type { Invoice, InvoiceStatus } from '@/types';
import './Invoices.css';
const FILTERS: Array<{ id: 'all' | InvoiceStatus; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'paid', label: 'Pagos' },
  { id: 'overdue', label: 'Vencidos' },
];
export default function Invoices() {
  const { invoices } = useInvoices();
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const filtered = invoices.filter((i) => filter === 'all' || i.status === filter);
  const total = filtered.reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === 'overdue');
  return (
    <div className="inv">
      <div>
        <Text as="h1" size="3xl" weight="black">Boletos</Text>
        <Text tone="muted" size="sm">{filtered.length} boletos · {formatBRL(total)} no período</Text>
      </div>
      {overdue.length > 0 && (
        <div className="inv__alert">
          <Text weight="bold" size="lg">⚠️ {overdue.length} boletos vencidos</Text>
          <Text tone="muted">{formatBRL(overdue.reduce((s, i) => s + i.amount, 0))} em aberto</Text>
        </div>
      )}
      <div className="inv__toolbar">
        <div className="inv__filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={`inv__filter ${filter === f.id ? 'inv__filter--on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <Button>+ Emitir boleto</Button>
      </div>
      <Card padding="sm">
        <div className="inv__head">
          <Text weight="bold" size="xs" tone="muted">NÚMERO</Text>
          <Text weight="bold" size="xs" tone="muted">CLIENTE</Text>
          <Text weight="bold" size="xs" tone="muted">PLANO</Text>
          <Text weight="bold" size="xs" tone="muted">VENCIMENTO</Text>
          <Text weight="bold" size="xs" tone="muted">STATUS</Text>
          <Text weight="bold" size="xs" tone="muted" style={{ textAlign: 'right' }}>VALOR</Text>
        </div>
        {filtered.map((i) => <InvoiceRow key={i.id} invoice={i} />)}
      </Card>
    </div>
  );
}
function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="inv__block">
      <button className="inv__row" onClick={() => setExpanded(!expanded)}>
        <Text weight="bold" tone="primary">#{invoice.number}</Text>
        <div>
          <Text weight="semibold">{invoice.tenantName}</Text>
          <Text tone="muted" size="xs">{invoice.tenantSlug}</Text>
        </div>
        <Text tone="muted" size="sm">{invoice.planName}</Text>
        <Text tone="muted" size="sm">{formatDateBR(invoice.dueAt)}</Text>
        <InvoiceStatusBadge status={invoice.status} />
        <Text weight="black" style={{ textAlign: 'right' }}>{formatBRL(invoice.amount)}</Text>
      </button>
      {expanded && (
        <div className="inv__detail">
          <div><Text tone="muted" size="xs">Emitido em</Text><Text weight="semibold">{formatDateBR(invoice.issuedAt)}</Text></div>
          <div><Text tone="muted" size="xs">Vence em</Text><Text weight="semibold">{formatDateBR(invoice.dueAt)}</Text></div>
          {invoice.paidAt && <div><Text tone="muted" size="xs">Pago em</Text><Text weight="semibold">{formatDateBR(invoice.paidAt)}</Text></div>}
          <div className="inv__actions">
            <Button variant="ghost" size="sm">Baixar PDF</Button>
            <Button variant="ghost" size="sm">Reenviar por email</Button>
            <Button variant="ghost" size="sm"><span style={{ color: 'var(--color-danger)' }}>Cancelar</span></Button>
          </div>
        </div>
      )}
    </div>
  );
}
