'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';
import type { IconName } from '@fixcycle/ui';
import { addDriverDocument, fetchDriverDocuments, fetchDriverExpiredDocuments } from '@fixcycle/api-client';
import type {
  DriverDocumentItem,
  DriverDocumentsResult,
  DriverSegmentDocumentGroup,
  DriverVehicleDocumentGroup,
} from '@fixcycle/api-client';

import type { TranslationKey } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { api } from '@/lib/api';

type AddFor = 'PERSONAL' | 'VEHICLE' | 'SEGMENT';

const DOC_TEMPLATES: { id: string; nameKey: TranslationKey }[] = [
  { id: 'DRIVER_LICENCE', nameKey: 'documents.docTypeLicence' },
  { id: 'NATIONAL_ID', nameKey: 'documents.docTypeId' },
  { id: 'PROFILE_PHOTO', nameKey: 'documents.docTypePhoto' },
];

function documentTone(doc: DriverDocumentItem): 'success' | 'warning' | 'danger' | 'neutral' {
  const text = `${doc.verificationStatusText} ${doc.tempVerificationStatusText}`.toLowerCase();
  if (/reject|expire/.test(text)) {
    return 'danger';
  }
  if (/approve|verified|active/.test(text)) {
    return 'success';
  }
  if (/pending|submitted|review/.test(text)) {
    return 'warning';
  }
  return 'neutral';
}

function documentStatusText(doc: DriverDocumentItem): string {
  return doc.verificationStatusText || doc.tempVerificationStatusText || 'Pending';
}

function DocRow({ doc }: { doc: DriverDocumentItem }): React.ReactNode {
  const docNumber = String(doc.raw['document_number'] ?? '');
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--fc-surface-raised)] p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
        <Icon name="document" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{doc.documentName}</p>
        {docNumber ? <p className="text-xs text-[var(--fc-text-secondary)]">{docNumber}</p> : null}
      </div>
      <StatusPill tone={documentTone(doc)}>{documentStatusText(doc)}</StatusPill>
    </div>
  );
}

interface AddSheetProps {
  addFor: AddFor;
  vehicles: DriverVehicleDocumentGroup[];
  segments: DriverSegmentDocumentGroup[];
  onClose: () => void;
  onDone: () => void;
}

function AddDocumentSheet({ addFor, vehicles, segments, onClose, onDone }: AddSheetProps): React.ReactNode {
  const { runtime } = useRuntime();
  const [templateId, setTemplateId] = useState(DOC_TEMPLATES[0]?.id ?? '');
  const [vehicleId, setVehicleId] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [number, setNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = DOC_TEMPLATES.find((d) => d.id === templateId) ?? DOC_TEMPLATES[0];

  const handleSubmit = async (): Promise<void> => {
    if (!template) return;
    setSubmitting(true);
    setError(null);
    try {
      await addDriverDocument(api, {
        documentFor: addFor,
        documentId: template.id,
        documentImage: 'files/placeholder-document.png',
        numberRequired: false,
        ...(number ? { documentNumber: number } : {}),
        ...(addFor === 'VEHICLE' && vehicleId ? { driverVehicleId: vehicleId } : {}),
        ...(addFor === 'SEGMENT' && segmentId ? { segmentId } : {}),
      });
      onDone();
      onClose();
    } catch {
      setError('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" role="presentation">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-[var(--fc-surface)] p-5 pb-8" role="dialog" aria-modal="true">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--fc-border)]" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('documents.select', runtime.locale)}</h2>
          <IconButton icon="close" label={t('common.cancel', runtime.locale)} onClick={onClose} className="h-8 w-8" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            {DOC_TEMPLATES.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setTemplateId(doc.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                  templateId === doc.id
                    ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                    : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)]'
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
                  <Icon name="document" size={18} />
                </span>
                <span className="flex-1 text-sm font-semibold text-[var(--fc-text-primary)]">
                  {t(doc.nameKey, runtime.locale)}
                </span>
                {templateId === doc.id ? (
                  <Icon name="check" size={18} className="text-[var(--fc-bg-secondary)]" />
                ) : null}
              </button>
            ))}
          </div>

          {addFor === 'VEHICLE' && vehicles.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                {t('documents.vehicleSelect', runtime.locale)}
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
              >
                <option value="">{t('documents.vehicleSelect', runtime.locale)}</option>
                {vehicles.map((v) => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {v.vehicleNumber || v.vehicleType}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {addFor === 'SEGMENT' && segments.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                {t('documents.segmentSelect', runtime.locale)}
              </label>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
              >
                <option value="">{t('documents.segmentSelect', runtime.locale)}</option>
                {segments.map((sg) => (
                  <option key={sg.segmentId} value={sg.segmentId}>
                    {sg.segmentName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
              {t('documents.number', runtime.locale)}
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border-2 border-dashed border-[var(--fc-border)] p-4 text-center">
            <Icon name="camera" size={24} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
            <p className="text-xs text-[var(--fc-text-secondary)]">
              {t('documents.upload', runtime.locale)} (preview)
            </p>
          </div>

          {error ? <p className="text-sm text-[var(--fc-danger)]">{error}</p> : null}

          <Button block loading={submitting} onClick={() => void handleSubmit()}>
            {submitting ? t('documents.submitting', runtime.locale) : t('documents.upload', runtime.locale)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const [result, setResult] = useState<DriverDocumentsResult | null>(null);
  const [expired, setExpired] = useState<DriverDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addOpen, setAddOpen] = useState<AddFor | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(false);
    try {
      const [docs, exp] = await Promise.all([
        fetchDriverDocuments(api, { documentFor: 'ALL' }).catch(() => null),
        fetchDriverExpiredDocuments(api).catch(() => []),
      ]);
      if (docs) {
        setResult(docs);
      } else {
        setError(true);
      }
      setExpired(exp);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback((): Promise<void> => load(), [load]);

  const headerIcon: IconName = 'document';

  return (
    <AppShell
      padded={false}
      header={
        <TopHeader
          title={t('documents.title', runtime.locale)}
          leading={
            <IconButton icon="back" label={t('common.back', runtime.locale)} onClick={() => router.back()} />
          }
        />
      }
    >
      <div className="px-4 pb-8 pt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-5 w-5 text-[var(--fc-bg-secondary)]" />
          </div>
        ) : error || !result ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Icon name="alert" size={32} className="mb-3 text-[var(--fc-text-secondary)]" />
            <Button variant="secondary" onClick={() => void refresh()}>
              {t('common.retry', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {expired.length > 0 ? (
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--fc-danger)]/10 px-4 py-3 text-sm font-semibold text-[var(--fc-danger)]">
                <Icon name="alert" size={18} />
                {t('documents.expired', runtime.locale)} ({expired.length})
              </div>
            ) : null}

            {!result.hasAnyItem ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fc-surface-raised)]">
                  <Icon name={headerIcon} size={28} className="text-[var(--fc-text-secondary)]" />
                </span>
                <p className="text-sm text-[var(--fc-text-secondary)]">{t('documents.empty', runtime.locale)}</p>
                <Button icon="plus" className="mt-4" onClick={() => setAddOpen('PERSONAL')}>
                  {t('documents.add', runtime.locale)}
                </Button>
              </div>
            ) : (
              <>
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--fc-text-primary)]">
                      {t('documents.personal', runtime.locale)}
                    </h3>
                    <Button variant="secondary" icon="plus" onClick={() => setAddOpen('PERSONAL')}>
                      {t('documents.add', runtime.locale)}
                    </Button>
                  </div>
                  {result.personal.length === 0 ? (
                    <p className="text-xs text-[var(--fc-text-secondary)]">{t('documents.empty', runtime.locale)}</p>
                  ) : (
                    <div className="space-y-2">
                      {result.personal.map((doc) => (
                        <DocRow key={doc.id} doc={doc} />
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--fc-text-primary)]">
                      {t('documents.vehicle', runtime.locale)}
                    </h3>
                    <Button variant="secondary" icon="plus" onClick={() => setAddOpen('VEHICLE')}>
                      {t('documents.add', runtime.locale)}
                    </Button>
                  </div>
                  {result.vehicles.length === 0 ? (
                    <p className="text-xs text-[var(--fc-text-secondary)]">{t('documents.empty', runtime.locale)}</p>
                  ) : (
                    <div className="space-y-4">
                      {result.vehicles.map((v) => (
                        <div key={v.vehicleId} className="rounded-2xl border border-[var(--fc-border)] p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Icon name="taxi" size={16} className="text-[var(--fc-bg-secondary)]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">
                                {v.vehicleNumber || v.vehicleType}
                              </p>
                              <p className="text-xs text-[var(--fc-text-secondary)]">{v.vehicleStatus}</p>
                            </div>
                          </div>
                          {v.documents.length === 0 ? (
                            <p className="text-xs text-[var(--fc-text-secondary)]">
                              {t('documents.empty', runtime.locale)}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {v.documents.map((doc) => (
                                <DocRow key={doc.id} doc={doc} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--fc-text-primary)]">
                      {t('documents.segment', runtime.locale)}
                    </h3>
                    <Button variant="secondary" icon="plus" onClick={() => setAddOpen('SEGMENT')}>
                      {t('documents.add', runtime.locale)}
                    </Button>
                  </div>
                  {result.segments.length === 0 ? (
                    <p className="text-xs text-[var(--fc-text-secondary)]">{t('documents.empty', runtime.locale)}</p>
                  ) : (
                    <div className="space-y-4">
                      {result.segments.map((sg) => (
                        <div key={sg.segmentId} className="rounded-2xl border border-[var(--fc-border)] p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Icon name={sg.checkable ? 'grid' : 'handyman'} size={16} className="text-[var(--fc-bg-secondary)]" />
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--fc-text-primary)]">
                              {sg.segmentName}
                            </p>
                          </div>
                          {sg.documents.length === 0 ? (
                            <p className="text-xs text-[var(--fc-text-secondary)]">
                              {t('documents.empty', runtime.locale)}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {sg.documents.map((doc) => (
                                <DocRow key={doc.id} doc={doc} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </div>

      {addOpen ? (
        <AddDocumentSheet
          addFor={addOpen}
          vehicles={result?.vehicles ?? []}
          segments={result?.segments ?? []}
          onClose={() => setAddOpen(null)}
          onDone={() => void refresh()}
        />
      ) : null}
    </AppShell>
  );
}