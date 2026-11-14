# KeepReady (PWA)

App web instalável para a família planejar e acompanhar o estoque de emergência: dashboard de autonomia (comida, água e gás), baldes com rotação (um por vez), metas de calorias por pessoa, lista de compras e guias. Funciona sem internet e, com login, sincroniza entre os aparelhos da casa.

Stack: Preact + TypeScript + Vite + vite-plugin-pwa (service worker) + IndexedDB (idb-keyval) + Supabase (login, Postgres, RLS). Hospedagem: Cloudflare Workers (static assets).

## Plano flexível

Em Mais, Plano e meta: você informa **quantas pessoas, quantos dias e o perfil de cada uma**, e o app calcula comida, baldes de grãos, despensa, água, gás e **caixas de 27 galões** (higiene, cozinha, remédios, luz, ferramentas). Metas de até 14 dias usam comida pronta, sem baldes de Mylar (dá para forçar nas Opções do plano). "Aplicar" ajusta só o que ainda não foi feito: baldes lacrados ou em rotação, o que você tem na despensa e o que você marcou como comprado não mudam. A lista das caixas vem da Ready.gov, da Cruz Vermelha e do repositório; as quantidades por pessoa e dia são, na maioria, estimativas do app, marcadas como tal (Guias, Como o plano calcula).

## Como funciona

- **Os dados moram no aparelho.** Cada item (balde, pessoa, item de compra) é um registro guardado em IndexedDB. O app abre e funciona sem internet depois da primeira visita.
- **Com conta, os registros também vão para o Supabase.** Cada rodada envia o que mudou no aparelho e busca o que mudou no servidor. Se duas pessoas editam o mesmo item, vale a última a sincronizar. O relógio que conta é o do servidor.
- **Casa e convite.** Quem cria a casa recebe um código de convite. Quem entra com o código vê e edita os mesmos dados. Trate o código como senha: quem o tem entra na casa.
- **Sem chaves do Supabase** o app roda só no aparelho (sem login). Serve para testar as contas.

## Rodar no computador

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 90 testes (contas, calorias, sincronização, plano)
npm run build      # tsc + vite build, gera dist/
npm run preview    # serve dist/ em http://127.0.0.1:4173
```

## Ligar login e sincronização (Supabase, plano gratuito)

1. Crie um projeto em supabase.com.
2. SQL Editor, New query, cole o conteúdo de `supabase/migrations/20261113171845_keepready_sync.sql` e rode (é seguro rodar de novo). Se você conectou o Supabase ao GitHub, defina o Working directory da integração como `app`: com a mesma versão já registrada no projeto, a migração não é aplicada duas vezes, e novas migrações nessa pasta são aplicadas quando entram na `main` (com "Deploy to production" ligado). Cria as tabelas `households`, `household_users` e `records`, as regras de acesso (RLS) e as funções `create_household`, `join_household` e `my_household`.
3. Authentication, Providers, Email: para o teste em família, desligue "Confirm email". Se deixar ligado, cada pessoa precisa clicar no link do e-mail antes do primeiro login.
4. Project Settings, API (ou API Keys): copie a **Project URL** e a chave pública (chamada `anon` ou `publishable`). Ela é pública por desenho; quem protege os dados são as regras de RLS do passo 2. **Nunca** coloque a chave `service_role` ou `secret` no app.
5. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. As variáveis `VITE_*` são lidas na hora do build.

## Publicar (Cloudflare Workers, static assets)

O repositório já tem `wrangler.jsonc`, que manda a pasta `dist/` para a Cloudflare como site estático. A Cloudflare está concentrando os recursos novos em Workers; o Cloudflare Pages continua funcionando, e Workers static assets é o caminho mais seguro para um projeto novo.

1. Crie a conta em dash.cloudflare.com (não pede cartão).
2. Workers & Pages, Create application, GitHub. Autorize o app da Cloudflare só para este repositório e escolha-o.
3. Configure:
   - Nome do Worker: `keepready` (precisa ser igual ao `name` de `app/wrangler.jsonc`, senão o build falha).
   - Production branch: a branch com este código (`feat/pwa-app` enquanto não houver merge na `main`).
   - Root directory: `app`.
   - Build command: `npm run build`.
   - Deploy command: `npx wrangler deploy` (é o padrão).
   - Build variables: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Têm que ser *build variables*, porque o Vite as lê durante o build. Variáveis de runtime não servem.
4. Save and Deploy. O endereço sai como `keepready.<seu-subdominio>.workers.dev`. HTTPS é obrigatório para o service worker, e já vem incluído.
5. Cada push na branch de produção publica de novo. Outras branches geram um endereço de preview.

O roteador usa `#/` (hash), então não precisa de regra de redirecionamento. Qualquer hospedagem estática com HTTPS serve (Cloudflare Pages, Netlify, Vercel, GitHub Pages).

## Usar com a família

1. Abra o endereço no celular, uma vez, com internet.
2. Instale: iPhone, Safari, Compartilhar, Adicionar à Tela de Início. Android, Chrome, menu, Instalar app.
3. Mais, Família e conta: crie a conta e a casa. O app envia os dados deste aparelho.
4. Mande o código de convite para a família. Cada pessoa cria a conta e toca em "Entrar na casa". O aparelho dela passa a usar os dados da casa (os dados de exemplo que ela tinha são trocados, não somados).
5. Em Ajustes, exporte um backup de vez em quando e guarde fora do celular.

## Custos e limites (planos gratuitos, conferidos em novembro de 2026)

Confira sempre as páginas oficiais de preços antes de decidir, porque os valores mudam.

| | Grátis | Quando passar do grátis |
|---|---|---|
| Supabase | 2 projetos ativos, banco de 500 MB, 50.000 usuários ativos por mês, 5 GB de saída de dados, **sem backups**. O projeto **pausa após uma semana sem atividade** e pode ser retomado em até 1 ano. Ao bater um limite, o serviço para (não cobra). | Pro: US$ 25 por mês por organização, 8 GB de banco, 100.000 usuários ativos, backup diário por 7 dias, não pausa. Acima disso, cobrança por uso (por exemplo, US$ 0,125 por GB de banco além de 8 GB) e o teto de gastos vem ligado por padrão. |
| Cloudflare (Workers static assets) | Requisições de arquivos estáticos grátis e sem limite. Build grátis incluído. | Só entra em plano pago (a partir de US$ 5 por mês) se você acrescentar código de servidor (Workers dinâmicos) acima da cota gratuita. |

Ordem de grandeza deste app: um plano de exemplo completo (55 registros) ocupa cerca de 12 KB de dados. Mesmo com o overhead do Postgres, o banco de 500 MB comporta, por estimativa, milhares de casas. O limite que aparece primeiro tende a ser o de usuários ativos ou a pausa por inatividade, não o espaço.

Pontos de atenção no plano gratuito do Supabase:
- **Pausa por inatividade.** O app continua funcionando no aparelho (os dados ficam lá), mas a sincronização para até alguém retomar o projeto no painel. Quem mexe no app com internet gera atividade; semanas sem uso podem pausar o projeto.
- **Sem backup automático.** Use Ajustes, Exportar backup, e guarde o arquivo.
- **O serviço de e-mail embutido envia no máximo 2 e-mails por hora** (documentação do Supabase). Com "Confirm email" ligado, a família toda não consegue criar conta de uma vez. Para o teste, desligue essa opção. Para produção, configure um SMTP próprio e ajuste Authentication, URL Configuration, Site URL para o endereço do app, senão o link do e-mail pode apontar para o lugar errado.
- **Saída de emergência.** O banco é Postgres comum e o app guarda tudo no aparelho, então trocar de provedor depois é viável.

## Cuidados e limites conhecidos

- **iPhone:** o Safari pode apagar dados que um site guardou no aparelho após 7 dias sem uso (MDN). Não está confirmado se apps da tela inicial ficam de fora. O app pede armazenamento persistente, mas a proteção real é a conta com sincronização mais o backup em arquivo e o resumo impresso (Mais, Resumo para imprimir).
- **Conflitos:** vale a última edição de cada item. Não há histórico nem desfazer.
- **O login e a sincronização foram testados contra um servidor simulado**, escrito para imitar as rotas do Supabase, e não contra um projeto Supabase real. O SQL foi testado num Postgres 16 local (tabelas, trigger, RLS e funções). Se algo falhar no primeiro uso real, a causa mais provável é uma diferença nas rotas, nas mensagens de erro ou nas configurações do projeto.
- **Preços** da lista de compras são estimativas do plano. Corrija em Compras, Editar.
- **Altitude:** o fator da panela de pressão (5% a cada 1.000 pés acima de 2.000) vem da CSU Extension. Os fatores da panela aberta e da água de cozimento, e a folga de 20% no gás, são estimativas do app. Veja Guias.
- **Calorias:** a tabela de recomendação não vale para gestantes, lactantes e crianças com menos de 2 anos.
- **Intervalo de rotação:** 24 meses é uma escolha conservadora. Ajuste em Rotação.

## Estrutura

```
src/lib/        regras e dados: calc.ts (contas), nutrition.ts (calorias), store.ts (registros locais),
                sync.ts (uma rodada de sincronização), supabase.ts, account.ts, plan.ts (plano de exemplo),
                planner.ts (motor do plano), apply.ts (aplicar sem apagar o que já foi feito)
src/views/      Dashboard, Stock, Rotation, Shopping, Family, Guides, Settings, More, Print
src/content/    guides.ts (guias, com fontes), catalog.ts (itens das caixas)
supabase/       migrations/20261113171845_keepready_sync.sql
tests/          calc, nutrition, sync, planner (vitest)
```

## Fontes

- CSU Extension: [Adjusting for elevation when pressure cooking](https://extension.colostate.edu/resource/adjusting-for-elevation-when-pressure-cooking), [Cooking dry beans](https://extension.colostate.edu/resource/cooking-dry-beans/), [High elevation food preparation](https://extension.colostate.edu/resource/high-elevation-food-preparation/)
- USU Extension: [Food storage packaging](https://extension.usu.edu/preserve-the-harvest/food-storage-packaging)
- Dietary Guidelines for Americans 2010, Apêndice 6 (calorias estimadas por idade, sexo e atividade)
- Supabase: [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Production checklist (limites de e-mail e backups)](https://supabase.com/docs/guides/platform/going-into-prod), [resumo de preços 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
- Cloudflare: [limites do Pages](https://developers.cloudflare.com:8443/pages/platform/limits), [Workers static assets](https://developers.cloudflare.com/workers/static-assets/migrate-from-pages/), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration)
- MDN: [Storage quotas and eviction criteria](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
