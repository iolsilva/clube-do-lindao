# Checklist final de deploy - Clube do Lindão

## Antes de subir para o GitHub

- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm run build`.
- [ ] Se houver `Acesso negado` no Windows, validar com:
  - [ ] `node .\node_modules\eslint\bin\eslint.js`
  - [ ] `node .\node_modules\next\dist\bin\next build --webpack`
- [ ] Confirmar que `.env.local` não está versionado.
- [ ] Confirmar que `.env.example` existe.
- [ ] Confirmar que nenhuma service role está exposta no código.
- [ ] Confirmar que não há dados sensíveis em páginas públicas.
- [ ] Confirmar que `README.md` tem instruções de deploy.
- [ ] Fazer commit final.
- [ ] Subir o repositório para o GitHub.

## Banco Supabase

- [ ] Confirmar que o banco oficial é o Supabase PostgreSQL do projeto.
- [ ] Confirmar que `supabase/schema.sql` foi aplicado.
- [ ] Aplicar migrations pendentes de `supabase/migrations/`, se necessário.
- [ ] Confirmar que RLS está ativo.
- [ ] Confirmar que público acessa apenas ranking público e prêmios ativos.
- [ ] Confirmar que CPF/CNPJ e telefone não aparecem na área pública.
- [ ] Criar ou confirmar usuário admin no Supabase Auth.

## Configuração na Vercel

- [ ] Importar o repositório pelo GitHub.
- [ ] Framework detectado: Next.js.
- [ ] Build command: `npm run build`.
- [ ] Install command: `npm install`.
- [ ] Output padrão da Vercel para Next.js.
- [ ] Adicionar variáveis:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Não adicionar service role key na Vercel.
- [ ] Fazer deploy.

## Validação depois do deploy

Rotas públicas:
- [ ] `/ranking` carrega.
- [ ] Busca pública por nome funciona.
- [ ] Busca pública por código funciona.
- [ ] Busca pública por telefone funciona sem exibir telefone.
- [ ] `/premios` mostra apenas prêmios ativos.

Rotas admin:
- [ ] `/login` carrega.
- [ ] Login admin funciona.
- [ ] `/admin/dashboard` carrega.
- [ ] `/admin/clientes` carrega.
- [ ] `/admin/compras` carrega.
- [ ] `/admin/ranking` carrega.
- [ ] `/admin/niveis` carrega.
- [ ] `/admin/premios` carrega.
- [ ] Botão sair funciona.
- [ ] Rotas admin sem sessão redirecionam para `/login`.

Fluxos críticos:
- [ ] Cadastrar cliente.
- [ ] Editar cliente.
- [ ] Ativar/inativar cliente.
- [ ] Registrar compra.
- [ ] Confirmar pontos gerados pela regra `valor * 0.1`.
- [ ] Confirmar ranking ordenado por maior pontuação.
- [ ] Confirmar empate com mesma colocação.
- [ ] Registrar resgate com saldo suficiente.
- [ ] Impedir resgate acima do saldo.
- [ ] Criar/editar nível.
- [ ] Criar/editar prêmio.
- [ ] Ativar/inativar prêmio.

## Recomendação final

O deploy pode seguir quando lint/build estiverem validados, variáveis estiverem configuradas na Vercel e o banco oficial estiver com schema/migrations aplicados.
