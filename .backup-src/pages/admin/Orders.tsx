import { useMemo, useState } from 'react';
import { Card, Text } from '@/components/ui';
import { MOCK_ORDERS } from '@/mock/adminData';
import { formatBRL } from '@/utils/currency';
import type { OrderStatus } from '@/types';
import './Orders.css';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Aguardando Pix',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
};

const FILTERS: Array<{ id: 'all' | OrderStatus; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'PAID', label: 'Pagos' },
  { id: 'PREPARING', label: 'Preparando' },
  { id: 'READY', label: 'Prontos' },
  { id: 'DELIVERED', label: 'Entregues' },
];

export default function Orders() {
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return MOCK_ORDERS;
    return MOCK_ORDERS.filter((o) => o.status === filter);
  }, [filter]);

  const totalDia = filtered.reduce((s, o) => s + o.total, 0);

  return (
    <div className="ord">
      <div className="ord__head">
        <div>
          <Text as="h1" size="3xl" weight="black">Pedidos</Text>
          <Text tone="muted" size="sm">
            {filtered.length} pedidos · {formatBRL(totalDia)} no período
          </Text>
        </div>
      </div>

      <div className="ord__filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`ord__filter ${filter === f.id ? 'ord__filter--on' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card padding="sm">
        <div className="ord__table-head">
          <Text weight="bold" size="sm" tone="muted">PEDIDO</Text>
          <Text weight="bold" size="sm" tone="muted">DATA / HORA</Text>
          <Text weight="bold" size="sm" tone="muted">ITENS</Text>
          <Text weight="bold" size="sm" tone="muted">TOTEM</Text>
          <Text weight="bold" size="sm" tone="muted">STATUS</Text>
          <Text weight="bold" size="sm" tone="muted" style={{ textAlign: 'right' }}>VALOR</Text>
        </div>

        {filtered.map((o) => {
          const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
          const isOpen = expandedId === o.id;
          return (
            <div key={o.id} className="ord__block">
              <button
                type="button"
                className="ord__row"
                onClick={() => setExpandedId(isOpen ? null : o.id)}
                aria-expanded={isOpen}
              >
                <div className="ord__code">
                  <Text weight="black" size="lg" tone="primary">#{o.code}</Text>
                </div>
                <div className="ord__time">
                  <Text weight="semibold" size="sm">
                    {new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text tone="muted" size="xs">
                    {new Date(o.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </Text>
                </div>
                <Text size="sm" tone="muted">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</Text>
                <Text size="sm" tone="muted">{o.totemId}</Text>
                <span className={`ord__badge ord__badge--${o.status.toLowerCase()}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                <Text weight="black" size="lg" style={{ textAlign: 'right' }}>{formatBRL(o.total)}</Text>
              </button>

              {isOpen && (
                <div className="ord__detail">
                  <div className="ord__detail-header">
                    <Text weight="bold" size="sm" tone="muted">ITENS DO PEDIDO</Text>
                  </div>
                  {o.items.map((item) => (
                    <div key={item.productId} className="ord__item">
                      <img src={item.product.imageUrl} alt="" className="ord__item-img" />
                      <div className="ord__item-info">
                        <Text weight="semibold">{item.product.name}</Text>
                        <Text tone="muted" size="sm">Quantidade: {item.quantity}</Text>
                        {item.removedIngredients.length > 0 && (
                          <Text tone="danger" size="xs">
                            Sem: {item.removedIngredients.join(', ')}
                          </Text>
                        )}
                        {item.additions.length > 0 && (
                          <Text tone="primary" size="xs">
                            Adicionais: {item.additions.map((a) => a.name).join(', ')}
                          </Text>
                        )}
                        {item.notes && (
                          <Text tone="muted" size="xs" style={{ fontStyle: 'italic' }}>
                            Obs: {item.notes}
                          </Text>
                        )}
                      </div>
                      <Text weight="bold" style={{ textAlign: 'right' }}>
                        {formatBRL(item.unitPrice * item.quantity)}
                      </Text>
                    </div>
                  ))}

                  <div className="ord__detail-footer">
                    <div>
                      {o.customer?.cpf && <Text tone="muted" size="xs">CPF: {o.customer.cpf}</Text>}
                      {o.customer?.email && <Text tone="muted" size="xs">Email: {o.customer.email}</Text>}
                    </div>
                    <Text weight="black" size="lg" tone="primary">{formatBRL(o.total)}</Text>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <Text tone="muted" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            Nenhum pedido neste filtro.
          </Text>
        )}
      </Card>
    </div>
  );
}
