import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { authService } from '@/services/auth';
import { BRAND } from '@/config/brand';
export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await authService.login(email, pwd);
      nav(user.role === 'superadmin' ? '/superadmin' : '/admin', { replace: true });
    } catch { setError('Email ou senha inválidos'); }
  };
  return (
    <form onSubmit={handleSubmit} className="screen screen--narrow"
      style={{ maxWidth: 560, margin: 'auto', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', fontSize: 72 }}>🍔</div>
      <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>{BRAND.name}</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>Painel do Gerente · Acesso restrito</Text>
      <Input label="Usuário" size="lg" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Senha" size="lg" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
      {error && <Text tone="danger">{error}</Text>}
      <Button type="submit" size="lg" fullWidth>Entrar no painel</Button>
    </form>
  );
}
