import './Spinner.css';
export interface SpinnerProps { size?: number; label?: string; }
export function Spinner({ size = 48, label }: SpinnerProps) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <div className="spinner__circle" style={{ width: size, height: size, borderWidth: Math.max(3, size/12) }} />
      {label && <span className="spinner__label">{label}</span>}
    </div>
  );
}
