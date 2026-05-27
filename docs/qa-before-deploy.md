# QA antes do deploy - Clube do Lindão

Data da revisão: 25 de maio de 2026

## Escopo revisado

Rotas públicas:
- `/ranking`
- `/ranking?q=Iago`
- `/ranking?q=#001`
- `/ranking?q=17992000019`
- `/premios`

Rotas administrativas:
- `/login`
- `/admin/dashboard`
- `/admin/clientes`
- `/admin/compras`
- `/admin/ranking`
- `/admin/niveis`
- `/admin/premios`

Fluxos revisados:
- Autenticação e redirecionamento das rotas admin.
- Navegação pública e administrativa.
- Busca pública de ranking.
- Ranking público sem exibição de CPF, CNPJ ou telefone.
- Cards e estados vazios.
- Cadastro/edição/listagem de clientes, compras, níveis e prêmios por revisão de código e build.
- Resgate de pontos por revisão de código e compatibilidade com o banco atual.
- Cálculo de pontos em compras: `points_generated = total_amount * 0.1`.
- Dashboard com totais, valor movimentado, top ranking e últimas compras.
- Segurança de variáveis de ambiente e ausência de chaves secretas no frontend.

## Checklist de QA

- [x] Rotas públicas carregam sem overlay de erro.
- [x] Busca pública do ranking funciona sem quebrar a tela.
- [x] Ranking público não renderiza CPF, CNPJ nem telefone.
- [x] Página pública de prêmios carrega prêmios ativos.
- [x] Rota admin sem sessão redireciona para `/login`.
- [x] Usuário logado em `/login` é redirecionado para `/admin/dashboard`.
- [x] Telas admin carregam sem overlay de erro no navegador.
- [x] Inputs, selects e textareas estão visíveis nas telas revisadas.
- [x] Build de produção compila com sucesso.
- [x] ESLint passa pelo executável direto.
- [x] `.env.local` não está versionado.
- [x] Nenhuma chave secreta foi encontrada exposta no código.

## Bugs encontrados

1. A busca pública do ranking não aparecia quando o ranking estava vazio.
   - Impacto: o cliente não conseguia pesquisar quando não havia participantes renderizados.
   - Correção: a seção "Ranking completo" passou a ser renderizada também no estado vazio, mantendo o campo de busca e mensagens adequadas para busca sem resultado.

2. O resgate de pontos podia falhar no Supabase oficial quando a tabela `reward_redemptions` ainda não tinha as colunas novas `points_used` ou `redemption_date`.
   - Impacto: o admin poderia receber erro ao salvar um resgate.
   - Correção: o fluxo tenta gravar no formato novo e, se o banco responder que a coluna não existe, usa fallback compatível com o schema legado (`points_spent` e `redeemed_at`), sem alterar o banco.

## Bugs corrigidos

- Busca pública do ranking visível em `/ranking`, `/ranking?q=Iago`, `/ranking?q=#001` e `/ranking?q=telefone`.
- Mensagem correta para busca sem resultado: "Nenhum participante encontrado."
- Fallback seguro para salvar resgate de pontos em bancos com schema legado.

## Itens pendentes

- Executar testes reais de criação/edição/exclusão em um ambiente de homologação ou com dados de teste autorizados. Esta revisão não criou novos dados no Supabase oficial para evitar sujeira no banco antes do deploy.
- Confirmar no Supabase oficial se a função `search_public_ranking(search_text text)` está aplicada. Sem ela, a busca por telefone não expõe dados sensíveis, mas depende do fallback por nome/código quando a função não existir.
- Confirmar no Vercel as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- O comando `npm run lint` e `npm run build` falhou localmente com `Acesso negado` pelo shim do Windows, mas os executáveis diretos passaram.

## Comandos executados

- `git status --short`
- `git ls-files .env.local`
- Busca de chaves secretas no código.
- Fetch sem sessão para `/admin/dashboard`: retornou `307` para `/login?redirectedFrom=%2Fadmin%2Fdashboard`.
- Fetch para `/api/public-ranking?q=Iago`: retornou `200` com somente `data` e `error`.
- Navegação no browser para rotas públicas e admin, verificando overlay, console e renderização.
- `npm run lint`
- `node .\node_modules\eslint\bin\eslint.js`
- `npm run build`
- `node .\node_modules\next\dist\bin\next build --webpack`

## Resultado do lint

- `npm run lint`: falhou localmente com `Acesso negado`.
- `node .\node_modules\eslint\bin\eslint.js`: passou sem erros.

## Resultado do build

- `npm run build`: falhou localmente com `Acesso negado`.
- `node .\node_modules\next\dist\bin\next build --webpack`: passou com sucesso.

Rotas compiladas:
- `/`
- `/admin`
- `/admin/clientes`
- `/admin/compras`
- `/admin/dashboard`
- `/admin/niveis`
- `/admin/premios`
- `/admin/ranking`
- `/api/public-ranking`
- `/login`
- `/premios`
- `/ranking`

## Recomendação

O código está pronto para um deploy controlado, desde que as variáveis de ambiente estejam configuradas no Vercel e o Supabase oficial tenha as migrations públicas principais aplicadas. Para deploy definitivo, recomendo fazer uma validação rápida em homologação com um cliente, uma compra e um resgate reais de teste.
