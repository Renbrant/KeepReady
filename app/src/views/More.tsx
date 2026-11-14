import { SyncPill } from '../components/SyncPill';
import { usePlan, useReadiness } from '../lib/derived';
import { n0, plural } from '../lib/fmt';
import { useMeta } from '../lib/meta';
import { L } from '../lib/i18n';

function Link({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <a class="menu-link" href={href}>
      <span>
        {title}
        <small>{sub}</small>
      </span>
      <span aria-hidden="true">›</span>
    </a>
  );
}

export function More() {
  const r = useReadiness();
  const plan = usePlan();
  const meta = useMeta();
  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L('Mais', 'More')}</h1>
          <div class="sub">{r.settings.householdName}</div>
        </div>
        <SyncPill />
      </div>
      <Link
        href="#/plano"
        title={L('Plano e meta', 'Plan and goal')}
        sub={L(
          `${r.members.length} ${plural(r.members.length, 'pessoa', 'pessoas')} · ${r.settings.daysTarget} dias · ${plan.food.grainBuckets} baldes, ${plan.totes.length} ${plural(plan.totes.length, 'caixa', 'caixas')} de 27 gal`,
          `${r.members.length} ${plural(r.members.length, 'person', 'people')} · ${r.settings.daysTarget} days · ${plan.food.grainBuckets} buckets, ${plan.totes.length} ${plural(plan.totes.length, 'tote', 'totes')} (27 gal)`,
        )}
      />
      <Link
        href="#/familia"
        title={L('Família e conta', 'Family and account')}
        sub={L(
          `${r.members.length} ${plural(r.members.length, 'pessoa', 'pessoas')} · ${n0(r.kcalPerDay)} kcal por dia · ${meta.householdId ? `casa ${meta.householdName}` : 'sem conta'}`,
          `${r.members.length} ${plural(r.members.length, 'person', 'people')} · ${n0(r.kcalPerDay)} kcal per day · ${meta.householdId ? `household ${meta.householdName}` : 'no account'}`,
        )}
      />
      <Link href="#/entrada" title={L('Entrada de compras', 'Log purchases')} sub={L('Registrar o que comprou, com validade, etiqueta e código de barras', 'Log what you bought, with expiry, label and barcode')} />
      <Link href="#/guias" title={L('Guias', 'Guides')} sub={L('Reembalar, rotação, altitude, calorias, uso offline', 'Repacking, rotation, altitude, calories, offline use')} />
      <Link href="#/ajustes" title={L('Ajustes', 'Settings')} sub={L('Altitude, tema, backup, instalar', 'Altitude, theme, backup, install')} />
      <Link href="#/imprimir" title={L('Resumo para imprimir', 'Printable summary')} sub={L('Uma folha com o estado atual', 'One sheet with the current status')} />
    </>
  );
}
