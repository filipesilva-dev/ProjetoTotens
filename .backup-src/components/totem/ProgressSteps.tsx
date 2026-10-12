import { cn } from '@/utils/cn';
import './ProgressSteps.css';
export interface ProgressStepsProps { current: number; total?: number; }
export function ProgressSteps({ current, total = 4 }: ProgressStepsProps) {
  return (
    <div className="steps" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn('steps__dot', i <= current && 'steps__dot--active')} />
      ))}
    </div>
  );
}
