import { Card, Text, IconBuilding, IconDollar, IconAlert } from '@/components/ui';
import { useTenants } from '@/hooks/useTenants';
import { useInvoices } from '@/hooks/useInvoices';
import { formatBRL } from '@/utils/currency';
import { TenantStatusBadge } from '@/components/superadmin/TenantStatusBadge';
import './Overview.css';

export default function Overview() {
  const { tenants } = useTenants();
  const { invoices } = useInvoices();

  const activeCount = tenants.filter((t) => t.status === 'active').length;
  const trialCount = tenants.filter((t) => t.status === 'trial').length;
  const suspendedCount = tenants.filter(
    (t) => t.status === 'suspended' || t.status === 'past_due',
  ).length;

  const mrr = tenants
    .filter((t) => t.status === 'active')
    .reduce(
      (sum, t) => sum + (t.planId === 'basic' ? 199 : t.planId === 'pro' ? 399 : 899),
      0,
    );

  const overdue = invoices.filter((i) => i.status === 'overdue');
  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="ov">
      <div>
        <Text as="h1" size="3xl" weight="black">Visão geral</Text>
        <Text tone="muted" size="sm">Indicadores do negócio · atualizado agora</Text>
      </div>

      <div className="ov__kpis">
        <div className="ov__kpi">
          <div className="ov__kpi-icon"><IconBuilding size={22} /></div>
          <Text tone="muted" size="sm">Clientes ativos</Text>
          <Text size="3xl" weight="black">{activeCount}</Text>
          <Text tone="muted" size="xs">{trialCount} em teste</Text>
        </div>

        <div className="ov__kpi">
          <div className="ov__kpi-icon ov__kpi-icon--success"><IconDollar size={22} /></div>
          <Text tone="muted" size="sm">MRR</Text>
          <Text size="3xl" weight="black">{formatBRL(mrr)}</Text>
          <Text tone="muted" size="xs">Receita recorrente mensal</Text>
        </div>

        <div className="ov__kpi">
          <div className="ov__kpi-icon ov__kpi-icon--warning"><IconAlert size={22} /></div>
          <Text tone="muted" size="sm">Atenção</Text>
          <Text size="3xl" weight="black">{suspendedCount}</Text>
          <Text tone="muted" size="xs">Suspensos ou em atraso</Text>
        </div>

        <div className="ov__kpi">
          <div className="ov__kpi-icon ov__kpi-icon--danger"><IconDollar size={22} /></div>
          <Text tone="muted" size="sm">Boletos vencidos</Text>
          <Text size="3xl" weight="black">{overdue.length}</Text>
          <Text tone="muted" size="xs">
            {formatBRL(overdue.reduce((s, i) => s + i.amount, 0))} em aberto
          </Text>
        </div>
      </div>

      <Text as="h2" size="xl" weight="black">Clientes recentes</Text>

      <Card padding="md">
        {recentTenants.map((t, i) => (
          <div
            key={t.id}
            className="ov__row"
            style={{
              borderBottom:
                i < recentTenants.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <span className="ov__row-emoji">{t.logoEmoji}</span>
            <div>
              <Text weight="bold">{t.name}</Text>
              <Text tone="muted" size="xs">{t.ownerEmail}</Text>
            </div>
            <TenantStatusBadge status={t.status} />
            <Text tone="muted" size="sm">{t.totemCount} totens</Text>
            <Text weight="black" size="sm">
              {t.planId === 'basic' ? 'Básico' : t.planId === 'pro' ? 'Pro' : 'Enterprise'}
            </Text>
          </div>
        ))}
      </Card>
    </div>
  );
}
