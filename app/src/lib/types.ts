export type Kind = 'settings' | 'member' | 'bucket' | 'pantry' | 'shop' | 'supply';

/** Registro local-first. `dirty` e `rev` só existem no aparelho; o resto vai para o servidor. */
export interface Rec<T = unknown> {
  id: string;
  kind: Kind;
  data: T;
  updatedAt: string;
  deleted?: boolean;
  dirty?: boolean;
  rev: number;
}

export interface RemoteRec {
  id: string;
  kind: Kind;
  data: unknown;
  deleted: boolean;
  updated_at: string;
}

export type Sex = 'F' | 'M';
export type Activity = 'sedentary' | 'moderate' | 'active';

export interface Member {
  name: string;
  sex?: Sex;
  age?: number;
  activity: Activity;
  pregnantOrNursing?: boolean;
  /** Meta escolhida pelo usuário (kcal/dia). Se ausente, usa a recomendação. */
  kcalOverride?: number | null;
  order: number;
}

export interface BucketItem {
  name: string;
  kg: number;
  kcalPerKg: number;
  waterLPerKg?: number;
  /** US$ por kg (estimativa editável). */
  pricePerKg?: number;
}

export type BucketStatus = 'planned' | 'sealed' | 'rotating';

export interface Bucket {
  n: number;
  name: string;
  kind: 'grain' | 'mixed';
  bags: number;
  items: BucketItem[];
  status: BucketStatus;
  sealedOn?: string;
  dueOn?: string;
  /** 0 = nunca lacrado; 1 = primeiro ciclo; 2+ = reposições. */
  cycle: number;
  rotationStartedOn?: string;
  note?: string;
}

export interface PantryItem {
  name: string;
  unit: string;
  planQty: number;
  haveQty: number;
  kcalPerUnit: number;
  expiresOn?: string;
  note?: string;
  order: number;
}

export interface ShopItem {
  name: string;
  qty: number;
  unit: string;
  store: 'Costco' | 'Outros' | 'Reposição';
  section: string;
  unitPrice?: number;
  checked: boolean;
  note?: string;
  forBucket?: number;
  order: number;
}

export interface Supplies {
  waterGal: number;
  waterTargetGal: number;
  propaneFull: number;
  propaneTarget: number;
}

export interface Settings {
  householdName: string;
  daysTarget: number;
  /** Intervalo de rotação de cada balde, em meses. */
  rotationMonths: number;
  /** Prazo para consumir um balde aberto, em dias. */
  rotationWindowDays: number;
  altitudeFt: number;
  cookingMode: 'pressure' | 'open';
  drinkLPerPersonDay: number;
  packagingCostPerBag: number;
  theme: 'auto' | 'dark' | 'light';
}
