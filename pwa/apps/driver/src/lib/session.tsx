'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  driverDemoOnboard,
  driverLoginWithOtp,
  driverLoginWithPassword,
  fetchDriverDetails,
  logoutDriver,
  UnauthorizedError,
} from '@fixcycle/api-client';
import type { DriverProfile, DriverTokenPayload } from '@fixcycle/api-client';

import { api } from './api';

export type DriverAuthStatus = 'booting' | 'signedOut' | 'signedIn';

export interface DriverSessionContextValue {
  status: DriverAuthStatus;
  profile: DriverProfile | null;
  signInWithOtp: (phone: string, otp: string) => Promise<void>;
  signInWithPassword: (phone: string, password: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setProfile: (profile: DriverProfile) => void;
}

const DriverSessionContext = createContext<DriverSessionContextValue | null>(null);

export function DriverSessionProvider({ children }: { children: ReactNode }): ReactNode {
  const [status, setStatus] = useState<DriverAuthStatus>('booting');
  const [profile, setProfile] = useState<DriverProfile | null>(null);

  const establishSession = useCallback(async (payload: DriverTokenPayload): Promise<void> => {
    await api.tokenStore.setToken('driver', payload.accessToken);
    setProfile(payload.driver);
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const record = await api.tokenStore.getToken('driver');
        if (!record) {
          if (!cancelled) {
            setStatus('signedOut');
          }
          return;
        }
        const profileData = await fetchDriverDetails(api);
        if (!cancelled) {
          setProfile(profileData);
          setStatus('signedIn');
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof UnauthorizedError) {
            await api.tokenStore.clearToken('driver');
          }
          setStatus('signedOut');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithOtp = useCallback(
    async (phone: string, otp: string): Promise<void> => {
      const payload = await driverLoginWithOtp(api, { phone, loginOtp: otp });
      await establishSession(payload);
    },
    [establishSession],
  );

  const signInWithPassword = useCallback(
    async (phone: string, password: string): Promise<void> => {
      const payload = await driverLoginWithPassword(api, { phone, password });
      await establishSession(payload);
    },
    [establishSession],
  );

  const signInDemo = useCallback(async (): Promise<void> => {
    const payload = await driverDemoOnboard(api);
    await establishSession(payload);
  }, [establishSession]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await logoutDriver(api);
    } finally {
      setProfile(null);
      setStatus('signedOut');
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    const profileData = await fetchDriverDetails(api);
    setProfile(profileData);
  }, []);

  const value = useMemo<DriverSessionContextValue>(
    () => ({
      status,
      profile,
      signInWithOtp,
      signInWithPassword,
      signInDemo,
      signOut,
      refresh,
      setProfile,
    }),
    [status, profile, signInWithOtp, signInWithPassword, signInDemo, signOut, refresh],
  );

  return <DriverSessionContext.Provider value={value}>{children}</DriverSessionContext.Provider>;
}

export function useDriverSession(): DriverSessionContextValue {
  const value = useContext(DriverSessionContext);
  if (!value) {
    throw new Error('useDriverSession must be used within DriverSessionProvider');
  }
  return value;
}