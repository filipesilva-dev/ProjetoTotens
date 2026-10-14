import { useNavigate } from 'react-router-dom';
import { Card, IconPix, Text } from '@/components/ui';
import { useCartStore } from '@/contexts/CartContext';
import { formatBRL } from '@/utils/currency';
import './PaymentMethod.css';
export default function PaymentMethod() {
  const nav = useNavigate();
  const subtotal = useCartStore((s) => s.subtotal());
  return (
    <div className="screen screen--narrow">
      <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Pagamento via Pix</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>Rápido, seguro e sem taxas</Text>
      <Card variant="raised" padding="lg" className="pm__total">
        <Text tone="muted" size="sm">Total a pagar</Text>
        <Text size="4xl" weight="black" tone="primary">{formatBRL(subtotal)}</Text>
      </Card>
      <button type="button" className="pm__option" onClick={() => nav('/totem/payment/pix')}>
        <span className="pm__option-icon"><IconPix size={52} /></span>
        <span className="pm__option-body">
          <Text as="span" size="2xl" weight="black" style={{ display: 'block' }}>Pagar com Pix</Text>
          <Text as="span" tone="muted" size="sm" style={{ display: 'block', marginTop: 4 }}>QR Code na próxima tela</Text>
          <Text as="span" tone="primary" size="sm" weight="bold" style={{ display: 'block', marginTop: 6 }}>✓ Aprovação imediata</Text>
        </span>
        <span className="pm__option-arrow">→</span>
      </button>
      <Text tone="soft" size="sm" style={{ textAlign: 'center' }}>Ao tocar, geramos seu QR Code para pagamento.</Text>
    </div>
  );
}
