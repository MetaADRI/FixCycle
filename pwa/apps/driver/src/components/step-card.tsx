'use client';

import { Icon, StatusPill } from '@fixcycle/ui';
import type { DriverStepHolder } from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

interface StepCardProps {
  step: DriverStepHolder;
  onPress?: (step: DriverStepHolder) => void;
}

function stepIcon(type: string): 'user' | 'document' | 'taxi' | 'towing' | 'settings' {
  if (type.includes('REGISTRATION')) return 'user';
  if (type.includes('PERSONAL_DOCUMENT')) return 'document';
  if (type.includes('VEHICLE') && !type.includes('DOCUMENT')) return 'taxi';
  if (type.includes('VEHICLE_DOCUMENT')) return 'document';
  if (type.includes('SEGMENT') || type.includes('SERVICE')) return 'towing';
  return 'settings';
}

function stepStatus(status: number): 'success' | 'warning' | 'neutral' {
  if (status === 5) return 'success';
  if (status === 4) return 'warning';
  return 'neutral';
}

export function StepCard({ step, onPress }: StepCardProps): React.ReactNode {
  const { runtime } = useRuntime();
  return (
    <button
      type="button"
      onClick={() => onPress?.(step)}
      className="flex w-full items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4 text-left transition-colors active:bg-[var(--fc-surface-raised)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--fc-surface-raised)]">
        <Icon name={stepIcon(step.stepType)} size={20} className="text-[var(--fc-text-primary)]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{step.stepName}</p>
        <p className="truncate text-xs text-[var(--fc-text-secondary)]">{step.stepDescription}</p>
      </div>
      <StatusPill tone={stepStatus(step.stepStatus)}>
        {step.stepStatus === 5 ? 'Done' : step.stepStatus === 4 ? 'Pending' : 'To do'}
      </StatusPill>
    </button>
  );
}