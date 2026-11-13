import { Btn } from '../components/ui';
import { bucketKcal, bucketKg, nextDue, rotationRows } from '../lib/calc';
import { fmtDate, todayISO } from '../lib/dates';
import { useReadiness } from '../lib/derived';
import { daysFmt, n0, n1, usd } from '../lib/fmt';
import { memberTarget } from '../lib/nutrition';

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
          <h1>Resumo para imprimir</h1>
          <div class="sub">Folha de papel com o estado atual</div>
        </div>
        <Btn kind="primary" onClick={() => window.print()}>
          Imprimir
        </Btn>
      </div>

      <h2>
        {r.settings.householdName} · {fmtDate(today)}
      </h2>
      <p class="small">
        Autonomia: <b>{daysFmt(r.a.min)} dias</b> (comida {daysFmt(r.a.food)}, água {daysFmt(r.a.water)}, gás {daysFmt(r.a.gas)}) para uma meta de {r.settings.daysTarget} dias. Altitude {n0(r.settings.altitudeFt)} pés.
      </p>

      <h3>Pessoas e calorias por dia</h3>
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
              <b>Total</b>
            </td>
            <td class="num">
              <b>{n0(r.kcalPerDay)} kcal</b>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ marginTop: 14 }}>Baldes</h3>
      <table class="t">
        <thead>
          <tr>
            <th>Balde</th>
            <th>Conteúdo</th>
            <th class="num">kg</th>
            <th class="num">kcal</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          {r.buckets.map((b) => {
            const row = rows.find((x) => x.bucket.n === b.n);
            return (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.items.map((i) => i.name).join(', ')}</td>
                <td class="num">{n1(bucketKg(b))}</td>
                <td class="num">{n0(bucketKcal(b))}</td>
                <td>
                  {b.status === 'planned' ? 'Planejado' : b.status === 'rotating' ? 'Em rotação' : `Lacrado ${fmtDate(b.sealedOn)}, rotação ${fmtDate(row?.dueOn ?? b.dueOn)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {next && (
        <p class="small" style={{ marginTop: 8 }}>
          Próxima rotação: <b>{next.bucket.name}</b> em {fmtDate(next.dueOn)}.
        </p>
      )}

      <h3 style={{ marginTop: 14 }}>Água e gás</h3>
      <p class="small">
        Água: {n0(r.sup.waterGal)} de {n0(r.sup.waterTargetGal)} gal (precisa de cerca de {n0(r.waterNeedGal)} gal). Botijões de 20 lb: {r.sup.propaneFull} de {r.sup.propaneTarget} (precisa de cerca de {r.cylindersNeed}).
      </p>

      <h3 style={{ marginTop: 14 }}>Despensa</h3>
      <table class="t">
        <tbody>
          {r.pantry.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td class="num">
                {n1(p.haveQty)} de {n1(p.planQty)} {p.unit}
              </td>
              <td>{p.expiresOn ? `validade ${fmtDate(p.expiresOn)}` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 14 }}>Falta comprar ({open.length})</h3>
      <table class="t">
        <tbody>
          {open.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td class="num">
                {i.qty} {i.unit}
              </td>
              <td class="num">{i.unitPrice !== undefined ? usd(i.unitPrice * i.qty) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p class="xs faint" style={{ marginTop: 12 }}>Gerado pelo KeepReady. Preços e tempos de cozimento são estimativas.</p>
    </>
  );
}
