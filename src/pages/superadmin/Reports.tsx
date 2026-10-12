import { Button, Card, Text } from '@/components/ui';
import { useTenants } from '@/hooks/useTenants';
import { useInvoices } from '@/hooks/useInvoices';
import { formatBRL } from '@/utils/currency';
export default function SuperReports() {
  const { tenants } = useTenants();
  const { invoices } = useInvoices();
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Text as="h1" size="3xl" weight="black">Relatórios</Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        <Card padding="lg">
          <Text tone="muted" size="sm">Recebido</Text>
          <Text size="2xl" weight="black" tone="primary">{formatBRL(totalPaid)}</Text>
        </Card>
        <Card padding="lg">
          <Text tone="muted" size="sm">A receber</Text>
          <Text size="2xl" weight="black">{formatBRL(totalPending)}</Text>
        </Card>
        <Card padding="lg">
          <Text tone="muted" size="sm">Em atraso</Text>
          <Text size="2xl" weight="black" tone="danger">{formatBRL(totalOverdue)}</Text>
        </Card>
        <Card padding="lg">
          <Text tone="muted" size="sm">Clientes</Text>
          <Text size="2xl" weight="black">{tenants.length}</Text>
        </Card>
      </div>
      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Por plano</Text>
        {(['basic', 'pro', 'enterprise'] as const).map((pid) => {
          const list = tenants.filter((t) => t.planId === pid);
          const label = pid === 'basic' ? 'Básico' : pid === 'pro' ? 'Pro' : 'Enterprise';
          const total = list.length * (pid === 'basic' ? 199 : pid === 'pro' ? 399 : 899);
          return (
            <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <Text weight="bold">{label}</Text>
                <Text tone="muted" size="sm">{list.length} clientes</Text>
              </div>
              <Text weight="black" size="lg">{formatBRL(total)}/mês</Text>
            </div>
          );
        })}
      </Card>
      <Button variant="ghost">Exportar CSV</Button>
    </div>
  );
}
