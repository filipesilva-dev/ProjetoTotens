import { useState } from 'react';
import { Button, Card, Text, Toast } from '@/components/ui';
import { useTenants } from '@/hooks/useTenants';
import { useInvoices } from '@/hooks/useInvoices';
import { formatBRL } from '@/utils/currency';

const PLAN_PRICES: Record<string, number> = { basic: 199, pro: 399, enterprise: 899 };
const PLAN_LABELS: Record<string, string> = { basic: 'Básico', pro: 'Pro', enterprise: 'Enterprise' };

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function SuperReports() {
  const { tenants } = useTenants();
  const { invoices } = useInvoices();
  const [toast, setToast] = useState<string | null>(null);

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const exportInvoicesCSV = () => {
    // TODO(backend): substituir por GET /reports/export/invoices.csv
    const rows: string[][] = [
      ['Número', 'Cliente', 'Slug', 'Plano', 'Valor', 'Status', 'Emissão', 'Vencimento', 'Pago em'],
      ...invoices.map((i) => [
        i.number, i.tenantName, i.tenantSlug, i.planName, String(i.amount), i.status,
        new Date(i.issuedAt).toLocaleDateString('pt-BR'),
        new Date(i.dueAt).toLocaleDateString('pt-BR'),
        i.paidAt ? new Date(i.paidAt).toLocaleDateString('pt-BR') : '',
      ]),
    ];
    downloadCSV(`fastlanches-boletos-${Date.now()}.csv`, rows);
    flash('CSV de boletos exportado');
  };

  const exportTenantsCSV = () => {
    // TODO(backend): substituir por GET /reports/export/tenants.csv
    const rows: string[][] = [
      ['Nome', 'Slug', 'CNPJ', 'Responsável', 'Email', 'Plano', 'Status', 'Totens', 'Cliente desde'],
      ...tenants.map((t) => [
        t.name, t.slug, t.cnpj, t.ownerName, t.ownerEmail,
        PLAN_LABELS[t.planId] ?? t.planId, t.status, String(t.totemCount),
        new Date(t.createdAt).toLocaleDateString('pt-BR'),
      ]),
    ];
    downloadCSV(`fastlanches-clientes-${Date.now()}.csv`, rows);
    flash('CSV de clientes exportado');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <Text as="h1" size="3xl" weight="black">Relatórios</Text>
          <Text tone="muted" size="sm">Indicadores financeiros e de clientes</Text>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={exportTenantsCSV}>Exportar clientes</Button>
          <Button onClick={exportInvoicesCSV}>Exportar boletos</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        <Card padding="lg"><Text tone="muted" size="sm">Recebido</Text><Text size="2xl" weight="black" tone="primary">{formatBRL(totalPaid)}</Text></Card>
        <Card padding="lg"><Text tone="muted" size="sm">A receber</Text><Text size="2xl" weight="black">{formatBRL(totalPending)}</Text></Card>
        <Card padding="lg"><Text tone="muted" size="sm">Em atraso</Text><Text size="2xl" weight="black" tone="danger">{formatBRL(totalOverdue)}</Text></Card>
        <Card padding="lg"><Text tone="muted" size="sm">Clientes</Text><Text size="2xl" weight="black">{tenants.length}</Text></Card>
      </div>

      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Por plano</Text>
        {(['basic', 'pro', 'enterprise'] as const).map((pid) => {
          const list = tenants.filter((t) => t.planId === pid);
          const total = list.length * (PLAN_PRICES[pid] ?? 0);
          return (
            <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <Text weight="bold">{PLAN_LABELS[pid]}</Text>
                <Text tone="muted" size="sm">{list.length} clientes</Text>
              </div>
              <Text weight="black" size="lg">{formatBRL(total)}/mês</Text>
            </div>
          );
        })}
      </Card>

      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Distribuição de clientes por status</Text>
        {(['active', 'trial', 'past_due', 'suspended', 'cancelled'] as const).map((status) => {
          const count = tenants.filter((t) => t.status === status).length;
          const pct = tenants.length ? Math.round((count / tenants.length) * 100) : 0;
          return (
            <div key={status} style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text weight="semibold" size="sm">
                  {status === 'active' ? 'Ativos' : status === 'trial' ? 'Em teste' : status === 'past_due' ? 'Em atraso' : status === 'suspended' ? 'Suspensos' : 'Cancelados'}
                </Text>
                <Text weight="black" size="sm">{count} · {pct}%</Text>
              </div>
              <div style={{ height: 10, background: 'var(--color-surface-2)', borderRadius: 5 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gradient-super)', borderRadius: 5 }} />
              </div>
            </div>
          );
        })}
      </Card>

      <Toast message={toast} tone="success" onClose={() => setToast(null)} />
    </div>
  );
}
