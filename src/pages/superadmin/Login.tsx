import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { useSuperAdminStore } from '@/contexts/SuperAdminContext';
import { isValidEmail } from '@/utils/email';
export default function SuperLogin() {
  const nav = useNavigate();
  const login = useSuperAdminStore((s) => s.login);
  const [email, setEmail] = useState('admin@fastlanches.com');
  const [password, setPassword] = useState('super123');
  const [error, setError] = useState<string | undefined>();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Email inválido');
    if (password.length < 6) return setError('Senha curta');
    login({ id: 'sa-1', name: 'Admin FastLanches', email, role: 'superadmin' }, 'sa-' + Date.now());
    nav('/superadmin', { replace: true });
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
