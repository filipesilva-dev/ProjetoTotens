import { Button, Card, Text } from '@/components/ui';
import { KpiCard } from '@/components/admin/KpiCard';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { formatBRL } from '@/utils/currency';
export default function Reports() {
  const [summary, setSummary] = useState({ revenue: 0, orders: 0, averageTicket: 0, topProducts: [] as { name: string; count: number }[] });
  useEffect(() => { void api.get<typeof summary>('/reports/summary').then(r => setSummary(r.data)); }, []);
  const max = Math.max(1, ...summary.topProducts.map(p => p.count));
  const exportOrders = async () => {
    const { data } = await api.get<Blob>('/reports/orders.csv', { responseType: 'blob' });
    const url = URL.createObjectURL(data); const a = document.createElement('a');
    a.href = url; a.download = 'pedidos.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Text as="h1" size="3xl" weight="black">Relatórios de vendas</Text>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button variant="ghost">Últimos 7 dias ▾</Button>
        <Button variant="ghost">Todas categorias ▾</Button>
        <div style={{ flex: 1 }} />
        <Button onClick={() => void exportOrders()}>Exportar</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <KpiCard icon="💰" label="Faturamento" value={formatBRL(Number(summary.revenue))} />
        <KpiCard icon="📋" label="Pedidos" value={String(summary.orders)} />
        <KpiCard icon="🎫" label="Ticket médio" value={formatBRL(Number(summary.averageTicket))} />
      </div>
      <Text as="h2" size="xl" weight="black">Top 5 produtos</Text>
      <Card padding="lg">
        {summary.topProducts.map((p, i) => (
          <div key={p.name} style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text weight="semibold">{i + 1}. {p.name}</Text>
              <Text weight="black">{p.count} un.</Text>
            </div>
            <div style={{ height: 10, background: 'var(--color-surface-2)', borderRadius: 5 }}>
              <div style={{ width: `${p.count / max * 100}%`, height: '100%',
                background: 'var(--gradient-primary)', borderRadius: 5 }} />
            </div>
          </div>
        ))}
      </Card>
      <Card variant="flat" padding="lg">
        <Text weight="black" size="lg">100% Pix</Text>
        <Text tone="muted" size="sm">Todos os pagamentos do período foram via Pix.</Text>
      </Card>
    </div>
  );
}
