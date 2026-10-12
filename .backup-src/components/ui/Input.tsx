import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import './Input.css';
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string; hint?: string; error?: string;
  leftIcon?: ReactNode; rightIcon?: ReactNode;
  size?: 'md'|'lg'|'xl'; containerClassName?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightIcon, size='md', className, containerClassName, id, ...rest }, ref
) {
  const autoId = useId();
  const inputId = id ?? `input-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('input', containerClassName)}>
      {label && <label className="input__label" htmlFor={inputId}>{label}</label>}
      <div className={cn('input__box', `input__box--${size}`, error && 'input__box--error')}>
        {leftIcon && <span className="input__icon">{leftIcon}</span>}
        <input ref={ref} id={inputId} className={cn('input__field', className)}
          aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} {...rest} />
        {rightIcon && <span className="input__icon">{rightIcon}</span>}
      </div>
      {error && <span id={errorId} className="input__error" role="alert">{error}</span>}
      {!error && hint && <span id={hintId} className="input__hint">{hint}</span>}
    </div>
  );
});
