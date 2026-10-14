import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Text } from '@/components/ui';
import { isValidEmail } from '@/utils/email';
import { authService } from '@/services/auth';
import './Signup.css';

const BENEFITS = [
  '14 dias grátis, sem cartão',
  'Cancelamento a qualquer momento',
  'Suporte em português',
  'Conformidade com LGPD',
];

export default function Signup() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const chosenPlan = params.get('plano') || 'pro';
  const chosenCycle = params.get('cycle') === 'yearly' ? 'yearly' : 'monthly';

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // ─── Erros por campo (antes era um único `error` compartilhado) ───
  const [storeNameError, setStoreNameError] = useState<string | undefined>();
  const [ownerNameError, setOwnerNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [termsError, setTermsError] = useState<string | undefined>();

  const clearAllErrors = () => {
    setStoreNameError(undefined);
    setOwnerNameError(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
    setTermsError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();

    let hasError = false;

    if (!storeName.trim()) {
      setStoreNameError('Informe o nome da loja');
      hasError = true;
    }
    if (!ownerName.trim()) {
      setOwnerNameError('Informe o seu nome');
      hasError = true;
    }
    if (!isValidEmail(email)) {
      setEmailError('Email inválido');
      hasError = true;
    }
    if (password.length < 8) {
      setPasswordError('Senha com pelo menos 8 caracteres');
      hasError = true;
    }
    if (!acceptedTerms) {
      setTermsError('É necessário aceitar os termos');
      hasError = true;
    }

    if (hasError) return;

    try {
      const base = storeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'loja';
      await authService.signup({ slug: `${base}-${crypto.randomUUID().slice(0, 6)}`,
        name: storeName, ownerName, ownerEmail: email, password, planId: chosenPlan });
      await authService.login(email, password);
      nav(`/checkout/${chosenPlan}?cycle=${chosenCycle}`);
    } catch (cause) { setEmailError((cause as { detail?: string }).detail ?? 'Falha ao criar conta'); }
  };

  return (
    <div className="signup">
      <div className="signup__panel">
        <header className="signup__head">
          <Text as="h1" size="3xl" weight="black">Criar minha conta</Text>
          <Text tone="muted">14 dias grátis. Sem cartão de crédito.</Text>
        </header>

        <form onSubmit={handleSubmit} className="signup__form">
          <Input
            label="Nome da loja"
            size="lg"
            value={storeName}
            onChange={(e) => { setStoreName(e.target.value); setStoreNameError(undefined); }}
            error={storeNameError}
            required
          />

          <Input
            label="Seu nome"
            size="lg"
            value={ownerName}
            onChange={(e) => { setOwnerName(e.target.value); setOwnerNameError(undefined); }}
            error={ownerNameError}
            required
          />

          <Input
            label="Email"
            type="email"
            size="lg"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(undefined); }}
            error={emailError}
            required
          />

          <Input
            label="Senha"
            type="password"
            size="lg"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(undefined); }}
            error={passwordError}
            hint="Mínimo de 8 caracteres"
            required
          />

          <label className="signup__terms-check">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => { setAcceptedTerms(e.target.checked); setTermsError(undefined); }}
            />
            <span>
              Aceito os <Link to="/termos">Termos</Link> e a <Link to="/privacidade">Política</Link>.
            </span>
          </label>

          {termsError && (
            <Text tone="danger" size="sm" weight="semibold">{termsError}</Text>
          )}

          <Button type="submit" size="lg" fullWidth>Criar conta e escolher plano</Button>

          <Text tone="muted" size="sm" style={{ textAlign: 'center' }}>
            Já tem conta?{' '}
            <Link to="/entrar" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-bold)' }}>
              Fazer login
            </Link>
          </Text>
        </form>
      </div>

      <aside className="signup__side">
        <Text as="h3" size="2xl" weight="black" style={{ color: '#fff' }}>O que está incluído</Text>
        <ul className="signup__benefits">
          {BENEFITS.map((b) => <li key={b}>✓ {b}</li>)}
        </ul>
      </aside>
    </div>
  );
}
