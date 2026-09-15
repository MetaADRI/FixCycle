'use client';

import { useCallback, useState } from 'react';
import { fetchActiveBookings, fetchBookingDetail, fetchBookingHistory } from '@fixcycle/api-client';
import type { HistoryBooking, HistoryDetail } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export type HistoryScope = 'ride' | 'delivery' | 'all';
export type HistoryTab = 'recent' | 'active' | 'past';

export interface HistoryView {
  loading: boolean;
  bookings: HistoryBooking[];
  active: HistoryBooking[];
  detail: HistoryDetail | null;
  load: (scope: HistoryScope, tab: HistoryTab) => Promise<void>;
  loadActive: () => Promise<void>;
  loadDetail: (bookingId: string | number) => Promise<void>;
}

export function useHistory(): HistoryView {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<HistoryBooking[]>([]);
  const [active, setActive] = useState<HistoryBooking[]>([]);
  const [detail, setDetail] = useState<HistoryDetail | null>(null);

  const load = useCallback(async (scope: HistoryScope, tab: HistoryTab) => {
    setLoading(true);
    try {
      const segmentId = scope === 'ride' ? 1 : scope === 'delivery' ? 4 : undefined;
      const result = await fetchBookingHistory(api, {
        segmentId: segmentId ?? '',
        requestType: tab === 'past' ? 'past' : 'ongoing',
      });
      setBookings(result.bookings);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActive = useCallback(async () => {
    const list = await fetchActiveBookings(api);
    setActive(list);
  }, []);

  const loadDetail = useCallback(async (bookingId: string | number) => {
    const res = await fetchBookingDetail(api, { bookingId });
    setDetail(res);
  }, []);

  return { loading, bookings, active, detail, load, loadActive, loadDetail };
}