import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField } from '../components/ui';
import { buildApply } from '../lib/apply';
import { saveSettings, runOps } from '../lib/db';
import { useReadiness, usePlan } from '../lib/derived';
import { n0, n1, plural } from '../lib/fmt';
import { gearProgress, gearTotals, grainBucketKcal, SHORT_GOAL_DAYS } from '../lib/planner';
import { newId } from '../lib/store';
import type { Settings } from '../lib/types';
import { MemberCard, addMember, type M } from './Family';

const DAY_PRESETS = [3, 7, 14, 30, 60, 90];
const BUFFER_PRESETS = [0, 10, 25, 50];

function Preset({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" class={`btn small ${on ? 'primary' : ''}`} onClick={onClick} aria-pressed={on}>
      {children}
    </button>
  );
}

function Row({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <li>
      <div class="row between" style={{ alignItems: 'flex-start' }}>
        <div class="grow">
          <div style={{ fontWeight: 600 }}>{k}</div>
          {sub && <div class="xs muted">{sub}</div>}
        </div>
        <div class="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
          {v}
        </div>
      </div>
    </li>
  );
}

export function Plan() {
  const r = useReadiness();
  const plan = usePlan();
  const s = r.settings;
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState('');
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setDone('');
    saveSettings({ [k]: v } as Partial<Settings>);
  };

  const f = plan.food;
  const totals = gearTotals(plan.gearLines);
  const prog = gearProgress(plan.gearLines);
  const grainDays = plan.kcalPerDay > 0 ? grainBucketKcal() / plan.kcalPerDay : 0;
  const state = { plan, buckets: r.buckets, pantry: r.pantry, shop: r.shop, sup: r.sup };
  // A prévia é refeita a cada tela, então nunca fica velha se o usuário mexer nos números com ela aberta.
  const preview = confirming ? buildApply({ ...state, makeId: (p) => `${p}-novo` }) : null;

  const apply = () => {
    const real = buildApply({ ...state, makeId: newId });
    runOps(real.ops);
    saveSettings({ planConfigured: true });
    setConfirming(false);
    setDone('Plano aplicado. Veja os baldes em Estoque, a lista em Compras e as caixas em Estoque, Caixas de 27 gal.');
  };

  return (
    <>
      <div class="topbar">
        <div>
          <h1>Plano</h1>
          <div class="sub">
            {plan.people} {plural(plan.people, 'pessoa', 'pessoas')} · {s.daysTarget} dias
          </div>
        </div>
      </div>

      {!s.planConfigured && (
        <Card>
          <div class="small">
            <b>Comece por aqui.</b> Diga quantas pessoas, quantos dias de autonomia e o perfil de cada uma. O app calcula a comida, os baldes, a água, o gás e as caixas de 27 galões, e mostra o que muda antes de você aplicar.
          </div>
          <div style={{ marginTop: 8 }}>
            <Btn small onClick={() => saveSettings({ planConfigured: true })}>
              Dispensar este aviso
            </Btn>
          </div>
        </Card>
      )}

      <h2>1. Pessoas e perfil</h2>
      <Card>
        <div class="small">
          Idade, sexo e atividade definem as calorias. Idade, sexo, remédio contínuo e óculos definem itens como fraldas, absorventes e remédios. Toque numa pessoa para editar.
        </div>
        <div class="xs muted" style={{ marginTop: 6 }}>
          Total: <b>{n0(plan.kcalPerDay)}</b> kcal por dia.
        </div>
      </Card>
      {r.members.map((m) => (
        <MemberCard key={m.id} m={m as M} canRemove={r.members.length > 1} />
      ))}
      <div style={{ marginBottom: 16 }}>
        <Btn onClick={() => addMember(r.members)}>Adicionar pessoa</Btn>
      </div>

      <h2>2. Meta</h2>
      <Card>
        <div class="stack">
          <div>
            <div class="small" style={{ marginBottom: 6 }}>
              Quantos dias você quer aguentar sem comprar nada?
            </div>
            <div class="row wrap">
              {DAY_PRESETS.map((d) => (
                <Preset key={d} on={s.daysTarget === d} onClick={() => set('daysTarget', d)}>
                  {`${d} dias`}
                </Preset>
              ))}
            </div>
          </div>
          <NumField label="Outra meta" suffix="dias" value={s.daysTarget} min={1} step={1} onChange={(v) => set('daysTarget', Math.max(1, Math.round(v ?? 30)))} />
          <div>
            <div class="small" style={{ marginBottom: 6 }}>
              Folga na comida (perda, apetite maior, visitas)
            </div>
            <div class="row wrap">
              {BUFFER_PRESETS.map((b) => (
                <Preset key={b} on={s.bufferPct === b} onClick={() => set('bufferPct', b)}>
                  {`${b}%`}
                </Preset>
              ))}
            </div>
          </div>
          <div class="xs muted">
            Altitude {n0(s.altitudeFt)} pés e {s.cookingMode === 'pressure' ? 'panela de pressão' : 'panela aberta'} (mude em <a href="#/ajustes">Ajustes</a>): afetam a água de cozimento e o gás.
          </div>
        </div>
      </Card>

      <details class="card">
        <summary>
          <b>Opções do plano</b>
        </summary>
        <div class="stack">
          <SelectField<Settings['bucketMode']>
            label="Comida em baldes de Mylar"
            value={s.bucketMode}
            options={[
              { value: 'auto', label: `Automático (só acima de ${SHORT_GOAL_DAYS} dias)` },
              { value: 'always', label: 'Sempre' },
            ]}
            onChange={(v) => set('bucketMode', v)}
          />
          <div class="xs muted">
            Mylar com absorvedor serve para guardar por anos. Para metas curtas, comida de mercado (lata, pasta de amendoim, biscoito) dura o suficiente e não exige cozinhar. Se escolher "Sempre", o app calcula baldes mesmo para 7 dias.
          </div>
          <NumField label="Peso máximo de cada caixa de 27 gal" suffix="kg" value={s.toteCapKg} min={5} step={1} onChange={(v) => set('toteCapKg', Math.max(5, v ?? 20))} />
          <div class="xs muted">Uma caixa cheia de papel higiênico é leve; uma com alvejante e pilhas pesa. O padrão de 20 kg é uma escolha do app para a caixa ser carregável.</div>
        </div>
      </details>

      <h2>3. O que o plano pede</h2>
      <Card>
        <ul class="list">
          <Row
            k="Comida"
            v={`${n0(f.needKcal / 1000)} mil kcal`}
            sub={`${plan.people} ${plural(plan.people, 'pessoa', 'pessoas')} × ${s.daysTarget} dias × ${n0(plan.kcalPerDay / Math.max(1, plan.people))} kcal, mais ${s.bufferPct}% de folga. O plano cobre ${n1(f.coverDays)} dias.`}
          />
          {f.strategy === 'buckets' ? (
            <>
              <Row k="Baldes de grãos" v={String(f.grainBuckets)} sub={`Arroz, feijão, macarrão e aveia em Mylar. Cada balde rende cerca de ${n1(grainDays)} dias para a família.`} />
              <Row
                k="Balde misto"
                v={String(f.mixedBuckets)}
                sub={f.mixedBuckets > 0 ? `Açúcar, leite em pó, sal e café${f.mixedScale < 0.95 ? `, a ${Math.round(f.mixedScale * 100)}% das quantidades do balde de exemplo` : ''}.` : 'Pouca comida para justificar um balde misto.'}
              />
              <Row k="Despensa (comida pronta)" v={`${n0(f.pantryKcal / 1000)} mil kcal`} sub="Lata, pasta de amendoim, carne seca, biscoito, barras e óleo. Sem cozinhar, para os primeiros dias." />
            </>
          ) : (
            <Row
              k="Despensa (comida pronta)"
              v={`${n0(f.pantryKcal / 1000)} mil kcal`}
              sub={`Meta de até ${SHORT_GOAL_DAYS} dias: comida de mercado que não exige cozinhar. Sem baldes de Mylar. Para usar baldes mesmo assim, veja Opções do plano.`}
            />
          )}
          <Row k="Água" v={`${n0(plan.waterGal)} gal`} sub={`Beber e cozinhar. Meta atual no Estoque: ${n0(r.sup.waterTargetGal)} gal.`} />
          <Row k="Gás" v={`${plan.cylinders} ${plural(plan.cylinders, 'botijão', 'botijões')}`} sub="Botijões de 20 lb, com 20% de folga. Meta atual: ver Estoque." />
          <Row
            k="Caixas de 27 gal"
            v={String(plan.totes.length)}
            sub={`${n0(totals.liters)} L e ${n0(totals.kg)} kg em ${totals.items} itens. ${plan.outside.length} ${plural(plan.outside.length, 'item grande fica', 'itens grandes ficam')} fora das caixas.`}
          />
        </ul>
        <div class="row wrap" style={{ marginTop: 8 }}>
          <a class="btn small" href="#/caixas">
            Ver as caixas ({prog.done} de {prog.total} itens completos)
          </a>
        </div>
      </Card>

      {plan.warnings.length > 0 && (
        <Card tone="warn">
          <h2>Atenção</h2>
          <ul class="list">
            {plan.warnings.map((w) => (
              <li key={w} class="small">
                {w}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2>4. Aplicar</h2>
      <Card>
        <div class="small">
          Aplicar ajusta os baldes planejados, a despensa, as metas de água e gás e a lista de compras da comida. <b>Não mexe</b> em baldes lacrados ou em rotação, no que você já tem na despensa, no que marcou como comprado nem nos itens que você adicionou. As caixas de 27 gal se atualizam sozinhas, sem precisar aplicar.
        </div>
        {done && <p class="okmsg" style={{ marginTop: 8, marginBottom: 0 }}>{done}</p>}
        {!confirming ? (
          <div style={{ marginTop: 10 }}>
            <Btn kind="primary" onClick={() => setConfirming(true)} disabled={plan.people === 0 || plan.kcalPerDay <= 0}>
              Ver o que muda
            </Btn>
          </div>
        ) : (
          preview && (
            <div style={{ marginTop: 10 }}>
              <div class="banner">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Isto vai mudar:</div>
                <ul class="list">
                  {preview.lines.map((l) => (
                    <li key={l} class="small">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
              <div class="row wrap">
                <Btn kind="primary" onClick={apply}>
                  Aplicar agora
                </Btn>
                <Btn onClick={() => setConfirming(false)}>Cancelar</Btn>
              </div>
            </div>
          )
        )}
        <div class="xs muted" style={{ marginTop: 10 }}>
          Mudou de ideia depois? Troque a meta e aplique de novo. Se a meta cair, baldes já lacrados ficam e a despensa pede menos.
        </div>
      </Card>

      <div class="xs muted" style={{ marginBottom: 16 }}>
        <Pill tone="info">Como o app calcula</Pill> <a href="#/guias/plano">Veja o que é fonte pública e o que é estimativa do app</a>.
      </div>
    </>
  );
}
