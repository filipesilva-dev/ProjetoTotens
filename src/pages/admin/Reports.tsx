import { Button, Card, Text } from '@/components/ui';
import { KpiCard } from '@/components/admin/KpiCard';
const TOP = [
  { name: 'Combo Clássico', count: 184, pct: 100 },
  { name: 'X-Burger Especial', count: 142, pct: 82 },
  { name: 'Smash Duplo', count: 121, pct: 70 },
  { name: 'Batata Média', count: 98, pct: 56 },
  { name: 'Milkshake Chocolate', count: 76, pct: 44 },
];
export default function Reports() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Text as="h1" size="3xl" weight="black">Relatórios de vendas</Text>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button variant="ghost">Últimos 7 dias ▾</Button>
        <Button variant="ghost">Todas categorias ▾</Button>
        <div style={{ flex: 1 }} />
        <Button>Exportar</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <KpiCard icon="💰" label="Faturamento" value="R$ 32.4k" />
        <KpiCard icon="📋" label="Pedidos" value="1.024" />
        <KpiCard icon="🎫" label="Ticket médio" value="R$ 31,64" />
      </div>
      <Text as="h2" size="xl" weight="black">Top 5 produtos</Text>
      <Card padding="lg">
        {TOP.map((p, i) => (
          <div key={p.name} style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text weight="semibold">{i + 1}. {p.name}</Text>
              <Text weight="black">{p.count} un.</Text>
            </div>
            <div style={{ height: 10, background: 'var(--color-surface-2)', borderRadius: 5 }}>
              <div style={{ width: `${p.pct}%`, height: '100%',
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
