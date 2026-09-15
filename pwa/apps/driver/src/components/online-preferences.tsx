'use client';

import { useEffect, useState } from 'react';

import { Button, Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useDriver } from '@/lib/driver-context';

export function OnlinePreferences(): React.ReactNode {
  const { runtime } = useRuntime();
  const { onlineConfig, saveConfig } = useDriver();
  const [voice, setVoice] = useState(true);
  const [auto, setAuto] = useState(false);
  const [radius, setRadius] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (onlineConfig) {
      setVoice(onlineConfig.voiceAlertEnabled);
      setAuto(onlineConfig.autoAcceptEnabled);
      setRadius(onlineConfig.radiusKm);
    }
  }, [onlineConfig]);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await saveConfig(voice, auto, radius);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="settings" size={18} className="text-[var(--fc-text-secondary)]" />
        <h3 className="text-sm font-bold text-[var(--fc-text-primary)]">
          {t('main.preferences', runtime.locale)}
        </h3>
      </div>
      <div className="space-y-4">
        {/* Voice alert toggle */}
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-[var(--fc-text-primary)]">
            <Icon name="bell" size={16} className="text-[var(--fc-text-secondary)]" />
            {t('main.voiceAlert', runtime.locale)}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={voice}
            onClick={() => setVoice((prev) => !prev)}
            className={`relative h-6 w-11 rounded-full transition-colors ${voice ? 'bg-[var(--fc-bg-secondary)]' : 'bg-[var(--fc-border)]'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${voice ? 'translate-x-5.5 left-0' : 'left-0.5'}`}
            />
          </button>
        </label>
        {/* Auto-accept toggle */}
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-[var(--fc-text-primary)]">
            <Icon name="check" size={16} className="text-[var(--fc-text-secondary)]" />
            {t('main.autoAccept', runtime.locale)}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={auto}
            onClick={() => setAuto((prev) => !prev)}
            className={`relative h-6 w-11 rounded-full transition-colors ${auto ? 'bg-[var(--fc-bg-secondary)]' : 'bg-[var(--fc-border)]'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${auto ? 'translate-x-5.5 left-0' : 'left-0.5'}`}
            />
          </button>
        </label>
        {/* Accept radius */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-[var(--fc-text-primary)]">
              <Icon name="loc" size={16} className="text-[var(--fc-text-secondary)]" />
              {t('main.radius', runtime.locale)}
            </span>
            <span className="text-sm font-bold text-[var(--fc-bg-secondary)]">{radius} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-[var(--fc-bg-secondary)]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-[var(--fc-text-secondary)]">
            <span>1 km</span>
            <span>15 km</span>
          </div>
        </div>
      </div>
      <Button
        variant="secondary"
        block
        loading={saving}
        onClick={() => void handleSave()}
        className="mt-4"
      >
        {t('common.save', runtime.locale)}
      </Button>
    </div>
  );
}