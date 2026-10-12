import { cn } from '@/utils/cn';
import './ToggleSwitch.css';
export function ToggleSwitch({ checked, onChange, label }: {
  checked: boolean; onChange: (n: boolean) => void; label?: string;
}) {
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
