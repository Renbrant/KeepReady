/**
 * Links de compra (afiliado Amazon). A chave é a chave automática do item da lista de compras.
 * Só entra aqui produto que o dono do app escolheu. Nenhum preço da Amazon é exibido no app.
 */
export type BuyLink = { url: string; label: string; title: string };

export const BUY_LINKS: Record<string, BuyLink> = {
  'pkg:mylar': {
    url: 'https://link.amazon/B0cacNSSl',
    label: 'Ver na Amazon',
    title: 'Mylar 2 gal, 13×17 pol, 10 mil, pacote com 60 (vem com 20 absorvedores de 400 cc)',
  },
  'pkg:o2': {
    url: 'https://link.amazon/B0io2n6vN',
    label: 'Ver na Amazon',
    title: 'Absorvedores de oxigênio 700 cc, 100 unidades em pacotes de 5 (confira que a variante 700cc está marcada)',
  },
  'pkg:aquatabs': {
    url: 'https://link.amazon/B02qpl2AA',
    label: 'Ver na Amazon',
    title: 'Aquatabs 397 mg, 100 pastilhas (confira que o tamanho 397 mg está marcado)',
  },
};

export const AFFILIATE_DISCLOSURE = 'Como associado da Amazon, o KeepReady ganha com compras qualificadas feitas pelos links "Ver na Amazon". Isso não muda o preço para você. O preço e a disponibilidade são os da página da Amazon.';
