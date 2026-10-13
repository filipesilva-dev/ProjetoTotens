import { useState } from 'react';
import { Button, Card, Input, Modal, Text } from '@/components/ui';
import { useTenants } from '@/hooks/useTenants';
import { TenantStatusBadge } from '@/components/superadmin/TenantStatusBadge';
import { formatDateBR, daysUntil } from '@/utils/date';
import { isValidEmail } from '@/utils/email';
import type { Tenant, TenantStatus, SubscriptionCycle } from '@/types';
import './Tenants.css';

const FILTERS: Array<{ id: 'all' | TenantStatus; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Ativos' },
  { id: 'trial', label: 'Em teste' },
  { id: 'past_due', label: 'Em atraso' },
  { id: 'suspended', label: 'Suspensos' },
];

const PLAN_OPTIONS = [
  { id: 'basic', label: 'Básico', price: 199 },
  { id: 'pro', label: 'Pro', price: 399 },
  { id: 'enterprise', label: 'Enterprise', price: 899 },
];

interface NewTenantForm {
  name: string; slug: string; cnpj: string; ownerName: string; ownerEmail: string;
  planId: string; cycle: SubscriptionCycle;
}

const EMPTY_FORM: NewTenantForm = {
  name: '', slug: '', cnpj: '', ownerName: '', ownerEmail: '', planId: 'pro', cycle: 'monthly',
};

export default function Tenants() {
  const { tenants } = useTenants();
  const [filter, setFilter] = useState<'all' | TenantStatus>('all');
  const [search, setSearch] = useState('');
  const [localTenants, setLocalTenants] = useState<Tenant[] | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<NewTenantForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | undefined>();

  const [editing, setEditing] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState<NewTenantForm>(EMPTY_FORM);

  const [invoicing, setInvoicing] = useState<Tenant | null>(null);
  const [suspending, setSuspending] = useState<Tenant | null>(null);

  const source = localTenants ?? tenants;
  const filtered = source
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!form.name.trim()) return setFormError('Informe o nome da loja');
    if (!form.slug.trim()) return setFormError('Informe o slug (identificador na URL)');
    if (!/^[a-z0-9-]+$/.test(form.slug)) return setFormError('Slug deve conter apenas letras minúsculas, números e hífen');
    if (!form.ownerName.trim()) return setFormError('Informe o nome do responsável');
    if (!isValidEmail(form.ownerEmail)) return setFormError('Email inválido');

    const newTenant: Tenant = {
      id: 't-' + Date.now(), slug: form.slug, name: form.name, cnpj: form.cnpj || '—',
      logoEmoji: '🍔', ownerName: form.ownerName, ownerEmail: form.ownerEmail,
      planId: form.planId, cycle: form.cycle, status: 'trial', totemCount: 1,
      createdAt: new Date().toISOString(),
      contractEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    };
    // TODO(backend): substituir por tenantsService.create(newTenant)
    setLocalTenants([...source, newTenant]);
    setShowNew(false); setForm(EMPTY_FORM); setFormError(undefined);
  };

  const openEdit = (t: Tenant) => {
    setEditForm({ name: t.name, slug: t.slug, cnpj: t.cnpj, ownerName: t.ownerName, ownerEmail: t.ownerEmail, planId: t.planId, cycle: t.cycle });
    setEditing(t);
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    if (!editForm.name.trim()) return setFormError('Nome é obrigatório');
    if (!isValidEmail(editForm.ownerEmail)) return setFormError('Email inválido');
    // TODO(backend): substituir por tenantsService.update(editing.id, payload)
    setLocalTenants(source.map((t) => t.id === editing.id ? {
      ...t, name: editForm.name, slug: editForm.slug, cnpj: editForm.cnpj,
      ownerName: editForm.ownerName, ownerEmail: editForm.ownerEmail,
      planId: editForm.planId, cycle: editForm.cycle,
    } : t));
    setEditing(null); setFormError(undefined);
  };

  const handleIssueInvoice = () => {
    if (!invoicing) return;
    const plan = PLAN_OPTIONS.find((p) => p.id === invoicing.planId);
    // TODO(backend): substituir por invoicesService.create({ tenantId, planId, amount })
    // eslint-disable-next-line no-console
    console.info('[mock] Emitindo boleto', { tenantId: invoicing.id, planId: invoicing.planId, amount: plan?.price });
    setInvoicing(null);
  };

  const handleSuspend = () => {
    if (!suspending) return;
    // TODO(backend): substituir por tenantsService.updateStatus(suspending.id, 'suspended')
    setLocalTenants(source.map((t) => t.id === suspending.id ? { ...t, status: 'suspended' as TenantStatus } : t));
    setSuspending(null);
  };

  return (
    <div className="ten">
      <div className="ten__head">
        <div>
          <Text as="h1" size="3xl" weight="black">Clientes</Text>
          <Text tone="muted" size="sm">{filtered.length} estabelecimentos</Text>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setFormError(undefined); setShowNew(true); }}>
          + Novo cliente
        </Button>
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
        {filtered.map((t) => (
          <TenantRow key={t.id} tenant={t} onEdit={() => openEdit(t)} onInvoice={() => setInvoicing(t)} onSuspend={() => setSuspending(t)} />
        ))}
        {filtered.length === 0 && (
          <Text tone="muted" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Nenhum cliente neste filtro.</Text>
        )}
      </Card>

      <Modal open={showNew} title="Novo cliente" confirmLabel="Criar conta" cancelLabel="Cancelar"
        onConfirm={handleCreate} onCancel={() => { setShowNew(false); setFormError(undefined); }}
        description={<TenantForm form={form} setForm={setForm} error={formError} />} />

      <Modal open={Boolean(editing)} title={editing ? `Editar ${editing.name}` : 'Editar cliente'}
        confirmLabel="Salvar alterações" cancelLabel="Cancelar"
        onConfirm={handleSaveEdit} onCancel={() => { setEditing(null); setFormError(undefined); }}
        description={<TenantForm form={editForm} setForm={setEditForm} error={formError} />} />

      <Modal open={Boolean(invoicing)} title="Emitir boleto" confirmLabel="Confirmar emissão" cancelLabel="Cancelar"
        onConfirm={handleIssueInvoice} onCancel={() => setInvoicing(null)}
        description={invoicing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Text tone="muted">Será emitido um boleto para <strong>{invoicing.name}</strong> com vencimento em 30 dias.</Text>
            <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Text tone="muted" size="sm">Plano</Text>
                <Text weight="bold">{PLAN_OPTIONS.find((p) => p.id === invoicing.planId)?.label}</Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text tone="muted" size="sm">Valor</Text>
                <Text weight="black" size="lg" tone="primary">R$ {PLAN_OPTIONS.find((p) => p.id === invoicing.planId)?.price},00</Text>
              </div>
            </div>
          </div>
        )} />

      <Modal open={Boolean(suspending)} title="Suspender cliente?" confirmLabel="Suspender" cancelLabel="Cancelar" variant="danger"
        onConfirm={handleSuspend} onCancel={() => setSuspending(null)}
        description={suspending && (
          <Text tone="muted">O acesso de <strong>{suspending.name}</strong> ao painel será bloqueado imediatamente. Os dados continuam salvos e a conta pode ser reativada a qualquer momento.</Text>
        )} />
    </div>
  );
}

function TenantForm({ form, setForm, error }: { form: NewTenantForm; setForm: (f: NewTenantForm) => void; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Input label="Nome da loja" size="lg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Lanches do João" />
      <Input label="Slug (URL)" size="lg" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="lanches-do-joao" hint="Apenas letras minúsculas, números e hífen." />
      <Input label="CNPJ" size="lg" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
      <Input label="Nome do responsável" size="lg" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} placeholder="Como devemos chamar" />
      <Input label="Email do responsável" type="email" size="lg" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} placeholder="email@exemplo.com" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div>
          <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Plano</Text>
          <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}
            style={{ width: '100%', height: 68, padding: '0 var(--space-4)', background: 'var(--color-surface-2)', border: '2px solid transparent', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-md)' }}>
            {PLAN_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Ciclo</Text>
          <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value as SubscriptionCycle })}
            style={{ width: '100%', height: 68, padding: '0 var(--space-4)', background: 'var(--color-surface-2)', border: '2px solid transparent', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-md)' }}>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
      </div>
      {error && <Text tone="danger" size="sm" weight="semibold">{error}</Text>}
    </div>
  );
}

function TenantRow({ tenant, onEdit, onInvoice, onSuspend }: { tenant: Tenant; onEdit: () => void; onInvoice: () => void; onSuspend: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const remaining = daysUntil(tenant.contractEndsAt);
  const canSuspend = tenant.status !== 'suspended' && tenant.status !== 'cancelled';

  return (
    <div className="ten__block">
      <button className="ten__row" onClick={() => setExpanded(!expanded)}>
        <span className="ten__row-emoji">{tenant.logoEmoji}</span>
        <div>
          <Text weight="bold">{tenant.name}</Text>
          <Text tone="muted" size="xs">{tenant.slug}</Text>
        </div>
        <TenantStatusBadge status={tenant.status} />
        <Text tone="muted" size="sm">{tenant.planId === 'basic' ? 'Básico' : tenant.planId === 'pro' ? 'Pro' : 'Enterprise'}</Text>
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
            <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>
            <Button variant="ghost" size="sm" onClick={onInvoice}>Emitir boleto</Button>
            {canSuspend && (
              <Button variant="ghost" size="sm" onClick={onSuspend}>
                <span style={{ color: 'var(--color-danger)' }}>Suspender</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
