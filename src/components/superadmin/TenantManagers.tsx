import { useEffect, useState } from 'react';
import { Button, Input, Text } from '@/components/ui';
import { managersService, type Manager } from '@/services/managers';
import { isValidEmail } from '@/utils/email';

const blank = { name: '', email: '', password: '' };

export function TenantManagers({ tenantId }: { tenantId: string }) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void managersService.list(tenantId)
      .then(data => { if (alive) setManagers(data); })
      .catch(() => { if (alive) setError('Falha ao carregar gerentes'); });
    return () => { alive = false; };
  }, [tenantId]);

  const submit = async () => {
    if (form.name.trim().length < 2 || !isValidEmail(form.email)) return setError('Informe nome e email válidos');
    if (!editing && form.password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres');
    setBusy(true); setError('');
    try {
      if (editing) {
        const updated = await managersService.update(tenantId, editing, { name: form.name, email: form.email });
        setManagers(current => current.map(item => item.id === editing ? updated : item));
      } else {
        const created = await managersService.create(tenantId, form);
        setManagers(current => [...current, created]);
      }
      setForm(blank); setEditing(null);
    } catch (cause) { setError((cause as { detail?: string }).detail ?? 'Falha ao salvar gerente'); }
    finally { setBusy(false); }
  };

  const toggle = async (manager: Manager) => {
    setBusy(true); setError('');
    try {
      const updated = await managersService.update(tenantId, manager.id, { active: !manager.active });
      setManagers(current => current.map(item => item.id === manager.id ? updated : item));
    } catch (cause) { setError((cause as { detail?: string }).detail ?? 'Falha ao alterar gerente'); }
    finally { setBusy(false); }
  };

  const reset = async () => {
    if (!resetting || form.password.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres');
    setBusy(true); setError('');
    try {
      await managersService.resetPassword(tenantId, resetting, form.password);
      setResetting(null); setForm(blank);
    } catch (cause) { setError((cause as { detail?: string }).detail ?? 'Falha ao redefinir senha'); }
    finally { setBusy(false); }
  };

  return <section style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <Text weight="bold">Gerentes</Text>
    {managers.map(manager => <div key={manager.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Text size="sm">{manager.name} · {manager.email} · {manager.active ? 'Ativo' : 'Inativo'}</Text>
      <Button variant="ghost" size="sm" onClick={() => { setEditing(manager.id); setResetting(null); setForm({ name: manager.name, email: manager.email, password: '' }); }}>Editar</Button>
      <Button variant="ghost" size="sm" onClick={() => { setResetting(manager.id); setEditing(null); setForm(blank); }}>Redefinir senha</Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => void toggle(manager)}>{manager.active ? 'Desativar' : 'Reativar'}</Button>
    </div>)}
    {resetting ? <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
      <Input label="Nova senha" type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
      <Button size="sm" disabled={busy} onClick={() => void reset()}>Redefinir</Button>
      <Button size="sm" variant="ghost" onClick={() => { setResetting(null); setForm(blank); }}>Cancelar</Button>
    </div> : <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
      <Input label="Nome" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
      <Input label="Email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
      {!editing && <Input label="Senha inicial" type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />}
      <Button size="sm" disabled={busy} onClick={() => void submit()}>{editing ? 'Salvar gerente' : 'Adicionar gerente'}</Button>
      {editing && <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setForm(blank); }}>Cancelar</Button>}
    </div>}
    {error && <Text tone="danger" size="sm">{error}</Text>}
  </section>;
}
