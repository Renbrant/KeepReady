import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Icon } from './components/ui';
import { L, useLang } from './lib/i18n';
import { saveSettings, saveSupplies, store, useSettings, useStoreVersion } from './lib/db';
import { householdKcalPerDay, waterNeededGal } from './lib/calc';
import { defaultSettings } from './lib/plan';
import type { Member, Settings as SettingsData, Supplies } from './lib/types';
import { Dashboard } from './views/Dashboard';
import { Family } from './views/Family';
import { Guides } from './views/Guides';
import { Plan } from './views/Plan';
import { Totes } from './views/Totes';
import { Water } from './views/Water';
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
  { href: '#/painel', icon: 'painel', get label() { return L('Painel', 'Dashboard'); }, match: ['', 'painel'] },
  { href: '#/estoque', icon: 'estoque', get label() { return L('Estoque', 'Stock'); }, match: ['estoque', 'caixas', 'agua'] },
  { href: '#/rotacao', icon: 'rotacao', get label() { return L('Rotação', 'Rotation'); }, match: ['rotacao'] },
  { href: '#/compras', icon: 'compras', get label() { return L('Compras', 'Shopping'); }, match: ['compras'] },
  { href: '#/mais', icon: 'mais', get label() { return L('Mais', 'More'); }, match: ['mais', 'plano', 'familia', 'guias', 'ajustes', 'imprimir'] },
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
    case 'agua':
      return <Water />;
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
  useLang();
  const { theme } = useSettings();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  /** Uma vez: quem já tinha o plano salvo passa para o modelo de água novo (beber 3 L por pessoa por dia). Depois você ajusta em Plano. */
  useStoreVersion();
  const rawModel = store.get<SettingsData>('settings')?.data.waterModel;
  const hasSettings = !!store.get('settings');
  useEffect(() => {
    if (!hasSettings || (rawModel ?? 1) >= 2) return;
    const cur = store.get<SettingsData>('settings')!.data;
    const members = store.list<Member>('member').map((r) => r.data);
    const kcal = householdKcalPerDay(members);
    const oldTarget = Math.ceil(waterNeededGal(members, kcal, { ...defaultSettings, ...cur }, 1));
    const sup = store.get<Supplies>('supplies')?.data;
    saveSettings({ waterModel: 2, drinkLPerPersonDay: 3 });
    // Só troca a meta de água se ela ainda era a calculada pelo modelo antigo (não mexe se você a definiu na mão).
    if (sup && Math.abs(sup.waterTargetGal - oldTarget) <= 1) {
      saveSupplies({ waterTargetGal: Math.ceil(waterNeededGal(members, kcal, { ...defaultSettings, ...cur, drinkLPerPersonDay: 3 })) });
    }
  }, [hasSettings, rawModel]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const head = route.split('/')[0];
  return (
    <>
      <main class="shell">{view(route)}</main>
      <nav class="nav" aria-label={L('Principal', 'Main')}>
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
