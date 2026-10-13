import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { isValidEmail } from '@/utils/email';
import './ContentPage.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Email inválido');
    setError(undefined);
    // TODO(backend): substituir por authService.forgotPassword(email)
    setSent(true);
  };

  return (
    <div className="cp">
      <header className="cp__head">
        <span className="cp__eyebrow">Recuperação</span>
        <Text as="h1" size="4xl" weight="black">Esqueci minha senha</Text>
        <Text size="lg" tone="muted">Enviaremos um link para redefinir em alguns minutos.</Text>
      </header>

      {sent ? (
        <div className="cp__card" style={{ alignItems: 'center', textAlign: 'center', padding: 'var(--space-10)' }}>
          <div className="cp__card-icon" style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}>✉️</div>
          <Text as="h3" size="lg" weight="black">Email enviado</Text>
          <Text tone="muted">Se existir uma conta com o email {email}, o link chegará em instantes.</Text>
          <Text tone="muted" size="sm">Não esqueça de verificar a caixa de spam.</Text>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Email cadastrado" type="email" size="lg" value={email} onChange={(e) => { setEmail(e.target.value); setError(undefined); }} error={error} required />
          <Button type="submit" size="lg" fullWidth>Enviar link de recuperação</Button>
          <Text tone="muted" size="sm" style={{ textAlign: 'center' }}>
            Lembrou a senha? <Link to="/entrar" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-bold)' }}>Voltar ao login</Link>
          </Text>
        </form>
      )}

      <Link to="/entrar" className="cp__back">
        <Button variant="ghost" size="lg">Voltar para o login</Button>
      </Link>
    </div>
  );
}
