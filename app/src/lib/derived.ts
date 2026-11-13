import { useBuckets, useGear, useMembers, usePantry, useSettings, useShop, useSupplies, useWater } from './db';
import { computePlan } from './planner';
import {
  autonomy,
  cylindersNeeded,
  foodDays,
  gasDays,
  householdKcalPerDay,
  readinessScore,
  stockKcal,
  waterDays,
  waterNeededGal,
  cleanNeededGal,
  waterSummary,
} from './calc';
import { todayISO } from './dates';

/** Tudo que o painel e as outras telas precisam, calculado a partir dos dados atuais. */
export function useReadiness() {
  const settings = useSettings();
  const members = useMembers();
  const buckets = useBuckets();
  const pantry = usePantry();
  const shop = useShop();
  const supRaw = useSupplies();
  const lots = useWater();
  const water0 = waterSummary(lots, supRaw.waterGal, todayISO());
  const sup = { ...supRaw, waterGal: water0.potableGal };
  const kcalPerDay = householdKcalPerDay(members);
  const stock = stockKcal(buckets, pantry);
  const food = foodDays(stock.totalKcal, kcalPerDay);
  const waterD = waterDays(sup, members, kcalPerDay, settings);
  const gas = gasDays(sup, kcalPerDay, settings);
  const a = autonomy(food, waterD, gas);
  return {
    settings,
    members,
    buckets,
    pantry,
    shop,
    sup,
    waterLots: lots,
    water: water0,
    cleanNeedGal: cleanNeededGal(members, settings),
    kcalPerDay,
    stock,
    a,
    score: readinessScore(a, settings.daysTarget),
    foodPlanDays: foodDays(stock.plannedKcal, kcalPerDay),
    waterNeedGal: waterNeededGal(members, kcalPerDay, settings),
    cylindersNeed: cylindersNeeded(kcalPerDay, settings),
  };
}

/** O plano calculado (comida, baldes, água, gás e caixas) para as pessoas, a meta de dias e o perfil de agora. */
export function usePlan() {
  const settings = useSettings();
  const members = useMembers();
  const gear = useGear();
  return computePlan({ members, settings, gear });
}
