import type { GearCategory, Member } from '../lib/types';
import { L, getLang } from '../lib/i18n';
import { CATALOG_EN } from './catalog.en';

/**
 * Catálogo dos itens que não são comida: o que vai nas caixas de 27 galões (e o que fica fora delas).
 *
 * De onde vem cada coisa:
 * - Os ITENS vêm de listas públicas (Ready.gov "Build a Kit", Cruz Vermelha "Survival Kit Supplies") e do
 *   repositório do KeepReady (FEATURES.md e knowledge_base/: kit de trauma MARCH, rádio, alvejante).
 * - As QUANTIDADES quase nunca vêm dessas fontes: elas listam o item sem dizer quanto. Quando a fonte dá número
 *   (água, 7 dias de remédio), o item é marcado `qty: 'fonte'`. Nos outros, o número é uma estimativa do app
 *   (`qty: 'estimativa'`), mostrada como tal na tela. Ajuste ao seu consumo: o plano usa o que está aqui como ponto de partida.
 * - `liters` e `kg` são o volume e o peso aproximados de uma unidade, só para estimar quantas caixas são necessárias.
 */

export type Source = 'ready.gov' | 'redcross' | 'repo';

export interface Ctx {
  members: Member[];
  people: number;
  days: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: GearCategory;
  unit: string;
  need: (c: Ctx) => number;
  /** Como a quantidade é calculada, em palavras. */
  how: string;
  qty: 'fonte' | 'estimativa';
  listedBy: Source[];
  liters: number;
  kg: number;
  /** Grande demais para a caixa: aparece numa lista à parte. */
  outside?: boolean;
  /** Vem desligado; o usuário liga se quiser. */
  optional?: boolean;
  note?: string;
}

export const CATEGORY_LABEL: Record<GearCategory, string> = {
  get saude() {
    return L('Saúde', 'Health');
  },
  get higiene() {
    return L('Higiene e saneamento', 'Hygiene and sanitation');
  },
  get cozinha() {
    return L('Cozinha', 'Kitchen');
  },
  get energia() {
    return L('Luz, energia e rádio', 'Light, power and radio');
  },
  get ferramentas() {
    return L('Ferramentas e segurança', 'Tools and safety');
  },
  get documentos() {
    return L('Documentos e comunicação', 'Documents and communication');
  },
};

/** Ordem em que as categorias são arrumadas nas caixas. */
export const CATEGORY_ORDER: GearCategory[] = ['saude', 'higiene', 'cozinha', 'energia', 'ferramentas', 'documentos'];

export const SOURCE_LABEL: Record<Source, string> = {
  'ready.gov': 'Ready.gov',
  get redcross() {
    return L('Cruz Vermelha', 'Red Cross');
  },
  get repo() {
    return L('seu repositório', 'your repository');
  },
};

/** Nome, unidade, forma de cálculo e nota do item no idioma atual. */
export function catText(item: CatalogItem): { name: string; unit: string; how: string; note?: string } {
  if (getLang() === 'en') {
    const e = CATALOG_EN[item.id];
    if (e) return e;
  }
  return { name: item.name, unit: item.unit, how: item.how, note: item.note };
}

/* ---------- regras de quantidade ---------- */

/** Arredonda para cima sem deixar ruído de ponto flutuante (4 × 30 × 0,4 = 48,000…04) virar 49. */
export const up = (x: number): number => Math.ceil(x - 1e-9) || 0;

const weightSum = (c: Ctx, w?: (m: Member) => number) => c.members.reduce((s, m) => s + (w ? w(m) : 1), 0);

/** `rate` por pessoa por dia, vezes os dias da meta. `w` pesa cada pessoa (0 = não se aplica). */
const personDay =
  (rate: number, o: { w?: (m: Member) => number; min?: number; minPerPerson?: number } = {}) =>
  (c: Ctx): number => {
    const total = up(weightSum(c, o.w) * rate * c.days);
    const applies = c.members.filter((m) => (o.w ? o.w(m) : 1) > 0).length;
    return Math.max(total, o.min ?? 0, (o.minPerPerson ?? 0) * applies);
  };

/** Uma quantidade fixa por pessoa a que o item se aplica. */
const perPerson =
  (n: number, w?: (m: Member) => number) =>
  (c: Ctx): number =>
    up(weightSum(c, w) * n);

/** Uma quantidade fixa por casa. */
const perHome =
  (n: number) =>
  (): number =>
    n;

const age = (m: Member) => m.age ?? 30;

/** Mulher entre 12 e 51 anos. Sem sexo informado, não entra na conta. */
const menstruates = (m: Member) => (m.sex === 'F' && age(m) >= 12 && age(m) <= 51 ? 1 : 0);

/** Fraldas por dia, por idade (estimativa do app). Só entra quem tem idade informada. */
const diapersPerDay = (m: Member) => (m.age === undefined ? 0 : m.age < 1 ? 8 : m.age < 2 ? 6 : m.age < 3 ? 5 : 0);

export const CATALOG: CatalogItem[] = [
  /* ----- Saúde ----- */
  {
    id: 'first-aid',
    name: 'Kit de primeiros socorros',
    category: 'saude',
    unit: 'kit',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['ready.gov', 'redcross'],
    liters: 3,
    kg: 1.5,
  },
  {
    id: 'ifak',
    name: 'Kit de trauma: 2 torniquetes CAT, 2 gazes hemostáticas, 2 selos de tórax, bandagem de pressão, tesoura',
    category: 'saude',
    unit: 'kit',
    need: perHome(1),
    how: '1 por casa (lista do seu repositório)',
    qty: 'fonte',
    listedBy: ['repo'],
    liters: 2,
    kg: 1,
    note: 'Lista do manifesto MARCH do repositório. Só serve com treinamento: procure um curso de controle de hemorragia.',
  },
  {
    id: 'meds-rx',
    name: 'Remédios de uso contínuo',
    category: 'saude',
    unit: 'dias de suprimento',
    need: (c) => up(weightSum(c, (m) => (m.takesMeds ? 1 : 0)) * Math.min(Math.max(c.days, 7), 30)),
    how: 'a meta de dias (entre 7 e 30) por pessoa que usa remédio contínuo',
    qty: 'fonte',
    listedBy: ['redcross', 'ready.gov'],
    liters: 0,
    kg: 0,
    note: 'A Cruz Vermelha cita 7 dias de suprimento. O app estende até 30 dias. Renove pela validade da receita e fale com seu médico sobre quanto guardar.',
  },
  {
    id: 'otc',
    name: 'Remédios sem receita: analgésico, antidiarreico, antiácido, laxante',
    category: 'saude',
    unit: 'kit',
    need: perHome(1),
    how: '1 kit por casa; as doses seguem a bula e o seu médico',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 1,
    kg: 0.5,
  },
  {
    id: 'glasses',
    name: 'Óculos reserva ou lentes e solução',
    category: 'saude',
    unit: 'conjunto',
    need: perPerson(1, (m) => (m.glasses ? 1 : 0)),
    how: '1 por pessoa que usa óculos ou lentes',
    qty: 'fonte',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.3,
    kg: 0.1,
  },
  {
    id: 'masks',
    name: 'Máscaras N95',
    category: 'saude',
    unit: 'unidade',
    need: perPerson(2),
    how: '2 por pessoa',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.1,
    kg: 0.02,
  },
  {
    id: 'vitamins',
    name: 'Multivitamínico',
    category: 'saude',
    unit: 'comprimido',
    need: personDay(1),
    how: '1 por pessoa por dia',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.002,
    kg: 0.001,
    optional: true,
  },

  /* ----- Higiene e saneamento ----- */
  {
    id: 'toilet-paper',
    name: 'Papel higiênico',
    category: 'higiene',
    unit: 'rolo',
    need: personDay(0.4),
    how: '0,4 rolo por pessoa por dia',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 1,
    kg: 0.17,
  },
  {
    id: 'wipes',
    name: 'Lenços umedecidos (pacote de 80)',
    category: 'higiene',
    unit: 'pacote',
    need: personDay(1 / 15),
    how: '1 pacote a cada 15 pessoas-dia',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 1.5,
    kg: 0.45,
  },
  {
    id: 'soap',
    name: 'Sabonete em barra',
    category: 'higiene',
    unit: 'barra',
    need: personDay(1 / 30, { minPerPerson: 1 }),
    how: '1 barra por pessoa a cada 30 dias, no mínimo 1',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.1,
    kg: 0.1,
  },
  {
    id: 'sanitizer',
    name: 'Álcool em gel 500 ml',
    category: 'higiene',
    unit: 'frasco',
    need: personDay(1 / 60, { min: 1 }),
    how: '1 frasco a cada 60 pessoas-dia, no mínimo 1',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.6,
    kg: 0.5,
  },
  {
    id: 'toothpaste',
    name: 'Pasta de dente',
    category: 'higiene',
    unit: 'tubo',
    need: personDay(1 / 60, { min: 1 }),
    how: '1 tubo a cada 60 pessoas-dia, no mínimo 1',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.15,
    kg: 0.15,
  },
  {
    id: 'toothbrush',
    name: 'Escova de dente',
    category: 'higiene',
    unit: 'unidade',
    need: personDay(1 / 90, { minPerPerson: 1 }),
    how: '1 por pessoa, mais 1 a cada 90 dias',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.05,
    kg: 0.02,
  },
  {
    id: 'feminine',
    name: 'Absorventes ou tampões',
    category: 'higiene',
    unit: 'unidade',
    need: personDay(20 / 28, { w: menstruates }),
    how: '20 a cada 28 dias por mulher de 12 a 51 anos (precisa do sexo informado)',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.05,
    kg: 0.01,
    note: 'Se não se aplica a alguém da casa, oculte o item.',
  },
  {
    id: 'diapers',
    name: 'Fraldas',
    category: 'higiene',
    unit: 'unidade',
    need: personDay(1, { w: diapersPerDay }),
    how: '8 por dia até 1 ano, 6 até 2 anos, 5 até 3 anos (precisa da idade informada)',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.5,
    kg: 0.05,
    note: 'Fórmula e papinha não entram na conta. Combine com o pediatra.',
  },
  {
    id: 'trash-bags',
    name: 'Sacos de lixo 13 gal',
    category: 'higiene',
    unit: 'unidade',
    need: personDay(0.5),
    how: '1 saco a cada 2 pessoas por dia (lixo e banheiro de emergência)',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.03,
    kg: 0.02,
  },
  {
    id: 'bleach',
    name: 'Alvejante sem perfume (1 galão)',
    category: 'higiene',
    unit: 'frasco',
    need: perHome(1),
    how: '1 por casa (desinfetar água e louça)',
    qty: 'estimativa',
    listedBy: ['redcross', 'repo'],
    liters: 4,
    kg: 4.3,
    note: 'O cloro perde força com o tempo. Confira a validade no rótulo e troque.',
  },

  /* ----- Cozinha ----- */
  {
    id: 'pressure-cooker',
    name: 'Panela de pressão de fogão (8 L)',
    category: 'cozinha',
    unit: 'panela',
    need: perHome(1),
    how: '1 por casa. Em altitude, o feijão sem ela gasta muito mais gás',
    qty: 'estimativa',
    listedBy: ['repo'],
    liters: 12,
    kg: 3,
    outside: true,
  },
  {
    id: 'stove',
    name: 'Fogareiro de propano',
    category: 'cozinha',
    unit: 'fogareiro',
    need: perHome(1),
    how: '1 por casa. Use ao ar livre ou bem ventilado',
    qty: 'estimativa',
    listedBy: ['repo'],
    liters: 15,
    kg: 4,
    outside: true,
  },
  {
    id: 'can-opener',
    name: 'Abridor de lata manual',
    category: 'cozinha',
    unit: 'unidade',
    need: perHome(2),
    how: '2 por casa (um reserva)',
    qty: 'fonte',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.1,
    kg: 0.15,
  },
  {
    id: 'lighters',
    name: 'Isqueiros',
    category: 'cozinha',
    unit: 'unidade',
    need: perHome(3),
    how: '3 por casa',
    qty: 'estimativa',
    listedBy: ['redcross'],
    liters: 0.02,
    kg: 0.02,
  },
  {
    id: 'matches',
    name: 'Fósforos em pote impermeável',
    category: 'cozinha',
    unit: 'pote',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.1,
    kg: 0.1,
  },
  {
    id: 'dish-soap',
    name: 'Detergente 500 ml',
    category: 'cozinha',
    unit: 'frasco',
    need: personDay(1 / 120, { min: 1 }),
    how: '1 frasco a cada 120 pessoas-dia, no mínimo 1',
    qty: 'estimativa',
    listedBy: ['repo'],
    liters: 0.6,
    kg: 0.55,
  },
  {
    id: 'paper-towels',
    name: 'Papel toalha',
    category: 'cozinha',
    unit: 'rolo',
    need: personDay(0.05),
    how: '1 rolo a cada 20 pessoas-dia',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 2.5,
    kg: 0.25,
  },
  {
    id: 'sponges',
    name: 'Esponjas',
    category: 'cozinha',
    unit: 'unidade',
    need: personDay(1 / 120, { min: 2 }),
    how: '1 a cada 120 pessoas-dia, no mínimo 2',
    qty: 'estimativa',
    listedBy: ['repo'],
    liters: 0.05,
    kg: 0.01,
  },
  {
    id: 'disposables',
    name: 'Pratos, copos e talheres descartáveis (conjunto)',
    category: 'cozinha',
    unit: 'conjunto',
    need: personDay(2),
    how: '2 conjuntos por pessoa por dia: economiza água de lavar louça',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.15,
    kg: 0.03,
    optional: true,
  },

  /* ----- Luz, energia e rádio ----- */
  {
    id: 'headlamp',
    name: 'Lanterna de cabeça ou de mão',
    category: 'energia',
    unit: 'unidade',
    need: perPerson(1),
    how: '1 por pessoa',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.2,
    kg: 0.15,
  },
  {
    id: 'lantern',
    name: 'Lanterna de área (LED)',
    category: 'energia',
    unit: 'unidade',
    need: (c) => Math.max(2, up(c.people / 3)),
    how: '1 a cada 3 pessoas, no mínimo 2',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 1.2,
    kg: 0.4,
  },
  {
    id: 'batteries-aa',
    name: 'Pilhas AA',
    category: 'energia',
    unit: 'unidade',
    need: personDay(0.3),
    how: '0,3 pilha por pessoa por dia',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.02,
    kg: 0.025,
    note: 'Pilhas recarregáveis com carregador solar reduzem esse número. Confira a validade: pilha vazando estraga a lanterna.',
  },
  {
    id: 'radio',
    name: 'Rádio a pilha ou manivela com alertas NOAA',
    category: 'energia',
    unit: 'unidade',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['ready.gov', 'redcross', 'repo'],
    liters: 1,
    kg: 0.4,
  },
  {
    id: 'power-bank',
    name: 'Bateria externa para celular (power bank)',
    category: 'energia',
    unit: 'unidade',
    need: (c) => Math.max(2, up(c.people / 2)),
    how: '1 a cada 2 pessoas, no mínimo 2',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.3,
    kg: 0.4,
    note: 'Recarregue a cada poucos meses.',
  },
  {
    id: 'solar-charger',
    name: 'Carregador solar',
    category: 'energia',
    unit: 'unidade',
    need: perHome(1),
    how: '1 por casa',
    qty: 'estimativa',
    listedBy: ['repo'],
    liters: 1,
    kg: 0.5,
    optional: true,
  },
  {
    id: 'whistle',
    name: 'Apito',
    category: 'energia',
    unit: 'unidade',
    need: perPerson(1),
    how: '1 por pessoa',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.01,
    kg: 0.01,
  },

  /* ----- Ferramentas e segurança ----- */
  {
    id: 'multitool',
    name: 'Multiferramenta ou alicate',
    category: 'ferramentas',
    unit: 'unidade',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['redcross', 'ready.gov'],
    liters: 0.4,
    kg: 0.4,
  },
  {
    id: 'wrench',
    name: 'Chave para fechar registros de gás e água',
    category: 'ferramentas',
    unit: 'unidade',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['ready.gov'],
    liters: 0.5,
    kg: 0.8,
  },
  {
    id: 'duct-tape',
    name: 'Fita adesiva reforçada (silver tape)',
    category: 'ferramentas',
    unit: 'rolo',
    need: perHome(2),
    how: '2 por casa',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.4,
    kg: 0.4,
  },
  {
    id: 'plastic-sheeting',
    name: 'Lona plástica',
    category: 'ferramentas',
    unit: 'rolo',
    need: perHome(1),
    how: '1 por casa',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 2,
    kg: 1.5,
  },
  {
    id: 'scissors',
    name: 'Tesoura',
    category: 'ferramentas',
    unit: 'unidade',
    need: perHome(1),
    how: '1 por casa',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.1,
    kg: 0.1,
  },
  {
    id: 'zip-ties',
    name: 'Abraçadeiras plásticas (pacote)',
    category: 'ferramentas',
    unit: 'pacote',
    need: perHome(1),
    how: '1 por casa',
    qty: 'estimativa',
    listedBy: ['ready.gov'],
    liters: 0.1,
    kg: 0.1,
  },
  {
    id: 'work-gloves',
    name: 'Luvas de trabalho',
    category: 'ferramentas',
    unit: 'par',
    need: perPerson(1),
    how: '1 par por pessoa',
    qty: 'estimativa',
    listedBy: ['redcross'],
    liters: 0.5,
    kg: 0.2,
  },
  {
    id: 'emergency-blanket',
    name: 'Manta térmica (Mylar)',
    category: 'ferramentas',
    unit: 'unidade',
    need: perPerson(1),
    how: '1 por pessoa',
    qty: 'estimativa',
    listedBy: ['redcross', 'repo'],
    liters: 0.3,
    kg: 0.1,
  },
  {
    id: 'blankets',
    name: 'Cobertor ou saco de dormir',
    category: 'ferramentas',
    unit: 'unidade',
    need: perPerson(1),
    how: '1 por pessoa',
    qty: 'fonte',
    listedBy: ['ready.gov', 'redcross'],
    liters: 30,
    kg: 1.5,
    outside: true,
  },
  {
    id: 'extinguisher',
    name: 'Extintor de incêndio',
    category: 'ferramentas',
    unit: 'unidade',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['ready.gov'],
    liters: 6,
    kg: 2.5,
    outside: true,
  },

  /* ----- Documentos e comunicação ----- */
  {
    id: 'docs',
    name: 'Cópias de documentos e contatos, em saco impermeável',
    category: 'documentos',
    unit: 'kit',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.5,
    kg: 0.2,
  },
  {
    id: 'map',
    name: 'Mapa de papel da região',
    category: 'documentos',
    unit: 'unidade',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['ready.gov', 'redcross'],
    liters: 0.2,
    kg: 0.1,
  },
  {
    id: 'paper-pencil',
    name: 'Papel e lápis',
    category: 'documentos',
    unit: 'kit',
    need: perHome(1),
    how: '1 por casa',
    qty: 'fonte',
    listedBy: ['ready.gov'],
    liters: 0.3,
    kg: 0.2,
  },
  {
    id: 'two-way',
    name: 'Rádios de duas vias (par)',
    category: 'documentos',
    unit: 'par',
    need: perHome(1),
    how: '1 par por casa',
    qty: 'estimativa',
    listedBy: ['redcross', 'repo'],
    liters: 0.5,
    kg: 0.3,
    optional: true,
  },
  {
    id: 'games',
    name: 'Jogos e livros para as crianças',
    category: 'documentos',
    unit: 'kit',
    need: (c) => (c.members.some((m) => m.age !== undefined && m.age < 13) ? 1 : 0),
    how: '1 kit se houver criança com menos de 13 anos (precisa da idade informada)',
    qty: 'estimativa',
    listedBy: ['ready.gov', 'redcross'],
    liters: 3,
    kg: 1,
    optional: true,
  },
];

export const CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(CATALOG.map((i) => [i.id, i]));
