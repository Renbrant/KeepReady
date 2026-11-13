import { Btn } from '../components/ui';
import { bucketKcal, bucketKg, nextDue, rotationRows } from '../lib/calc';
import { fmtDate, todayISO } from '../lib/dates';
import { useReadiness } from '../lib/derived';
import { daysFmt, n0, n1, usd } from '../lib/fmt';
import { memberTarget } from '../lib/nutrition';
import { L, tx } from '../lib/i18n';

/** Folha para imprimir e guardar com o estoque, para o caso de o celular não ligar. */
export function Print() {
  const r = useReadiness();
  const today = todayISO();
  const rows = rotationRows(r.buckets, today);
  const next = nextDue(rows);
  const open = r.shop.filter((i) => !i.checked);

  return (
    <>
      <div class="topbar noprint">
        <div>
          <h1>{L('Resumo para imprimir', 'Printable summary')}</h1>
          <div class="sub">{L('Folha de papel com o estado atual', 'A sheet of paper with the current status')}</div>
        </div>
        <Btn kind="primary" onClick={() => window.print()}>
          {L('Imprimir', 'Print')}
        </Btn>
      </div>

      <h2>
        {r.settings.householdName} · {fmtDate(today)}
      </h2>
      <p class="small">
        {L('Autonomia: ', 'Autonomy: ')}<b>{daysFmt(r.a.min)}{L(' dias', ' days')}</b>{L(' (comida ', ' (food ')}{daysFmt(r.a.food)}{L(', água ', ', water ')}{daysFmt(r.a.water)}{L(', gás ', ', gas ')}{daysFmt(r.a.gas)}{L(') para uma meta de ', ') for a goal of ')}{r.settings.daysTarget}{L(' dias. Altitude ', ' days. Altitude ')}{n0(r.settings.altitudeFt)}{L(' pés.', ' ft.')}
      </p>

      <h3>{L('Pessoas e calorias por dia', 'People and calories per day')}</h3>
      <table class="t">
        <tbody>
          {r.members.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td class="num">{n0(memberTarget(m))} kcal</td>
            </tr>
          ))}
          <tr>
            <td>
              <b>{L('Total', 'Total')}</b>
            </td>
            <td class="num">
              <b>{n0(r.kcalPerDay)} kcal</b>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ marginTop: 14 }}>{L('Baldes', 'Buckets')}</h3>
      <table class="t">
        <thead>
          <tr>
            <th>{L('Balde', 'Bucket')}</th>
            <th>{L('Conteúdo', 'Contents')}</th>
            <th class="num">kg</th>
            <th class="num">kcal</th>
            <th>{L('Situação', 'Status')}</th>
          </tr>
        </thead>
        <tbody>
          {r.buckets.map((b) => {
            const row = rows.find((x) => x.bucket.n === b.n);
            return (
              <tr key={b.id}>
                <td>{tx(b.name)}</td>
                <td>{b.items.map((i) => tx(i.name)).join(', ')}</td>
                <td class="num">{n1(bucketKg(b))}</td>
                <td class="num">{n0(bucketKcal(b))}</td>
                <td>
                  {b.status === 'planned' ? L('Planejado', 'Planned') : b.status === 'rotating' ? L('Em rotação', 'In rotation') : L(`Lacrado ${fmtDate(b.sealedOn)}, rotação ${fmtDate(row?.dueOn ?? b.dueOn)}`, `Sealed ${fmtDate(b.sealedOn)}, rotation ${fmtDate(row?.dueOn ?? b.dueOn)}`)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {next && (
        <p class="small" style={{ marginTop: 8 }}>
          {L('Próxima rotação: ', 'Next rotation: ')}<b>{tx(next.bucket.name)}</b>{L(' em ', ' on ')}{fmtDate(next.dueOn)}.
        </p>
      )}

      <h3 style={{ marginTop: 14 }}>{L('Água e gás', 'Water and gas')}</h3>
      <p class="small">
        {L('Água: ', 'Water: ')}{n0(r.sup.waterGal)}{L(' de ', ' of ')}{n0(r.sup.waterTargetGal)}{L(' gal (precisa de cerca de ', ' gal (needs about ')}{n0(r.waterNeedGal)}{L(' gal). Botijões de 20 lb: ', ' gal). 20 lb cylinders: ')}{r.sup.propaneFull}{L(' de ', ' of ')}{r.sup.propaneTarget}{L(' (precisa de cerca de ', ' (needs about ')}{r.cylindersNeed}).
      </p>

      <h3 style={{ marginTop: 14 }}>{L('Despensa', 'Pantry')}</h3>
      <table class="t">
        <tbody>
          {r.pantry.map((p) => (
            <tr key={p.id}>
              <td>{tx(p.name)}</td>
              <td class="num">
                {n1(p.haveQty)}{L(' de ', ' of ')}{n1(p.planQty)} {tx(p.unit)}
              </td>
              <td>{p.expiresOn ? L(`validade ${fmtDate(p.expiresOn)}`, `expires ${fmtDate(p.expiresOn)}`) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 14 }}>{L('Falta comprar (', 'Still to buy (')}{open.length})</h3>
      <table class="t">
        <tbody>
          {open.map((i) => (
            <tr key={i.id}>
              <td>{tx(i.name)}</td>
              <td class="num">
                {i.qty} {tx(i.unit)}
              </td>
              <td class="num">{i.unitPrice !== undefined ? usd(i.unitPrice * i.qty) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p class="xs faint" style={{ marginTop: 12 }}>{L('Gerado pelo KeepReady. Preços e tempos de cozimento são estimativas.', 'Generated by KeepReady. Prices and cooking times are estimates.')}</p>
    </>
  );
}
