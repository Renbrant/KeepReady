/**
 * Sugestão de armazenagem por tipo de item.
 * São sugestões do app, baseadas nos guias do próprio app (Reembalar, Rotação) e no que o rótulo costuma pedir.
 * Elas não substituem o rótulo da embalagem.
 */
import { L } from '../lib/i18n';
import type { StorageKey } from '../lib/types';

export const STORAGE_KEYS: StorageKey[] = ['mylar_o2', 'mylar', 'cans', 'dry_pack', 'cool_dark', 'tote', 'other'];

export function storageLabel(k: StorageKey): string {
  switch (k) {
    case 'mylar_o2': return L('Mylar com absorvedor, no balde', 'Mylar with absorber, in a bucket');
    case 'mylar': return L('Mylar sem absorvedor, no balde', 'Mylar without absorber, in a bucket');
    case 'cans': return L('Lata, em local fresco e seco', 'Cans, in a cool dry place');
    case 'dry_pack': return L('Embalagem original fechada', 'Original sealed package');
    case 'cool_dark': return L('Local fresco, escuro e seco', 'Cool, dark, dry place');
    case 'tote': return L('Caixa de 27 gal', '27-gal tote');
    default: return L('Outro (siga o rótulo)', 'Other (follow the label)');
  }
}

export function storageTip(k: StorageKey): string {
  switch (k) {
    case 'mylar_o2':
      return L(
        'Divida em sacos de Mylar, 1 absorvedor de 700 cc por saco, e guarde no balde. Só alimento seco (menos de 10% de umidade). Veja o guia Reembalar.',
        'Divide into Mylar bags, one 700 cc absorber per bag, and keep them in the bucket. Dry food only (under 10% moisture). See the Repacking guide.',
      );
    case 'mylar':
      return L(
        'Mylar sem absorvedor: açúcar e sal podem empedrar com ele. Guarde no balde, em saco separado.',
        'Mylar without an absorber: sugar and salt can cake with one. Keep in the bucket, in a separate bag.',
      );
    case 'cans':
      return L(
        'Local fresco e seco, longe do sol e do chão. Não guarde lata amassada ou estufada. Use as mais antigas primeiro.',
        'Cool, dry place, away from sun and off the floor. Do not keep dented or bulging cans. Use the oldest first.',
      );
    case 'dry_pack':
      return L(
        'Deixe na embalagem original, fechada, em local fresco e seco (de preferência dentro de uma caixa de 27 gal). Depois de aberta, siga o rótulo (alguns pedem geladeira).',
        'Leave it in the original sealed package, in a cool dry place (ideally inside a 27-gal tote). Once opened, follow the label (some say to refrigerate).',
      );
    case 'cool_dark':
      return L(
        'Local fresco, escuro e seco, longe de produtos químicos. Siga a validade e as instruções do rótulo.',
        'Cool, dark, dry place, away from chemicals. Follow the expiry date and the label instructions.',
      );
    case 'tote':
      return L('Caixa de 27 gal fechada, em local seco. Registre o item em Caixas se ele faz parte da lista.', 'Closed 27-gal tote, in a dry place. Log the item under Totes if it is on the list.');
    default:
      return L('Siga as instruções do rótulo da embalagem.', 'Follow the instructions on the package label.');
  }
}

/** Minúsculas, sem acento. */
export function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const RULES: { key: StorageKey; re: RegExp }[] = [
  // A ordem importa: "atum em óleo" é lata, "rice crackers" é biscoito, "pasta de amendoim" não é macarrão.
  { key: 'cans', re: /\b(lata\w*|cans?|canned|atum|tuna|sardin\w*|chicken|frango|chili|stew|ensopado|soup|sopa|tomat\w*|caldo|broth|salmon|salmao|spam|vienna)\b/ },
  { key: 'cool_dark', re: /\b(pasta de amendoim|peanut butter|oleo|oil|mel|honey|agua|water|vitamin\w*|multivit\w*|remedio\w*|medic\w*|aspirin\w*|ibuprofen\w*)\b/ },
  { key: 'tote', re: /\b(papel higienico|toilet paper|sabonete|soap|lenco\w*|wipes?|pilha\w*|batter\w*|lanterna\w*|flashlight\w*|curativo\w*|bandage\w*|gauze|gaze|escova|toothbrush|toothpaste|pasta de dente|trash bag\w*|saco\w* de lixo|mask\w*|mascara\w*|sanitizer|alcool)\b/ },
  { key: 'dry_pack', re: /\b(biscoito\w*|crackers?|barras?|bars?|granola|cereal|jerky|carne seca|nuts?|castanha\w*|amendoim|dried|desidratad\w*|freeze[- ]dried|liofiliz\w*)\b/ },
  { key: 'mylar', re: /\b(acucar|sugar|sal|salt)\b/ },
  { key: 'mylar_o2', re: /\b(arroz|rice|feij\w*|beans?|lentilh\w*|lentils?|macarr\w*|pasta|spaghetti|espaguete|aveia|oats?|oatmeal|trigo|wheat|farinha|flour|leite em po|powdered milk|dry milk|nonfat milk|cafe|coffee)\b/ },
];

export function suggestStorage(name: string): StorageKey {
  const n = norm(name);
  for (const r of RULES) if (r.re.test(n)) return r.key;
  return 'other';
}
