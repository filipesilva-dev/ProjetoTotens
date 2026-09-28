import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import './Button.css';
export type ButtonVariant = 'primary'|'secondary'|'ghost'|'danger';
export type ButtonSize = 'sm'|'md'|'lg'|'xl';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean;
  leftIcon?: ReactNode; rightIcon?: ReactNode; fullWidth?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant='primary', size='md', loading=false, leftIcon, rightIcon, fullWidth=false, className, children, disabled, ...rest }, ref
) {
  return (
    <button ref={ref}
      className={cn('btn', `btn--${variant}`, `btn--${size}`, fullWidth && 'btn--full', loading && 'btn--loading', className)}
      disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="btn__spinner" />}
      {!loading && leftIcon && <span className="btn__icon">{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span className="btn__icon">{rightIcon}</span>}
    </button>
  );
});
