import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { isValidEmail } from '@/utils/email';
import './Signup.css';
const BENEFITS = ['14 dias grátis, sem cartão', 'Cancelamento a qualquer momento', 'Suporte em português', 'Conformidade com LGPD'];
export default function Signup() {
  const nav = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return setError('Informe o nome da loja');
    if (!ownerName.trim()) return setError('Informe o seu nome');
    if (!isValidEmail(email)) return setError('Email inválido');
    if (password.length < 8) return setError('Senha com pelo menos 8 caracteres');
    if (!acceptedTerms) return setError('É necessário aceitar os termos');
    nav('/checkout/pro');
  };
  return (
    <div className="signup">
      <div className="signup__panel">
        <header className="signup__head">
          <Text as="h1" size="3xl" weight="black">Criar minha conta</Text>
          <Text tone="muted">14 dias grátis. Sem cartão de crédito.</Text>
        </header>
        <form onSubmit={handleSubmit} className="signup__form">
          <Input label="Nome da loja" size="lg" value={storeName} onChange={(e) => { setStoreName(e.target.value); setError(undefined); }} required />
          <Input label="Seu nome" size="lg" value={ownerName} onChange={(e) => { setOwnerName(e.target.value); setError(undefined); }} required />
          <Input label="Email" type="email" size="lg" value={email} onChange={(e) => { setEmail(e.target.value); setError(undefined); }} required />
          <Input label="Senha" type="password" size="lg" value={password} onChange={(e) => { setPassword(e.target.value); setError(undefined); }} error={error} required />
          <label className="signup__terms-check">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
            <span>Aceito os <a href="/termos">Termos</a> e a <a href="/privacidade">Política</a>.</span>
          </label>
          <Button type="submit" size="lg" fullWidth>Criar conta e escolher plano</Button>
          <Text tone="muted" size="sm" style={{ textAlign: 'center' }}>
            Já tem conta? <Link to="/entrar" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-bold)' }}>Fazer login</Link>
          </Text>
        </form>
      </div>
      <aside className="signup__side">
        <Text as="h3" size="2xl" weight="black" style={{ color: '#fff' }}>O que está incluído</Text>
        <ul className="signup__benefits">{BENEFITS.map((b) => <li key={b}>✓ {b}</li>)}</ul>
      </aside>
    </div>
  );
}
