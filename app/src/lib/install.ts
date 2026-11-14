import { useEffect, useState } from 'preact/hooks';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();

/** Guarda o convite de instalação do Chrome/Android para oferecer um botão em Ajustes. */
export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((f) => f());
  });
}

export function useInstallPrompt(): { canPrompt: boolean; prompt: () => Promise<void> } {
  const [, set] = useState(0);
  useEffect(() => {
    const f = () => set((v) => v + 1);
    listeners.add(f);
    return () => void listeners.delete(f);
  }, []);
  return {
    canPrompt: deferred !== null,
    prompt: async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice.catch(() => undefined);
      deferred = null;
      listeners.forEach((f) => f());
    },
  };
}

export function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}
