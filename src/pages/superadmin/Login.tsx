import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { authService } from '@/services/auth';
import { isValidEmail } from '@/utils/email';
export default function SuperLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Email inválido');
    if (password.length < 6) return setError('Senha curta');
    try {
      const user = await authService.login(email, password);
      if (user.role !== 'superadmin') return setError('Acesso exclusivo do SuperAdmin');
      nav('/superadmin', { replace: true });
    } catch { setError('Email ou senha inválidos'); }
  };
  return (
    <div style={{ background: 'var(--color-super-sidebar)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 480, background: '#fff', padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ textAlign: 'center', fontSize: 72 }}>🍔</div>
        <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Console interno</Text>
        <Text tone="muted" style={{ textAlign: 'center' }}>Acesso restrito à equipe FastLanches</Text>
        <Input label="Email" type="email" size="lg" value={email} onChange={(e) => { setEmail(e.target.value); setError(undefined); }} required />
        <Input label="Senha" type="password" size="lg" value={password} onChange={(e) => { setPassword(e.target.value); setError(undefined); }} error={error} required />
        <Button type="submit" size="lg" fullWidth>Entrar no console</Button>
      </form>
    </div>
  );
}
