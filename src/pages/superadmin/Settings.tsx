import { useEffect, useState } from 'react';
import { Button, Card, Input, Text, Toast, ToggleSwitch } from '@/components/ui';
import { settingsService } from '@/services/settings';

interface Settings {
  sendInvoiceEmail: boolean;
  autoSuspend: boolean;
  autoSuspendDays: string;
  welcomeMessage: string;
  supportEmail: string;
  maintenanceMode: boolean;
}

const DEFAULTS: Settings = {
  sendInvoiceEmail: true,
  autoSuspend: true,
  autoSuspendDays: '30',
  welcomeMessage: 'Bem-vindo ao FastLanches!',
  supportEmail: 'suporte@fastlanches.com',
  maintenanceMode: false,
};

export default function SuperSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState<Settings | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void settingsService.get().then(data => { setSettings(data); setSaved(data); })
      .catch(() => setError('Falha ao carregar configurações'));
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setError(undefined);
  };

  const handleSave = async () => {
    if (!settings.supportEmail.includes('@')) return setError('Email de suporte inválido');
    if (!settings.welcomeMessage.trim()) return setError('Mensagem de boas-vindas não pode ser vazia');
    const days = Number(settings.autoSuspendDays);
    if (settings.autoSuspend && (!Number.isFinite(days) || days < 1)) return setError('Prazo de suspensão precisa ser maior que zero');

    try {
      const savedSettings = await settingsService.save(settings);
      setSettings(savedSettings); setSaved(savedSettings);
      setToast('Configurações salvas');
      setTimeout(() => setToast(null), 2500);
    } catch { setError('Falha ao salvar configurações'); }
  };

  const handleReset = () => {
    setSettings(saved ?? DEFAULTS);
    setError(undefined);
    setToast('Alterações descartadas');
    setTimeout(() => setToast(null), 2000);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(saved);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 900 }}>
      <div>
        <Text as="h1" size="3xl" weight="black">Configurações</Text>
        <Text tone="muted" size="sm">Regras globais do console FastLanches</Text>
      </div>

      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Cobrança</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <ToggleSwitch checked={settings.sendInvoiceEmail} onChange={(v) => update('sendInvoiceEmail', v)} label="Enviar email automático ao emitir boleto" />
        </div>
      </Card>

      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Clientes</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <ToggleSwitch checked={settings.autoSuspend} onChange={(v) => update('autoSuspend', v)} label="Suspender automaticamente após período de atraso" />
          {settings.autoSuspend && (
            <Input label="Dias de atraso antes de suspender" type="number" size="md" value={settings.autoSuspendDays} onChange={(e) => update('autoSuspendDays', e.target.value)} />
          )}
          <ToggleSwitch checked={settings.maintenanceMode} onChange={(v) => update('maintenanceMode', v)} label="Modo manutenção (bloqueia novos pedidos em todos os totens)" />
        </div>
      </Card>

      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Mensagens padrão</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Mensagem de boas-vindas (enviada ao criar conta)" size="lg" value={settings.welcomeMessage} onChange={(e) => update('welcomeMessage', e.target.value)} />
          <Input label="Email de suporte exibido para clientes" type="email" size="lg" value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} />
        </div>
      </Card>

      {error && (
        <div style={{ padding: 'var(--space-4)', background: 'var(--color-danger-soft)', borderRadius: 'var(--radius-md)' }}>
          <Text tone="danger" weight="semibold" size="sm">{error}</Text>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button size="lg" onClick={handleSave} disabled={!hasChanges}>Salvar configurações</Button>
        {hasChanges && (<Button variant="ghost" size="lg" onClick={handleReset}>Descartar</Button>)}
      </div>

      <Toast message={toast} tone="success" onClose={() => setToast(null)} />
    </div>
  );
}
