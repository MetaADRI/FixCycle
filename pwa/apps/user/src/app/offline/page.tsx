import type { ReactNode } from 'react';

import { AppShell, IconButton, TopHeader } from '@fixcycle/ui';

import { OfflinePanel } from '@/components/offline-panel';

export default function OfflinePage(): ReactNode {
  return (
    <AppShell
      header={
        <TopHeader
          title="Offline"
          leading={
            <a href="/" aria-label="Back to home">
              <IconButton icon="back" label="Back" />
            </a>
          }
        />
      }
    >
      <OfflinePanel />
    </AppShell>
  );
}