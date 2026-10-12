import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import './Text.css';
export type TextSize = 'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'4xl';
export type TextWeight = 'regular'|'medium'|'semibold'|'bold'|'black';
export type TextTone = 'default'|'muted'|'soft'|'primary'|'accent'|'danger'|'inverse';
export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType; size?: TextSize; weight?: TextWeight; tone?: TextTone; children?: ReactNode;
}
export function Text({ as: C = 'span', size='md', weight='regular', tone='default', className, children, ...rest }: TextProps) {
  return <C className={cn('text', `text--${size}`, `text--${weight}`, `text--${tone}`, className)} {...rest}>{children}</C>;
}
