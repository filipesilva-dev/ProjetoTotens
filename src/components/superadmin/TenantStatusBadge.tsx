import { Text } from '@/components/ui';
import type { TenantStatus } from '@/types';
import './TenantStatusBadge.css';
const LABELS: Record<TenantStatus, { label: string; tone: string }> = {
  trial:     { label: 'Em teste',     tone: 'info' },
  active:    { label: 'Ativo',        tone: 'success' },
  past_due:  { label: 'Em atraso',    tone: 'warning' },
  suspended: { label: 'Suspenso',     tone: 'danger' },
  cancelled: { label: 'Cancelado',    tone: 'muted' },
};
export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const meta = LABELS[status];
  return (
    <span className={`tsb tsb--${meta.tone}`}>
      <Text as="span" size="xs" weight="bold">{meta.label}</Text>
    </span>
  );
}
