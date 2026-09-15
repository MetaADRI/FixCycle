'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button, Icon, Spinner } from '@fixcycle/ui';
import {
  submitDriverRegStepOne,
  submitDriverRegStepTwo,
  submitDriverRegStepThree,
  submitDriverRegStepFive,
  saveDriverServiceTimeSlot,
} from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useDriverSession } from '@/lib/session';
import { api } from '@/lib/api';

type WizardStep = 1 | 2 | 3 | 5 | 7;

function stepForSignup(signupStep: number): WizardStep {
  if (signupStep <= 1) return 1;
  if (signupStep === 2) return 2;
  if (signupStep === 3) return 3;
  if (signupStep <= 5) return 5;
  return 7;
}

export default function OnBoardPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const { status, profile, setProfile, refresh } = useDriverSession();
  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if fully approved
  useEffect(() => {
    if (status !== 'booting' && profile && profile.signupStep >= 9) {
      router.replace('/main');
    } else if (status !== 'booting' && profile && profile.signupStep === 8) {
      router.replace('/pending-approval');
    } else if (status === 'signedOut') {
      router.replace('/login');
    }
  }, [status, profile, router]);

  // Sync step from profile on boot/refresh
  useEffect(() => {
    if (profile) {
      setStep(stepForSignup(profile.signupStep));
    }
  }, [profile]);

  if (status === 'booting' || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--fc-surface)]">
        <Spinner className="h-6 w-6 text-[var(--fc-bg-secondary)]" />
      </div>
    );
  }

  // Step 1: Personal details
  const StepOne = (): React.ReactNode => {
    const [firstName, setFirstName] = useState(profile.firstName);
    const [lastName, setLastName] = useState(profile.lastName);
    const [email, setEmail] = useState(profile.email);

    const handleSubmit = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await submitDriverRegStepOne(api, { first_name: firstName, last_name: lastName, email });
        setProfile(result.driver);
      } catch {
        setError('Could not save. Try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">{t('onboard.firstName', runtime.locale)}</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">{t('onboard.lastName', runtime.locale)}</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">{t('onboard.email', runtime.locale)}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
          />
        </div>
        <Button block loading={loading} onClick={() => void handleSubmit()}>
          {t('common.next', runtime.locale)}
        </Button>
      </div>
    );
  };

  // Step 2: Personal documents (placeholder — documents require file picker in live)
  const StepTwo = (): React.ReactNode => {
    const handleSubmit = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await submitDriverRegStepTwo(api, { document_type: 'aadhaar', document_number: 'DEMO123' });
        setProfile(result.driver);
      } catch {
        setError('Could not save. Try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-dashed border-[var(--fc-border)] p-8 text-center">
          <Icon name="document" size={32} className="mx-auto mb-3 text-[var(--fc-text-secondary)]" />
          <p className="text-sm text-[var(--fc-text-secondary)]">Upload ID proof and driving licence</p>
          <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">Tap to select files (preview mode)</p>
        </div>
        <Button block loading={loading} onClick={() => void handleSubmit()}>
          {t('common.next', runtime.locale)}
        </Button>
      </div>
    );
  };

  // Step 3: Vehicle details
  const StepThree = (): React.ReactNode => {
    const [model, setModel] = useState('');
    const [number, setNumber] = useState('');
    const [color, setColor] = useState('');

    const handleSubmit = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await submitDriverRegStepThree(api, { vehicle_model: model, vehicle_number: number, vehicle_color: color });
        setProfile(result.driver);
      } catch {
        setError('Could not save. Try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">{t('onboard.model', runtime.locale)}</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Maruti Swift"
            className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">{t('onboard.vehicleNumber', runtime.locale)}</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="MH 01 AB 1234"
            className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">{t('onboard.vehicleColor', runtime.locale)}</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. White"
            className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
          />
        </div>
        <Button block loading={loading} onClick={() => void handleSubmit()}>
          {t('common.next', runtime.locale)}
        </Button>
      </div>
    );
  };

  // Step 5: Service segments
  const StepFive = (): React.ReactNode => {
    const [selected, setSelected] = useState<string[]>(['ride']);
    const segments = [
      { slug: 'ride', label: 'Ride', icon: 'taxi' as const },
      { slug: 'delivery', label: 'Delivery', icon: 'delivery' as const },
      { slug: 'towing', label: 'Towing', icon: 'towing' as const },
    ];

    const toggle = (slug: string): void => {
      setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    };

    const handleSubmit = async (): Promise<void> => {
      if (selected.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        const result = await submitDriverRegStepFive(api, {
          segments: selected.map((slug) => ({ segment_slug: slug, segment_name: slug })),
        });
        setProfile(result.driver);
      } catch {
        setError('Could not save. Try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('onboard.selectSegment', runtime.locale)}</p>
        <div className="space-y-3">
          {segments.map((seg) => (
            <button
              key={seg.slug}
              type="button"
              onClick={() => toggle(seg.slug)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                selected.includes(seg.slug)
                  ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                  : 'border-[var(--fc-border)] bg-[var(--fc-surface)]'
              }`}
            >
              <Icon name={seg.icon} size={24} className={selected.includes(seg.slug) ? 'text-[var(--fc-bg-secondary)]' : 'text-[var(--fc-text-secondary)]'} />
              <span className="text-sm font-semibold text-[var(--fc-text-primary)]">{seg.label}</span>
              {selected.includes(seg.slug) ? (
                <Icon name="check" size={18} className="ml-auto text-[var(--fc-bg-secondary)]" />
              ) : null}
            </button>
          ))}
        </div>
        <Button block loading={loading} onClick={() => void handleSubmit()} disabled={selected.length === 0}>
          {t('common.next', runtime.locale)}
        </Button>
      </div>
    );
  };

  // Step 7: Availability slots
  const StepSeven = (): React.ReactNode => {
    const [slots, setSlots] = useState([
      { day: 'Mon', start: '09:00', end: '18:00', enabled: true },
      { day: 'Tue', start: '09:00', end: '18:00', enabled: true },
      { day: 'Wed', start: '09:00', end: '18:00', enabled: true },
      { day: 'Thu', start: '09:00', end: '18:00', enabled: true },
      { day: 'Fri', start: '09:00', end: '18:00', enabled: true },
      { day: 'Sat', start: '10:00', end: '16:00', enabled: true },
      { day: 'Sun', start: '', end: '', enabled: false },
    ]);

    const handleSubmit = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await saveDriverServiceTimeSlot(api, {
          time_slots: slots.filter((s) => s.enabled).map((s) => ({ day: s.day, start: s.start, end: s.end })),
        });
        setProfile(result.driver);
      } catch {
        setError('Could not save. Try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('onboard.selectSlot', runtime.locale)}</p>
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div
              key={slot.day}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                slot.enabled ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5' : 'border-[var(--fc-border)] bg-[var(--fc-surface)]'
              }`}
            >
              <button
                type="button"
                onClick={() => setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s))}
                className={`flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${slot.enabled ? 'bg-[var(--fc-bg-secondary)]' : 'bg-[var(--fc-border)]'}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${slot.enabled ? 'translate-x-4.5 ml-0' : 'ml-0.5'}`} />
              </button>
              <span className="w-8 text-sm font-semibold text-[var(--fc-text-primary)]">{slot.day}</span>
              {slot.enabled ? (
                <div className="ml-auto flex items-center gap-2 text-sm text-[var(--fc-text-secondary)]">
                  <span>{slot.start}</span>
                  <span>-</span>
                  <span>{slot.end}</span>
                </div>
              ) : (
                <span className="ml-auto text-sm text-[var(--fc-text-secondary)]">Off</span>
              )}
            </div>
          ))}
        </div>
        <Button block loading={loading} onClick={() => void handleSubmit()}>
          {t('common.submit', runtime.locale)}
        </Button>
      </div>
    );
  };

  const stepConfig: Record<WizardStep, { title: string; desc: string; content: React.ReactNode }> = {
    1: { title: t('onboard.step1Title', runtime.locale), desc: t('onboard.step1Desc', runtime.locale), content: <StepOne /> },
    2: { title: t('onboard.step2Title', runtime.locale), desc: t('onboard.step2Desc', runtime.locale), content: <StepTwo /> },
    3: { title: t('onboard.step3Title', runtime.locale), desc: t('onboard.step3Desc', runtime.locale), content: <StepThree /> },
    5: { title: t('onboard.step5Title', runtime.locale), desc: t('onboard.step5Desc', runtime.locale), content: <StepFive /> },
    7: { title: t('onboard.step7Title', runtime.locale), desc: t('onboard.step7Desc', runtime.locale), content: <StepSeven /> },
  };

  const config = stepConfig[step];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <div className="flex items-center gap-3 border-b border-[var(--fc-border)] px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)]/10">
          <Icon name="taxi" size={20} className="text-[var(--fc-bg-secondary)]" />
        </div>
        <div>
          <p className="text-xs text-[var(--fc-text-secondary)]">{t('onboard.title', runtime.locale)}</p>
          <p className="text-sm font-bold text-[var(--fc-text-primary)]">{t('onboard.subtitle', runtime.locale)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 px-4 pt-4">
        {([1, 2, 3, 5, 7] as const).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-[var(--fc-bg-secondary)]' : 'bg-[var(--fc-border)]'}`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-8">
        <h2 className="mb-1 text-lg font-bold text-[var(--fc-text-primary)]">{config.title}</h2>
        <p className="mb-6 text-sm text-[var(--fc-text-secondary)]">{config.desc}</p>

        {error ? (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[var(--fc-danger)]/10 p-3 text-sm text-[var(--fc-danger)]">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        {config.content}
      </div>
    </div>
  );
}