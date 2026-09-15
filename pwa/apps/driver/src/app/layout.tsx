import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { publicEnv } from '@fixcycle/config';

import { RuntimeProvider } from '@/lib/runtime-context';
import { DriverSessionProvider } from '@/lib/session';
import { DriverProvider } from '@/lib/driver-context';

import './globals.css';

export const metadata: Metadata = {
  applicationName: 'Fixcycle Driver',
  title: 'Fixcycle Driver',
  description: 'Driver app for Fixcycle on-demand services.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fixcycle Driver',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#287e0a' },
    { media: '(prefers-color-scheme: dark)', color: '#287e0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en" data-app-role={publicEnv.appRole}>
      <body>
        <RuntimeProvider>
          <DriverSessionProvider>
            <DriverProvider>{children}</DriverProvider>
          </DriverSessionProvider>
        </RuntimeProvider>
      </body>
    </html>
  );
}