export type Kind = 'settings' | 'member' | 'bucket' | 'pantry' | 'shop' | 'supply' | 'gear';

/** Lista única dos tipos de registro (backup, testes). O servidor tem a mesma lista numa restrição da tabela `records`. */
export const KINDS: Kind[] = ['settings', 'member', 'bucket', 'pantry', 'shop', 'supply', 'gear'];

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
  /** Usa remédio de uso contínuo (entra no cálculo de suprimento de remédios). */
  takesMeds?: boolean;
  /** Usa óculos ou lentes (entra no cálculo de reserva de óculos e solução). */
  glasses?: boolean;
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
  /** Chave de um item gerado pelo plano (ex.: 'food:rice'). Itens sem chave são seus. */
  auto?: string;
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
  /** Folga sobre a meta de comida, em %, para perda, apetite e visitas. */
  bufferPct: number;
  /** 'auto': baldes de Mylar só a partir de 15 dias. 'always': sempre. */
  bucketMode: 'auto' | 'always';
  /** Peso máximo de cada caixa de 27 gal, em kg. */
  toteCapKg: number;
  /** O usuário já passou pelo plano (pessoas, dias, perfil) ou dispensou o convite. */
  planConfigured: boolean;
  /** Os itens de variedade (carne em lata, refeição liofilizada) já foram adicionados à despensa. */
  varietyAdded: boolean;
  theme: 'auto' | 'dark' | 'light';
}

export type GearCategory = 'saude' | 'higiene' | 'cozinha' | 'energia' | 'ferramentas' | 'documentos';

/** Estado de um item da lista das caixas. O id do registro é `gear-<id do catálogo>` ou `gear-c-…` para item seu. */
export interface GearState {
  have: number;
  expiresOn?: string;
  hidden?: boolean;
  /** Presente só em item criado pelo usuário. */
  custom?: { name: string; category: GearCategory; unit: string; need: number; liters: number; kg: number };
}
