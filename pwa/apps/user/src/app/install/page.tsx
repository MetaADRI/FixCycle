import type { ReactNode } from 'react';

import { AppShell, IconButton, TopHeader } from '@fixcycle/ui';

import { InstallHelp } from '@/components/install-help';

export default function InstallPage(): ReactNode {
  return (
    <AppShell
      header={
        <TopHeader
          title="Install Fixcycle"
          leading={
            <a href="/" aria-label="Back to home">
              <IconButton icon="back" label="Back" />
            </a>
          }
        />
      }
    >
      <InstallHelp />
    </AppShell>
  );
}