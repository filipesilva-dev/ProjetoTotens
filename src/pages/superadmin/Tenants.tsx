import { useState } from 'react';
import { Button, Card, Input, Text } from '@/components/ui';
import { useTenants } from '@/hooks/useTenants';
import { TenantStatusBadge } from '@/components/superadmin/TenantStatusBadge';
import { formatDateBR, daysUntil } from '@/utils/date';
import type { Tenant, TenantStatus } from '@/types';
import './Tenants.css';
const FILTERS: Array<{ id: 'all' | TenantStatus; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Ativos' },
  { id: 'trial', label: 'Em teste' },
  { id: 'past_due', label: 'Em atraso' },
  { id: 'suspended', label: 'Suspensos' },
];
export default function Tenants() {
  const { tenants } = useTenants();
  const [filter, setFilter] = useState<'all' | TenantStatus>('all');
  const [search, setSearch] = useState('');
  const filtered = tenants
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase()));
  return (
    <div className="ten">
      <div className="ten__head">
        <div>
          <Text as="h1" size="3xl" weight="black">Clientes</Text>
          <Text tone="muted" size="sm">{filtered.length} estabelecimentos</Text>
        </div>
        <Button>+ Novo cliente</Button>
      </div>
      <div className="ten__toolbar">
        <div className="ten__filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={`ten__filter ${filter === f.id ? 'ten__filter--on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <Input size="md" placeholder="Buscar por nome ou slug" value={search} onChange={(e) => setSearch(e.target.value)} containerClassName="ten__search" />
      </div>
      <Card padding="sm">
        {filtered.map((t) => <TenantRow key={t.id} tenant={t} />)}
        {filtered.length === 0 && <Text tone="muted" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Nenhum cliente neste filtro.</Text>}
      </Card>
    </div>
  );
}
function TenantRow({ tenant }: { tenant: Tenant }) {
  const [expanded, setExpanded] = useState(false);
  const remaining = daysUntil(tenant.contractEndsAt);
  return (
    <div className="ten__block">
      <button className="ten__row" onClick={() => setExpanded(!expanded)}>
        <span className="ten__row-emoji">{tenant.logoEmoji}</span>
        <div>
          <Text weight="bold">{tenant.name}</Text>
          <Text tone="muted" size="xs">{tenant.slug}</Text>
        </div>
        <TenantStatusBadge status={tenant.status} />
        <Text tone="muted" size="sm">
          {tenant.planId === 'basic' ? 'Básico' : tenant.planId === 'pro' ? 'Pro' : 'Enterprise'}
        </Text>
        <Text tone="muted" size="sm">{tenant.totemCount} totens</Text>
        <Text weight="semibold" size="sm">{remaining} dias restantes</Text>
      </button>
      {expanded && (
        <div className="ten__detail">
          <div><Text tone="muted" size="xs">CNPJ</Text><Text weight="semibold">{tenant.cnpj}</Text></div>
          <div><Text tone="muted" size="xs">Responsável</Text><Text weight="semibold">{tenant.ownerName}</Text></div>
          <div><Text tone="muted" size="xs">Email</Text><Text weight="semibold">{tenant.ownerEmail}</Text></div>
          <div><Text tone="muted" size="xs">Cliente desde</Text><Text weight="semibold">{formatDateBR(tenant.createdAt)}</Text></div>
          <div><Text tone="muted" size="xs">Contrato até</Text><Text weight="semibold">{formatDateBR(tenant.contractEndsAt)}</Text></div>
          <div className="ten__detail-actions">
            <Button variant="ghost" size="sm">Editar</Button>
            <Button variant="ghost" size="sm">Emitir boleto</Button>
            <Button variant="ghost" size="sm">Suspender</Button>
          </div>
        </div>
      )}
    </div>
  );
}
