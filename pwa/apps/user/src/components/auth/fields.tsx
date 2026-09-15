'use client';

import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { IconButton } from '@fixcycle/ui';

export interface InputFieldProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  type?: string;
  inputMode?: 'text' | 'tel' | 'numeric' | 'email' | 'url';
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
  locale?: string;
}

const inputClasses =
  'min-h-[48px] w-full bg-transparent text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)] outline-none disabled:opacity-60';

export function InputField({
  label,
  value,
  onValueChange,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  error,
  leading,
  trailing,
  disabled,
  autoFocus,
  name,
  locale = 'en',
}: InputFieldProps): ReactNode {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-[var(--fc-text-secondary)]"
        >
          {label}
        </label>
      ) : null}
      <div
        className={`flex min-h-[48px] items-center gap-2 rounded-[var(--fc-radius-md)] border bg-[var(--fc-surface)] px-3 transition-colors ${
          error ? 'border-[var(--fc-danger)]' : 'border-[var(--fc-border)] focus-within:border-[var(--fc-bg-secondary)]'
        }`}
      >
        {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
        <input
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          className={inputClasses}
        />
        {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
      </div>
      {error ? (
        <p className="text-xs text-[var(--fc-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField(props: Omit<InputFieldProps, 'type' | 'trailing'>): ReactNode {
  const [visible, setVisible] = useState(false);
  return (
    <InputField
      {...props}
      type={visible ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
      trailing={
        <IconButton
          icon={visible ? 'eye-off' : 'eye'}
          label={visible ? 'Hide password' : 'Show password'}
          size={20}
          className="h-9 w-9 text-[var(--fc-text-secondary)]"
          onClick={() => setVisible((current) => !current)}
          tabIndex={-1}
        />
      }
    />
  );
}

export function FormError({ message }: { message?: string | null }): ReactNode {
  if (!message) {
    return null;
  }
  return (
    <p className="text-xs text-[var(--fc-danger)]" role="alert">
      {message}
    </p>
  );
}