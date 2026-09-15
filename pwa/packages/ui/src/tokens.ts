import type { ThemeColorSet } from '@fixcycle/config';

export type CssVariable = `--fc-${string}`;

export type CssVariableMap = Partial<Record<CssVariable, string>>;

export const NEUTRAL_TOKENS: Record<CssVariable, string> = {
  '--fc-surface': '#ffffff',
  '--fc-surface-raised': '#f5f6fa',
  '--fc-border': '#e6e8ee',
  '--fc-overlay': 'rgba(11, 27, 63, 0.5)',
  '--fc-success': '#17b26a',
  '--fc-warning': '#f79009',
  '--fc-danger': '#e5484d',
  '--fc-info': '#2563eb',
  '--fc-shadow': '0 6px 18px rgba(16, 24, 40, 0.08)',
  '--fc-radius-sm': '0.5rem',
  '--fc-radius-md': '0.875rem',
  '--fc-radius-lg': '1.25rem',
  '--fc-font': "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

export function themeToCssVars(theme: ThemeColorSet): Record<CssVariable, string> {
  return {
    '--fc-bg-primary': theme.bgColorPrimary,
    '--fc-bg-secondary': theme.bgColorSecondary,
    '--fc-text-primary': theme.textColorPrimary,
    '--fc-text-secondary': theme.textColorSecondary,
    ...NEUTRAL_TOKENS,
  };
}

export function applyThemeVars(vars: Record<CssVariable, string>): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

export const LAYOUT = {
  maxWidth: '430px',
  minTouchTarget: 44,
  radius: {
    sm: 'var(--fc-radius-sm)',
    md: 'var(--fc-radius-md)',
    lg: 'var(--fc-radius-lg)',
  },
} as const;