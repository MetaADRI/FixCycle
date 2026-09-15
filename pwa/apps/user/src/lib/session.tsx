'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  fetchUserDetails,
  forgotPassword,
  guestLogin,
  loginWithOtp,
  loginWithPassword,
  logoutUser,
  sendOtp,
  signup,
  UnauthorizedError,
} from '@fixcycle/api-client';
import type { OtpChannel, OtpSendResult, OtpType, SignupParams, UserProfile } from '@fixcycle/api-client';
import { getEncryptionConfig } from '@fixcycle/config';

import { api } from './api';
import { useRuntime } from './runtime-context';

export type AuthStatus = 'booting' | 'signedOut' | 'signedIn';
export type AuthSessionKind = 'user' | 'guest';

export interface AuthContextValue {
  status: AuthStatus;
  user: UserProfile | null;
  sessionKind: AuthSessionKind | null;
  sendOtpFor: (type: OtpType, channel: OtpChannel, identifier: string) => Promise<OtpSendResult>;
  signInWithOtp: (phone: string, otp: string) => Promise<void>;
  signInWithPassword: (phone: string, password: string, logintype?: string) => Promise<void>;
  signUp: (params: SignupParams) => Promise<void>;
  resetPassword: (channel: OtpChannel, password: string, identifier: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const { runtime } = useRuntime();
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionKind, setSessionKind] = useState<AuthSessionKind | null>(null);

  const encryption = useMemo(() => getEncryptionConfig(runtime), [runtime]);

  const establishSession = useCallback(async (token: string, kind: AuthSessionKind): Promise<void> => {
    await api.tokenStore.setToken('user', token);
    const profile = await fetchUserDetails(api);
    setUser(profile);
    setSessionKind(kind);
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const record = await api.tokenStore.getToken('user');
        if (!record) {
          if (!cancelled) {
            setStatus('signedOut');
          }
          return;
        }
        const profile = await fetchUserDetails(api);
        if (!cancelled) {
          setUser(profile);
          setSessionKind('user');
          setStatus('signedIn');
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof UnauthorizedError) {
            await api.tokenStore.clearToken('user');
          }
          setStatus('signedOut');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendOtpFor = useCallback(
    async (type: OtpType, channel: OtpChannel, identifier: string): Promise<OtpSendResult> => {
      return sendOtp(api, {
        type,
        for: channel,
        user_name: identifier,
        phone: channel === 'PHONE' ? identifier : undefined,
        email: channel === 'EMAIL' ? identifier : undefined,
        encryption,
      });
    },
    [encryption],
  );

  const signInWithOtp = useCallback(
    async (phone: string, otp: string): Promise<void> => {
      const token = await loginWithOtp(api, { phone, loginOtp: otp });
      await establishSession(token.accessToken, 'user');
    },
    [establishSession],
  );

  const signInWithPassword = useCallback(
    async (phone: string, password: string, logintype?: string): Promise<void> => {
      const token = await loginWithPassword(api, { phone, password, logintype, encryption });
      await establishSession(token.accessToken, 'user');
    },
    [encryption, establishSession],
  );

  const signUp = useCallback(
    async (params: SignupParams): Promise<void> => {
      if (params.isRegister === true && !params.loginOtp) {
        throw new Error('A verification code is required to complete registration');
      }
      const result = await signup(api, { ...params, encryption });
      if (
        result &&
        typeof result === 'object' &&
        'accessToken' in result &&
        typeof result.accessToken === 'string'
      ) {
        await establishSession(result.accessToken, 'user');
      }
    },
    [encryption, establishSession],
  );

  const resetPassword = useCallback(
    async (channel: OtpChannel, password: string, identifier: string): Promise<void> => {
      await forgotPassword(api, {
        for: channel,
        password,
        phone: identifier,
        encryption,
      });
    },
    [encryption],
  );

  const signInAsGuest = useCallback(async (): Promise<void> => {
    const token = await guestLogin(api, {});
    await establishSession(token.accessToken, 'guest');
  }, [establishSession]);

  const signOut = useCallback(async (): Promise<void> => {
    await logoutUser(api);
    setUser(null);
    setSessionKind(null);
    setStatus('signedOut');
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    const profile = await fetchUserDetails(api);
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      sessionKind,
      sendOtpFor,
      signInWithOtp,
      signInWithPassword,
      signUp,
      resetPassword,
      signInAsGuest,
      signOut,
      refresh,
    }),
    [
      status,
      user,
      sessionKind,
      sendOtpFor,
      signInWithOtp,
      signInWithPassword,
      signUp,
      resetPassword,
      signInAsGuest,
      signOut,
      refresh,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}