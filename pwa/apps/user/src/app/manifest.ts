import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fixcycle',
    short_name: 'Fixcycle',
    description: 'On-demand fix services: taxi, delivery, food, grocery and more.',
    id: 'fixcycle-user',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b1b3f',
    theme_color: '#0b1b3f',
    categories: ['navigation', 'utilities', 'shopping'],
    lang: 'en',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}