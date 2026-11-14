import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import './styles.css';
import { store } from './lib/db';
import { captureInstallPrompt } from './lib/install';
import { setMeta } from './lib/meta';
import { startAutoSync } from './lib/syncManager';

captureInstallPrompt();

async function boot(): Promise<void> {
  await store.init();
  render(<App />, document.getElementById('app')!);

  // Service worker: guarda o app no aparelho e atualiza sozinho quando há versão nova.
  registerSW({ immediate: true });

  // Pede ao navegador para não apagar os dados do app quando faltar espaço.
  try {
    const ok = (await navigator.storage?.persist?.()) ?? false;
    setMeta({ persisted: ok });
  } catch {
    setMeta({ persisted: false });
  }

  startAutoSync();

  // Grava na hora ao sair do app, sem esperar o intervalo normal.
  const flush = () => void store.flush();
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

void boot();
