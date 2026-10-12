import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Text } from '@/components/ui';
export default function PaymentProcessing() {
  const nav = useNavigate();
  useEffect(() => { const t = setTimeout(() => nav('/totem/payment/approved'), 2500); return () => clearTimeout(t); }, [nav]);
  return (
    <div className="screen screen--center">
      <Spinner size={120} />
      <Text as="h1" size="4xl" weight="black">Confirmando pagamento...</Text>
      <Text tone="muted" size="sm">Não feche esta tela</Text>
    </div>
  );
}
