import { cn } from '@/utils/cn';
import './ToggleSwitch.css';
export interface ToggleSwitchProps { checked: boolean; onChange: (n: boolean) => void; label?: string; }
export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="toggle">
      {label && <span className="toggle__label">{label}</span>}
      <button type="button" role="switch" aria-checked={checked}
        className={cn('toggle__track', checked && 'toggle__track--on')}
        onClick={() => onChange(!checked)}>
        <span className="toggle__thumb" />
      </button>
    </label>
  );
}
