import { useEffect, useState } from 'react';
import { Button, Card, Text, Toast } from '@/components/ui';
import { useTenants } from '@/hooks/useTenants';
import { useInvoices } from '@/hooks/useInvoices';
import { formatBRL } from '@/utils/currency';
import { api } from '@/services/api';
import { plansService } from '@/services/plans';
import type { Plan } from '@/types';

async function downloadCSV(filename: string, endpoint: string) {
  const { data } = await api.get<Blob>(endpoint, { responseType: 'blob' });
  const blob = data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function SuperReports() {
  const { tenants } = useTenants();
  const { invoices } = useInvoices();
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => { void plansService.listAll().then(setPlans); }, []);
  const [toast, setToast] = useState<string | null>(null);

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const exportInvoicesCSV = async () => {
    try { await downloadCSV('fastlanches-boletos.csv', '/admin/reports/export/invoices.csv'); flash('CSV de boletos exportado'); }
    catch { flash('Falha ao exportar boletos'); }
  };

  const exportTenantsCSV = async () => {
    try { await downloadCSV('fastlanches-clientes.csv', '/admin/reports/export/tenants.csv'); flash('CSV de clientes exportado'); }
    catch { flash('Falha ao exportar clientes'); }
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
        {plans.map((plan) => {
          const list = tenants.filter((t) => t.planId === plan.slug);
          const total = list.length * plan.priceMonthly;
          return (
            <div key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <Text weight="bold">{plan.name}</Text>
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
