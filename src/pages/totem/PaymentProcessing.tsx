import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Text } from '@/components/ui';
export default function PaymentProcessing() {
  const nav = useNavigate();
  useEffect(() => { const t = setTimeout(() => nav('/payment/approved'), 2500); return () => clearTimeout(t); }, [nav]);
  return (
    <div className="screen screen--center">
      <Spinner size={120} />
      <Text as="h1" size="4xl" weight="black">Confirmando pagamento...</Text>
      <Text weight="bold">Não feche esta tela</Text>
      <Text tone="muted" size="sm">Isso pode levar alguns segundos</Text>
    </div>
  );
}
