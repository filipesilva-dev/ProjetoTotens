import { Card, Text, ToggleSwitch, Input, Button } from '@/components/ui';
import { useState } from 'react';
export default function SuperSettings() {
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState(true);
  const [autoSuspend, setAutoSuspend] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Bem-vindo ao FastLanches!');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 900 }}>
      <Text as="h1" size="3xl" weight="black">Configurações</Text>
      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Cobrança</Text>
        <ToggleSwitch checked={sendInvoiceEmail} onChange={setSendInvoiceEmail} label="Enviar email automático ao emitir boleto" />
      </Card>
      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Clientes</Text>
        <ToggleSwitch checked={autoSuspend} onChange={setAutoSuspend} label="Suspender automaticamente após 30 dias de atraso" />
      </Card>
      <Card padding="lg">
        <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Mensagens padrão</Text>
        <Input label="Mensagem de boas-vindas" size="lg" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} />
      </Card>
      <Button size="lg">Salvar configurações</Button>
    </div>
  );
}
