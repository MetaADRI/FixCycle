'use client';

import { Suspense, type ReactNode } from 'react';

import { HistoryDetail } from './history-detail';

export default function HistoryDetailPage(): ReactNode {
  return (
    <Suspense fallback={null}>
      <HistoryDetail />
    </Suspense>
  );
}