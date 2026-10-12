import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { useAuthStore } from '@/contexts/AuthContext';
import { isValidEmail } from '@/utils/email';
export default function Login() {
  const nav = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Email inválido');
    if (password.length < 6) return setError('Senha muito curta');
    login({ id: '1', name: 'Gerente', email, role: 'ADMIN' }, 'mock-' + Date.now());
    nav('/admin', { replace: true });
  };
  return (
    <div className="signup">
      <div className="signup__panel" style={{ maxWidth: 520, margin: '0 auto' }}>
        <header className="signup__head">
          <Text as="h1" size="3xl" weight="black">Entrar</Text>
          <Text tone="muted">Acesse o painel da sua loja.</Text>
        </header>
        <form onSubmit={handleSubmit} className="signup__form">
          <Input label="Email" type="email" size="lg" value={email} onChange={(e) => { setEmail(e.target.value); setError(undefined); }} required />
          <Input label="Senha" type="password" size="lg" value={password} onChange={(e) => { setPassword(e.target.value); setError(undefined); }} error={error} required />
          <Button type="submit" size="lg" fullWidth>Entrar</Button>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
            <Link to="/recuperar-senha" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)' }}>Esqueci minha senha</Link>
            <Link to="/cadastro" style={{ color: 'var(--color-text-muted)' }}>Criar conta</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
