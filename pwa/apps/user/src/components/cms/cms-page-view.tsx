'use client';

import { useEffect, useState } from 'react';

import { fetchCmsPage } from '@fixcycle/api-client';
import type { CmsPage } from '@fixcycle/api-client';
import { AppShell, Button, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { api } from '@/lib/api';

interface CmsPageViewProps {
  slug: string;
}

export function CmsPageView({ slug }: CmsPageViewProps): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCmsPage(api, { slug })
      .then((result) => {
        if (!cancelled) setPage(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('auth.somethingWentWrong', runtime.locale));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug, runtime.locale]);

  return (
    <AppShell padded={false}>
      <TopHeader
        title={page?.title ?? slug.replace(/-/g, ' ')}
        leading={
          <IconButton icon="back" label="Back" size={20} onClick={() => router.back()} />
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Spinner className="h-8 w-8 text-[var(--fc-bg-secondary)]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-center text-sm text-[var(--fc-danger)]" role="alert">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : page ? (
          <article
            className="prose prose-sm max-w-none text-[var(--fc-text-primary)]"
            dangerouslySetInnerHTML={{ __html: page.description }}
          />
        ) : (
          <p className="py-12 text-center text-sm text-[var(--fc-text-secondary)]">
            {t('cms.notFound', runtime.locale)}
          </p>
        )}
      </div>
    </AppShell>
  );
}