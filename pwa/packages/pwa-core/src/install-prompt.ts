import { useCallback, useEffect, useState } from 'react';

export type InstallPlatform = 'ios-safari' | 'chrome-android' | 'other';

export interface InstallEligibility {
  canInstall: boolean;
  isStandalone: boolean;
  platform: InstallPlatform;
}

export interface InstallPromptState extends InstallEligibility {
  promptInstall: () => Promise<boolean>;
  dismissed: boolean;
  dismiss: () => void;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const nav = navigator as Navigator & {
    standalone?: boolean;
  };
  return 'standalone' in navigator ? Boolean(nav.standalone) : Boolean(window.matchMedia('(display-mode: standalone)').matches);
}

export function detectInstallEligibility(): InstallEligibility {
  if (typeof navigator === 'undefined') {
    return { canInstall: false, isStandalone: false, platform: 'other' };
  }
  const userAgent = navigator.userAgent ?? '';
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isChromeAndroid = /android/i.test(userAgent) && /chrome|crios/i.test(userAgent);
  const platform: InstallPlatform = isIos ? 'ios-safari' : isChromeAndroid ? 'chrome-android' : 'other';
  return {
    isStandalone: detectStandalone(),
    canInstall: isChromeAndroid && !detectStandalone(),
    platform,
  };
}

export function useInstallEligibility(): InstallEligibility | null {
  const [eligibility, setEligibility] = useState<InstallEligibility | null>(null);
  useEffect(() => {
    setEligibility(detectInstallEligibility());
  }, []);
  return eligibility;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = 'fixcycle.installPrompt.dismissedAt';

export function useInstallPrompt(): InstallPromptState {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [eligibility, setEligibility] = useState<InstallEligibility>(() => detectInstallEligibility());
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.localStorage.getItem(DISMISS_KEY) !== null;
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent): void => {
      event.preventDefault();
      setDeferredEvent(event);
      setEligibility((current) => ({ ...current, canInstall: true }));
    };
    const onAppInstalled = (): void => {
      setEligibility((current) => ({ ...current, canInstall: false, isStandalone: true }));
      setDeferredEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (eligibility.platform === 'ios-safari') {
      return false;
    }
    if (!deferredEvent) {
      return false;
    }
    try {
      await deferredEvent.prompt();
      const outcome = await deferredEvent.userChoice;
      setEligibility((current) => ({ ...current, canInstall: outcome.outcome === 'dismissed' }));
      if (outcome.outcome === 'accepted') {
        setDeferredEvent(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredEvent, eligibility.platform]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  }, []);

  return {
    ...eligibility,
    promptInstall,
    dismissed,
    dismiss,
  };
}