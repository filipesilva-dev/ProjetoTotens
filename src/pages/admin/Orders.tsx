import { useEffect, useMemo, useState } from 'react';
import { Card, Text } from '@/components/ui';
import { ordersService } from '@/services/orders';
import { paymentsService } from '@/services/payments';
import { fiscalService, type FiscalInvoice } from '@/services/fiscal';
import { formatBRL } from '@/utils/currency';
import type { Order, OrderStatus } from '@/types';
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [fiscal, setFiscal] = useState<FiscalInvoice[]>([]);
  const [error, setError] = useState('');
  const reload = () => {
    void ordersService.list().then(setOrders).catch(() => setError('Falha ao carregar pedidos'));
    void fiscalService.list().then(setFiscal).catch(() => undefined);
  };
  useEffect(() => { reload(); const timer = setInterval(reload, 5000); return () => clearInterval(timer); }, []);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [filter, orders]);

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
        {error && <Text tone="danger">{error}</Text>}
        <div className="ord__table-head">
          <Text weight="bold" size="sm" tone="muted">PEDIDO</Text>
          <Text weight="bold" size="sm" tone="muted">DATA / HORA</Text>
          <Text weight="bold" size="sm" tone="muted">ITENS</Text>
          <Text weight="bold" size="sm" tone="muted">TOTEM</Text>
          <Text weight="bold" size="sm" tone="muted">STATUS</Text>
          <Text weight="bold" size="sm" tone="muted" style={{ textAlign: 'right' }}>VALOR</Text>
        </div>

        {filtered.map((o) => {
          const note = fiscal.find(item => item.orderId === o.id);
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
                  <div style={{ display: 'flex', gap: 8, padding: 12 }}>
                    {o.status === 'PAID' && <button onClick={() => void ordersService.status(o.id, 'PREPARING').then(reload).catch(() => setError('Falha ao iniciar preparo'))}>Iniciar preparo</button>}
                    {o.status === 'PREPARING' && <button onClick={() => void ordersService.status(o.id, 'READY').then(reload).catch(() => setError('Falha ao marcar pronto'))}>Marcar pronto</button>}
                    {o.status === 'READY' && <button onClick={() => void ordersService.status(o.id, 'DELIVERED').then(reload).catch(() => setError('Falha ao entregar'))}>Entregue</button>}
                    {o.status === 'PENDING_PAYMENT' && <button onClick={() => void paymentsService.simulate(o.id).then(reload).catch(() => setError('Simulação só no modo mock'))}>Simular Pix</button>}
                    <button onClick={() => void ordersService.downloadKitchenTicket(o.id).catch(() => setError('Falha ao gerar comanda'))}>Imprimir cozinha</button>
                    {note && <button onClick={() => void fiscalService.refresh(note.id).then(reload).catch(() => setError('Falha ao atualizar NFC-e'))}>NFC-e: {note.status} {note.number ?? ''}</button>}
                    {note?.status === 'issued' && <button onClick={() => void fiscalService.download(note.id).catch(() => setError('Falha ao baixar NFC-e'))}>Baixar NFC-e</button>}
                    {note?.status === 'error' && <button onClick={() => void fiscalService.retry(note.id).then(reload).catch(() => setError('Falha ao reenviar NFC-e'))}>Tentar NFC-e novamente</button>}
                  </div>
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
