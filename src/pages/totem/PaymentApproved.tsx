import { useNavigate } from 'react-router-dom';
import { Button, Card, IconCheck, Text } from '@/components/ui';
import { useCartStore } from '@/contexts/CartContext';
import { formatBRL } from '@/utils/currency';
export default function PaymentApproved() {
  const nav = useNavigate();
  const subtotal = useCartStore((s) => s.subtotal());
  return (
    <div className="screen screen--center">
      <div style={{ width: 130, height: 130, borderRadius: '50%',
        background: 'var(--color-success-soft)', color: 'var(--color-success)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconCheck size={70} />
      </div>
      <Text as="h1" size="4xl" weight="black">Pagamento aprovado!</Text>
      <Text tone="muted">Seu pedido já foi para a cozinha</Text>
      <Card variant="flat" padding="lg" style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text tone="muted">Valor pago</Text>
          <Text weight="black" size="xl">{formatBRL(subtotal)}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Text tone="muted">Forma</Text>
          <Text weight="bold">Pix</Text>
        </div>
      </Card>
      <Button size="lg" onClick={() => nav('/order/confirmed')}>Continuar</Button>
    </div>
  );
}
