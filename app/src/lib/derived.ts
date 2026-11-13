import { useBuckets, useMembers, usePantry, useSettings, useShop, useSupplies } from './db';
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
} from './calc';

/** Tudo que o painel e as outras telas precisam, calculado a partir dos dados atuais. */
export function useReadiness() {
  const settings = useSettings();
  const members = useMembers();
  const buckets = useBuckets();
  const pantry = usePantry();
  const shop = useShop();
  const sup = useSupplies();
  const kcalPerDay = householdKcalPerDay(members);
  const stock = stockKcal(buckets, pantry);
  const food = foodDays(stock.totalKcal, kcalPerDay);
  const water = waterDays(sup, members, kcalPerDay, settings);
  const gas = gasDays(sup, kcalPerDay, settings);
  const a = autonomy(food, water, gas);
  return {
    settings,
    members,
    buckets,
    pantry,
    shop,
    sup,
    kcalPerDay,
    stock,
    a,
    score: readinessScore(a, settings.daysTarget),
    foodPlanDays: foodDays(stock.plannedKcal, kcalPerDay),
    waterNeedGal: waterNeededGal(members, kcalPerDay, settings),
    cylindersNeed: cylindersNeeded(kcalPerDay, settings),
  };
}
