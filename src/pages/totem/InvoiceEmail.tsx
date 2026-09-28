import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { ProgressSteps } from '@/components/totem/ProgressSteps';
import { useCartStore } from '@/contexts/CartContext';
import { isValidEmail } from '@/utils/email';
export default function InvoiceEmail() {
  const nav = useNavigate();
  const setEmail = useCartStore((s) => s.setEmail);
  const [email, setEmailLocal] = useState('');
  const [error, setError] = useState<string | undefined>();
  const handleConfirm = () => {
    if (!isValidEmail(email)) { setError('Email inválido — verifique'); return; }
    setEmail(email); nav('/invoice-email/confirm');
  };
  return (
    <div className="screen screen--narrow">
      <ProgressSteps current={1} />
      <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Informe seu email</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>Enviaremos a NF após o pagamento</Text>
      <Input label="Email" size="lg" type="email" placeholder="seuemail@exemplo.com"
        value={email} onChange={(e) => { setEmailLocal(e.target.value); setError(undefined); }} error={error} />
      <Text weight="bold" size="sm" tone="soft">SUGESTÕES</Text>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button variant="secondary" onClick={() => setEmailLocal(email + '@gmail.com')}>@gmail.com</Button>
        <Button variant="secondary" onClick={() => setEmailLocal(email + '@outlook.com')}>@outlook.com</Button>
      </div>
      <Button size="lg" fullWidth onClick={handleConfirm}>Confirmar email</Button>
    </div>
  );
}
