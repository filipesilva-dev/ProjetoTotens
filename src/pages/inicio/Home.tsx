import { Link } from 'react-router-dom';
import { Text, IconCheck, IconPix, IconCart } from '@/components/ui';
import { PlanCard } from '@/components/inicio/PlanCard';
import { usePlans } from '@/hooks/usePlans';
import './Landing.css';

const BENEFITS = [
  { icon: <IconCart size={28} />, title: 'Fila andando mais rápido', desc: 'O cliente resolve tudo no totem, sem esperar caixa livre.' },
  { icon: <IconPix size={28} />, title: 'Pagamento via Pix', desc: 'Aprovação em segundos, sem maquininha nem taxa de cartão.' },
  { icon: <IconCheck size={28} />, title: '99% de precisão', desc: 'Pedido chega na cozinha exatamente como o cliente montou.' },
];
const STATS = [
  { value: '+15%', label: 'de aumento nas vendas em horário de pico' },
  { value: '3x', label: 'mais pedidos por hora quando o totem assume o caixa' },
  { value: '3-4', label: 'meses até o investimento se pagar' },
];
const STEPS = [
  { num: '1', title: 'Crie sua conta', desc: 'Menos de 5 minutos. Sem cartão de crédito no teste.' },
  { num: '2', title: 'Monte seu cardápio', desc: 'Painel completo para editar produtos, preços e categorias.' },
  { num: '3', title: 'Ligue o totem', desc: 'Aponte o navegador para o link da sua loja e comece hoje.' },
];

export default function Home() {
  const { plans } = usePlans();
  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__hero-inner">
          <span className="landing__eyebrow">Autoatendimento para lanchonetes</span>
          <Text as="h1" size="4xl" weight="black" className="landing__title">
            Sua fila anda mais rápido.<br />Seu caixa, mais leve.
          </Text>
          <Text size="lg" tone="muted" className="landing__subtitle">
            Totem com pagamento Pix que absorve até três caixas humanos,
            reduz tempo de espera e aumenta suas vendas nos horários de pico.
          </Text>
          <div className="landing__hero-actions">
            <Link to="/cadastro" className="landing__cta landing__cta--primary">Testar grátis por 14 dias</Link>
            <Link to="/planos" className="landing__cta landing__cta--ghost">Ver planos</Link>
          </div>
          <Text tone="soft" size="sm" style={{ marginTop: 'var(--space-3)' }}>Sem cartão. Sem fidelidade.</Text>
        </div>
        <div className="landing__hero-visual">
          <div className="landing__mockup">
            <div className="landing__mockup-header"><span>🍔</span><span>FastLanches</span></div>
            <div className="landing__mockup-body">
              {[28, 32, 18].map((p, i) => (
                <div key={i} className="landing__mockup-item">
                  <div className="landing__mockup-img" />
                  <div>
                    <span className="landing__mockup-line" />
                    <span className="landing__mockup-line landing__mockup-line--sm" />
                    <div className="landing__mockup-price">R$ {p},00</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="landing__mockup-footer"><IconPix size={20} /><span>Pagar com Pix</span></div>
          </div>
        </div>
      </section>

      <section className="landing__benefits">
        <Text as="h2" size="3xl" weight="black" className="landing__section-title">Por que funciona</Text>
        <div className="landing__benefits-grid">
          {BENEFITS.map((b) => (
            <div key={b.title} className="landing__benefit">
              <div className="landing__benefit-icon">{b.icon}</div>
              <Text as="h3" size="xl" weight="black">{b.title}</Text>
              <Text tone="muted">{b.desc}</Text>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__stats">
        {STATS.map((s) => (
          <div key={s.value} className="landing__stat">
            <Text size="4xl" weight="black" tone="primary">{s.value}</Text>
            <Text tone="muted">{s.label}</Text>
          </div>
        ))}
      </section>

      <section className="landing__steps-section">
        <Text as="h2" size="3xl" weight="black" className="landing__section-title">Como funciona</Text>
        <Text size="lg" tone="muted" className="landing__section-sub">Três passos para o totem estar recebendo pedidos.</Text>
        <div className="landing__steps">
          {STEPS.map((s) => (
            <div key={s.num} className="landing__step">
              <div className="landing__step-num">{s.num}</div>
              <Text as="h3" size="xl" weight="black">{s.title}</Text>
              <Text tone="muted">{s.desc}</Text>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__plans">
        <Text as="h2" size="3xl" weight="black" className="landing__section-title">Planos para todos os tamanhos</Text>
        <Text size="lg" tone="muted" className="landing__section-sub">Sem taxa de setup. Cancele quando quiser.</Text>
        <div className="landing__plans-grid">
          {plans.map((p) => <PlanCard key={p.id} plan={p} />)}
        </div>
      </section>

      <section className="landing__final">
        <Text as="h2" size="3xl" weight="black" style={{ color: '#fff', textAlign: 'center' }}>Pronto para reduzir sua fila?</Text>
        <Text size="lg" style={{ color: 'rgba(255,255,255,.92)', textAlign: 'center' }}>Comece hoje com 14 dias grátis.</Text>
        <Link to="/cadastro" className="landing__cta landing__cta--light">Criar minha conta</Link>
      </section>
    </div>
  );
}
