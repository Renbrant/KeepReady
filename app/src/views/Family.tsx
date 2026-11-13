import { Account } from '../components/Account';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { saveMember, store, useBuckets, usePantry } from '../lib/db';
import { useReadiness } from '../lib/derived';
import { n0, plural } from '../lib/fmt';
import { ACTIVITY_HELP, ACTIVITY_LABEL, SPHERE_KCAL, memberRecommended, memberTarget, recommendationNote } from '../lib/nutrition';
import { newId } from '../lib/store';
import type { Activity, Member, Sex } from '../lib/types';
import { foodDays, stockKcal } from '../lib/calc';

type M = Member & { id: string };

function MemberCard({ m, canRemove }: { m: M; canRemove: boolean }) {
  const rec = memberRecommended(m);
  const note = recommendationNote(m);
  const target = memberTarget(m);
  const usingRec = !(typeof m.kcalOverride === 'number' && m.kcalOverride > 0);
  return (
    <details class="card">
      <summary>
        <div class="row between">
          <div>
            <b>{m.name || 'Sem nome'}</b>
            <div class="xs muted">
              {m.sex ? (m.sex === 'F' ? 'Mulher' : 'Homem') : 'Sexo não informado'}
              {m.age !== undefined ? ` · ${m.age} anos` : ''} · {ACTIVITY_LABEL[m.activity]}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div class="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{n0(target)}</div>
            <div class="xs muted">kcal/dia</div>
          </div>
        </div>
      </summary>

      <div class="stack">
        <TextField label="Nome" value={m.name} onChange={(v) => saveMember(m.id, { name: v })} />
        <div class="grid2">
          <SelectField<'' | Sex>
            label="Sexo"
            value={m.sex ?? ''}
            options={[{ value: '', label: 'Não informar' }, { value: 'F', label: 'Mulher' }, { value: 'M', label: 'Homem' }]}
            onChange={(v) => saveMember(m.id, { sex: v === '' ? undefined : v })}
          />
          <NumField label="Idade" suffix="anos" value={m.age} min={0} step={1} onChange={(v) => saveMember(m.id, { age: v })} />
        </div>
        <SelectField<Activity>
          label="Atividade física"
          value={m.activity}
          options={(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => ({ value: a, label: ACTIVITY_LABEL[a] }))}
          onChange={(v) => saveMember(m.id, { activity: v })}
        />
        <div class="xs muted">{ACTIVITY_HELP[m.activity]}</div>
        <label class="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={!!m.pregnantOrNursing} onChange={(e) => saveMember(m.id, { pregnantOrNursing: (e.currentTarget as HTMLInputElement).checked })} />
          <span class="small">Gestante ou lactante</span>
        </label>

        <div class="banner">
          <div class="row between">
            <div>
              <div class="xs muted">Recomendação (Dietary Guidelines)</div>
              <div class="mono" style={{ fontWeight: 700 }}>{rec !== null ? `${n0(rec)} kcal/dia` : '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div class="xs muted">Referência de emergência (Sphere)</div>
              <div class="mono" style={{ fontWeight: 700 }}>{n0(SPHERE_KCAL)} kcal/dia</div>
            </div>
          </div>
          {note && <div class="xs" style={{ marginTop: 6, color: 'var(--warn)' }}>{note}</div>}
        </div>

        <NumField
          label="Meta usada nas contas"
          suffix="kcal/dia"
          value={usingRec ? (rec ?? undefined) : m.kcalOverride ?? undefined}
          min={0}
          step={50}
          placeholder="Defina a meta"
          onChange={(v) => saveMember(m.id, { kcalOverride: v && v > 0 ? v : null })}
        />
        <div class="row wrap">
          <Pill tone={usingRec ? 'ok' : 'info'}>{usingRec ? 'Usando a recomendação' : 'Meta definida por você'}</Pill>
          {!usingRec && rec !== null && (
            <Btn small onClick={() => saveMember(m.id, { kcalOverride: null })}>
              Usar a recomendação
            </Btn>
          )}
          {!usingRec && (
            <Btn small onClick={() => saveMember(m.id, { kcalOverride: SPHERE_KCAL })}>
              Usar {n0(SPHERE_KCAL)}
            </Btn>
          )}
        </div>
        {canRemove && (
          <div>
            <Btn small kind="danger" onClick={() => store.remove(m.id)}>
              Remover pessoa
            </Btn>
          </div>
        )}
      </div>
    </details>
  );
}

export function Family() {
  const r = useReadiness();
  const buckets = useBuckets();
  const pantry = usePantry();
  const plannedDays = foodDays(stockKcal(buckets, pantry).plannedKcal, r.kcalPerDay);

  const addMember = () => {
    const order = r.members.reduce((mx, m) => Math.max(mx, m.order), 0) + 1;
    store.put('member', newId('member'), { name: `Pessoa ${order}`, activity: 'moderate', kcalOverride: SPHERE_KCAL, order } satisfies Member);
  };

  return (
    <>
      <div class="topbar">
        <div>
          <h1>Família</h1>
          <div class="sub">
            {r.members.length} {plural(r.members.length, 'pessoa', 'pessoas')} · {n0(r.kcalPerDay)} kcal por dia
          </div>
        </div>
      </div>

      <Card>
        <div class="small">
          Cada pessoa tem uma meta de calorias. O app mostra a <b>recomendação</b> por idade, sexo e atividade (Dietary Guidelines for Americans) e a referência de emergência de {n0(SPHERE_KCAL)} kcal (padrão Sphere). Você escolhe o número que vale: ele define quantos dias o estoque dura.
        </div>
        <div class="xs muted" style={{ marginTop: 8 }}>
          Com as metas atuais, o plano completo dura cerca de <b>{n0(plannedDays)}</b> dias. Mudar uma meta muda o painel na hora.
        </div>
      </Card>

      {r.members.map((m) => (
        <MemberCard key={m.id} m={m as M} canRemove={r.members.length > 1} />
      ))}
      <div style={{ marginBottom: 16 }}>
        <Btn onClick={addMember}>Adicionar pessoa</Btn>
      </div>

      <Account />
    </>
  );
}
