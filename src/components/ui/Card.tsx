import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import './Card.css';
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'raised'|'flat'|'outline';
  padding?: 'sm'|'md'|'lg';
  children?: ReactNode;
}
export function Card({ variant='raised', padding='md', className, children, ...rest }: CardProps) {
  return <div className={cn('card', `card--${variant}`, `card--pad-${padding}`, className)} {...rest}>{children}</div>;
}
