import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { useAuthStore } from '@/contexts/AuthContext';
import { BRAND } from '@/config/brand';
export default function Login() {
  const nav = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('gerente@fastlanches.com');
  const [pwd, setPwd] = useState('123456');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ id: '1', name: 'Gerente', email, role: 'ADMIN' }, 'mock-' + Date.now());
    nav('/admin', { replace: true });
  };
  return (
    <form onSubmit={handleSubmit} className="screen screen--narrow"
      style={{ maxWidth: 560, margin: 'auto', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', fontSize: 72 }}>🍔</div>
      <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>{BRAND.name}</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>Painel do Gerente · Acesso restrito</Text>
      <Input label="Usuário" size="lg" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Senha" size="lg" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
      <Button type="submit" size="lg" fullWidth>Entrar no painel</Button>
    </form>
  );
}
