import { Account } from '../components/Account';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { saveMember, store, useBuckets, usePantry } from '../lib/db';
import { useReadiness } from '../lib/derived';
import { n0, plural } from '../lib/fmt';
import { ACTIVITY_HELP, ACTIVITY_LABEL, SPHERE_KCAL, memberRecommended, memberTarget, recommendationNote } from '../lib/nutrition';
import { newId } from '../lib/store';
import type { Activity, Member, Sex } from '../lib/types';
import { foodDays, stockKcal } from '../lib/calc';
import { L } from '../lib/i18n';

export type M = Member & { id: string };

export function MemberCard({ m, canRemove }: { m: M; canRemove: boolean }) {
  const rec = memberRecommended(m);
  const note = recommendationNote(m);
  const target = memberTarget(m);
  const usingRec = !(typeof m.kcalOverride === 'number' && m.kcalOverride > 0);
  return (
    <details class="card">
      <summary>
        <div class="row between">
          <div>
            <b>{m.name || L('Sem nome', 'No name')}</b>
            <div class="xs muted">
              {m.sex ? (m.sex === 'F' ? L('Mulher', 'Woman') : L('Homem', 'Man')) : L('Sexo não informado', 'Sex not given')}
              {m.age !== undefined ? L(` · ${m.age} anos`, ` · ${m.age} years old`) : ''} · {ACTIVITY_LABEL[m.activity]}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div class="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{n0(target)}</div>
            <div class="xs muted">{L('kcal/dia', 'kcal/day')}</div>
          </div>
        </div>
      </summary>

      <div class="stack">
        <TextField label={L('Nome', 'Name')} value={m.name} onChange={(v) => saveMember(m.id, { name: v })} />
        <div class="grid2">
          <SelectField<'' | Sex>
            label={L('Sexo', 'Sex')}
            value={m.sex ?? ''}
            options={[{ value: '', label: L('Não informar', 'Prefer not to say') }, { value: 'F', label: L('Mulher', 'Woman') }, { value: 'M', label: L('Homem', 'Man') }]}
            onChange={(v) => saveMember(m.id, { sex: v === '' ? undefined : v })}
          />
          <NumField label={L('Idade', 'Age')} suffix={L('anos', 'years')} value={m.age} min={0} step={1} onChange={(v) => saveMember(m.id, { age: v })} />
        </div>
        <SelectField<Activity>
          label={L('Atividade física', 'Physical activity')}
          value={m.activity}
          options={(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => ({ value: a, label: ACTIVITY_LABEL[a] }))}
          onChange={(v) => saveMember(m.id, { activity: v })}
        />
        <div class="xs muted">{ACTIVITY_HELP[m.activity]}</div>
        <label class="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={!!m.pregnantOrNursing} onChange={(e) => saveMember(m.id, { pregnantOrNursing: (e.currentTarget as HTMLInputElement).checked })} />
          <span class="small">{L('Gestante ou lactante', 'Pregnant or nursing')}</span>
        </label>
        <label class="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={!!m.takesMeds} onChange={(e) => saveMember(m.id, { takesMeds: (e.currentTarget as HTMLInputElement).checked })} />
          <span class="small">{L('Usa remédio de uso contínuo', 'Takes ongoing medication')}</span>
        </label>
        <label class="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={!!m.glasses} onChange={(e) => saveMember(m.id, { glasses: (e.currentTarget as HTMLInputElement).checked })} />
          <span class="small">{L('Usa óculos ou lentes', 'Wears glasses or contacts')}</span>
        </label>
        <div class="xs muted">{L('Idade, sexo e estes dois itens definem o que o plano pede nas caixas (remédios, óculos, fraldas, absorventes).', 'Age, sex and these two items decide what the plan asks for in the totes (medication, glasses, diapers, pads).')}</div>

        <div class="banner">
          <div class="row between">
            <div>
              <div class="xs muted">{L('Recomendação (Dietary Guidelines)', 'Recommendation (Dietary Guidelines)')}</div>
              <div class="mono" style={{ fontWeight: 700 }}>{rec !== null ? `${n0(rec)} kcal/dia` : '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div class="xs muted">{L('Referência de emergência (Sphere)', 'Emergency reference (Sphere)')}</div>
              <div class="mono" style={{ fontWeight: 700 }}>{n0(SPHERE_KCAL)} kcal/dia</div>
            </div>
          </div>
          {note && <div class="xs" style={{ marginTop: 6, color: 'var(--warn)' }}>{note}</div>}
        </div>

        <NumField
          label={L('Meta usada nas contas', 'Goal used in the calculations')}
          suffix={L('kcal/dia', 'kcal/day')}
          value={usingRec ? (rec ?? undefined) : m.kcalOverride ?? undefined}
          min={0}
          step={50}
          placeholder={L('Defina a meta', 'Set the goal')}
          onChange={(v) => saveMember(m.id, { kcalOverride: v && v > 0 ? v : null })}
        />
        <div class="row wrap">
          <Pill tone={usingRec ? 'ok' : 'info'}>{usingRec ? L('Usando a recomendação', 'Using the recommendation') : L('Meta definida por você', 'Goal set by you')}</Pill>
          {!usingRec && rec !== null && (
            <Btn small onClick={() => saveMember(m.id, { kcalOverride: null })}>
              {L('Usar a recomendação', 'Use the recommendation')}
            </Btn>
          )}
          {!usingRec && (
            <Btn small onClick={() => saveMember(m.id, { kcalOverride: SPHERE_KCAL })}>
              {L('Usar ', 'Use ')}{n0(SPHERE_KCAL)}
            </Btn>
          )}
        </div>
        {canRemove && (
          <div>
            <Btn small kind="danger" onClick={() => store.remove(m.id)}>
              {L('Remover pessoa', 'Remove person')}
            </Btn>
          </div>
        )}
      </div>
    </details>
  );
}

export function addMember(existing: Member[]): void {
  const order = existing.reduce((mx, m) => Math.max(mx, m.order), 0) + 1;
  store.put('member', newId('member'), { name: L(`Pessoa ${order}`, `Person ${order}`), activity: 'moderate', kcalOverride: SPHERE_KCAL, order } satisfies Member);
}

export function Family() {
  const r = useReadiness();
  const buckets = useBuckets();
  const pantry = usePantry();
  const plannedDays = foodDays(stockKcal(buckets, pantry).plannedKcal, r.kcalPerDay);

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L('Família', 'Family')}</h1>
          <div class="sub">
            {r.members.length} {plural(r.members.length, L('pessoa', 'person'), L('pessoas', 'people'))} · {n0(r.kcalPerDay)}{L(' kcal por dia', ' kcal per day')}
          </div>
        </div>
      </div>

      <Card>
        <div class="small">
          {L('Cada pessoa tem uma meta de calorias. O app mostra a ', 'Each person has a calorie goal. The app shows the ')}<b>{L('recomendação', 'recommendation')}</b>{L(' por idade, sexo e atividade (Dietary Guidelines for Americans) e a referência de emergência de ', ' by age, sex and activity (Dietary Guidelines for Americans) and the emergency reference of ')}{n0(SPHERE_KCAL)}{L(' kcal (padrão Sphere). Você escolhe o número que vale: ele define quantos dias o estoque dura.', ' kcal (Sphere standard). You choose the number that counts: it decides how many days the stock lasts.')}
        </div>
        <div class="xs muted" style={{ marginTop: 8 }}>
          {L('Com as metas atuais, o plano completo dura cerca de ', 'With the current goals, the full plan lasts about ')}<b>{n0(plannedDays)}</b>{L(' dias. Mudar uma meta muda o painel na hora.', ' days. Changing a goal updates the dashboard right away.')}
        </div>
      </Card>

      {r.members.map((m) => (
        <MemberCard key={m.id} m={m as M} canRemove={r.members.length > 1} />
      ))}
      <div style={{ marginBottom: 16 }}>
        <Btn onClick={() => addMember(r.members)}>{L('Adicionar pessoa', 'Add person')}</Btn>
      </div>

      <Account />
    </>
  );
}
