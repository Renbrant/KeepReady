import type { Activity, Member, Sex } from './types';

/**
 * Calorias estimadas por dia para manter o peso, por idade, sexo e nível de atividade.
 * Fonte: Dietary Guidelines for Americans 2010, Apêndice 6 (equações EER do Institute of
 * Medicine, Britten et al. 2006). Valores arredondados para 200 kcal. Os intervalos
 * para adultos da edição 2020–2025 são compatíveis.
 * Cada linha: [idade inicial, idade final, homem [sed, mod, ativo], mulher [sed, mod, ativo]].
 */
type Row = [number, number, [number, number, number], [number, number, number]];

export const EER_TABLE: Row[] = [
  [2, 2, [1000, 1000, 1000], [1000, 1000, 1000]],
  [3, 3, [1200, 1400, 1400], [1000, 1200, 1400]],
  [4, 4, [1200, 1400, 1600], [1200, 1400, 1400]],
  [5, 5, [1200, 1400, 1600], [1200, 1400, 1600]],
  [6, 6, [1400, 1600, 1800], [1200, 1400, 1600]],
  [7, 7, [1400, 1600, 1800], [1200, 1600, 1800]],
  [8, 8, [1400, 1600, 2000], [1400, 1600, 1800]],
  [9, 9, [1600, 1800, 2000], [1400, 1600, 1800]],
  [10, 10, [1600, 1800, 2200], [1400, 1800, 2000]],
  [11, 11, [1800, 2000, 2200], [1600, 1800, 2000]],
  [12, 12, [1800, 2200, 2400], [1600, 2000, 2200]],
  [13, 13, [2000, 2200, 2600], [1600, 2000, 2200]],
  [14, 14, [2000, 2400, 2800], [1800, 2000, 2400]],
  [15, 15, [2200, 2600, 3000], [1800, 2000, 2400]],
  [16, 18, [2400, 2800, 3200], [1800, 2000, 2400]],
  [19, 20, [2600, 2800, 3000], [2000, 2200, 2400]],
  [21, 25, [2400, 2800, 3000], [2000, 2200, 2400]],
  [26, 30, [2400, 2600, 3000], [1800, 2000, 2400]],
  [31, 35, [2400, 2600, 3000], [1800, 2000, 2200]],
  [36, 40, [2400, 2600, 2800], [1800, 2000, 2200]],
  [41, 45, [2200, 2600, 2800], [1800, 2000, 2200]],
  [46, 50, [2200, 2400, 2800], [1800, 2000, 2200]],
  [51, 55, [2200, 2400, 2800], [1600, 1800, 2200]],
  [56, 60, [2200, 2400, 2600], [1600, 1800, 2200]],
  [61, 65, [2000, 2400, 2600], [1600, 1800, 2000]],
  [66, 70, [2000, 2200, 2600], [1600, 1800, 2000]],
  [71, 75, [2000, 2200, 2600], [1600, 1800, 2000]],
  [76, 200, [2000, 2200, 2400], [1600, 1800, 2000]],
];

/** Referência humanitária de emergência (padrão Sphere), usada no README do KeepReady. */
export const SPHERE_KCAL = 2100;

const ACT_INDEX: Record<Activity, 0 | 1 | 2> = { sedentary: 0, moderate: 1, active: 2 };

export const ACTIVITY_LABEL: Record<Activity, string> = {
  sedentary: 'Sedentário',
  moderate: 'Moderado',
  active: 'Ativo',
};

export const ACTIVITY_HELP: Record<Activity, string> = {
  sedentary: 'Só a atividade leve do dia a dia.',
  moderate: 'Atividade leve mais caminhada de 1,5 a 3 milhas (2,4 a 4,8 km) por dia.',
  active: 'Atividade leve mais caminhada de mais de 3 milhas (4,8 km) por dia.',
};

/** Recomendação da tabela, ou null se faltar idade/sexo ou a idade estiver fora da tabela (menos de 2 anos). */
export function recommendedKcal(sex: Sex | undefined, age: number | undefined, activity: Activity): number | null {
  if (!sex || age === undefined || !Number.isFinite(age) || age < 2) return null;
  const row = EER_TABLE.find(([from, to]) => age >= from && age <= to);
  if (!row) return null;
  const col = sex === 'M' ? row[2] : row[3];
  return col[ACT_INDEX[activity]];
}

export function memberRecommended(m: Member): number | null {
  return recommendedKcal(m.sex, m.age, m.activity);
}

/** Meta usada nas contas: o valor do usuário, ou a recomendação, ou 0 se não houver nenhum dos dois. */
export function memberTarget(m: Member): number {
  if (typeof m.kcalOverride === 'number' && m.kcalOverride > 0) return m.kcalOverride;
  return memberRecommended(m) ?? 0;
}

/** Por que a recomendação não se aplica, se for o caso. */
export function recommendationNote(m: Member): string | null {
  if (m.age !== undefined && m.age < 2) return 'Menor de 2 anos: a tabela não cobre. Defina a meta com o pediatra.';
  if (m.pregnantOrNursing) return 'Gestante ou lactante: a tabela não se aplica. Defina a meta com seu médico.';
  if (!m.sex || m.age === undefined) return 'Informe idade e sexo para ver a recomendação.';
  return null;
}
