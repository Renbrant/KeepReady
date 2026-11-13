import { SyncPill } from '../components/SyncPill';
import { useReadiness } from '../lib/derived';
import { n0, plural } from '../lib/fmt';
import { useMeta } from '../lib/meta';

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
  const meta = useMeta();
  return (
    <>
      <div class="topbar">
        <div>
          <h1>Mais</h1>
          <div class="sub">{r.settings.householdName}</div>
        </div>
        <SyncPill />
      </div>
      <Link
        href="#/familia"
        title="Família e conta"
        sub={`${r.members.length} ${plural(r.members.length, 'pessoa', 'pessoas')} · ${n0(r.kcalPerDay)} kcal por dia · ${meta.householdId ? `casa ${meta.householdName}` : 'sem conta'}`}
      />
      <Link href="#/guias" title="Guias" sub="Reembalar, rotação, altitude, calorias, uso offline" />
      <Link href="#/ajustes" title="Ajustes" sub="Altitude, tema, backup, instalar" />
      <Link href="#/imprimir" title="Resumo para imprimir" sub="Uma folha com o estado atual" />
    </>
  );
}
