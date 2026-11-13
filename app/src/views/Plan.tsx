import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField } from '../components/ui';
import { buildApply } from '../lib/apply';
import { saveSettings, runOps } from '../lib/db';
import { useReadiness, usePlan } from '../lib/derived';
import { n0, n1, plural } from '../lib/fmt';
import { foodRations, gearProgress, gearTotals, grainBucketKcal, SHORT_GOAL_DAYS } from '../lib/planner';
import { newId } from '../lib/store';
import type { Settings } from '../lib/types';
import { L, tx } from '../lib/i18n';
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
  const rations = foodRations(f, plan.people);
  const grainDays = plan.kcalPerDay > 0 ? grainBucketKcal() / plan.kcalPerDay : 0;
  const state = { plan, buckets: r.buckets, pantry: r.pantry, shop: r.shop, sup: r.sup, addVariety: !s.varietyAdded };
  // A prévia é refeita a cada tela, então nunca fica velha se o usuário mexer nos números com ela aberta.
  const preview = confirming ? buildApply({ ...state, makeId: (p) => `${p}-novo` }) : null;

  const apply = () => {
    const real = buildApply({ ...state, makeId: newId });
    runOps(real.ops);
    saveSettings({ planConfigured: true, varietyAdded: true });
    setConfirming(false);
    setDone(L('Plano aplicado. Veja os baldes em Estoque, a lista em Compras e as caixas em Estoque, Caixas de 27 gal.', 'Plan applied. See the buckets under Stock, the list under Shopping and the totes under Stock, 27-gal totes.'));
  };

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L('Plano', 'Plan')}</h1>
          <div class="sub">
            {plan.people} {plural(plan.people, L('pessoa', 'person'), L('pessoas', 'people'))} · {s.daysTarget} {L('dias', 'days')}
          </div>
        </div>
      </div>

      {!s.planConfigured && (
        <Card>
          <div class="small">
            <b>{L('Comece por aqui.', 'Start here.')}</b> {L('Diga quantas pessoas, quantos dias de autonomia e o perfil de cada uma. O app calcula a comida, os baldes, a água, o gás e as caixas de 27 galões, e mostra o que muda antes de você aplicar.', 'Tell the app how many people, how many days of self-reliance and each one’s profile. It calculates the food, buckets, water, gas and 27-gallon totes, and shows what changes before you apply.')}
          </div>
          <div style={{ marginTop: 8 }}>
            <Btn small onClick={() => saveSettings({ planConfigured: true })}>
              {L('Dispensar este aviso', 'Dismiss this notice')}
            </Btn>
          </div>
        </Card>
      )}

      <h2>{L('1. Pessoas e perfil', '1. People and profile')}</h2>
      <Card>
        <div class="small">
          {L('Idade, sexo e atividade definem as calorias. Idade, sexo, remédio contínuo e óculos definem itens como fraldas, absorventes e remédios. Toque numa pessoa para editar.', 'Age, sex and activity decide the calories. Age, sex, ongoing medication and glasses decide items such as diapers, pads and medication. Tap a person to edit.')}
        </div>
        <div class="xs muted" style={{ marginTop: 6 }}>
          {L('Total: ', 'Total: ')}<b>{n0(plan.kcalPerDay)}</b>{L(' kcal por dia.', ' kcal per day.')}
        </div>
      </Card>
      {r.members.map((m) => (
        <MemberCard key={m.id} m={m as M} canRemove={r.members.length > 1} />
      ))}
      <div style={{ marginBottom: 16 }}>
        <Btn onClick={() => addMember(r.members)}>{L('Adicionar pessoa', 'Add person')}</Btn>
      </div>

      <h2>{L('2. Meta', '2. Goal')}</h2>
      <Card>
        <div class="stack">
          <div>
            <div class="small" style={{ marginBottom: 6 }}>
              {L('Quantos dias você quer aguentar sem comprar nada?', 'How many days do you want to last without buying anything?')}
            </div>
            <div class="row wrap">
              {DAY_PRESETS.map((d) => (
                <Preset key={d} on={s.daysTarget === d} onClick={() => set('daysTarget', d)}>
                  {`${d} ${L('dias', 'days')}`}
                </Preset>
              ))}
            </div>
          </div>
          <NumField label={L('Outra meta', 'Other goal')} suffix={L('dias', 'days')} value={s.daysTarget} min={1} step={1} onChange={(v) => set('daysTarget', Math.max(1, Math.round(v ?? 30)))} />
          <div>
            <div class="small" style={{ marginBottom: 6 }}>
              {L('Folga na comida (perda, apetite maior, visitas)', 'Food buffer (spoilage, bigger appetite, guests)')}
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
            {L('Altitude ', 'Altitude ')}{n0(s.altitudeFt)}{L(' pés e ', ' ft and ')}{s.cookingMode === 'pressure' ? L('panela de pressão', 'pressure cooker') : L('panela aberta', 'open pot')}{L(' (mude em ', ' (change in ')}<a href="#/ajustes">{L('Ajustes', 'Settings')}</a>{L('): afetam a água de cozimento e o gás.', '): they affect cooking water and gas.')}
          </div>
        </div>
      </Card>

      <details class="card">
        <summary>
          <b>{L('Opções do plano', 'Plan options')}</b>
        </summary>
        <div class="stack">
          <SelectField<Settings['bucketMode']>
            label={L('Comida em baldes de Mylar', 'Food in Mylar buckets')}
            value={s.bucketMode}
            options={[
              { value: 'auto', label: L(`Automático (só acima de ${SHORT_GOAL_DAYS} dias)`, `Automatic (only above ${SHORT_GOAL_DAYS} days)`) },
              { value: 'always', label: L('Sempre', 'Always') },
            ]}
            onChange={(v) => set('bucketMode', v)}
          />
          <div class="xs muted">
            {L('Mylar com absorvedor serve para guardar por anos. Para metas curtas, comida de mercado (lata, pasta de amendoim, biscoito) dura o suficiente e não exige cozinhar. Se escolher "Sempre", o app calcula baldes mesmo para 7 dias.', 'Mylar with an absorber keeps food for years. For short goals, store-bought food (cans, peanut butter, crackers) lasts long enough and needs no cooking. If you choose "Always", the app calculates buckets even for 7 days.')}
          </div>
          <NumField label={L('Peso máximo de cada caixa de 27 gal', 'Maximum weight of each 27-gal tote')} suffix="kg" value={s.toteCapKg} min={5} step={1} onChange={(v) => set('toteCapKg', Math.max(5, v ?? 20))} />
          <div class="xs muted">{L('Uma caixa cheia de papel higiênico é leve; uma com alvejante e pilhas pesa. O padrão de 20 kg é uma escolha do app para a caixa ser carregável.', 'A tote full of toilet paper is light; one with bleach and batteries is heavy. The 20 kg default is an app choice so the tote stays carryable.')}</div>
        </div>
      </details>

      <h2>{L('3. O que o plano pede', '3. What the plan asks for')}</h2>
      <Card>
        <ul class="list">
          <Row
            k={L('Comida', 'Food')}
            v={L(`${n0(f.needKcal / 1000)} mil kcal`, `${n0(f.needKcal / 1000)}k kcal`)}
            sub={L(`${plan.people} ${plural(plan.people, 'pessoa', 'pessoas')} × ${s.daysTarget} dias × ${n0(plan.kcalPerDay / Math.max(1, plan.people))} kcal, mais ${s.bufferPct}% de folga. O plano cobre ${n1(f.coverDays)} dias.`, `${plan.people} ${plural(plan.people, 'person', 'people')} × ${s.daysTarget} days × ${n0(plan.kcalPerDay / Math.max(1, plan.people))} kcal, plus ${s.bufferPct}% buffer. The plan covers ${n1(f.coverDays)} days.`)}
          />
          {f.strategy === 'buckets' ? (
            <>
              <Row k={L('Baldes de grãos', 'Grain buckets')} v={String(f.grainBuckets)} sub={L(`Arroz, feijão, macarrão e aveia em Mylar. Cada balde rende cerca de ${n1(grainDays)} dias para a família.`, `Rice, beans, pasta and oats in Mylar. Each bucket lasts about ${n1(grainDays)} days for the family.`)} />
              <Row
                k={L('Balde misto', 'Mixed bucket')}
                v={String(f.mixedBuckets)}
                sub={f.mixedBuckets > 0 ? L(`Açúcar, leite em pó, sal e café${f.mixedScale < 0.95 ? `, a ${Math.round(f.mixedScale * 100)}% das quantidades do balde de exemplo` : ''}.`, `Sugar, powdered milk, salt and coffee${f.mixedScale < 0.95 ? `, at ${Math.round(f.mixedScale * 100)}% of the sample bucket quantities` : ''}.`) : L('Pouca comida para justificar um balde misto.', 'Too little food to justify a mixed bucket.')}
              />
              <Row k={L('Despensa (comida pronta)', 'Pantry (ready-to-eat food)')} v={L(`${n0(f.pantryKcal / 1000)} mil kcal`, `${n0(f.pantryKcal / 1000)}k kcal`)} sub={L('Lata, pasta de amendoim, carne seca, biscoito, barras e óleo. Sem cozinhar, para os primeiros dias.', 'Cans, peanut butter, jerky, crackers, bars and oil. No cooking, for the first days.')} />
            </>
          ) : (
            <Row
              k={L('Despensa (comida pronta)', 'Pantry (ready-to-eat food)')}
              v={L(`${n0(f.pantryKcal / 1000)} mil kcal`, `${n0(f.pantryKcal / 1000)}k kcal`)}
              sub={L(`Meta de até ${SHORT_GOAL_DAYS} dias: comida de mercado que não exige cozinhar. Sem baldes de Mylar. Para usar baldes mesmo assim, veja Opções do plano.`, `Goal of up to ${SHORT_GOAL_DAYS} days: store-bought food that needs no cooking. No Mylar buckets. To use buckets anyway, see Plan options.`)}
            />
          )}
          <Row k={L('Água', 'Water')} v={`${n0(plan.waterGal)} gal`} sub={L(`Beber e cozinhar. Meta atual no Estoque: ${n0(r.sup.waterTargetGal)} gal.`, `Drinking and cooking. Current goal in Stock: ${n0(r.sup.waterTargetGal)} gal.`)} />
          <Row k={L('Gás', 'Gas')} v={`${plan.cylinders} ${plural(plan.cylinders, L('botijão', 'cylinder'), L('botijões', 'cylinders'))}`} sub={L('Botijões de 20 lb, com 20% de folga. Meta atual: ver Estoque.', '20 lb cylinders, with a 20% buffer. Current goal: see Stock.')} />
          <Row
            k={L('Caixas de 27 gal', '27-gal totes')}
            v={String(plan.totes.length)}
            sub={L(`${n0(totals.liters)} L e ${n0(totals.kg)} kg em ${totals.items} itens. ${plan.outside.length} ${plural(plan.outside.length, 'item grande fica', 'itens grandes ficam')} fora das caixas.`, `${n0(totals.liters)} L and ${n0(totals.kg)} kg in ${totals.items} items. ${plan.outside.length} large ${plural(plan.outside.length, 'item stays', 'items stay')} outside the totes.`)}
          />
        </ul>
        <div class="row wrap" style={{ marginTop: 8 }}>
          <a class="btn small" href="#/caixas">
            {L(`Ver as caixas (${prog.done} de ${prog.total} itens completos)`, `See the totes (${prog.done} of ${prog.total} items complete)`)}
          </a>
        </div>
      </Card>

      {rations.rows.length > 0 && (
        <Card>
          <h2>{L('Na prática, por pessoa', 'In practice, per person')}</h2>
          <div class="xs muted" style={{ marginBottom: 6 }}>
            {L('Quantidade média de cada alimento, se a comida for esticada até o fim do plano. Veja se faz sentido para vocês: se alguém come mais ou menos, ajuste as calorias dessa pessoa em Família e tudo se recalcula.', 'Average amount of each food if the food is stretched to the end of the plan. See if it makes sense for you: if someone eats more or less, adjust that person’s calories under Family and everything recalculates.')}
          </div>
          <ul class="list">
            {rations.rows.map((x) => (
              <li key={x.name}>
                <div class="row between">
                  <div class="grow small">{tx(x.name)}</div>
                  <div class="mono small" style={{ textAlign: 'right' }}>
                    {x.unit === 'por semana' ? L(`${n1(x.amount)} ${x.countUnit} por semana`, `${n1(x.amount)} ${tx(x.countUnit ?? '')} per week`) : L(`${n0(x.amount)} ${x.unit} por dia`, `${n0(x.amount)} ${tx(x.unit)} per day`)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div class="xs muted" style={{ marginTop: 8 }}>
            {L('Soma: cerca de ', 'Total: about ')}<b>{n0(rations.kcalPerPerson)}</b>{L(' kcal por pessoa por dia (média da casa: ', ' kcal per person per day (household average: ')}{n0(plan.kcalPerDay / Math.max(1, plan.people))}{L(', mais a folga). Sal, café e temperos não contam calorias.', ', plus the buffer). Salt, coffee and spices do not count calories.')}
          </div>
        </Card>
      )}

      {plan.warnings.length > 0 && (
        <Card tone="warn">
          <h2>{L('Atenção', 'Attention')}</h2>
          <ul class="list">
            {plan.warnings.map((w) => (
              <li key={w} class="small">
                {w}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2>{L('4. Aplicar', '4. Apply')}</h2>
      <Card>
        <div class="small">
          {L('Aplicar ajusta os baldes planejados, a despensa, as metas de água e gás e a lista de compras da comida. ', 'Applying adjusts the planned buckets, the pantry, the water and gas goals and the food shopping list. ')}<b>{L('Não mexe', 'It does not touch')}</b>{L(' em baldes lacrados ou em rotação, no que você já tem na despensa, no que marcou como comprado nem nos itens que você adicionou. As caixas de 27 gal se atualizam sozinhas, sem precisar aplicar.', ' sealed or rotating buckets, what you already have in the pantry, what you marked as bought or the items you added. The 27-gal totes update on their own, no need to apply.')}
        </div>
        {done && <p class="okmsg" style={{ marginTop: 8, marginBottom: 0 }}>{done}</p>}
        {!confirming ? (
          <div style={{ marginTop: 10 }}>
            <Btn kind="primary" onClick={() => setConfirming(true)} disabled={plan.people === 0 || plan.kcalPerDay <= 0}>
              {L('Ver o que muda', 'See what changes')}
            </Btn>
          </div>
        ) : (
          preview && (
            <div style={{ marginTop: 10 }}>
              <div class="banner">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{L('Isto vai mudar:', 'This will change:')}</div>
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
                  {L('Aplicar agora', 'Apply now')}
                </Btn>
                <Btn onClick={() => setConfirming(false)}>{L('Cancelar', 'Cancel')}</Btn>
              </div>
            </div>
          )
        )}
        <div class="xs muted" style={{ marginTop: 10 }}>
          {L('Mudou de ideia depois? Troque a meta e aplique de novo. Se a meta cair, baldes já lacrados ficam e a despensa pede menos.', 'Changed your mind later? Change the goal and apply again. If the goal drops, sealed buckets stay and the pantry asks for less.')}
        </div>
      </Card>

      <div class="xs muted" style={{ marginBottom: 16 }}>
        <Pill tone="info">{L('Como o app calcula', 'How the app calculates')}</Pill> <a href="#/guias/plano">{L('Veja o que é fonte pública e o que é estimativa do app', 'See what is a public source and what is an app estimate')}</a>.
      </div>
    </>
  );
}
