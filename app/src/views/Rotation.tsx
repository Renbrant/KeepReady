import { Btn, Card, NumField, Pill } from '../components/ui';
import {
  canStartRotation,
  finishRotation,
  nextDue,
  overlaps,
  projectSchedule,
  replacementCost,
  rotationRows,
  startRotation,
} from '../lib/calc';
import { addReplacementShopping, removeReplacementShopping } from '../lib/actions';
import { addDays, diffDays, fmtDate, fmtMonthYear, todayISO } from '../lib/dates';
import { saveBucket, saveSettings } from '../lib/db';
import { useReadiness } from '../lib/derived';
import { n0, n1, usd } from '../lib/fmt';

export function Rotation() {
  const r = useReadiness();
  const today = todayISO();
  const T = r.settings.rotationMonths;
  const N = r.buckets.length;
  const rows = rotationRows(r.buckets, today);
  const active = rows.find((x) => x.status === 'rotating');
  const next = nextDue(rows);
  const events = projectSchedule(r.buckets, T, today, 36);
  const clashes = overlaps(events, r.settings.rotationWindowDays);
  const costOf = (n: number) => {
    const b = r.buckets.find((x) => x.n === n);
    return b ? replacementCost(b, r.settings).total : 0;
  };
  const avgCost = N > 0 ? r.buckets.reduce((s, b) => s + replacementCost(b, r.settings).total, 0) / N : 0;
  const eventsPerYear = T > 0 ? (12 * N) / T : 0;
  const everyMonths = N > 0 ? T / N : 0;

  const start = (n: number) => {
    const b = r.buckets.find((x) => x.n === n);
    if (!b) return;
    saveBucket(b.id, startRotation(b, today));
    addReplacementShopping(b);
  };
  const finish = () => {
    const b = active?.bucket;
    if (!b) return;
    const id = r.buckets.find((x) => x.n === b.n)!.id;
    saveBucket(id, finishRotation(b, today, T));
    removeReplacementShopping(b.n);
  };

  return (
    <>
      <div class="topbar">
        <div>
          <h1>Rotação</h1>
          <div class="sub">Um balde por vez, para nada estragar e o custo ficar leve</div>
        </div>
      </div>

      {active ? (
        <Card tone="warn">
          <div class="row between">
            <h2 style={{ margin: 0 }}>{active.bucket.name} em rotação</h2>
            <Pill tone="info">Em andamento</Pill>
          </div>
          <p class="small" style={{ marginTop: 8 }}>
            Aberto desde <b>{fmtDate(active.bucket.rotationStartedOn)}</b>. Use o conteúdo nas refeições normais até{' '}
            <b>{fmtDate(addDays(active.bucket.rotationStartedOn ?? today, r.settings.rotationWindowDays))}</b>, compre a reposição (já está em Compras) e relacre com saco e absorvedor novos.
          </p>
          <Btn kind="primary" block onClick={finish}>
            Concluir reposição (relacrei hoje)
          </Btn>
          <p class="xs muted" style={{ marginTop: 8, marginBottom: 0 }}>Só depois de concluir dá para abrir o próximo balde.</p>
        </Card>
      ) : next ? (
        <Card tone={next.status === 'overdue' ? 'bad' : next.status === 'soon' ? 'warn' : undefined}>
          <div class="row between">
            <h2 style={{ margin: 0 }}>Próximo: {next.bucket.name}</h2>
            <Pill tone={next.status === 'overdue' ? 'bad' : next.status === 'soon' ? 'warn' : 'ok'}>
              {next.status === 'overdue' ? 'Vencido' : next.status === 'soon' ? 'Em breve' : 'No prazo'}
            </Pill>
          </div>
          <p class="small" style={{ marginTop: 8 }}>
            Vence em <b>{fmtDate(next.dueOn)}</b>
            {next.daysToDue !== undefined && (next.daysToDue < 0 ? ` (há ${Math.abs(next.daysToDue)} dias)` : ` (daqui a ${n0(next.daysToDue)} dias)`)}. Reposição estimada: <b>{usd(costOf(next.bucket.n))}</b>.
          </p>
          <Btn kind="primary" block disabled={!canStartRotation(r.buckets, next.bucket.n).ok} onClick={() => start(next.bucket.n)}>
            Iniciar rotação do {next.bucket.name}
          </Btn>
        </Card>
      ) : (
        <Card>
          <h2>Nenhum balde lacrado</h2>
          <p class="small muted" style={{ marginBottom: 0 }}>
            Lacre os baldes em Estoque. O calendário abaixo mostra como ficaria se você lacrasse todos hoje.
          </p>
        </Card>
      )}

      <Card>
        <h2>Como funciona</h2>
        <ol class="steps">
          <li>
            <b>Escalonar.</b>O primeiro ciclo é espaçado: o balde 1 vence em {n1(everyMonths)} meses, o 2 em {n1(2 * everyMonths)} e assim por diante, até o último em {T} meses. Depois disso, cada balde volta a cada {T} meses e a reposição cai de {n1(everyMonths)} em {n1(everyMonths)} meses.
          </li>
          <li>
            <b>Abrir um só.</b>Ao iniciar a rotação, o app cria a lista de compras daquele balde. Os outros ficam intactos, e o app não deixa abrir um segundo antes de concluir o primeiro.
          </li>
          <li>
            <b>Consumir.</b>Use o conteúdo nas refeições normais dentro de {r.settings.rotationWindowDays} dias. O balde em rotação sai da conta de dias de comida enquanto está aberto.
          </li>
          <li>
            <b>Repor e relacrar.</b>Reembale com saco de Mylar e absorvedor novos (veja Guias) e toque em Concluir. A data de lacre e o prazo recomeçam.
          </li>
        </ol>
      </Card>

      <Card>
        <h2>Ajustes da rotação</h2>
        <div class="grid2">
          <NumField label="Rotacionar cada balde a cada" suffix="meses" value={T} min={3} step={1} onChange={(v) => saveSettings({ rotationMonths: Math.max(3, Math.round(v ?? 24)) })} />
          <NumField label="Prazo para consumir um balde aberto" suffix="dias" value={r.settings.rotationWindowDays} min={7} step={1} onChange={(v) => saveSettings({ rotationWindowDays: Math.max(7, Math.round(v ?? 30)) })} />
          <NumField label="Custo de embalagem por saco" suffix="US$" value={r.settings.packagingCostPerBag} min={0} step={0.1} onChange={(v) => saveSettings({ packagingCostPerBag: Math.max(0, v ?? 0) })} />
        </div>
        <p class="xs muted" style={{ marginTop: 10, marginBottom: 0 }}>
          Com {N} baldes e {T} meses, sai um balde a cada <b>{n1(everyMonths)} meses</b> (~{n1(eventsPerYear)} por ano), cerca de <b>{usd(avgCost)}</b> cada, ou <b>{usd(avgCost * eventsPerYear)}</b> por ano em comida. Como o balde aberto é comido em casa, esse dinheiro volta como comida que você já ia comprar. {T <= 12 ? '' : 'O intervalo de 24 meses é uma escolha conservadora: as fontes do repositório falam em décadas para arroz e feijão bem lacrados, então ajuste como preferir.'}
        </p>
      </Card>

      {clashes.length > 0 && (
        <Card tone="warn">
          <h2>Rotações muito próximas</h2>
          <p class="small" style={{ marginBottom: 0 }}>
            {clashes.length} {clashes.length === 1 ? 'par de rotações cai' : 'pares de rotações caem'} a menos de {r.settings.rotationWindowDays} dias um do outro, o que quebra a regra de um por vez. Isso acontece quando vários baldes têm o mesmo vencimento. Relacre um por vez ao rotacionar, ou aumente o intervalo.
          </p>
        </Card>
      )}

      <Card>
        <h2>Calendário (36 meses)</h2>
        {events.length === 0 ? (
          <p class="small muted" style={{ marginBottom: 0 }}>Sem rotações no período.</p>
        ) : (
          <ul class="list">
            {events.map((e, i) => {
              const d = diffDays(today, e.date);
              return (
                <li key={`${e.n}-${e.date}-${i}`}>
                  <div class="row between">
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {e.name} <span class="faint xs">· rotação {e.cycle}</span>
                      </div>
                      <div class="xs muted">
                        {fmtDate(e.date)} · {fmtMonthYear(e.date)}
                        {e.hypothetical ? ' · se lacrar hoje' : ''}
                      </div>
                    </div>
                    <div class="mono small" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div>{usd(costOf(e.n))}</div>
                      <div class="xs muted">{d < 0 ? `${Math.abs(d)} d atrás` : `em ${n0(d)} d`}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
