'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  addFavouriteLocation,
  deleteFavouriteLocation,
  fetchFavouriteDrivers,
  fetchFavouriteLocations,
  toggleFavouriteDriver,
} from '@fixcycle/api-client';
import type { FavouriteDriver, FavouriteLocation } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export type FavouritesTab = 'drivers' | 'locations';

export interface FavouritesView {
  loading: boolean;
  drivers: FavouriteDriver[];
  locations: FavouriteLocation[];
  load: (tab: FavouritesTab, segmentId?: string | number) => Promise<void>;
  toggleDriver: (params: { driverId: number; segmentId: number; action: 1 | 2 }) => Promise<{ success: boolean; message: string }>;
  addLocation: (params: {
    locationName: string;
    address: string;
    latitude: number | string;
    longitude: number | string;
  }) => Promise<{ success: boolean; message: string }>;
  removeLocation: (locationId: string | number) => Promise<{ success: boolean; message: string }>;
}

export function useFavourites(): FavouritesView {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<FavouriteDriver[]>([]);
  const [locations, setFavouriteLocations] = useState<FavouriteLocation[]>([]);

  const load = useCallback(async (tab: FavouritesTab, segmentId?: string | number) => {
    setLoading(true);
    try {
      if (tab === 'drivers') {
        setDrivers(await fetchFavouriteDrivers(api, { segmentId: segmentId ?? '' }));
      } else {
        setFavouriteLocations(await fetchFavouriteLocations(api));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('drivers');
  }, [load]);

  const toggleDriver = useCallback(
    async (params: { driverId: number; segmentId: number; action: 1 | 2 }) => {
      const res = await toggleFavouriteDriver(api, params);
      if (res.success) void load('drivers', params.segmentId);
      return res;
    },
    [load],
  );

  const addLocation = useCallback(
    async (params: { locationName: string; address: string; latitude: number | string; longitude: number | string }) => {
      const res = await addFavouriteLocation(api, params);
      if (res.success) void load('locations');
      return res;
    },
    [load],
  );

  const removeLocation = useCallback(
    async (locationId: string | number) => {
      const res = await deleteFavouriteLocation(api, { locationId });
      if (res.success) void load('locations');
      return res;
    },
    [load],
  );

  return { loading, drivers, locations, load, toggleDriver, addLocation, removeLocation };
}