import { useNavigate } from 'react-router-dom';
import { Button, Card, IconMail, Text } from '@/components/ui';
import { useCartStore } from '@/contexts/CartContext';
export default function InvoiceConfirm() {
  const nav = useNavigate();
  const email = useCartStore((s) => s.email);
  return (
    <div className="screen screen--narrow">
      <div style={{ color: 'var(--color-primary)', textAlign: 'center' }}><IconMail size={72} /></div>
      <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Confirme seu email</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>Está correto?</Text>
      <Card variant="flat" padding="lg">
        <Text tone="muted" size="sm" style={{ textAlign: 'center' }}>Enviaremos a NF para:</Text>
        <Text size="xl" weight="bold" style={{ textAlign: 'center', marginTop: 8 }}>{email}</Text>
      </Card>
      <Button size="lg" fullWidth onClick={() => nav('/order/summary')}>Sim, está correto</Button>
      <Button variant="ghost" size="lg" fullWidth onClick={() => nav('/invoice-email/input')}>Corrigir email</Button>
    </div>
  );
}
