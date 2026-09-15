import { fileURLToPath } from 'node:url';
import path from 'node:path';
import withSerwistInit from '@serwist/next';

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
});

export default withSerwist({
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@fixcycle/config', '@fixcycle/api-client', '@fixcycle/ui', '@fixcycle/pwa-core'],
});