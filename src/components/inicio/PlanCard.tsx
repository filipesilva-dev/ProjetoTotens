import { Link } from 'react-router-dom';
import type { Plan, SubscriptionCycle } from '@/types';
import { Text, IconCheck } from '@/components/ui';
import { formatBRL } from '@/utils/currency';
import './PlanCard.css';
export function PlanCard({ plan, cycle = 'monthly', ctaLabel }: {
  plan: Plan; cycle?: SubscriptionCycle; ctaLabel?: string;
}) {
  const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const period = cycle === 'monthly' ? '/mês' : '/ano';
  return (
    <article className={`plan-card ${plan.highlighted ? 'plan-card--featured' : ''}`}>
      {plan.highlighted && <span className="plan-card__badge">Mais escolhido</span>}
      <header className="plan-card__head">
        <Text as="h3" size="2xl" weight="black">{plan.name}</Text>
        <Text tone="muted" size="sm">{plan.description}</Text>
      </header>
      <div className="plan-card__price">
        <Text as="span" size="4xl" weight="black" tone="primary">{formatBRL(price)}</Text>
        <Text as="span" tone="muted" size="md">{period}</Text>
      </div>
      <ul className="plan-card__features">
        {plan.features.map((f) => (
          <li key={f} className="plan-card__feature">
            <span className="plan-card__feature-icon"><IconCheck size={18} /></span>
            <Text size="sm">{f}</Text>
          </li>
        ))}
      </ul>
      <Link to={`/checkout/${plan.id}`} className="plan-card__cta">
        {ctaLabel ?? `Contratar ${plan.name}`}
      </Link>
    </article>
  );
}
