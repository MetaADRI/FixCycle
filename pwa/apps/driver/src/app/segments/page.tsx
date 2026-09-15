'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';
import {
  deleteDriverGalleryImage,
  fetchDriverEnrolledSegments,
  fetchDriverGallery,
  fetchDriverSegments,
  fetchSegmentServicesConfig,
  fetchServiceTimeSlots,
  saveDriverGalleryImage,
  saveDriverSegmentConfig,
  saveDriverTimeSlots,
} from '@fixcycle/api-client';
import type {
  DriverGalleryImage,
  DriverSegmentListItem,
  DriverSegmentServiceOption,
  DriverSegmentServicesConfig,
  DriverTimeSlotResult,
} from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { api } from '@/lib/api';

type Section = 'services' | 'slots' | 'gallery';

function SegmentPicker({
  segments,
  selectedId,
  onSelect,
}: {
  segments: DriverSegmentListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}): React.ReactNode {
  const { runtime } = useRuntime();
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {segments.map((seg) => (
        <button
          key={seg.id}
          type="button"
          onClick={() => onSelect(seg.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            selectedId === seg.id
              ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)] text-white'
              : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]'
          }`}
        >
          <Icon name="grid" size={14} />
          {seg.segmentName}
          {seg.selected ? (
            <span className={`rounded-full px-1.5 text-[10px] ${selectedId === seg.id ? 'bg-white/20' : 'bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]'}`}>
              {t('segments.enrolled', runtime.locale)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export default function SegmentsPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const [segments, setSegments] = useState<DriverSegmentListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [section, setSection] = useState<Section>('services');
  const [config, setConfig] = useState<DriverSegmentServicesConfig | null>(null);
  const [slots, setSlots] = useState<DriverTimeSlotResult | null>(null);
  const [gallery, setGallery] = useState<DriverGalleryImage[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadSegments = useCallback(async (): Promise<void> => {
    setLoadingSegments(true);
    try {
      const [allResult, enrolled] = await Promise.all([
        fetchDriverSegments(api),
        fetchDriverEnrolledSegments(api).catch(() => []),
      ]);
      const all = allResult.segments;
      setSegments(all);
      setEnrolledIds(enrolled.map((seg) => seg.id));
      const preferred = all.find((seg) => seg.selected) ?? all[0];
      if (preferred) {
        setSelectedId(preferred.id);
      }
    } finally {
      setLoadingSegments(false);
    }
  }, []);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  const loadSegmentDetail = useCallback(async (segmentId: string): Promise<void> => {
    setConfig(null);
    setSlots(null);
    setGallery([]);
    const [cfg, slotResult, images] = await Promise.all([
      fetchSegmentServicesConfig(api, { segmentId }).catch(() => null),
      fetchServiceTimeSlots(api, { segmentId }).catch(() => null),
      fetchDriverGallery(api, { segmentId }).catch(() => []),
    ]);
    setConfig(cfg);
    setSlots(slotResult);
    setGallery(images);
  }, []);

  useEffect(() => {
    if (selectedId) {
      void loadSegmentDetail(selectedId);
    }
  }, [selectedId, loadSegmentDetail]);

  const handleSelectSegment = useCallback(
    (id: string): void => {
      setSelectedId(id);
      setSection('services');
    },
    [],
  );

  const toggleService = useCallback((serviceId: string): void => {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.map((svc) =>
          svc.id === serviceId ? { ...svc, selected: !svc.selected } : svc,
        ),
      };
    });
  }, []);

  const toggleSlot = useCallback((slotId: string): void => {
    setSlots((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day) => ({
          ...day,
          slots: day.slots.map((slot) =>
            slot.id === slotId ? { ...slot, selected: !slot.selected } : slot,
          ),
        })),
      };
    });
  }, []);

  const saveServices = useCallback(async (): Promise<void> => {
    if (!config || !selectedId) return;
    setSaving(true);
    try {
      await saveDriverSegmentConfig(api, {
        segment_id: selectedId,
        arr_services: config.services.map((svc) => ({
          service_type_id: svc.id,
          selected: svc.selected ? 1 : 0,
        })),
      });
    } finally {
      setSaving(false);
    }
  }, [config, selectedId]);

  const saveSlots = useCallback(async (): Promise<void> => {
    if (!slots || !selectedId) return;
    setSaving(true);
    try {
      const slotIds = slots.days
        .flatMap((day) => day.slots)
        .filter((slot) => slot.selected)
        .map((slot) => slot.id);
      await saveDriverTimeSlots(api, { segmentId: selectedId, slotIds });
    } finally {
      setSaving(false);
    }
  }, [slots, selectedId]);

  const addGalleryImage = useCallback(async (): Promise<void> => {
    if (!selectedId) return;
    await saveDriverGalleryImage(api, {
      segmentId: selectedId,
      image: `files/gallery-${Date.now()}.png`,
    });
    await loadSegmentDetail(selectedId);
  }, [selectedId, loadSegmentDetail]);

  const removeGalleryImage = useCallback(
    async (imageId: string): Promise<void> => {
      if (!selectedId) return;
      await deleteDriverGalleryImage(api, { imageId, segmentId: selectedId }).catch(() => undefined);
      await loadSegmentDetail(selectedId);
    },
    [selectedId, loadSegmentDetail],
  );

  const isEnrolled = enrolledIds.includes(selectedId);

  return (
    <AppShell
      padded={false}
      header={
        <TopHeader
          title={t('segments.title', runtime.locale)}
          leading={
            <IconButton icon="back" label={t('common.back', runtime.locale)} onClick={() => router.back()} />
          }
        />
      }
    >
      <div className="px-4 pb-8 pt-4">
        {loadingSegments ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-5 w-5 text-[var(--fc-bg-secondary)]" />
          </div>
        ) : segments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Icon name="grid" size={32} className="mb-3 text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('segments.none', runtime.locale)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <SegmentPicker
              segments={segments}
              selectedId={selectedId}
              onSelect={handleSelectSegment}
            />

            <div className="flex border-b border-[var(--fc-border)]">
              {(['services', 'slots', 'gallery'] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSection(sec)}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    section === sec
                      ? 'border-b-2 border-[var(--fc-bg-secondary)] text-[var(--fc-bg-secondary)]'
                      : 'text-[var(--fc-text-secondary)]'
                  }`}
                >
                  {sec === 'services'
                    ? t('segments.services', runtime.locale)
                    : sec === 'slots'
                      ? t('segments.slots', runtime.locale)
                      : t('segments.gallery', runtime.locale)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <StatusPill tone={isEnrolled ? 'success' : 'neutral'}>
                {isEnrolled ? t('segments.enrolled', runtime.locale) : t('segments.notEnrolled', runtime.locale)}
              </StatusPill>
            </div>

            {section === 'services' ? (
              config === null ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-5 w-5 text-[var(--fc-bg-secondary)]" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--fc-text-primary)]">{config.segmentName}</p>
                      <p className="text-xs text-[var(--fc-text-secondary)]">
                        {config.currency} {config.priceTypeText}
                      </p>
                    </div>
                  </div>
                  {config.services.length === 0 ? (
                    <p className="text-sm text-[var(--fc-text-secondary)]">{t('segments.none', runtime.locale)}</p>
                  ) : (
                    config.services.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleService(svc.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                          svc.selected
                            ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                            : 'border-[var(--fc-border)] bg-[var(--fc-surface)]'
                        }`}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
                          <Icon name="grid" size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">
                            {svc.serviceName}
                          </p>
                          <p className="text-xs text-[var(--fc-text-secondary)]">
                            {t('segments.price', runtime.locale)}: {config.currency}
                            {svc.price} · {t('segments.priceType', runtime.locale)}: {svc.priceType}
                          </p>
                        </div>
                        {svc.selected ? (
                          <Icon name="check" size={18} className="text-[var(--fc-bg-secondary)]" />
                        ) : null}
                      </button>
                    ))
                  )}
                  <Button block loading={saving} onClick={() => void saveServices()}>
                    {t('segments.save', runtime.locale)}
                  </Button>
                </div>
              )
            ) : section === 'slots' ? (
              slots === null ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-5 w-5 text-[var(--fc-bg-secondary)]" />
                </div>
              ) : (
                <div className="space-y-3">
                  {slots.days.length === 0 ? (
                    <p className="text-sm text-[var(--fc-text-secondary)]">{t('segments.none', runtime.locale)}</p>
                  ) : (
                    slots.days.map((day, i) => (
                      <div key={day.day || i} className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
                        <p className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">
                          {day.dayName || day.day}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {day.slots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => toggleSlot(slot.id)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                slot.selected
                                  ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)] text-white'
                                  : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]'
                              }`}
                            >
                              {slot.startTime} – {slot.endTime}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  <Button block loading={saving} onClick={() => void saveSlots()}>
                    {t('segments.save', runtime.locale)}
                  </Button>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {gallery.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[var(--fc-border)] p-8 text-center">
                    <Icon name="camera" size={28} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
                    <p className="text-sm text-[var(--fc-text-secondary)]">{t('segments.none', runtime.locale)}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {gallery.map((img) => (
                      <div key={img.id} className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--fc-surface-raised)]">
                        <div className="flex h-full w-full items-center justify-center text-[var(--fc-bg-secondary)]">
                          <Icon name="camera" size={24} />
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeGalleryImage(img.id)}
                          aria-label={t('segments.deletePhoto', runtime.locale)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="secondary" block icon="plus" onClick={() => void addGalleryImage()}>
                  {t('segments.addPhoto', runtime.locale)}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}