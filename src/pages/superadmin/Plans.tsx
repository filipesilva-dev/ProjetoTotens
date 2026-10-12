import { Button, Card, Text } from '@/components/ui';
import { usePlans } from '@/hooks/usePlans';
import { formatBRL } from '@/utils/currency';
import './PlansAdmin.css';
export default function PlansAdmin() {
  const { plans } = usePlans();
  return (
    <div className="pa">
      <div className="pa__head">
        <div>
          <Text as="h1" size="3xl" weight="black">Planos</Text>
          <Text tone="muted" size="sm">{plans.length} planos configurados</Text>
        </div>
        <Button>+ Novo plano</Button>
      </div>
      <div className="pa__grid">
        {plans.map((p) => (
          <Card key={p.id} padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <Text as="h3" size="xl" weight="black">{p.name}</Text>
              {p.highlighted && <span style={{ background: 'var(--color-super-soft)', color: 'var(--color-super-dark)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)' }}>Destaque</span>}
            </div>
            <Text tone="muted" size="sm" style={{ marginBottom: 'var(--space-4)' }}>{p.description}</Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
              <Text size="3xl" weight="black" tone="primary">{formatBRL(p.priceMonthly)}</Text>
              <Text tone="muted" size="sm">/mês</Text>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <Text size="sm" tone="muted">
                {p.maxTotems === -1 ? 'Totens ilimitados' : `${p.maxTotems} totem${p.maxTotems > 1 ? 's' : ''}`}
              </Text>
              <Text size="sm" tone="muted">
                {p.maxProducts === -1 ? 'Produtos ilimitados' : `${p.maxProducts} produtos`}
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="sm" fullWidth>Editar</Button>
              <Button variant="ghost" size="sm" fullWidth><span style={{ color: 'var(--color-danger)' }}>Desativar</span></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
