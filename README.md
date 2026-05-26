# Clube do Lindão

Sistema de clube de vantagens para o Depósito São Marcos, com área pública para ranking e prêmios e área administrativa protegida para gestão de clientes, compras, níveis, prêmios e resgates.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Vercel

## Rotas principais

Públicas:
- `/ranking`
- `/premios`

Admin:
- `/login`
- `/admin/dashboard`
- `/admin/clientes`
- `/admin/compras`
- `/admin/ranking`
- `/admin/niveis`
- `/admin/premios`

## Configuração local

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

Variáveis usadas pelo projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` é usada somente no servidor para operações administrativas sensíveis, como o resgate de pontos quando o RLS bloquear o usuário autenticado. Nunca use essa chave com prefixo `NEXT_PUBLIC` e não versione `.env.local`.

Execute o ambiente local:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Banco de dados

O banco oficial é Supabase PostgreSQL. O schema base está em:

```text
supabase/schema.sql
```

Migrations auxiliares estão em:

```text
supabase/migrations/
```

Para preparar o banco no Supabase:

1. Acesse o Supabase Dashboard.
2. Abra SQL Editor.
3. Clique em New Query.
4. Cole o conteúdo de `supabase/schema.sql`.
5. Execute Run.
6. Aplique migrations adicionais que ainda não existirem no banco oficial.

## Autenticação admin

Os usuários admin são criados no Supabase Auth pelo painel do Supabase. Depois de criar o usuário, confirme que o perfil correspondente está marcado como admin conforme as policies e funções do schema.

As rotas `/admin/*` são protegidas e redirecionam usuários sem sessão para `/login`.

## Validação antes do deploy

Rode:

```bash
npm run lint
npm run build
```

Neste ambiente Windows, os scripts `npm run lint` e `npm run build` podem falhar com `Acesso negado` por causa do shim local. Quando isso acontecer, valide pelos executáveis diretos:

```bash
node .\node_modules\eslint\bin\eslint.js
node .\node_modules\next\dist\bin\next build --webpack
```

## Deploy no GitHub e Vercel

1. Confirme que `.env.local` não está versionado.
2. Confirme que `.env.example` existe.
3. Confirme que não há service role ou chave secreta no código.
4. Faça commit das alterações.
5. Suba o repositório para o GitHub.
6. Na Vercel, clique em Add New Project.
7. Importe o repositório do GitHub.
8. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
9. Use o build command padrão:

```bash
npm run build
```

10. Faça o deploy.
11. Valide as rotas públicas e admin após o deploy.

Checklist completo: [docs/deploy-checklist.md](docs/deploy-checklist.md).
