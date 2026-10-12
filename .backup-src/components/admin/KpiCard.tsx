import { Text } from '@/components/ui';
import './KpiCard.css';
export interface KpiCardProps { label: string; value: string; delta?: string; positive?: boolean; icon?: string; }
export function KpiCard({ label, value, delta, positive = true, icon }: KpiCardProps) {
  return (
    <div className="kpi">
      {icon && <div className="kpi__icon">{icon}</div>}
      <Text tone="muted" size="sm">{label}</Text>
      <Text size="3xl" weight="black" style={{ lineHeight: 1 }}>{value}</Text>
      {delta && <Text tone={positive ? 'primary' : 'danger'} size="sm" weight="semibold">{delta}</Text>}
    </div>
  );
}
