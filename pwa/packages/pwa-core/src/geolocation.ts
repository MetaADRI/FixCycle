export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export type GeolocationReason = 'granted' | 'denied' | 'unavailable' | 'unsupported';

export interface GeolocationStatus {
  granted: boolean;
  reason: GeolocationReason;
  message?: string;
}

export interface WatchHandle {
  stop: () => void;
}

export interface GeolocationRequesterOptions {
  timeoutMs?: number;
  maximumAgeMs?: number;
  highAccuracy?: boolean;
}

const DEFAULT_OPTIONS: Required<GeolocationRequesterOptions> = {
  timeoutMs: 10000,
  maximumAgeMs: 0,
  highAccuracy: true,
};

export function isGeoSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export async function requestGeolocationPermission(): Promise<GeolocationStatus> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return { granted: false, reason: 'unsupported' };
  }

  const permissions = navigator.permissions;
  if (permissions) {
    try {
      const result = await permissions.query({ name: 'geolocation' as PermissionName });
      if (result.state === 'granted') {
        return { granted: true, reason: 'granted' };
      }
      if (result.state === 'denied') {
        return { granted: false, reason: 'denied', message: 'Location access is blocked. Enable it in your browser settings.' };
      }
      return { granted: false, reason: 'unavailable' };
    } catch {
      // Fall through to a live check.
    }
  }

  return new Promise<GeolocationStatus>((resolve) => {
    const onSuccess = (): void => resolve({ granted: true, reason: 'granted' });
    const onError = (error: GeolocationPositionError): void => {
      if (error.code === error.PERMISSION_DENIED) {
        resolve({ granted: false, reason: 'denied', message: 'Location access is blocked. Enable it in your browser settings.' });
        return;
      }
      resolve({ granted: false, reason: 'unavailable', message: 'The browser could not determine location permission.' });
    };
    const options: PositionOptions = {
      timeout: 3000,
      maximumAge: DEFAULT_OPTIONS.maximumAgeMs,
      enableHighAccuracy: DEFAULT_OPTIONS.highAccuracy,
    };
    try {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    } catch {
      resolve({ granted: false, reason: 'unavailable' });
    }
  });
}

export function getCurrentPosition(options: GeolocationRequesterOptions = {}): Promise<Coordinates> {
  if (!isGeoSupported()) {
    return Promise.reject(new Error('geolocation-unsupported'));
  }
  return new Promise<Coordinates>((resolve, reject) => {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('geolocation-denied'));
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new Error('geolocation-timeout'));
          return;
        }
        reject(new Error('geolocation-unavailable'));
      },
      { timeout: merged.timeoutMs, maximumAge: merged.maximumAgeMs, enableHighAccuracy: merged.highAccuracy },
    );
  });
}

export function watchPosition(onUpdate: (coords: Coordinates) => void, options: GeolocationRequesterOptions = {}): WatchHandle {
  if (!isGeoSupported()) {
    throw new Error('geolocation-unsupported');
  }
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const id = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      });
    },
    () => undefined,
    { enableHighAccuracy: merged.highAccuracy, maximumAge: merged.maximumAgeMs, timeout: merged.timeoutMs },
  );
  return { stop: () => navigator.geolocation.clearWatch(id) };
}

export function formatCoordinates(latitude: number, longitude: number, precision = 5): string {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
}