import { useNavigate } from 'react-router-dom';
import { Button, Card, Text } from '@/components/ui';
import { ProgressSteps } from '@/components/totem/ProgressSteps';
import { useCartStore } from '@/contexts/CartContext';
import './InvoiceQuestion.css';
export default function InvoiceQuestion() {
  const nav = useNavigate();
  const cpf = useCartStore((s) => s.cpf);
  const setWants = useCartStore((s) => s.setWantsInvoiceEmail);
  const handleSkip = () => { setWants(false); nav('/totem/order/summary'); };
  const handleWant = () => { setWants(true); nav('/totem/invoice-email/input'); };
  return (
    <div className="screen screen--narrow">
      <ProgressSteps current={1} />
      <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Nota fiscal</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>Deseja receber a NF por email?</Text>
      <button type="button" className="iq__skip" onClick={handleSkip}>
        <span className="iq__skip-icon" aria-hidden>⚡</span>
        <span className="iq__skip-text">
          <Text as="span" size="xl" weight="black" tone="inverse" style={{ display: 'block' }}>Não, obrigado</Text>
          <Text as="span" size="sm" style={{ display: 'block', color: 'rgba(255,255,255,.9)' }}>Recomendado · Você pode pedir a nota depois</Text>
        </span>
        <span className="iq__skip-arrow" aria-hidden>→</span>
      </button>
      <div className="iq__divider"><span>ou receba por email</span></div>
      <Card variant="flat" padding="md">
        <Text weight="bold">Por que informar o email?</Text>
        <Text tone="muted" size="sm">• NF enviada automaticamente após o pagamento</Text>
        <Text tone="muted" size="sm">• Sem precisar guardar papel</Text>
      </Card>
      {cpf && <Text tone="soft" size="sm" style={{ textAlign: 'center' }}>CPF informado: {cpf}</Text>}
      <Button variant="ghost" size="lg" fullWidth onClick={handleWant}>Sim, quero receber por email</Button>
    </div>
  );
}
