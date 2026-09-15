import type { ButtonHTMLAttributes, ReactNode } from 'react';

import type { IconName } from './icons';
import { Icon } from './icons';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  block?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--fc-bg-secondary)] text-white shadow-sm active:opacity-90',
  secondary: 'bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)] border border-[var(--fc-border)] active:bg-[var(--fc-border)]',
  ghost: 'bg-transparent text-[var(--fc-text-primary)] hover:bg-[var(--fc-surface-raised)]',
  danger: 'bg-[var(--fc-danger)] text-white shadow-sm active:opacity-90',
};

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  block = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--fc-radius-md)] px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${block ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner className="h-4 w-4" />
      ) : icon ? (
        <Icon name={icon} size={18} />
      ) : null}
      {children}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  size?: number;
}

export function IconButton({ icon, label, size = 24, className = '', ...rest }: IconButtonProps): ReactNode {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--fc-text-primary)] active:bg-[var(--fc-surface-raised)] ${className}`}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export function Spinner({ className = '' }: { className?: string }): ReactNode {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function Skeleton({ className = '' }: { className?: string }): ReactNode {
  return <div aria-hidden="true" className={`animate-pulse rounded-[var(--fc-radius-sm)] bg-[var(--fc-border)] ${className}`} />;
}

export interface StatusPillProps {
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  children?: ReactNode;
}

const toneClasses: Record<NonNullable<StatusPillProps['tone']>, string> = {
  success: 'bg-[var(--fc-success)]/10 text-[var(--fc-success)]',
  warning: 'bg-[var(--fc-warning)]/10 text-[var(--fc-warning)]',
  danger: 'bg-[var(--fc-danger)]/10 text-[var(--fc-danger)]',
  neutral: 'bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)] border border-[var(--fc-border)]',
  info: 'bg-[var(--fc-info)]/10 text-[var(--fc-info)]',
};

export function StatusPill({ tone = 'neutral', children }: StatusPillProps): ReactNode {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: IconName;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  icon = 'alert',
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps): ReactNode {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fc-danger)]/10 text-[var(--fc-danger)]">
        <Icon name={icon} size={28} />
      </span>
      <h2 className="text-base font-semibold text-[var(--fc-text-primary)]">{title}</h2>
      {message ? <p className="max-w-xs text-sm text-[var(--fc-text-secondary)]">{message}</p> : null}
      {onRetry ? (
        <Button variant="secondary" icon="refresh" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}