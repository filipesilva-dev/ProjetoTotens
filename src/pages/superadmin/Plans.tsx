import { useEffect, useState } from 'react';
import { Button, Card, Input, Modal, Text, Toast } from '@/components/ui';
import { plansService } from '@/services/plans';
import { formatBRL } from '@/utils/currency';
import type { Plan } from '@/types';
import './PlansAdmin.css';

interface PlanForm {
  name: string; description: string; priceMonthly: string; priceYearly: string;
  maxTotems: string; maxProducts: string; highlighted: boolean; features: string;
}

const EMPTY_FORM: PlanForm = { name: '', description: '', priceMonthly: '', priceYearly: '', maxTotems: '1', maxProducts: '50', highlighted: false, features: '' };

function planToForm(p: Plan): PlanForm {
  return { name: p.name, description: p.description, priceMonthly: String(p.priceMonthly), priceYearly: String(p.priceYearly), maxTotems: String(p.maxTotems), maxProducts: String(p.maxProducts), highlighted: p.highlighted, features: p.features.join('\n') };
}

export default function PlansAdmin() {
  const [localPlans, setLocalPlans] = useState<Plan[]>([]);
  useEffect(() => { void plansService.listAll().then(setLocalPlans).catch(() => setFormError('Falha ao carregar planos')); }, []);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | undefined>();
  const [toDeactivate, setToDeactivate] = useState<Plan | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const source = localPlans;
  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const parseFeatures = (raw: string) => raw.split('\n').map((f) => f.trim()).filter(Boolean);

  const handleCreate = async () => {
    if (!form.name.trim()) return setFormError('Informe o nome do plano');
    if (!Number(form.priceMonthly)) return setFormError('Preço mensal obrigatório');
    if (!Number(form.priceYearly)) return setFormError('Preço anual obrigatório');

    const newPlan = {
      name: form.name, description: form.description,
      priceMonthly: Number(form.priceMonthly), priceYearly: Number(form.priceYearly),
      maxTotems: Number(form.maxTotems), maxProducts: Number(form.maxProducts),
      highlighted: form.highlighted, active: true, sortOrder: source.length + 1,
      features: parseFeatures(form.features),
    };
    try {
      const saved = await plansService.create(newPlan);
      setLocalPlans([...source, saved]);
      setShowNew(false); setForm(EMPTY_FORM); setFormError(undefined);
      flash(`Plano ${saved.name} criado`);
    } catch (error) { setFormError((error as { detail?: string }).detail ?? 'Falha ao criar plano'); }
  };

  const openEdit = (p: Plan) => { setEditing(p); setForm(planToForm(p)); setFormError(undefined); };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!form.name.trim()) return setFormError('Nome obrigatório');
    if (!Number(form.priceMonthly)) return setFormError('Preço mensal obrigatório');
    try {
      const saved = await plansService.update(editing.id, {
      name: form.name, description: form.description,
      priceMonthly: Number(form.priceMonthly), priceYearly: Number(form.priceYearly),
      maxTotems: Number(form.maxTotems), maxProducts: Number(form.maxProducts),
      highlighted: form.highlighted, features: parseFeatures(form.features),
      });
      setLocalPlans(source.map((p) => p.id === editing.id ? saved : p));
      setEditing(null); setFormError(undefined);
      flash(`Plano ${form.name} atualizado`);
    } catch (error) { setFormError((error as { detail?: string }).detail ?? 'Falha ao salvar plano'); }
  };

  const handleToggleActive = async () => {
    if (!toDeactivate) return;
    const action = toDeactivate.active ? 'desativado' : 'reativado';
    try {
      const saved = await plansService.update(toDeactivate.id, { active: !toDeactivate.active });
      setLocalPlans(source.map((p) => p.id === toDeactivate.id ? saved : p));
      flash(`Plano ${toDeactivate.name} ${action}`);
      setToDeactivate(null);
    } catch (error) { setFormError((error as { detail?: string }).detail ?? 'Falha ao atualizar plano'); }
  };

  return (
    <div className="pa">
      <div className="pa__head">
        <div>
          <Text as="h1" size="3xl" weight="black">Planos</Text>
          <Text tone="muted" size="sm">{source.length} planos configurados</Text>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setFormError(undefined); setShowNew(true); }}>+ Novo plano</Button>
      </div>

      <div className="pa__grid">
        {source.map((p) => (
          <Card key={p.id} padding="lg" style={{ opacity: p.active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <Text as="h3" size="xl" weight="black">{p.name}</Text>
              <div style={{ display: 'flex', gap: 6 }}>
                {p.highlighted && (
                  <span style={{ background: 'var(--color-super-soft)', color: 'var(--color-super-dark)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)' }}>Destaque</span>
                )}
                {!p.active && (
                  <span style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)' }}>Inativo</span>
                )}
              </div>
            </div>
            <Text tone="muted" size="sm" style={{ marginBottom: 'var(--space-4)' }}>{p.description}</Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
              <Text size="3xl" weight="black" tone="primary">{formatBRL(p.priceMonthly)}</Text>
              <Text tone="muted" size="sm">/mês</Text>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <Text size="sm" tone="muted">{p.maxTotems === -1 ? 'Totens ilimitados' : `${p.maxTotems} totem${p.maxTotems > 1 ? 's' : ''}`}</Text>
              <Text size="sm" tone="muted">{p.maxProducts === -1 ? 'Produtos ilimitados' : `${p.maxProducts} produtos`}</Text>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="sm" fullWidth onClick={() => openEdit(p)}>Editar</Button>
              <Button variant="ghost" size="sm" fullWidth onClick={() => setToDeactivate(p)}>
                {p.active
                  ? <span style={{ color: 'var(--color-danger)' }}>Desativar</span>
                  : <span style={{ color: 'var(--color-success)' }}>Reativar</span>}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showNew} title="Novo plano" confirmLabel="Criar plano" cancelLabel="Cancelar"
        onConfirm={handleCreate} onCancel={() => { setShowNew(false); setFormError(undefined); }}
        description={<PlanFormFields form={form} setForm={setForm} error={formError} />} />

      <Modal open={Boolean(editing)} title={editing ? `Editar ${editing.name}` : 'Editar plano'} confirmLabel="Salvar alterações" cancelLabel="Cancelar"
        onConfirm={handleSaveEdit} onCancel={() => { setEditing(null); setFormError(undefined); }}
        description={<PlanFormFields form={form} setForm={setForm} error={formError} />} />

      <Modal open={Boolean(toDeactivate)} title={toDeactivate?.active ? 'Desativar plano?' : 'Reativar plano?'}
        confirmLabel={toDeactivate?.active ? 'Desativar' : 'Reativar'} cancelLabel="Cancelar"
        variant={toDeactivate?.active ? 'danger' : 'default'}
        onConfirm={handleToggleActive} onCancel={() => setToDeactivate(null)}
        description={toDeactivate && (
          <Text tone="muted">
            {toDeactivate.active
              ? `O plano ${toDeactivate.name} deixará de aparecer como opção para novos clientes. Assinaturas existentes continuam funcionando.`
              : `O plano ${toDeactivate.name} voltará a ficar disponível para contratação.`}
          </Text>
        )} />

      <Toast message={toast} tone="success" onClose={() => setToast(null)} />
    </div>
  );
}

function PlanFormFields({ form, setForm, error }: { form: PlanForm; setForm: (f: PlanForm) => void; error?: string }) {
  const inputStyle = { width: '100%', padding: 'var(--space-4)', background: 'var(--color-surface-2)', border: '2px solid transparent', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', fontSize: 'var(--font-size-md)', outline: 'none', resize: 'vertical' as const };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Input label="Nome do plano" size="lg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pro" />
      <div>
        <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Descrição</Text>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <Input label="Preço mensal (R$)" type="number" step="0.01" size="lg" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} />
        <Input label="Preço anual (R$)" type="number" step="0.01" size="lg" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <Input label="Máximo de totens (-1 = ilimitado)" type="number" size="lg" value={form.maxTotems} onChange={(e) => setForm({ ...form, maxTotems: e.target.value })} />
        <Input label="Máximo de produtos (-1 = ilimitado)" type="number" size="lg" value={form.maxProducts} onChange={(e) => setForm({ ...form, maxProducts: e.target.value })} />
      </div>
      <div>
        <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Features (uma por linha)</Text>
        <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={5}
          placeholder={'1 totem incluído\nPagamento via Pix\nSuporte por email'} style={inputStyle} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.highlighted} onChange={(e) => setForm({ ...form, highlighted: e.target.checked })} style={{ width: 20, height: 20, accentColor: 'var(--color-super-primary)' }} />
        <Text size="sm">Destacar este plano na página de planos</Text>
      </label>
      {error && <Text tone="danger" size="sm" weight="semibold">{error}</Text>}
    </div>
  );
}
