'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';
import {
  addDriverVehicle,
  changeDriverVehicle,
  fetchDriverVehicles,
  fetchVehicleConfiguration,
  fetchVehicleModels,
  requestDriverVehicleByCode,
  verifyDriverVehicleOtp,
} from '@fixcycle/api-client';
import type {
  AddDriverVehicleParams,
  DriverVehicleListItem,
  DriverVehicleKindOption,
} from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { api } from '@/lib/api';

function vehicleTone(
  v: DriverVehicleListItem,
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (v.activeStatus === 1) {
    return 'success';
  }
  if (v.verificationStatus === '1') {
    return 'info';
  }
  if (v.verificationStatus === '2') {
    return 'warning';
  }
  if (v.verificationStatus === '3') {
    return 'warning';
  }
  return 'danger';
}

function vehicleStatusText(v: DriverVehicleListItem): string {
  if (v.activeStatus === 1) {
    return 'Active';
  }
  if (v.verificationStatus === '1') {
    return 'Approved';
  }
  if (v.verificationStatus === '2') {
    return v.showMessage || 'Under review';
  }
  if (v.verificationStatus === '3') {
    return v.showMessage || 'Pending approval';
  }
  return v.showMessage || 'Pending approval';
}

interface AddVehicleSheetProps {
  onClose: () => void;
  onDone: () => void;
}

function AddVehicleSheet({ onClose, onDone }: AddVehicleSheetProps): React.ReactNode {
  const { runtime } = useRuntime();
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [types, setTypes] = useState<DriverVehicleKindOption[]>([]);
  const [makes, setMakes] = useState<DriverVehicleKindOption[]>([]);
  const [models, setModels] = useState<DriverVehicleKindOption[]>([]);
  const [typeId, setTypeId] = useState('');
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [number, setNumber] = useState('');
  const [color, setColor] = useState('');
  const [seats, setSeats] = useState('4');
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [pendingVehicleId, setPendingVehicleId] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchVehicleConfiguration(api)
      .then((cfg) => {
        setTypes(cfg.vehicleTypes);
        setMakes(cfg.vehicleMakes);
      })
      .catch(() => setError('error'))
      .finally(() => setLoadingConfig(false));
  }, []);

  const loadModels = useCallback(async (make: string): Promise<void> => {
    const list = await fetchVehicleModels(api, { vehicleMakeId: make }).catch(() => []);
    setModels(list);
  }, []);

  const handleSubmitVehicle = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    const params: AddDriverVehicleParams = {
      vehicleTypeId: typeId || undefined,
      vehicleMakeId: makeId || undefined,
      vehicleModelId: modelId || undefined,
      vehicleNumber: number,
      vehicleColor: color,
      vehicleImage: 'files/placeholder-vehicle.png',
      numberPlateImage: 'files/placeholder-number-plate.png',
      vehicleSeat: seats,
    };
    try {
      const result = await addDriverVehicle(api, params);
      if (!result.driverVehicleId) {
        onDone();
        onClose();
        return;
      }
      setPendingVehicleId(result.driverVehicleId);
      setStage('otp');
    } catch {
      setError('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (!pendingVehicleId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyDriverVehicleOtp(api, {
        driverVehicleId: pendingVehicleId,
        otp,
      });
      if (String(result['verified'] ?? '1') !== '0' && !result['resultError']) {
        onDone();
        onClose();
      } else {
        setError(t('vehicles.invalidOtp', runtime.locale));
      }
    } catch {
      setError(t('vehicles.invalidOtp', runtime.locale));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" role="presentation">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-[var(--fc-surface)] p-5 pb-8" role="dialog" aria-modal="true">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--fc-border)]" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--fc-text-primary)]">
            {stage === 'form'
              ? t('vehicles.add', runtime.locale)
              : t('vehicles.otp', runtime.locale)}
          </h2>
          <IconButton icon="close" label={t('common.cancel', runtime.locale)} onClick={onClose} className="h-8 w-8" />
        </div>

        {stage === 'form' ? (
          <div className="space-y-4">
            {loadingConfig ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-5 w-5 text-[var(--fc-bg-secondary)]" />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                    {t('vehicles.type', runtime.locale)}
                  </label>
                  <select
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t('vehicles.type', runtime.locale)}</option>
                    {types.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                    {t('vehicles.make', runtime.locale)}
                  </label>
                  <select
                    value={makeId}
                    onChange={(e) => {
                      setMakeId(e.target.value);
                      setModelId('');
                      if (e.target.value) {
                        void loadModels(e.target.value);
                      } else {
                        setModels([]);
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="">{t('vehicles.make', runtime.locale)}</option>
                    {makes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                    {t('vehicles.model', runtime.locale)}
                  </label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t('vehicles.model', runtime.locale)}</option>
                    {models.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                    {t('vehicles.number', runtime.locale)}
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="MH 01 AB 1234"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                    {t('vehicles.color', runtime.locale)}
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="White"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                    {t('vehicles.seats', runtime.locale)}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {error ? <p className="text-sm text-[var(--fc-danger)]">{error}</p> : null}

                <Button block loading={submitting} onClick={() => void handleSubmitVehicle()}>
                  {t('vehicles.submit', runtime.locale)}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('vehicles.otpHint', runtime.locale)}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className={inputClass}
            />
            {error ? <p className="text-sm text-[var(--fc-danger)]">{error}</p> : null}
            <Button block loading={submitting} onClick={() => void handleVerifyOtp()}>
              {t('vehicles.verify', runtime.locale)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehiclesPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<DriverVehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [attachCode, setAttachCode] = useState('');
  const [attaching, setAttaching] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(false);
    try {
      const list = await fetchDriverVehicles(api);
      setVehicles(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMakeActive = useCallback(
    async (id: string): Promise<void> => {
      await changeDriverVehicle(api, id).catch(() => undefined);
      await load();
    },
    [load],
  );

  const handleAttach = useCallback(async (): Promise<void> => {
    const code = attachCode.trim();
    if (!code) return;
    setAttaching(true);
    try {
      await requestDriverVehicleByCode(api, { code });
      setAttachCode('');
      await load();
    } catch {
      // ignore
    } finally {
      setAttaching(false);
    }
  }, [attachCode, load]);

  const inputClass =
    'w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none';

  return (
    <AppShell
      padded={false}
      header={
        <TopHeader
          title={t('vehicles.title', runtime.locale)}
          leading={
            <IconButton icon="back" label={t('common.back', runtime.locale)} onClick={() => router.back()} />
          }
          trailing={
            <IconButton icon="plus" label={t('vehicles.add', runtime.locale)} onClick={() => setAddOpen(true)} />
          }
        />
      }
    >
      <div className="px-4 pb-8 pt-4">
        <div className="mb-4">
          <Button block icon="plus" onClick={() => setAddOpen(true)}>
            {t('vehicles.add', runtime.locale)}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-5 w-5 text-[var(--fc-bg-secondary)]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Icon name="alert" size={32} className="mb-3 text-[var(--fc-text-secondary)]" />
            <Button variant="secondary" onClick={() => void load()}>
              {t('common.retry', runtime.locale)}
            </Button>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fc-surface-raised)]">
              <Icon name="taxi" size={28} className="text-[var(--fc-text-secondary)]" />
            </span>
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('vehicles.empty', runtime.locale)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div key={v.id} className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
                    <Icon name="taxi" size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">
                      {v.vehicleNumber || '—'}
                    </p>
                    <p className="text-xs text-[var(--fc-text-secondary)]">
                      {v.vehicleModel || v.vehicleType}
                      {v.vehicleColor ? ` · ${v.vehicleColor}` : ''}
                    </p>
                    {v.shareCode ? (
                      <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">
                        {t('vehicles.shareCode', runtime.locale)}: {v.shareCode}
                      </p>
                    ) : null}
                  </div>
                  <StatusPill tone={vehicleTone(v)}>{vehicleStatusText(v)}</StatusPill>
                </div>

                {v.activeStatus !== 1 ? (
                  <Button
                    variant="secondary"
                    block
                    className="mt-3"
                    onClick={() => void handleMakeActive(v.id)}
                  >
                    {t('vehicles.makeActive', runtime.locale)}
                  </Button>
                ) : (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--fc-success)]">
                    <Icon name="check" size={14} />
                    {t('vehicles.active', runtime.locale)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
          <p className="text-sm font-bold text-[var(--fc-text-primary)]">{t('vehicles.attach', runtime.locale)}</p>
          <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">{t('vehicles.attachHint', runtime.locale)}</p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={attachCode}
              onChange={(e) => setAttachCode(e.target.value)}
              placeholder="VHC1002"
              className={inputClass}
            />
            <Button loading={attaching} onClick={() => void handleAttach()}>
              {t('vehicles.attachBtn', runtime.locale)}
            </Button>
          </div>
        </div>
      </div>

      {addOpen ? (
        <AddVehicleSheet
          onClose={() => setAddOpen(false)}
          onDone={() => void load()}
        />
      ) : null}
    </AppShell>
  );
}