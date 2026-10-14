import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Text } from '@/components/ui';
import { paymentsService } from '@/services/payments';
export default function PaymentProcessing() {
  const nav = useNavigate();
  useEffect(() => {
    const orderId = paymentsService.currentOrderId();
    if (!orderId) return;
    const timer = setInterval(() => {
      void paymentsService.status(orderId).then(result => {
        if (result.status === 'approved' || result.status === 'paid') nav('/totem/payment/approved');
      }).catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [nav]);
  return (
    <div className="screen screen--center">
      <Spinner size={120} />
      <Text as="h1" size="4xl" weight="black">Confirmando pagamento...</Text>
      <Text tone="muted" size="sm">Não feche esta tela</Text>
    </div>
  );
}
