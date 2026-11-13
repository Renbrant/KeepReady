export interface Source {
  title: string;
  url: string;
}

export interface Guide {
  id: string;
  title: string;
  summary: string;
  /** Texto corrido antes dos passos. */
  intro?: string[];
  steps?: { title: string; text: string }[];
  /** Pontos de atenção depois dos passos. */
  notes?: string[];
  /** Itens que são estimativa do app, não valor de fonte. */
  estimates?: string[];
  sources: Source[];
}

const USU_PACK: Source = { title: 'USU Extension: Food storage packaging', url: 'https://extension.usu.edu/preserve-the-harvest/food-storage-packaging' };
const MYLAR: Source = { title: 'Survival Freedom: Mylar bags and oxygen absorbers (blog, não é fonte acadêmica)', url: 'https://survivalfreedom.com/how-to-use-mylar-bags-and-oxygen-absorbers-for-long-term-food-storage' };
const CSU_PRESSURE: Source = { title: 'CSU Extension: Adjusting for elevation when pressure cooking', url: 'https://extension.colostate.edu/resource/adjusting-for-elevation-when-pressure-cooking' };
const CSU_BEANS: Source = { title: 'CSU Extension: Cooking dry beans', url: 'https://extension.colostate.edu/resource/cooking-dry-beans/' };
const CSU_HIGH: Source = { title: 'CSU Extension: High elevation food preparation', url: 'https://extension.colostate.edu/resource/high-elevation-food-preparation/' };
const READY: Source = { title: 'Ready.gov: Build a Kit', url: 'https://www.ready.gov/kit' };
const REDCROSS: Source = { title: 'Cruz Vermelha Americana: Survival Kit Supplies', url: 'https://redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies.html' };
const MDN: Source = { title: 'MDN: Storage quotas and eviction criteria', url: 'https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria' };

export const GUIDES: Guide[] = [
  {
    id: 'reembalar',
    title: 'Reembalar arroz, feijão e macarrão',
    summary: 'Do saco grande do Costco para Mylar com absorvedor, dentro do balde.',
    intro: [
      'Os sacos de papel e de plástico fino do mercado deixam passar umidade e oxigênio e não seguram insetos nem roedores. O Mylar tem uma camada de alumínio que reduz muito a passagem de oxigênio e umidade, e o balde protege o saco de furos e de roedores. Abra o saco grande, divida em sacos de Mylar e feche com absorvedor de oxigênio.',
      'Materiais: baldes de 5 galões de plástico próprio para alimento, com tampa; sacos de Mylar de 1,5 a 2 galões (o cartão de cada balde, em Estoque, diz quantos); absorvedores de oxigênio de 700 cc para os sacos de grão; ferro de passar, alisador de cabelo ou seladora; pote de vidro com tampa para os absorvedores que sobrarem; caneta permanente.',
    ],
    steps: [
      {
        title: 'Confira se o alimento está seco',
        text: 'Só guarde alimento seco, com menos de 10% de umidade. Arroz branco, feijão e macarrão de pacote costumam estar dentro disso. Alimento úmido com absorvedor dentro do Mylar não deve ser selado.',
      },
      {
        title: 'Congele para matar insetos (recomendado)',
        text: 'A USU Extension indica colocar o arroz no freezer por 3 dias para matar insetos ou larvas. Faça o mesmo com feijão e macarrão. Depois deixe voltar à temperatura ambiente antes de embalar, para não formar umidade dentro do saco. Se o saco ainda estiver fechado, deixe fechado enquanto esquenta.',
      },
      {
        title: 'Prepare tudo antes de abrir os absorvedores',
        text: 'Deixe todos os sacos de Mylar abertos, dentro dos baldes para ficarem de pé, e o alimento já medido. O absorvedor começa a trabalhar assim que o pacote é aberto, e fora do pacote ele rende só 10 a 15 minutos.',
      },
      {
        title: 'Encha os sacos',
        text: 'Despeje o alimento e deixe uns 5 cm livres no topo para dar para selar. Bata o saco de leve para assentar.',
      },
      {
        title: 'Coloque o absorvedor e sele logo',
        text: 'Abra o pacote de absorvedores, solte um de 700 cc em cada saco de grão e feche o pote de vidro com os que sobraram, de preferência com o cartão rosa indicador dentro. Sele a boca do saco com ferro ou alisador (a fonte usa alisador a cerca de 220 °C), deixando uma abertura pequena, aperte para sair o ar e sele o resto. Passe a selagem duas vezes.',
      },
      {
        title: 'Confira a selagem',
        text: 'Nem sempre o saco fica parecendo embalado a vácuo, e isso é normal. O que importa é a selagem estar inteira, sem dobras nem falhas. Se houver dúvida, abra, troque o absorvedor e sele de novo.',
      },
      {
        title: 'Etiquete e guarde',
        text: 'Escreva o conteúdo, a data e o tamanho do absorvedor. Coloque os sacos no balde, feche a tampa e guarde em lugar seco e fresco, longe do chão. Depois toque em Lacrar no balde, em Estoque, com a data de hoje. É essa data que define quando o balde entra na rotação.',
      },
    ],
    notes: [
      'Macarrão: as pontas podem furar o saco. Use sacos grossos e coloque o macarrão com cuidado. Esta é uma precaução do app, não vem das fontes.',
      'Balde 7 (açúcar, sal, leite em pó, café): açúcar e sal não levam absorvedor, porque podem empedrar. Use absorvedor no leite em pó e no café. Embale cada item em saco separado.',
      'Arroz integral tem óleo demais para este método. O plano usa arroz branco.',
      'Tamanho do absorvedor: a fonte cita 300 a 500 cc para um saco de 1 galão. O app usa 700 cc para sacos de 2 galões (13×17 pol), que é o que o vendedor do absorvedor recomenda para esse tamanho.',
    ],
    sources: [USU_PACK, MYLAR],
  },
  {
    id: 'rotacao',
    title: 'Rotação: comer, repor, relacrar',
    summary: 'Por que girar os baldes e como fazer um de cada vez.',
    intro: [
      'Comida guardada precisa ser usada antes de estragar, e a única forma de saber se a reserva está boa é consumi-la de tempos em tempos. A rotação do KeepReady abre um balde por vez, usa o conteúdo nas refeições normais, compra a reposição e relacra com saco e absorvedor novos. Assim o custo de cada reposição é pequeno e a comida que você compra é a que você já ia comer.',
    ],
    steps: [
      { title: 'Cada balde tem uma data', text: 'Ao lacrar, o app calcula a data da primeira rotação. No primeiro ciclo as datas são espaçadas (com N baldes, o balde 1 vence em 1/N do intervalo, o balde 2 em 2/N, e assim por diante), para os baldes não vencerem todos juntos. Depois, cada balde volta a cada intervalo, contado da data em que foi relacrado.' },
      { title: 'Iniciar rotação', text: 'Na tela Rotação, toque em Iniciar. O app só deixa abrir um balde por vez e coloca a reposição na lista de Compras, na seção Reposição.' },
      { title: 'Consumir em até 30 dias', text: 'Use o conteúdo nas refeições normais. Enquanto estiver aberto, o balde não conta como estoque no painel.' },
      { title: 'Repor e concluir', text: 'Compre a reposição, reembale (veja o guia de reembalar) e toque em Concluir. A data de lacre e o prazo recomeçam.' },
    ],
    notes: [
      'O intervalo padrão de 24 meses é uma escolha conservadora do app. Arroz e feijão bem lacrados duram bem mais, segundo as fontes do repositório, e dá para aumentar o intervalo em Rotação. Feijão muito velho tende a endurecer e demorar mais para cozinhar, e isso pesa mais na altitude.',
      'Se dois baldes ficarem com datas muito próximas, o app avisa. Relacre um por vez ou aumente o intervalo.',
    ],
    estimates: ['O intervalo de 24 meses e o prazo de 30 dias para consumir são escolhas do app, não valores de uma norma.'],
    sources: [USU_PACK, CSU_BEANS],
  },
  {
    id: 'altitude',
    title: 'Água e gás na altitude',
    summary: 'De onde vêm os números de água, tempo de cozimento e botijões.',
    intro: [
      'Em Thornton (cerca de 5.300 pés, 1.600 m) a água ferve a uma temperatura menor, então arroz, feijão e macarrão levam mais tempo e mais água, e o gás dura menos. O app calcula isso a partir da altitude que você informa em Ajustes.',
    ],
    steps: [
      { title: 'Panela de pressão', text: 'A CSU Extension manda aumentar o tempo de cozimento em 5% a cada 1.000 pés acima de 2.000 pés. O app usa esse valor e ele é o mais firme de todo o modelo.' },
      { title: 'Panela aberta', text: 'Para cozinhar sem pressão o app estima um aumento de 25% no tempo a cada 3.000 pés acima de 2.000 e de 15% na água de cozimento, na mesma base. Esses dois valores são estimativas do app, calibradas pelo texto da CSU de que cozinhar em altitude exige mais tempo e mais líquido.' },
      { title: 'Tempos de partida', text: 'Para o plano de 4 pessoas e 8.000 kcal por dia, o app parte de 37,5 min para o arroz, 18 min para o macarrão, 12 min para a aveia, 15 min para a água quente e 60 min para o feijão com pressão (135 min sem pressão), e multiplica pelo fator da altitude.' },
      { title: 'Gás', text: 'Um queimador de 10.000 BTU por hora, propano a 21.500 BTU por libra e botijão de 20 lb, que dá 430.000 BTU. O app soma uma folga de 20%. Resultado típico: 3 botijões com panela de pressão e 4 sem.' },
      { title: 'Água', text: 'Beber: 3 litros por pessoa por dia (padrão do app, menos que o galão por pessoa que a Ready.gov e a Cruz Vermelha citam, que também cobre higiene; a água limpa para higiene é contada à parte em Água). Cozinhar: 1,86 litros por pessoa de 2.000 kcal por dia, no nível do mar, só sobre a parte da comida que é seca (74% em metas acima de 14 dias, 10% nas curtas, estimativas do app). O fator de altitude aumenta a parte de cozimento.' },
    ],
    estimates: [
      'Estimativas do app: fatores da panela aberta, da água de cozimento e a folga de 20% no gás.',
      'Os tempos de partida do cozimento são médias de referência para este plano, não de uma receita única.',
    ],
    notes: ['Teste no seu fogão. Cozinhe um balde "de teste" em casa, anote o tempo real e a quantidade de gás gasta, e ajuste a altitude ou o modo de cozimento em Ajustes se necessário.'],
    sources: [CSU_PRESSURE, CSU_HIGH, CSU_BEANS],
  },
  {
    id: 'plano',
    title: 'Como o plano calcula as quantidades',
    summary: 'Pessoas, dias e perfil viram comida, baldes, água, gás e caixas de 27 galões. O que é fonte e o que é estimativa.',
    intro: [
      'Você informa quantas pessoas, quantos dias de autonomia e o perfil de cada uma (idade, sexo, atividade, remédio contínuo, óculos). O app soma as calorias da casa e calcula o resto a partir disso. Tudo é recalculado na hora que você muda um número.',
    ],
    steps: [
      {
        title: 'Comida',
        text: 'Calorias por dia da casa × dias × (1 + folga). A folga padrão é 10%. Em metas acima de 14 dias, a comida se divide como no plano de exemplo: cerca de 62% em baldes de grãos, 12% no balde misto (açúcar, leite, sal, café) e o resto na despensa de comida pronta, com no mínimo 10% na despensa. O número de baldes de grãos sempre sobe para o inteiro seguinte e a despensa absorve a diferença, então o plano nunca cobre menos que a meta. Em metas de até 14 dias, o app usa só comida pronta de mercado, sem baldes de Mylar: o Mylar serve para guardar por anos, e comida de mercado dura o bastante para uma meta curta. Você pode escolher "Sempre" nas Opções do plano.',
      },
      {
        title: 'Água e gás',
        text: 'Água: beber (padrão do app: 3 litros por pessoa por dia; a Ready.gov e a Cruz Vermelha citam 1 galão, que inclui higiene) mais a água de cozimento da comida seca. Gás: minutos de fogo por dia, corrigidos pela altitude e pelo modo de cozinhar, com 20% de folga. Veja o guia de altitude.',
      },
      {
        title: 'Caixas de 27 galões',
        text: 'As caixas guardam o que não é perecível, não precisa de vedação e é usado com frequência. A lista de itens vem da Ready.gov e da Cruz Vermelha, mais o kit de trauma e o rádio do repositório do KeepReady. O app multiplica cada item por pessoas e dias (ou 1 por casa), arruma por categoria e enche uma caixa de cada vez até 80% do volume de 27 galões (cerca de 102 L) ou o peso máximo (20 kg por padrão). Itens grandes, como cobertores, extintor, panela de pressão e fogareiro, ficam fora da conta de caixas.',
      },
      {
        title: 'Perfil de cada pessoa',
        text: 'Mulheres de 12 a 51 anos entram no cálculo de absorventes. Crianças até 3 anos entram no de fraldas. Quem usa remédio contínuo entra no suprimento de remédios, e quem usa óculos ou lentes, na reserva de óculos. Sem idade ou sexo informado, esses itens não aparecem.',
      },
    ],
    notes: [
      'As fontes públicas listam os itens, mas quase nunca a quantidade por pessoa e por dia. A Cruz Vermelha cita números para água (1 galão por pessoa por dia), comida (3 dias para evacuar, 2 semanas em casa) e 7 dias de remédios. A Ready.gov fala em 1 galão por pessoa por dia e em "vários dias" de comida. Nos outros itens, a quantidade é estimativa do app e aparece marcada como tal em cada item. Ajuste ao seu consumo: marque "Tenho" e desligue o que não se aplica.',
      'Remédios: o app só conta dias de suprimento. Não calcula doses. Siga a bula e o seu médico. O kit de trauma só serve com treinamento.',
      'Bebês com menos de 1 ano: fórmula e papinha não entram na conta. A tabela de calorias também não vale para menores de 2 anos. Combine com o pediatra.',
      'A despensa é escalada em proporção ao plano de exemplo. Se você trocou os itens dela, a proporção entre eles é mantida. Variedade e micronutrientes não são calculados: o plano mira em calorias.',
      'Aplicar o plano não mexe em baldes lacrados ou em rotação, no que você já tem na despensa, no que marcou como comprado nem nos itens que você adicionou.',
    ],
    estimates: [
      'Papel higiênico: 0,4 rolo por pessoa por dia.',
      'Lenços umedecidos, sabonete, pasta de dente, álcool em gel, sacos de lixo, papel toalha, detergente, esponja: taxas por pessoa-dia definidas pelo app.',
      'Pilhas AA: 0,3 por pessoa por dia.',
      'Lanternas (1 por pessoa), baterias externas (1 a cada 2 pessoas), máscaras N95 (2 por pessoa).',
      'Absorventes: 20 a cada 28 dias. Fraldas: 8, 6 e 5 por dia até 1, 2 e 3 anos.',
      'Volume e peso de cada item (para estimar quantas caixas), aproveitamento de 80% da caixa e limite de 20 kg.',
      'Divisão da comida entre baldes e despensa, mínimo de 10% na despensa e limite de 14 dias para a meta curta.',
    ],
    sources: [READY, REDCROSS],
  },
  {
    id: 'calorias',
    title: 'De onde vêm as calorias',
    summary: 'Recomendação por idade, sexo e atividade, e a referência de emergência.',
    intro: [
      'A tela Família mostra, para cada pessoa, a estimativa de calorias por dia para manter o peso, por idade, sexo e nível de atividade. A tabela vem do Apêndice 6 das Dietary Guidelines for Americans 2010 (equações do Institute of Medicine), arredondada para 200 kcal. As faixas para adultos das edições 2020–2025 são compatíveis.',
      'A referência de emergência é de 2.100 kcal por pessoa por dia, usada em ajuda humanitária (padrão Sphere). Você decide o número que vale: ele aparece como "Meta usada nas contas" e é o que o painel usa para calcular os dias de comida.',
    ],
    notes: [
      'A tabela não vale para gestantes, lactantes e crianças com menos de 2 anos. Para essas pessoas, defina a meta manualmente, de preferência com o médico ou o pediatra.',
      'Se você deixar a meta em branco, o app usa a recomendação. Se também não houver recomendação (faltam idade ou sexo), a pessoa conta como 0 kcal nas contas.',
    ],
    sources: [],
  },
  {
    id: 'offline',
    title: 'Instalar e usar sem internet',
    summary: 'Como instalar no celular e o que fazer para não perder dados.',
    steps: [
      { title: 'Abra uma vez com internet', text: 'O app baixa o que precisa para funcionar. Depois disso ele abre sem internet.' },
      { title: 'Instale na tela inicial', text: 'No iPhone: Safari, botão Compartilhar, Adicionar à Tela de Início. No Android: Chrome, menu, Instalar app ou Adicionar à tela inicial.' },
      { title: 'Entre numa casa para sincronizar', text: 'Em Família, crie uma conta e uma casa. Quem receber o código de convite vê e edita os mesmos dados. As edições feitas sem internet sobem quando a conexão voltar. Se duas pessoas editarem o mesmo item, vale a última a sincronizar.' },
      { title: 'Faça backup', text: 'Em Ajustes, exporte o backup em arquivo e guarde fora do celular. Ainda em Ajustes, o botão Imprimir gera uma folha em papel para o caso de o celular acabar a bateria.' },
    ],
    notes: [
      'No iPhone, o Safari pode apagar os dados que um site guardou no aparelho depois de 7 dias sem uso. Não está confirmado se apps instalados na tela inicial ficam de fora dessa regra. Por isso o app pede armazenamento persistente, mas o que realmente protege é a conta com sincronização e o backup em arquivo.',
      'Se o aparelho ficar sem internet por muito tempo, os dados continuam no aparelho, mas só vão para os outros membros da casa quando a conexão voltar.',
    ],
    sources: [MDN],
  },
];
