import { useState } from 'react';
import { Button, Input, Text } from '@/components/ui';
import { isValidEmail } from '@/utils/email';
import { api } from '@/services/api';
import './ContentPage.css';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Informe seu nome');
    if (!isValidEmail(email)) return setError('Email inválido');
    if (message.trim().length < 10) return setError('Mensagem muito curta');
    setError(undefined);
    try { await api.post('/contact', { name, email, message }); setSent(true); }
    catch { setError('Não foi possível enviar a mensagem'); }
  };

  return (
    <div className="cp">
      <header className="cp__head">
        <span className="cp__eyebrow">Contato</span>
        <Text as="h1" size="4xl" weight="black">Fale com a gente</Text>
        <Text size="lg" tone="muted">Respondemos em até um dia útil.</Text>
      </header>

      <section className="cp__grid">
        <div className="cp__card">
          <div className="cp__card-icon">✉️</div>
          <Text as="h3" size="lg" weight="black">Email</Text>
          <Text tone="muted">contato@fastlanches.com</Text>
        </div>
        <div className="cp__card">
          <div className="cp__card-icon">📞</div>
          <Text as="h3" size="lg" weight="black">Telefone</Text>
          <Text tone="muted">(61) 3356-9000</Text>
        </div>
        <div className="cp__card">
          <div className="cp__card-icon">📍</div>
          <Text as="h3" size="lg" weight="black">Endereço</Text>
          <Text tone="muted">Taguatinga, Brasília — DF</Text>
        </div>
      </section>

      <section className="cp__section">
        <Text as="h2" size="2xl" weight="black">Mande sua mensagem</Text>

        {sent ? (
          <div className="cp__card" style={{ alignItems: 'center', textAlign: 'center', padding: 'var(--space-10)' }}>
            <div className="cp__card-icon" style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}>✓</div>
            <Text as="h3" size="lg" weight="black">Mensagem enviada</Text>
            <Text tone="muted">Vamos responder no email {email}.</Text>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input label="Seu nome" size="lg" value={name} onChange={(e) => { setName(e.target.value); setError(undefined); }} required />
            <Input label="Email" type="email" size="lg" value={email} onChange={(e) => { setEmail(e.target.value); setError(undefined); }} required />
            <div>
              <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Mensagem</Text>
              <textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); setError(undefined); }}
                rows={5}
                style={{ width: '100%', padding: 'var(--space-4)', background: '#fff', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', fontSize: 'var(--font-size-md)', outline: 'none', resize: 'vertical' }}
                required
              />
            </div>
            {error && <Text tone="danger" size="sm" weight="semibold">{error}</Text>}
            <Button type="submit" size="lg" fullWidth>Enviar mensagem</Button>
          </form>
        )}
      </section>
    </div>
  );
}
