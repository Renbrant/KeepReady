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
const MDN: Source = { title: 'MDN: Storage quotas and eviction criteria', url: 'https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria' };

export const GUIDES: Guide[] = [
  {
    id: 'reembalar',
    title: 'Reembalar arroz, feijão e macarrão',
    summary: 'Do saco grande do Costco para Mylar com absorvedor, dentro do balde.',
    intro: [
      'Os sacos de papel e de plástico fino do mercado deixam passar umidade e oxigênio e não seguram insetos nem roedores. O Mylar tem uma camada de alumínio que reduz muito a passagem de oxigênio e umidade, e o balde protege o saco de furos e de roedores. Abra o saco grande, divida em sacos de Mylar e feche com absorvedor de oxigênio.',
      'Materiais: baldes de 5 galões de plástico próprio para alimento, com tampa; sacos de Mylar de 1,5 a 2 galões (o cartão de cada balde, em Estoque, diz quantos); absorvedores de oxigênio de 500 cc para os sacos de grão; ferro de passar, alisador de cabelo ou seladora; pote de vidro com tampa para os absorvedores que sobrarem; caneta permanente.',
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
        text: 'Abra o pacote de absorvedores, solte um de 500 cc em cada saco de grão e feche o pote de vidro com os que sobraram, de preferência com o cartão rosa indicador dentro. Sele a boca do saco com ferro ou alisador (a fonte usa alisador a cerca de 220 °C), deixando uma abertura pequena, aperte para sair o ar e sele o resto. Passe a selagem duas vezes.',
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
      'Tamanho do absorvedor: a fonte cita 300 a 500 cc para um saco de 1 galão. O app usa 500 cc para sacos de 1,5 a 2 galões.',
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
      { title: 'Água', text: 'São 1,86 litros por pessoa por dia só para cozinhar, no nível do mar, mais a água de beber (padrão de 1 galão por pessoa por dia, ajustável em Ajustes). O fator de altitude aumenta a parte de cozimento.' },
    ],
    estimates: [
      'Estimativas do app: fatores da panela aberta, da água de cozimento e a folga de 20% no gás.',
      'Os tempos de partida do cozimento são médias de referência para este plano, não de uma receita única.',
    ],
    notes: ['Teste no seu fogão. Cozinhe um balde "de teste" em casa, anote o tempo real e a quantidade de gás gasta, e ajuste a altitude ou o modo de cozimento em Ajustes se necessário.'],
    sources: [CSU_PRESSURE, CSU_HIGH, CSU_BEANS],
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
