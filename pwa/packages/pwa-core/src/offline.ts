import { useEffect, useState } from 'react';

export interface Capabilities {
  online: boolean;
  serviceWorker: boolean;
  touch: boolean;
}

export function useCapabilities(): Capabilities | null {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  useEffect(() => {
    setCapabilities(getCapabilities());
    return subscribeOnlineChange((online) => {
      setCapabilities((current) => (current ? { ...current, online } : current));
    });
  }, []);
  return capabilities;
}

export function useStandaloneMode(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setStandalone(isStandaloneMode());
  }, []);
  return standalone;
}

export interface OfflineStatus {
  online: boolean;
  supportsOffline: boolean;
}

export function getCapabilities(): Capabilities {
  const hasWindow = typeof window !== 'undefined';
  return {
    online: hasWindow ? navigator.onLine : true,
    serviceWorker: 'serviceWorker' in navigator,
    touch: hasWindow ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : false,
  };
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const nav = navigator as Navigator & { standalone?: boolean };
  if ('standalone' in navigator && typeof nav.standalone === 'boolean') {
    return nav.standalone;
  }
  return window.matchMedia('(display-mode: standalone)').matches;
}

export async function checkOfflineCapability(): Promise<OfflineStatus> {
  const hasWindow = typeof window !== 'undefined';
  const online = hasWindow ? navigator.onLine : true;
  let supportsOffline = false;
  if (hasWindow && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    supportsOffline = registration?.active !== undefined;
  }
  return { online, supportsOffline };
}

export function subscribeOnlineChange(onChange: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const handleOnline = (): void => onChange(true);
  const handleOffline = (): void => onChange(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}