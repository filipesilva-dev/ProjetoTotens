import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, IconPix, Spinner, Text } from '@/components/ui';
import { useCartStore } from '@/contexts/CartContext';
import { paymentsService } from '@/services/payments';
import { ordersService } from '@/services/orders';
import { useInterval } from '@/hooks/useInterval';
import { formatBRL } from '@/utils/currency';
import type { PixCharge } from '@/types';
import './PaymentPix.css';
export default function PaymentPix() {
  const nav = useNavigate();
  const items = useCartStore((s) => s.items);
  const cpf = useCartStore((s) => s.cpf);
  const email = useCartStore((s) => s.email);
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const orderRequest = useRef<ReturnType<typeof ordersService.create> | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        orderRequest.current ??= ordersService.create({ items, customer: { cpf, email }, paymentMethod: 'PIX' });
        const order = await orderRequest.current;
        const pix = await paymentsService.createPixCharge(order.id);
        if (alive) setCharge(pix);
      } catch {
        if (alive) nav('/totem/error/no-connection');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);
  useInterval(async () => {
    if (!charge) return;
    setChecking(true);
    try {
      const payment = await paymentsService.status(charge.orderId);
      if (payment.status === 'approved' || payment.status === 'paid') {
        useCartStore.getState().clear(); nav('/totem/payment/approved');
      }
      if (payment.status === 'cancelled' || payment.status === 'failed') nav('/totem/error/payment-declined');
    } catch {
      // O próximo ciclo tentará consultar o pagamento novamente.
    } finally { setChecking(false); }
  }, 3000);
  if (loading) return <div className="screen screen--center"><Spinner size={64} label="Gerando QR Code..." /></div>;
  if (!charge) return null;
  return (
    <div className="ppix">
      <div className="ppix__head">
        <div className="ppix__icon"><IconPix size={36} /></div>
        <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Pague com Pix</Text>
        <Text tone="muted" style={{ textAlign: 'center' }}>Abra o app do seu banco e escaneie o QR Code</Text>
      </div>
      <Card variant="raised" padding="lg" className="ppix__qr"><img src={charge.qrCodeImage} alt="QR Code Pix" /></Card>
      <Card variant="flat" padding="md" className="ppix__amount">
        <Text tone="muted" size="sm">Valor a pagar</Text>
        <Text size="3xl" weight="black" tone="primary">{formatBRL(charge.amount)}</Text>
      </Card>
      <div className="ppix__steps">
        <div className="ppix__step"><span className="ppix__step-num">1</span><Text size="sm">Abra o app do seu banco</Text></div>
        <div className="ppix__step"><span className="ppix__step-num">2</span><Text size="sm">Escolha "Pagar com Pix"</Text></div>
        <div className="ppix__step"><span className="ppix__step-num">3</span><Text size="sm">Aponte a câmera para o QR Code</Text></div>
      </div>
      <div className="ppix__status">
        <Spinner size={22} />
        <Text tone="muted" size="sm">{checking ? 'Verificando pagamento...' : 'Aguardando confirmação do banco...'}</Text>
      </div>
      <Button variant="ghost" size="lg" onClick={async () => { await paymentsService.cancel(charge.orderId).catch(() => undefined); nav('/totem/payment'); }}>Cancelar</Button>
    </div>
  );
}
