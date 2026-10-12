import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, IconPix, Input, Text } from '@/components/ui';
import { usePlans } from '@/hooks/usePlans';
import { formatBRL } from '@/utils/currency';
import type { SubscriptionCycle } from '@/types';
import './Checkout.css';
export default function Checkout() {
  const nav = useNavigate();
  const { planoId } = useParams();
  const { plans } = usePlans();
  const plan = plans.find((p) => p.id === planoId) ?? plans[0];
  const [cycle, setCycle] = useState<SubscriptionCycle>('monthly');
  const [processing, setProcessing] = useState(false);
  const [coupon, setCoupon] = useState('');
  if (!plan) return null;
  const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setProcessing(false);
    nav('/boas-vindas');
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
            <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Forma de pagamento</Text>
            <div className="checkout__methods">
              <div className="checkout__method checkout__method--on">
                <span className="checkout__method-icon"><IconPix size={24} /></span>
                <div>
                  <Text weight="bold" size="lg">Pix</Text>
                  <Text tone="muted" size="sm">Aprovação imediata</Text>
                </div>
              </div>
              <div className="checkout__method">
                <span className="checkout__method-icon">📄</span>
                <div><Text weight="bold" size="lg">Boleto</Text><Text tone="muted" size="sm">Vence em 3 dias úteis</Text></div>
              </div>
              <div className="checkout__method">
                <span className="checkout__method-icon">💳</span>
                <div><Text weight="bold" size="lg">Cartão</Text><Text tone="muted" size="sm">Parcelamento disponível</Text></div>
              </div>
            </div>
          </Card>
          <Card padding="lg">
            <Text as="h3" size="lg" weight="black" style={{ marginBottom: 'var(--space-4)' }}>Cupom</Text>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Input size="lg" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="PRIMEIRA10" containerClassName="checkout__coupon" />
              <Button variant="ghost" size="lg">Aplicar</Button>
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
          </Card>
        </aside>
      </div>
    </div>
  );
}
