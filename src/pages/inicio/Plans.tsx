import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Text, Button } from '@/components/ui';
import { PlanCard } from '@/components/inicio/PlanCard';
import { usePlans } from '@/hooks/usePlans';
import type { SubscriptionCycle } from '@/types';
import './Plans.css';
const FAQ = [
  { q: 'Preciso instalar algo?', a: 'Não. O sistema roda no navegador. Você só precisa de um totem touch com internet.' },
  { q: 'Como funciona o teste?', a: 'São 14 dias com acesso completo. Sem cartão de crédito para começar.' },
  { q: 'Posso mudar de plano?', a: 'Sim, a qualquer momento. O valor é recalculado proporcionalmente.' },
  { q: 'Quais formas de pagamento?', a: 'Pix, boleto e cartão de crédito. Cobrança mensal ou anual.' },
];
export default function Plans() {
  const [cycle, setCycle] = useState<SubscriptionCycle>('monthly');
  const { plans } = usePlans();
  return (
    <div className="plans-page">
      <header className="plans-page__head">
        <Text as="h1" size="4xl" weight="black" style={{ textAlign: 'center' }}>Escolha o plano ideal</Text>
        <Text size="lg" tone="muted" style={{ textAlign: 'center' }}>Todos com 14 dias de teste. Sem fidelidade.</Text>
        <div className="plans-page__toggle">
          <button className={`plans-page__toggle-btn ${cycle === 'monthly' ? 'plans-page__toggle-btn--on' : ''}`} onClick={() => setCycle('monthly')}>Mensal</button>
          <button className={`plans-page__toggle-btn ${cycle === 'yearly' ? 'plans-page__toggle-btn--on' : ''}`} onClick={() => setCycle('yearly')}>
            Anual<span className="plans-page__discount">2 meses grátis</span>
          </button>
        </div>
      </header>
      <div className="plans-page__grid">
        {plans.map((p) => <PlanCard key={p.id} plan={p} cycle={cycle} />)}
      </div>
      <section className="plans-page__faq">
        <Text as="h2" size="2xl" weight="black" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>Perguntas frequentes</Text>
        <div className="plans-page__faq-list">
          {FAQ.map((item) => (
            <details key={item.q} className="plans-page__faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="plans-page__help">
        <Text as="h3" size="2xl" weight="black">Ficou com dúvida?</Text>
        <Text tone="muted">Ajudamos a escolher o plano certo para sua operação.</Text>
        <Link to="/contato"><Button size="lg">Falar com vendas</Button></Link>
      </section>
    </div>
  );
}
