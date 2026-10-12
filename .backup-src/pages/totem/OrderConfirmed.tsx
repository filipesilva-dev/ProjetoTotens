import { useNavigate } from 'react-router-dom';
import { Button, Card, IconCheck, Text } from '@/components/ui';
export default function OrderConfirmed() {
  const nav = useNavigate();
  return (
    <div className="screen screen--center">
      <div style={{ width: 120, height: 120, borderRadius: '50%',
        background: 'var(--gradient-primary)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-primary)' }}>
        <IconCheck size={70} />
      </div>
      <Text as="h1" size="3xl" weight="black">Pedido confirmado!</Text>
      <Text tone="muted">Sua senha de retirada é</Text>
      <div style={{ padding: '24px 64px', borderRadius: 24, background: 'var(--gradient-warm)',
        boxShadow: 'var(--shadow-accent)' }}>
        <Text weight="black" style={{ fontSize: 160, lineHeight: 1, color: '#fff', letterSpacing: -6 }}>042</Text>
      </div>
      <Text tone="muted">Aguarde ser chamado no balcão</Text>
      <Card variant="flat" padding="md" style={{ width: '100%', maxWidth: 420 }}>
        <Text tone="muted" size="sm">⏱ Tempo estimado</Text>
        <Text weight="bold" size="lg">8 a 12 minutos</Text>
      </Card>
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <Button variant="ghost" size="lg" onClick={() => nav('/order/printing')}>🖨 Comprovante</Button>
        <Button size="lg" onClick={() => nav('/welcome')}>Novo pedido</Button>
      </div>
    </div>
  );
}
