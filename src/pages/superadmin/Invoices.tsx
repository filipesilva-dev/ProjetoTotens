import { useState } from 'react';
import { Button, Card, Input, Modal, Text, Toast } from '@/components/ui';
import { useInvoices } from '@/hooks/useInvoices';
import { useTenants } from '@/hooks/useTenants';
import { InvoiceStatusBadge } from '@/components/superadmin/InvoiceStatusBadge';
import { formatBRL } from '@/utils/currency';
import { formatDateBR } from '@/utils/date';
import type { Invoice, InvoiceStatus } from '@/types';
import { invoicesService } from '@/services/invoices';
import { usePlans } from '@/hooks/usePlans';
import './Invoices.css';

const FILTERS: Array<{ id: 'all' | InvoiceStatus; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'paid', label: 'Pagos' },
  { id: 'overdue', label: 'Vencidos' },
];

interface NewInvoiceForm { tenantId: string; amount: string; dueInDays: string; notes: string; }
const EMPTY_FORM: NewInvoiceForm = { tenantId: '', amount: '', dueInDays: '30', notes: '' };

export default function Invoices() {
  const { invoices } = useInvoices();
  const { tenants } = useTenants();
  const { plans } = usePlans();

  const [localInvoices, setLocalInvoices] = useState<Invoice[] | null>(null);
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<NewInvoiceForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | undefined>();
  const [operationError, setOperationError] = useState('');
  const [toCancel, setToCancel] = useState<Invoice | null>(null);
  const [toResend, setToResend] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const source = localInvoices ?? invoices;
  const filtered = source.filter((i) => filter === 'all' || i.status === filter);
  const total = filtered.reduce((s, i) => s + i.amount, 0);
  const overdue = source.filter((i) => i.status === 'overdue');

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleCreate = async () => {
    if (!form.tenantId) return setFormError('Selecione o cliente');
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return setFormError('Valor inválido');
    const days = Number(form.dueInDays);
    if (!Number.isFinite(days) || days < 1) return setFormError('Prazo inválido');
    const tenant = tenants.find((t) => t.id === form.tenantId);
    if (!tenant) return setFormError('Cliente não encontrado');

    try {
      const created = await invoicesService.create({ tenantId: tenant.id, planId: tenant.planId, amount,
        dueAt: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(), notes: form.notes });
      setLocalInvoices([created, ...source]);
      setShowNew(false); setForm(EMPTY_FORM); setFormError(undefined);
      flash(`Boleto ${created.number} emitido para ${tenant.name}`);
    } catch (error) { setFormError((error as { detail?: string }).detail ?? 'Falha ao emitir boleto'); }
  };

  const handleCancel = async () => {
    if (!toCancel) return;
    setOperationError('');
    try {
      const cancelled = await invoicesService.cancel(toCancel.id);
      setLocalInvoices(source.map((i) => i.id === toCancel.id ? cancelled : i));
      flash(`Boleto ${toCancel.number} cancelado`);
      setToCancel(null);
    } catch (error) { setOperationError((error as { detail?: string }).detail ?? 'Falha ao cancelar boleto'); }
  };

  const handleResend = async () => {
    if (!toResend) return;
    setOperationError('');
    try {
      await invoicesService.resend(toResend.id);
      flash(`Email reenviado para o cliente do boleto ${toResend.number}`);
      setToResend(null);
    } catch (error) { setOperationError((error as { detail?: string }).detail ?? 'Falha ao reenviar email'); }
  };

  const handleDownload = async (inv: Invoice) => {
    setOperationError('');
    try { await invoicesService.downloadPdf(inv.id, inv.number); flash(`Download iniciado: instrucoes-boleto-${inv.number}.pdf`); }
    catch { setOperationError('Falha ao baixar PDF de instruções'); }
  };

  return (
    <div className="inv">
      <div>
        <Text as="h1" size="3xl" weight="black">Boletos</Text>
        <Text tone="muted" size="sm">{filtered.length} boletos · {formatBRL(total)} no período</Text>
      </div>

      {overdue.length > 0 && (
        <div className="inv__alert">
          <Text weight="bold" size="lg">⚠️ {overdue.length} boletos vencidos</Text>
          <Text tone="muted">{formatBRL(overdue.reduce((s, i) => s + i.amount, 0))} em aberto</Text>
        </div>
      )}

      <div className="inv__toolbar">
        <div className="inv__filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={`inv__filter ${filter === f.id ? 'inv__filter--on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setFormError(undefined); setShowNew(true); }}>+ Emitir boleto</Button>
      </div>
      {operationError && <Text tone="danger" size="sm">{operationError}</Text>}

      <Card padding="sm">
        <div className="inv__head">
          <Text weight="bold" size="xs" tone="muted">NÚMERO</Text>
          <Text weight="bold" size="xs" tone="muted">CLIENTE</Text>
          <Text weight="bold" size="xs" tone="muted">PLANO</Text>
          <Text weight="bold" size="xs" tone="muted">VENCIMENTO</Text>
          <Text weight="bold" size="xs" tone="muted">STATUS</Text>
          <Text weight="bold" size="xs" tone="muted" style={{ textAlign: 'right' }}>VALOR</Text>
        </div>
        {filtered.map((i) => (
          <InvoiceRow key={i.id} invoice={i} onDownload={() => handleDownload(i)} onResend={() => setToResend(i)} onCancel={() => setToCancel(i)} />
        ))}
        {filtered.length === 0 && (
          <Text tone="muted" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Nenhum boleto neste filtro.</Text>
        )}
      </Card>

      <Modal open={showNew} title="Emitir boleto" confirmLabel="Emitir" cancelLabel="Cancelar"
        onConfirm={handleCreate} onCancel={() => { setShowNew(false); setFormError(undefined); }}
        description={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Cliente</Text>
              <select value={form.tenantId}
                onChange={(e) => {
                  const t = tenants.find((x) => x.id === e.target.value);
                  const amount = t ? plans.find(p => p.slug === t.planId)?.priceMonthly ?? 0 : 0;
                  setForm({ ...form, tenantId: e.target.value, amount: amount ? String(amount) : form.amount });
                  setFormError(undefined);
                }}
                style={{ width: '100%', height: 68, padding: '0 var(--space-4)', background: 'var(--color-surface-2)', border: '2px solid transparent', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-md)' }}>
                <option value="">Selecione…</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <Input label="Valor (R$)" type="number" step="0.01" size="lg" value={form.amount} onChange={(e) => { setForm({ ...form, amount: e.target.value }); setFormError(undefined); }} placeholder="399.00" />
            <Input label="Vencimento em (dias)" type="number" size="lg" value={form.dueInDays} onChange={(e) => { setForm({ ...form, dueInDays: e.target.value }); setFormError(undefined); }} />
            <Input label="Observações (opcional)" size="lg" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex: renovação anual" />
            {formError && <Text tone="danger" size="sm" weight="semibold">{formError}</Text>}
          </div>
        } />

      <Modal open={Boolean(toCancel)} title="Cancelar boleto?" confirmLabel="Cancelar boleto" cancelLabel="Voltar" variant="danger"
        onConfirm={handleCancel} onCancel={() => { setToCancel(null); setOperationError(''); }}
        description={toCancel && (
          <div><Text tone="muted">O boleto <strong>#{toCancel.number}</strong> de <strong>{formatBRL(toCancel.amount)}</strong> para {toCancel.tenantName} será cancelado no provedor, se a operação estiver disponível.</Text>
            {operationError && <Text tone="danger">{operationError}</Text>}</div>
        )} />

      <Modal open={Boolean(toResend)} title="Reenviar boleto por email" confirmLabel="Reenviar" cancelLabel="Cancelar"
        onConfirm={handleResend} onCancel={() => { setToResend(null); setOperationError(''); }}
        description={toResend && (
          <div><Text tone="muted">O boleto <strong>#{toResend.number}</strong> será enviado novamente para o email cadastrado do cliente.</Text>
            {operationError && <Text tone="danger">{operationError}</Text>}</div>
        )} />

      <Toast message={toast} tone="success" onClose={() => setToast(null)} />
    </div>
  );
}

function InvoiceRow({ invoice, onDownload, onResend, onCancel }: { invoice: Invoice; onDownload: () => void; onResend: () => void; onCancel: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const canCancel = invoice.status !== 'cancelled' && invoice.status !== 'paid';

  return (
    <div className="inv__block">
      <button className="inv__row" onClick={() => setExpanded(!expanded)}>
        <Text weight="bold" tone="primary">#{invoice.number}</Text>
        <div>
          <Text weight="semibold">{invoice.tenantName}</Text>
          <Text tone="muted" size="xs">{invoice.tenantSlug}</Text>
        </div>
        <Text tone="muted" size="sm">{invoice.planName}</Text>
        <Text tone="muted" size="sm">{formatDateBR(invoice.dueAt)}</Text>
        <InvoiceStatusBadge status={invoice.status} />
        <Text weight="black" style={{ textAlign: 'right' }}>{formatBRL(invoice.amount)}</Text>
      </button>

      {expanded && (
        <div className="inv__detail">
          <div><Text tone="muted" size="xs">Emitido em</Text><Text weight="semibold">{formatDateBR(invoice.issuedAt)}</Text></div>
          <div><Text tone="muted" size="xs">Vence em</Text><Text weight="semibold">{formatDateBR(invoice.dueAt)}</Text></div>
          {invoice.paidAt && (<div><Text tone="muted" size="xs">Pago em</Text><Text weight="semibold">{formatDateBR(invoice.paidAt)}</Text></div>)}
          {invoice.notes && (
            <div style={{ gridColumn: '1 / -1' }}><Text tone="muted" size="xs">Observações</Text><Text weight="semibold">{invoice.notes}</Text></div>
          )}
          <div className="inv__actions">
            {invoice.boletoUrl?.startsWith('https://') && <a href={invoice.boletoUrl} target="_blank" rel="noopener noreferrer">Abrir boleto oficial</a>}
            <Button variant="ghost" size="sm" onClick={onDownload}>Baixar instruções PDF</Button>
            <Button variant="ghost" size="sm" onClick={onResend}>Reenviar por email</Button>
            {canCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <span style={{ color: 'var(--color-danger)' }}>Cancelar</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
