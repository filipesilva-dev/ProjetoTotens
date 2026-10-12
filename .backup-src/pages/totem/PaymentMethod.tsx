import { useNavigate } from 'react-router-dom';
import { Card, IconPix, Text } from '@/components/ui';
import { useCartStore } from '@/contexts/CartContext';
import { formatBRL } from '@/utils/currency';
import './PaymentMethod.css';

/**
 * Método de pagamento.
 *
 * O totem aceita APENAS Pix — então esta tela não é um "escolha 1 de N",
 * é uma confirmação. A opção em si já é o botão de ação.
 */
export default function PaymentMethod() {
  const nav = useNavigate();
  const subtotal = useCartStore((s) => s.subtotal());

  return (
    <div className="screen screen--narrow">
      <div className="pm__head">
        <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>
          Pagamento via Pix
        </Text>
        <Text tone="muted" style={{ textAlign: 'center' }}>
          Rápido, seguro e sem taxas
        </Text>
      </div>

      <Card variant="raised" padding="lg" className="pm__total">
        <Text tone="muted" size="sm">Total a pagar</Text>
        <Text size="4xl" weight="black" tone="primary">{formatBRL(subtotal)}</Text>
      </Card>

      <button
        type="button"
        className="pm__option"
        onClick={() => nav('/payment/pix')}
        aria-label="Pagar com Pix"
      >
        <span className="pm__option-icon" aria-hidden>
          <IconPix size={52} />
        </span>

        <span className="pm__option-body">
          <Text as="span" size="2xl" weight="black" style={{ display: 'block' }}>
            Pagar com Pix
          </Text>
          <Text as="span" tone="muted" size="sm" style={{ display: 'block', marginTop: 4 }}>
            QR Code será exibido na próxima tela
          </Text>
          <Text as="span" tone="primary" size="sm" weight="bold" style={{ display: 'block', marginTop: 6 }}>
            ✓ Aprovação imediata
          </Text>
        </span>

        <span className="pm__option-arrow" aria-hidden>→</span>
      </button>

      <Text tone="soft" size="sm" style={{ textAlign: 'center' }}>
        Ao tocar, geramos seu QR Code para pagamento.
      </Text>
    </div>
  );
}
