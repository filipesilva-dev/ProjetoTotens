import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Text } from '@/components/ui';
import { usePlans } from '@/hooks/usePlans';
import { formatBRL } from '@/utils/currency';
import type { SubscriptionCycle } from '@/types';
import { api } from '@/services/api';
import { useAuthStore } from '@/contexts/AuthContext';
import './Checkout.css';
export default function Checkout() {
  const nav = useNavigate();
  const { planoId } = useParams();
  const [params] = useSearchParams();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated());
  const { plans } = usePlans();
  const plan = plans.find((p) => p.id === planoId || ('slug' in p && p.slug === planoId)) ?? plans[0];
  const [cycle, setCycle] = useState<SubscriptionCycle>(params.get('cycle') === 'yearly' ? 'yearly' : 'monthly');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  if (!plan) return null;
  const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const handleConfirm = async () => {
    if (!isAuthenticated) return nav(`/cadastro?plano=${plan.id}&cycle=${cycle}`);
    setProcessing(true);
    try {
      await api.post('/subscriptions', { planId: plan.id, cycle });
      nav('/boas-vindas');
    } catch (cause) { setError((cause as { detail?: string }).detail ?? 'Falha ao ativar teste'); }
    finally { setProcessing(false); }
  };
  return (
    <div className="checkout">
      <header className="checkout__head">
        <Text as="h1" size="3xl" weight="black">Finalizar contratação</Text>
        <Text tone="muted">Você só começa a pagar depois dos 14 dias de teste.</Text>
      </header>
      <div className="checkout__grid">
        <main className="checkout__main">
          <Card padding="lg">
            <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Ciclo de cobrança</Text>
            <div className="checkout__cycle">
              <button className={`checkout__cycle-opt ${cycle === 'monthly' ? 'checkout__cycle-opt--on' : ''}`} onClick={() => setCycle('monthly')}>
                <Text weight="bold" size="lg">Mensal</Text>
                <Text tone="muted" size="sm">Sem compromisso</Text>
              </button>
              <button className={`checkout__cycle-opt ${cycle === 'yearly' ? 'checkout__cycle-opt--on' : ''}`} onClick={() => setCycle('yearly')}>
                <Text weight="bold" size="lg">Anual</Text>
                <Text tone="success" size="sm">Economize 2 meses</Text>
              </button>
            </div>
          </Card>
          <Card padding="lg">
            <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Cobrança após o teste</Text>
            <div className="checkout__methods">
              <div className="checkout__method checkout__method--on">
                <span className="checkout__method-icon">📄</span>
                <div>
                  <Text weight="bold" size="lg">Boleto</Text>
                  <Text tone="muted" size="sm">Emitido pela equipe após o período grátis. Você não paga hoje.</Text>
                </div>
              </div>
            </div>
          </Card>
        </main>
        <aside className="checkout__side">
          <Card padding="lg">
            <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Resumo</Text>
            <div className="checkout__line">
              <div><Text weight="bold">{plan.name}</Text><Text tone="muted" size="sm">Cobrança {cycle === 'monthly' ? 'mensal' : 'anual'}</Text></div>
              <Text weight="black">{formatBRL(price)}</Text>
            </div>
            <div className="checkout__line"><Text tone="muted" size="sm">Primeiros 14 dias</Text><Text tone="success" weight="bold" size="sm">Grátis</Text></div>
            <div className="checkout__divider" />
            <div className="checkout__total"><Text weight="black" size="xl">Hoje</Text><Text weight="black" size="2xl" tone="primary">R$ 0,00</Text></div>
            <div className="checkout__total checkout__total--future">
              <Text tone="muted" size="sm">A partir de {new Date(Date.now() + 14*24*3600*1000).toLocaleDateString('pt-BR')}</Text>
              <Text weight="bold">{formatBRL(price)}</Text>
            </div>
            <Button size="xl" fullWidth onClick={handleConfirm} loading={processing} style={{ marginTop: 'var(--space-6)' }}>Começar teste grátis</Button>
            {error && <Text tone="danger">{error}</Text>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
