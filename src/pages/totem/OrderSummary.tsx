import { useNavigate } from 'react-router-dom';
import { Button, Card, Text } from '@/components/ui';
import { ProgressSteps } from '@/components/totem/ProgressSteps';
import { useCartStore } from '@/contexts/CartContext';
import { formatBRL } from '@/utils/currency';
export default function OrderSummary() {
  const nav = useNavigate();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const email = useCartStore((s) => s.email);
  return (
    <div className="screen screen--narrow">
      <ProgressSteps current={2} />
      <Text as="h1" size="3xl" weight="black">Resumo do pedido</Text>
      {items.map((i) => (
        <Card key={i.productId} variant="flat" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <Text weight="bold">{i.product.name}</Text>
              <Text tone="muted" size="sm">
                {i.quantity}x{i.removedIngredients.length > 0 && ` · sem ${i.removedIngredients.join(', ')}`}
              </Text>
            </div>
            <Text weight="black">{formatBRL(i.unitPrice * i.quantity)}</Text>
          </div>
        </Card>
      ))}
      {email && (
        <Card variant="outline" padding="sm">
          <Text tone="muted" size="sm">📧 NF por email: {email}</Text>
        </Card>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Text weight="black" size="xl">Total</Text>
        <Text weight="black" size="xl" tone="primary">{formatBRL(subtotal)}</Text>
      </div>
      <Button size="lg" fullWidth onClick={() => nav('/payment')}>Ir para pagamento</Button>
    </div>
  );
}
