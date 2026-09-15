export type SoundName = 'request-alert' | 'ready-to-go' | 'navigation-instruction' | 'payment-success';

const SOUND_PATHS: Record<SoundName, string> = {
  'request-alert': '/sound/request-alert.mp3',
  'ready-to-go': '/sound/ready-to-go.mp3',
  'navigation-instruction': '/sound/navigation-instruction.mp3',
  'payment-success': '/sound/payment-success.mp3',
};

const SOUND_ENABLED_KEY = 'fixcycle:driver-sound-enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return true;
  }
  return localStorage.getItem(SOUND_ENABLED_KEY) !== '0';
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SOUND_ENABLED_KEY, enabled ? '1' : '0');
    }
  } catch {
    // storage unavailable (private mode etc.)
  }
}

let activeAudio: HTMLAudioElement | null = null;

export function playSound(name: SoundName): void {
  if (!isSoundEnabled()) {
    return;
  }
  if (typeof window === 'undefined' || !window.Audio) {
    return;
  }
  try {
    if (activeAudio) {
      activeAudio.pause();
    }
    activeAudio = new Audio(SOUND_PATHS[name]);
    activeAudio.volume = 0.9;
    void activeAudio.play().catch(() => {
      // Audio is a placeholder frame in the Phase 13 preview; browsers may
      // also block autoplay until the user has interacted with the page.
    });
  } catch {
    // fail silently — sounds are non-critical
  }
}