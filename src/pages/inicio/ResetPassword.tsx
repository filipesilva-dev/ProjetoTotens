import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { authService } from '@/services/auth';
import './ContentPage.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setError('Use pelo menos 8 caracteres');
    try { await authService.resetPassword(params.get('token') ?? '', password); setDone(true); }
    catch { setError('Link inválido ou expirado'); }
  };
  return <div className="cp"><header className="cp__head"><Text as="h1" size="4xl" weight="black">Redefinir senha</Text></header>
    {done ? <div className="cp__card"><Text>Senha atualizada. <Link to="/entrar">Entrar</Link></Text></div> :
      <form onSubmit={submit} className="cp__card"><Input label="Nova senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <Text tone="danger">{error}</Text>}<Button type="submit">Salvar nova senha</Button></form>}
  </div>;
}
