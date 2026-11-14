/**
 * Links de compra (afiliado Amazon). A chave é a chave automática do item da lista de compras.
 * Só entra aqui produto que o dono do app escolheu. Nenhum preço da Amazon é exibido no app.
 */
import { L } from '../lib/i18n';

export type BuyLink = { url: string; label: string; title: string };

export const BUY_LINKS: Record<string, BuyLink> = {
  'pkg:mylar': {
    url: 'https://link.amazon/B0cacNSSl',
    get label() { return L('Ver na Amazon', 'View on Amazon'); },
    get title() { return L('Mylar 2 gal, 13×17 pol, 10 mil, pacote com 60 (vem com 20 absorvedores de 400 cc)', 'Mylar 2 gal, 13×17 in, 10 mil, pack of 60 (comes with 20 × 400 cc absorbers)'); },
  },
  'pkg:o2': {
    url: 'https://link.amazon/B0io2n6vN',
    get label() { return L('Ver na Amazon', 'View on Amazon'); },
    get title() { return L('Absorvedores de oxigênio 700 cc, 100 unidades em pacotes de 5 (confira que a variante 700cc está marcada)', '700 cc oxygen absorbers, 100 in packs of 5 (check that the 700cc variant is selected)'); },
  },
  'pkg:aquatabs': {
    url: 'https://link.amazon/B02qpl2AA',
    get label() { return L('Ver na Amazon', 'View on Amazon'); },
    get title() { return L('Aquatabs 397 mg, 100 pastilhas (confira que o tamanho 397 mg está marcado)', 'Aquatabs 397 mg, 100 tablets (check that the 397 mg size is selected)'); },
  },
};

export const affiliateDisclosure = (): string =>
  L(
    'Como associado da Amazon, o KeepReady ganha com compras qualificadas feitas pelos links "Ver na Amazon". Isso não muda o preço para você. O preço e a disponibilidade são os da página da Amazon.',
    'As an Amazon Associate, KeepReady earns from qualifying purchases made through the "View on Amazon" links. This does not change the price for you. Price and availability are those on the Amazon page.',
  );
