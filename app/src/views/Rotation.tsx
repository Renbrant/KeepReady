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
import { L, tx } from '../lib/i18n';

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
          <h1>{L('Rotação', 'Rotation')}</h1>
          <div class="sub">{L('Um balde por vez, para nada estragar e o custo ficar leve', 'One bucket at a time, so nothing spoils and the cost stays light')}</div>
        </div>
      </div>

      {active ? (
        <Card tone="warn">
          <div class="row between">
            <h2 style={{ margin: 0 }}>{tx(active.bucket.name)}{L(' em rotação', ' in rotation')}</h2>
            <Pill tone="info">{L('Em andamento', 'In progress')}</Pill>
          </div>
          <p class="small" style={{ marginTop: 8 }}>
            {L('Aberto desde ', 'Open since ')}<b>{fmtDate(active.bucket.rotationStartedOn)}</b>{L('. Use o conteúdo nas refeições normais até', '. Use the contents in normal meals until')}{' '}
            <b>{fmtDate(addDays(active.bucket.rotationStartedOn ?? today, r.settings.rotationWindowDays))}</b>{L(', compre a reposição (já está em Compras) e relacre com saco e absorvedor novos.', ', buy the replacement (it is already in Shopping) and reseal with a new bag and absorber.')}
          </p>
          <Btn kind="primary" block onClick={finish}>
            {L('Concluir reposição (relacrei hoje)', 'Finish replacement (resealed today)')}
          </Btn>
          <p class="xs muted" style={{ marginTop: 8, marginBottom: 0 }}>{L('Só depois de concluir dá para abrir o próximo balde.', 'Only after finishing can you open the next bucket.')}</p>
        </Card>
      ) : next ? (
        <Card tone={next.status === 'overdue' ? 'bad' : next.status === 'soon' ? 'warn' : undefined}>
          <div class="row between">
            <h2 style={{ margin: 0 }}>{L('Próximo: ', 'Next: ')}{tx(next.bucket.name)}</h2>
            <Pill tone={next.status === 'overdue' ? 'bad' : next.status === 'soon' ? 'warn' : 'ok'}>
              {next.status === 'overdue' ? L('Vencido', 'Overdue') : next.status === 'soon' ? L('Em breve', 'Soon') : L('No prazo', 'On schedule')}
            </Pill>
          </div>
          <p class="small" style={{ marginTop: 8 }}>
            {L('Vence em ', 'Due ')}<b>{fmtDate(next.dueOn)}</b>
            {next.daysToDue !== undefined && (next.daysToDue < 0 ? L(` (há ${Math.abs(next.daysToDue)} dias)`, ` (${Math.abs(next.daysToDue)} days ago)`) : L(` (daqui a ${n0(next.daysToDue)} dias)`, ` (in ${n0(next.daysToDue)} days)`))}{L('. Reposição estimada: ', '. Estimated replacement: ')}<b>{usd(costOf(next.bucket.n))}</b>.
          </p>
          <Btn kind="primary" block disabled={!canStartRotation(r.buckets, next.bucket.n).ok} onClick={() => start(next.bucket.n)}>
            {L('Iniciar rotação do ', 'Start rotation for ')}{tx(next.bucket.name)}
          </Btn>
        </Card>
      ) : (
        <Card>
          <h2>{L('Nenhum balde lacrado', 'No sealed bucket')}</h2>
          <p class="small muted" style={{ marginBottom: 0 }}>
            {L('Lacre os baldes em Estoque. O calendário abaixo mostra como ficaria se você lacrasse todos hoje.', 'Seal the buckets in Stock. The calendar below shows how it would look if you sealed them all today.')}
          </p>
        </Card>
      )}

      <Card>
        <h2>{L('Como funciona', 'How it works')}</h2>
        <ol class="steps">
          <li>
            <b>{L('Escalonar.', 'Stagger.')}</b>{L('O primeiro ciclo é espaçado: o balde 1 vence em ', 'The first cycle is spaced out: bucket 1 is due in ')}{n1(everyMonths)}{L(' meses, o 2 em ', ' months, bucket 2 in ')}{n1(2 * everyMonths)}{L(' e assim por diante, até o último em ', ' and so on, up to the last in ')}{T}{L(' meses. Depois disso, cada balde volta a cada ', ' months. After that, each bucket comes back every ')}{T}{L(' meses e a reposição cai de ', ' months and a replacement comes up every ')}{n1(everyMonths)}{L(' em ', ' to ')}{n1(everyMonths)}{L(' meses.', ' months.')}
          </li>
          <li>
            <b>{L('Abrir um só.', 'Open only one.')}</b>{L('Ao iniciar a rotação, o app cria a lista de compras daquele balde. Os outros ficam intactos, e o app não deixa abrir um segundo antes de concluir o primeiro.', 'When you start a rotation, the app creates that bucket’s shopping list. The others stay untouched, and the app does not let you open a second one before finishing the first.')}
          </li>
          <li>
            <b>{L('Consumir.', 'Consume.')}</b>{L('Use o conteúdo nas refeições normais dentro de ', 'Use the contents in normal meals within ')}{r.settings.rotationWindowDays}{L(' dias. O balde em rotação sai da conta de dias de comida enquanto está aberto.', ' days. The bucket in rotation is left out of the food-days count while it is open.')}
          </li>
          <li>
            <b>{L('Repor e relacrar.', 'Replace and reseal.')}</b>{L('Reembale com saco de Mylar e absorvedor novos (veja Guias) e toque em Concluir. A data de lacre e o prazo recomeçam.', 'Repack with a new Mylar bag and absorber (see Guides) and tap Finish. The seal date and deadline start over.')}
          </li>
        </ol>
      </Card>

      <Card>
        <h2>{L('Ajustes da rotação', 'Rotation settings')}</h2>
        <div class="grid2">
          <NumField label={L('Rotacionar cada balde a cada', 'Rotate each bucket every')} suffix={L('meses', 'months')} value={T} min={3} step={1} onChange={(v) => saveSettings({ rotationMonths: Math.max(3, Math.round(v ?? 24)) })} />
          <NumField label={L('Prazo para consumir um balde aberto', 'Time to use up an open bucket')} suffix={L('dias', 'days')} value={r.settings.rotationWindowDays} min={7} step={1} onChange={(v) => saveSettings({ rotationWindowDays: Math.max(7, Math.round(v ?? 30)) })} />
          <NumField label={L('Custo de embalagem por saco', 'Packaging cost per bag')} suffix="US$" value={r.settings.packagingCostPerBag} min={0} step={0.1} onChange={(v) => saveSettings({ packagingCostPerBag: Math.max(0, v ?? 0) })} />
        </div>
        <p class="xs muted" style={{ marginTop: 10, marginBottom: 0 }}>
          {L('Com ', 'With ')}{N}{L(' baldes e ', ' buckets and ')}{T}{L(' meses, sai um balde a cada ', ' months, one bucket comes out every ')}<b>{n1(everyMonths)}{L(' meses', ' months')}</b> (~{n1(eventsPerYear)}{L(' por ano), cerca de ', ' per year), about ')}<b>{usd(avgCost)}</b>{L(' cada, ou ', ' each, or ')}<b>{usd(avgCost * eventsPerYear)}</b>{L(' por ano em comida. Como o balde aberto é comido em casa, esse dinheiro volta como comida que você já ia comprar. ', ' per year in food. Since the open bucket is eaten at home, that money comes back as food you were going to buy anyway. ')}{T <= 12 ? '' : L('O intervalo de 24 meses é uma escolha conservadora: as fontes do repositório falam em décadas para arroz e feijão bem lacrados, então ajuste como preferir.', 'The 24-month interval is a conservative choice: the repository sources speak of decades for well-sealed rice and beans, so adjust as you prefer.')}
        </p>
      </Card>

      {clashes.length > 0 && (
        <Card tone="warn">
          <h2>{L('Rotações muito próximas', 'Rotations too close together')}</h2>
          <p class="small" style={{ marginBottom: 0 }}>
            {clashes.length} {clashes.length === 1 ? L('par de rotações cai', 'pair of rotations falls') : L('pares de rotações caem', 'pairs of rotations fall')}{L(' a menos de ', ' less than ')}{r.settings.rotationWindowDays}{L(' dias um do outro, o que quebra a regra de um por vez. Isso acontece quando vários baldes têm o mesmo vencimento. Relacre um por vez ao rotacionar, ou aumente o intervalo.', ' days apart, which breaks the one-at-a-time rule. This happens when several buckets have the same due date. Reseal one at a time when rotating, or increase the interval.')}
          </p>
        </Card>
      )}

      <Card>
        <h2>{L('Calendário (36 meses)', 'Calendar (36 months)')}</h2>
        {events.length === 0 ? (
          <p class="small muted" style={{ marginBottom: 0 }}>{L('Sem rotações no período.', 'No rotations in the period.')}</p>
        ) : (
          <ul class="list">
            {events.map((e, i) => {
              const d = diffDays(today, e.date);
              return (
                <li key={`${e.n}-${e.date}-${i}`}>
                  <div class="row between">
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {tx(e.name)} <span class="faint xs">· {L('rotação ', 'rotation ')}{e.cycle}</span>
                      </div>
                      <div class="xs muted">
                        {fmtDate(e.date)} · {fmtMonthYear(e.date)}
                        {e.hypothetical ? L(' · se lacrar hoje', ' · if sealed today') : ''}
                      </div>
                    </div>
                    <div class="mono small" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div>{usd(costOf(e.n))}</div>
                      <div class="xs muted">{d < 0 ? L(`${Math.abs(d)} d atrás`, `${Math.abs(d)} d ago`) : L(`em ${n0(d)} d`, `in ${n0(d)} d`)}</div>
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
