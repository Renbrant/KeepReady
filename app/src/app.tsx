import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Icon } from './components/ui';
import { useSettings } from './lib/db';
import { Dashboard } from './views/Dashboard';
import { Family } from './views/Family';
import { Guides } from './views/Guides';
import { Plan } from './views/Plan';
import { Totes } from './views/Totes';
import { More } from './views/More';
import { Print } from './views/Print';
import { Rotation } from './views/Rotation';
import { Settings } from './views/Settings';
import { Shopping } from './views/Shopping';
import { Stock } from './views/Stock';

function currentRoute(): string {
  return location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\/$/, '');
}

function useRoute(): string {
  const [route, setRoute] = useState(currentRoute());
  useEffect(() => {
    const f = () => setRoute(currentRoute());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return route;
}

const TABS = [
  { href: '#/painel', icon: 'painel', label: 'Painel', match: ['', 'painel'] },
  { href: '#/estoque', icon: 'estoque', label: 'Estoque', match: ['estoque', 'caixas'] },
  { href: '#/rotacao', icon: 'rotacao', label: 'Rotação', match: ['rotacao'] },
  { href: '#/compras', icon: 'compras', label: 'Compras', match: ['compras'] },
  { href: '#/mais', icon: 'mais', label: 'Mais', match: ['mais', 'plano', 'familia', 'guias', 'ajustes', 'imprimir'] },
] as const;

function view(route: string): ComponentChildren {
  const [head, sub] = route.split('/');
  switch (head) {
    case 'estoque':
      return <Stock />;
    case 'rotacao':
      return <Rotation />;
    case 'compras':
      return <Shopping />;
    case 'mais':
      return <More />;
    case 'plano':
      return <Plan />;
    case 'caixas':
      return <Totes />;
    case 'familia':
      return <Family />;
    case 'guias':
      return <Guides openId={sub} />;
    case 'ajustes':
      return <Settings />;
    case 'imprimir':
      return <Print />;
    default:
      return <Dashboard />;
  }
}

export function App() {
  const route = useRoute();
  const { theme } = useSettings();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const head = route.split('/')[0];
  return (
    <>
      <main class="shell">{view(route)}</main>
      <nav class="nav" aria-label="Principal">
        <ul>
          {TABS.map((t) => {
            const active = (t.match as readonly string[]).includes(head);
            return (
              <li key={t.href}>
                <a href={t.href} class={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                  <Icon name={t.icon} />
                  {t.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
