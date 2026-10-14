import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { authService } from '@/services/auth';

export default function TotemLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const user = await authService.login(email, password);
      if (user.role === 'superadmin') return setError('Use uma conta da loja');
      nav('/totem/splash', { replace: true });
    } catch { setError('Credenciais inválidas'); }
  };
  return <form onSubmit={submit} className="screen screen--narrow" style={{ maxWidth: 560, margin: 'auto', justifyContent: 'center' }}>
    <Text as="h1" size="3xl" weight="black">Entrar no totem</Text>
    <Input label="Email do totem" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
    <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
    {error && <Text tone="danger">{error}</Text>}
    <Button type="submit" size="lg">Entrar</Button>
  </form>;
}
