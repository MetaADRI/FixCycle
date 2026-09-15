import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { publicEnv } from '@fixcycle/config';

import { RuntimeProvider } from '@/lib/runtime-context';
import { AuthProvider } from '@/lib/session';

import './globals.css';

export const metadata: Metadata = {
  applicationName: 'Fixcycle',
  title: 'Fixcycle',
  description: 'On-demand fix services: taxi, delivery, food, grocery and more.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fixcycle',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0b1b3f' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1b3f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  const appName = publicEnv.appRole === 'user' ? 'Fixcycle' : publicEnv.appRole;

  return (
    <html lang="en" data-app-role={publicEnv.appRole}>
      <body>
        <RuntimeProvider>
          <AuthProvider>
            <noscript>
              <div style={{ padding: '16px', textAlign: 'center' }}>{appName} requires JavaScript.</div>
            </noscript>
            {children}
          </AuthProvider>
        </RuntimeProvider>
      </body>
    </html>
  );
}