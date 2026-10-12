import { KpiCard } from '@/components/admin/KpiCard';
import { BarChart } from '@/components/admin/BarChart';
import { Card, Text } from '@/components/ui';
import { MOCK_ORDERS } from '@/mock/adminData';
import { formatBRL } from '@/utils/currency';
import './Dashboard.css';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Aguardando Pix',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
};

export default function Dashboard() {
  const orders = MOCK_ORDERS.slice(0, 5);

  return (
    <div className="dash">
      <div>
        <Text as="h1" size="3xl" weight="black">Dashboard</Text>
        <Text tone="muted" size="sm">Hoje · atualizado agora</Text>
      </div>

      <div className="dash__kpis">
        <KpiCard icon="💰" label="Vendas hoje" value="R$ 4.240" delta="↑ 12% vs ontem" />
        <KpiCard icon="📋" label="Pedidos" value="138" delta="↑ 8% vs ontem" />
        <KpiCard icon="🎫" label="Ticket médio" value="R$ 30,72" delta="↑ 3% vs ontem" />
        <KpiCard icon="⚡" label="% Pix" value="100%" delta="Todos via Pix" />
      </div>

      <Text as="h2" size="xl" weight="black">Vendas por hora</Text>
      <BarChart values={[2, 3, 7, 9, 6, 3, 8, 5, 2, 2, 1, 1]} highlight={[3, 4, 6, 9]} />

      <div className="dash__head">
        <Text as="h2" size="xl" weight="black">Últimos pedidos</Text>
        <Text tone="primary" size="sm" weight="semibold" style={{ cursor: 'pointer' }}>
          Ver todos →
        </Text>
      </div>

      <Card padding="md">
        {orders.map((o, i) => (
          <div key={o.id} className="dash__row" style={{
            borderBottom: i < orders.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}>
            <div className="dash__row-code">
              <Text weight="black" size="lg" tone="primary">#{o.code}</Text>
              <Text tone="muted" size="xs">{o.totemId}</Text>
            </div>
            <div className="dash__row-time">
              <Text tone="muted" size="sm">
                {new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </div>
            <div className="dash__row-items">
              <Text size="sm" tone="muted">
                {o.items.reduce((s, it) => s + it.quantity, 0)} itens
              </Text>
            </div>
            <div className="dash__row-status">
              <span className={`dash__badge dash__badge--${o.status.toLowerCase()}`}>
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
            </div>
            <div className="dash__row-total">
              <Text weight="black" size="lg">{formatBRL(o.total)}</Text>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
